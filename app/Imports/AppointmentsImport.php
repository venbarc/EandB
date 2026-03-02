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
     * Visit AR Report CSV layout (headers in row 1, data from row 2):
     *
     * Column mapping (0-based index):
     *  0  Index (row number — skipped)
     *  1  Patient ID
     *  2  Patient Name
     *  3  DOB
     *  4  Provider
     *  5  Service (visit type)
     *  6  Month, Day, Year of Date of Service (text: "January 7, 2026")
     *  7  Appointment Status
     *  8  Modification History
     *  9  Location
     * 10  Invoice No.
     * 11  Invoice Status
     * 12  Authorization Number
     * 13  Scheduled Visits
     * 14  Total Visits
     * 15  Charges
     * 16  Payments
     * 17  Units
     * 18  Installment ID1
     * 19  Invoice No. (ARAging)
     * 20  Claim Created (ARAging)
     * 21  Current Responsibility (ARAging)
     * 22  Primary/Secondary/Patient
     * 23  Insurance/Patient Name
     * 24  AR Charges
     * 25  AR Payments
     * 26  AR Adjustments/Promotions
     * 27  Balance
     */

    /**
     * Source-system fields safe to overwrite on duplicate (upsert update columns).
     * Deliberately excludes user-set fields: eligibility_status, primary_insurance,
     * referral_status, collection_status, notes, psc_*, etc.
     */
    private const UPSERT_UPDATE_COLUMNS = [
        'patient_external_id',
        'patient_dob',
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
        'modification_history',
        'authorization_number',
        'scheduled_visits',
        'total_visits',
        'auth_status',
        'installment_id',
        'invoice_no_ar_aging',
        'primary_secondary_patient',
        'insurance_patient_name',
        'ar_charges',
        'ar_payments',
        'ar_adjustments',
        'balance',
        'updated_at',
    ];

    private int     $importedCount = 0;
    private int     $chunkCount    = 0;
    private ?string $cacheKey      = null;

    /** Whether to only process updates (records that already exist with different modification_history). */
    private bool $updatesOnly = false;

    /** Whether to only process new records (records that don't exist). */
    private bool $newOnly = false;

    public function getImportedCount(): int { return $this->importedCount; }
    public function getChunkCount(): int    { return $this->chunkCount; }

    /** Set a cache key so each processed chunk updates the import progress. */
    public function withCacheKey(string $key): static
    {
        $this->cacheKey = $key;
        return $this;
    }

    public function updatesOnly(bool $flag = true): static
    {
        $this->updatesOnly = $flag;
        return $this;
    }

    public function newOnly(bool $flag = true): static
    {
        $this->newOnly = $flag;
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

        // ── 2. Add timestamps, dedup_hash, and auto-tag auth_status ─────────
        $now  = now()->toDateTimeString();
        $rows = array_map(function (array $c) use ($now): array {
            $c['dedup_hash']  = $this->makeHash($c['patient_name'], $c['date_of_service'] ?? null, $c['appointment_status'] ?? null);
            $c['created_at']  = $now;
            $c['updated_at']  = $now;

            // Auto-tag auth_status based on authorization data
            if (!empty($c['authorization_number'])) {
                $c['auth_status'] = 'Auth Active';
            } else {
                $c['auth_status'] = 'For Review';
            }

            return $c;
        }, $candidates);

        // ── 3. Filter based on mode (new only / updates only) ────────────────
        if ($this->newOnly || $this->updatesOnly) {
            $hashes = array_column($rows, 'dedup_hash');
            $existing = Appointment::whereIn('dedup_hash', $hashes)
                ->pluck('modification_history', 'dedup_hash')
                ->toArray();

            $rows = array_filter($rows, function (array $row) use ($existing) {
                $hash = $row['dedup_hash'];
                $existsInDb = array_key_exists($hash, $existing);

                if ($this->newOnly) {
                    return !$existsInDb;
                }

                // updatesOnly: record must exist AND have different modification_history
                if ($this->updatesOnly) {
                    if (!$existsInDb) return false;
                    return ($this->parseModificationDate($existing[$hash]) ?? '') !== trim((string) ($row['modification_history'] ?? ''));
                }

                return true;
            });

            $rows = array_values($rows);
        }

        if (empty($rows)) {
            return;
        }

        // ── 4. Upsert entire chunk — one SQL statement, zero N+1 ──────────────
        Appointment::upsert($rows, ['dedup_hash'], self::UPSERT_UPDATE_COLUMNS);

        // Approximate imported count: rows processed in this chunk
        $this->importedCount += count($rows);

        // ── 5. Report progress to cache so the frontend can poll it ───────────
        if ($this->cacheKey !== null) {
            Cache::put($this->cacheKey, [
                'state'    => 'running',
                'chunk'    => $this->chunkCount,
                'imported' => $this->importedCount,
                'skipped'  => 0,
            ], 3600);
        }
    }

    // ── Public helper for preview ─────────────────────────────────────────────

    /**
     * Parse a single row for preview purposes.
     */
    public function parseRowForPreview(array $row): ?array
    {
        return $this->parseRow($row);
    }

    /**
     * Compute dedup hash for a parsed row.
     */
    public function computeHash(string $name, ?string $dos, ?string $status): string
    {
        return $this->makeHash($name, $dos, $status);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function parseRow(array $row): ?array
    {
        $name = trim((string) ($row[2] ?? ''));
        if ($name === '' || strtolower($name) === 'total') {
            return null;
        }

        // Column 6: "Month, Day, Year of Date of Service" (text: "January 7, 2026")
        $date = $this->parseDate($row[6] ?? null);
        if (! $date) {
            return null;
        }

        $dob = $this->parseDate($row[3] ?? null);

        return [
            'patient_external_id'      => trim((string) ($row[1] ?? '')) ?: null,
            'patient_name'             => $name,
            'patient_dob'              => $dob,
            'date_of_service'          => $date,
            'eligibility_status'       => 'Verification Pending',
            'appointment_status'       => trim((string) ($row[7] ?? 'New')),
            'provider'                 => trim((string) ($row[4] ?? '')),
            'visit_type'               => trim((string) ($row[5] ?? '')),
            'location'                 => trim((string) ($row[9] ?? '')) ?: null,
            'authorization_number'     => trim((string) ($row[12] ?? '')) ?: null,
            'scheduled_visits'         => is_numeric($row[13] ?? null) ? (int) $row[13] : null,
            'total_visits'             => is_numeric($row[14] ?? null) ? (int) $row[14] : null,
            'invoice_no'               => trim((string) ($row[10] ?? '')) ?: null,
            'invoice_status'           => trim((string) ($row[11] ?? '')) ?: null,
            'current_responsibility'   => trim((string) ($row[21] ?? '')) ?: null,
            'claim_created'            => strtolower(trim((string) ($row[20] ?? ''))) === 'yes',
            'charges'                  => is_numeric($row[15] ?? null) ? (float) $row[15] : 0,
            'payments'                 => is_numeric($row[16] ?? null) ? (float) $row[16] : 0,
            'units'                    => is_numeric($row[17] ?? null) ? (int) $row[17] : 0,
            'modification_history'     => $this->parseModificationDate($row[8] ?? null),
            'installment_id'           => trim((string) ($row[18] ?? '')) ?: null,
            'invoice_no_ar_aging'      => trim((string) ($row[19] ?? '')) ?: null,
            'primary_secondary_patient'=> trim((string) ($row[22] ?? '')) ?: null,
            'insurance_patient_name'   => trim((string) ($row[23] ?? '')) ?: null,
            'ar_charges'               => is_numeric($row[24] ?? null) ? (float) $row[24] : 0,
            'ar_payments'              => is_numeric($row[25] ?? null) ? (float) $row[25] : 0,
            'ar_adjustments'           => is_numeric($row[26] ?? null) ? (float) $row[26] : 0,
            'balance'                  => is_numeric($row[27] ?? null) ? (float) $row[27] : 0,
        ];
    }

    private function makeHash(string $name, ?string $dos, ?string $status): string
    {
        return md5(strtolower(trim($name)) . '|' . ($dos ?? 'null-date') . '|' . strtolower(trim($status ?? '')));
    }

    public function parseModificationDate(mixed $value): ?string
    {
        $value = trim((string) ($value ?? ''));
        if ($value === '') {
            return null;
        }
        // Extract the most recent date/time from "● MM/DD/YYYY HH:MM AM/PM - by ..."
        if (preg_match('/(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}\s*[AP]M)/i', $value, $m)) {
            return $m[1];
        }
        return $value;
    }

    private function parseDate(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }
        try {
            if (is_numeric($value)) {
                // Excel serial date number
                return Carbon::createFromTimestamp(($value - 25569) * 86400)->format('Y-m-d');
            }
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }
}
