<?php

namespace App\Services;

use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AppointmentSyncService
{
    private string $loginUrl;
    private string $dataUrl;
    private string $username;
    private string $password;

    /** Records per API page. */
    private const PER_PAGE = 100;

    /** Max rows per bulk UPSERT. */
    private const UPSERT_CHUNK = 2000;

    /** Cache key for sync progress. */
    public const CACHE_KEY = 'appointment_sync_progress';

    /** Cache TTL in seconds (1 hour). */
    private const CACHE_TTL = 3600;

    /**
     * Source-system fields safe to overwrite on duplicate (upsert update columns).
     * Deliberately excludes user-set fields: eligibility_status, primary_insurance,
     * auth_status, referral_status, collection_status, notes, psc_*, etc.
     */
    private const UPSERT_UPDATE_COLUMNS = [
        'appointment_status',
        'patient_email',
        'provider',
        'visit_type',
        'location',
        'invoice_no',
        'invoice_status',
        'current_responsibility',
        'claim_created',
        'charges',
        'payments',
        'units',
        'created_by',
        'cancellation_reason',
        'updated_at',
    ];

    public function __construct()
    {
        $this->loginUrl = config('services.appointments_api.login_url', '');
        $this->dataUrl  = config('services.appointments_api.url', '');
        $this->username = config('services.appointments_api.username', '');
        $this->password = config('services.appointments_api.password', '');
    }

    /**
     * Fetch one batch of pages (pagesPerBatch × PER_PAGE records) and bulk-upsert.
     *
     * @param  int $startPage     The first page number to fetch (1-based)
     * @param  int $pagesPerBatch How many pages to fetch in this batch
     * @param  int $batchNumber   Monotonically increasing batch counter for frontend progress
     * @return array{imported: int, skipped: int, duplicates: array, has_more: bool, next_page: int, batch_number: int}
     * @throws \RuntimeException on config missing, auth failure, or HTTP failure
     */
    public function syncBatch(int $startPage = 1, int $pagesPerBatch = 20, int $batchNumber = 1): array
    {
        if (empty($this->loginUrl) || empty($this->dataUrl)) {
            throw new \RuntimeException(
                'API sync is not configured. Please set APPOINTMENTS_API_LOGIN_URL and APPOINTMENTS_API_URL in your .env file.'
            );
        }

        $token = $this->authenticate();

        [$from, $to] = $this->resolveDateWindow();

        $allRecords = [];
        $hasMore    = false;
        $lastPage   = $startPage;

        for ($page = $startPage; $page < $startPage + $pagesPerBatch; $page++) {
            $rows = $this->fetchPage($token, $page, $from, $to);

            $allRecords = array_merge($allRecords, $rows);
            $lastPage   = $page;

            if (count($rows) < self::PER_PAGE) {
                $hasMore = false;
                break;
            }

            $hasMore = true;
        }

        Log::info('[AppointmentSync] Batch fetched', [
            'batchNumber' => $batchNumber,
            'startPage'   => $startPage,
            'lastPage'    => $lastPage,
            'rawRecords'  => count($allRecords),
            'from'        => $from,
            'to'          => $to,
        ]);

        $candidates = array_values(array_filter(
            array_map([$this, 'mapApiRecord'], $allRecords),
            fn ($r) => $r !== null
        ));

        Log::info('[AppointmentSync] Valid candidates after mapping', ['count' => count($candidates)]);

        $result = empty($candidates)
            ? ['imported' => 0, 'skipped' => 0, 'duplicates' => []]
            : $this->upsertBatch($candidates);

        // ── Update cumulative progress in cache ──────────────────────────────
        $prev = Cache::get(self::CACHE_KEY, ['imported' => 0, 'skipped' => 0]);
        Cache::put(self::CACHE_KEY, [
            'state'    => $hasMore ? 'running' : 'complete',
            'batch'    => $batchNumber,
            'imported' => (int) ($prev['imported'] ?? 0) + $result['imported'],
            'skipped'  => (int) ($prev['skipped'] ?? 0) + $result['skipped'],
            'page'     => $lastPage + 1,
        ], self::CACHE_TTL);

        return array_merge($result, [
            'has_more'     => $hasMore,
            'next_page'    => $lastPage + 1,
            'batch_number' => $batchNumber,
        ]);
    }

    // ── Private ──────────────────────────────────────────────────────────────

    /**
     * POST username + password to /auth/token and return the bearer token.
     */
    private function authenticate(): string
    {
        $response = Http::timeout(15)
            ->acceptJson()
            ->withoutVerifying()
            ->post($this->loginUrl, [
                'username' => $this->username,
                'password' => $this->password,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException(
                "API login failed: HTTP {$response->status()} — {$response->body()}"
            );
        }

        $body = $response->json();

        $token = $body['accessToken']
            ?? $body['access_token']
            ?? $body['token']
            ?? $body['data']['accessToken']
            ?? $body['data']['access_token']
            ?? $body['data']['token']
            ?? null;

        if (empty($token)) {
            throw new \RuntimeException(
                'API login succeeded but no token was found in the response. '
                . 'Raw response: ' . json_encode($body)
            );
        }

        return (string) $token;
    }

    /**
     * Fetch a single page from the API. Returns the rows array.
     */
    private function fetchPage(string $token, int $page, string $from, string $to): array
    {
        $response = Http::timeout(60)
            ->retry(3, 2000)
            ->acceptJson()
            ->withoutVerifying()
            ->withToken($token)
            ->get($this->dataUrl, [
                'from'     => $from,
                'to'       => $to,
                'page'     => $page,
                'per_page' => self::PER_PAGE,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException(
                "API data fetch failed (page {$page}): HTTP {$response->status()} — {$response->body()}"
            );
        }

        $body = $response->json();

        return $body['docs']
            ?? $body['data']
            ?? (is_array($body) ? $body : []);
    }

    /**
     * Map one API record to the Appointment shape, including dedup_hash.
     */
    private function mapApiRecord(array $record): ?array
    {
        $firstName = trim((string) ($record['patient_first_name'] ?? ''));
        $lastName  = trim((string) ($record['patient_last_name'] ?? ''));
        $name      = trim((string) ($record['patient_full_name'] ?? "$firstName $lastName"));

        if ($name === '') {
            return null;
        }

        $dos = $this->parseDate($record['date_of_service'] ?? null);

        return [
            'patient_name'           => $name,
            'patient_dob'            => null,
            'patient_email'          => $record['patient_email'] ?? null,
            'date_of_service'        => $dos,
            'appointment_status'     => $record['appointment_status'] ?? 'New',
            'eligibility_status'     => 'Verification Pending',
            'provider'               => $record['provider_name'] ?? '',
            'visit_type'             => $record['service_name'] ?? null,
            'location'               => $record['location_name'] ?? null,
            'invoice_no'             => $record['invoice_number'] ?? null,
            'invoice_status'         => $record['invoice_status'] ?? null,
            'current_responsibility' => $record['current_responsibility'] ?? null,
            'claim_created'          => strtolower(trim((string) ($record['claim_created_info'] ?? ''))) === 'yes',
            'charges'                => is_numeric($record['charges'] ?? null) ? (float) $record['charges'] : 0,
            'payments'               => is_numeric($record['payments'] ?? null) ? (float) $record['payments'] : 0,
            'units'                  => is_numeric($record['units'] ?? null) ? (int) $record['units'] : 0,
            'created_by'             => $record['created_by'] ?? null,
            'cancellation_reason'    => $record['reason'] ?? null,
            'dedup_hash'             => $this->makeHash($name, $dos, $record['appointment_status'] ?? null),
        ];
    }

    /**
     * Bulk-upsert all candidates in chunks of UPSERT_CHUNK.
     *
     * Uses dedup_hash as the unique key so MySQL handles conflict detection.
     * User-set fields (eligibility_status, primary_insurance, auth_status, etc.)
     * are intentionally excluded from UPSERT_UPDATE_COLUMNS and are never overwritten.
     *
     * @return array{imported: int, skipped: int, duplicates: array}
     */
    private function upsertBatch(array $candidates): array
    {
        $now = now()->toDateTimeString();

        $rows = array_map(fn ($c) => array_merge($c, [
            'created_at' => $now,
            'updated_at' => $now,
        ]), $candidates);

        foreach (array_chunk($rows, self::UPSERT_CHUNK) as $chunk) {
            Appointment::upsert($chunk, ['dedup_hash'], self::UPSERT_UPDATE_COLUMNS);
        }

        $imported = count($rows);

        Log::info('[AppointmentSync] Batch upsert complete', ['imported' => $imported]);

        return ['imported' => $imported, 'skipped' => 0, 'duplicates' => []];
    }

    private function makeHash(string $name, ?string $dos, ?string $status): string
    {
        return md5(strtolower(trim($name)) . '|' . ($dos ?? 'null-date') . '|' . strtolower(trim($status ?? '')));
    }

    private function parseDate(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }
        try {
            return Carbon::parse((string) $value)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Resolve the sync date window, validating ordering and applying defaults.
     *
     * @return array{0: string, 1: string} [from, to] in Y-m-d format
     */
    private function resolveDateWindow(): array
    {
        $defaultFrom = '2026-01-01';
        $defaultTo   = Carbon::now()->format('Y-m-d');

        $from = config('services.appointments_api.from_date', $defaultFrom) ?: $defaultFrom;
        $to   = config('services.appointments_api.to_date', $defaultTo) ?: $defaultTo;

        try {
            $fromDate = Carbon::parse($from)->startOfDay();
            $toDate   = Carbon::parse($to)->endOfDay();
        } catch (\Throwable $e) {
            throw new \RuntimeException('Invalid APPOINTMENTS_API_FROM_DATE or APPOINTMENTS_API_TO_DATE: ' . $e->getMessage());
        }

        if ($fromDate->greaterThan($toDate)) {
            throw new \RuntimeException('APPOINTMENTS_API_FROM_DATE cannot be after APPOINTMENTS_API_TO_DATE.');
        }

        return [$fromDate->format('Y-m-d'), $toDate->format('Y-m-d')];
    }
}
