<?php

namespace App\Imports;

use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class AppointmentsImport implements ToCollection, WithStartRow, WithChunkReading
{
    /**
     * PTEverywhere export layout (headers in row 1, data from row 2):
     *
     * Column mapping (0-based index):
     *  0  Patient Name
     *  1  Date of Service
     *  2  Appointment Status
     *  3  Provider
     *  4  Service (visit type)
     *  5  Location
     *  6  Invoice No.
     *  7  Invoice Status
     *  8  Current Responsibility
     *  9  Claim Created (Yes/No)
     * 10  Charges
     * 11  Payments
     * 12  Units
     * 13  Created by
     * 14  Cancellation Reason
     * 15  Modification History
     */

    /**
     * Source-system fields safe to overwrite on duplicate (upsert update columns).
     * Deliberately excludes user-set fields: eligibility_status, primary_insurance,
     * auth_status, referral_status, collection_status, notes, psc_*, etc.
     */
    private const UPSERT_UPDATE_COLUMNS = [
        'appointment_status',
        'invoice_no',
        'invoice_status',
        'current_responsibility',
        'claim_created',
        'charges',
        'payments',
        'units',
        'visit_type',
        'location',
        'provider',
        'cancellation_reason',
        'modification_history',
        'created_by',
        'updated_at',
    ];

    private int     $importedCount = 0;
    private int     $chunkCount    = 0;
    private ?string $cacheKey      = null;

    public function getImportedCount(): int { return $this->importedCount; }
    public function getChunkCount(): int    { return $this->chunkCount; }

    /** Set a cache key so each processed chunk updates the import progress. */
    public function withCacheKey(string $key): static
    {
        $this->cacheKey = $key;
        return $this;
    }

    public function startRow(): int  { return 2; }
    public function chunkSize(): int { return 2000; }

    public function collection(Collection $rows): void
    {
        $this->chunkCount++;

        // ── 1. Parse rows into candidate records ─────────────────────────────
        $candidates = [];
        foreach ($rows as $row) {
            $parsed = $this->parseRow($row->toArray());
            if ($parsed !== null) {
                $candidates[] = $parsed;
            }
        }

        if (empty($candidates)) {
            return;
        }

        // ── 2. Add timestamps and dedup_hash to each candidate ────────────────
        $now  = now()->toDateTimeString();
        $rows = array_map(function (array $c) use ($now): array {
            $c['dedup_hash']  = $this->makeHash($c['patient_name'], $c['date_of_service'] ?? null, $c['appointment_status'] ?? null);
            $c['created_at']  = $now;
            $c['updated_at']  = $now;
            return $c;
        }, $candidates);

        // ── 3. Upsert entire chunk — one SQL statement, zero N+1 ──────────────
        Appointment::upsert($rows, ['dedup_hash'], self::UPSERT_UPDATE_COLUMNS);

        // Approximate imported count: rows processed in this chunk
        $this->importedCount += count($rows);

        // ── 4. Report progress to cache so the frontend can poll it ───────────
        if ($this->cacheKey !== null) {
            Cache::put($this->cacheKey, [
                'state'    => 'running',
                'chunk'    => $this->chunkCount,
                'imported' => $this->importedCount,
                'skipped'  => 0,
            ], 3600);
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function parseRow(array $row): ?array
    {
        $name = trim((string) ($row[0] ?? ''));
        if ($name === '' || strtolower($name) === 'total') {
            return null;
        }

        $date = $this->parseDate($row[1] ?? null);
        if (! $date) {
            return null;
        }

        $invoiceNo = trim((string) ($row[6] ?? '')) ?: null;

        return [
            'patient_name'           => $name,
            'patient_dob'            => null,
            'date_of_service'        => $date,
            'eligibility_status'     => 'Verification Pending',
            'appointment_status'     => trim((string) ($row[2] ?? 'New')),
            'provider'               => trim((string) ($row[3] ?? '')),
            'visit_type'             => trim((string) ($row[4] ?? '')),
            'location'               => trim((string) ($row[5] ?? '')) ?: null,
            'invoice_no'             => $invoiceNo,
            'invoice_status'         => trim((string) ($row[7] ?? '')) ?: null,
            'current_responsibility' => trim((string) ($row[8] ?? '')) ?: null,
            'claim_created'          => strtolower(trim((string) ($row[9] ?? ''))) === 'yes',
            'charges'                => is_numeric($row[10] ?? null) ? (float) $row[10] : 0,
            'payments'               => is_numeric($row[11] ?? null) ? (float) $row[11] : 0,
            'units'                  => is_numeric($row[12] ?? null) ? (int) $row[12] : 0,
            'created_by'             => trim((string) ($row[13] ?? '')) ?: null,
            'cancellation_reason'    => trim((string) ($row[14] ?? '')) ?: null,
            'modification_history'   => trim((string) ($row[15] ?? '')) ?: null,
        ];
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
            if (is_numeric($value)) {
                // Excel serial date number
                return Carbon::createFromTimestamp(($value - 25569) * 86400)->format('Y-m-d');
            }
            return Carbon::parse((string) $value)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }
}
