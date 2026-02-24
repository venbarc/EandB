<?php

namespace App\Imports;

use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class AppointmentsImport implements ToCollection, WithStartRow, WithChunkReading
{
    /**
     * The Excel layout:
     * Row 1  – "General Visit Report" title
     * Row 2  – empty
     * Row 3  – column headers
     * Row 4  – totals row  ← we skip rows 1-4 via startRow()
     * Row 5+ – actual patient records
     *
     * Column mapping (1-based):
     *  2  Patient Name
     *  3  Date of Service
     *  4  TIME (values: AM or PM)
     *  5  E&B Status (Eligible, Not Eligible, Verification Pending; empty = Verification Pending)
     *  6  Appointment Status
     *  7  Provider
     *  8  Service (visit type)
     *  9  Location
     * 10  Invoice No.
     * 11  Invoice Status
     * 12  Current Responsibility
     * 13  Claim Created (Yes/No)
     * 14  Charges
     * 15  Payments
     * 16  Units
     * 17  Created by
     * 18  Cancellation Reason
     * 19  Modification History
     * 20  Payment Method
     */

    private int $importedCount = 0;
    private int $skippedCount  = 0;
    /** @var array<int, array{patient_name: string, date_of_service: string, invoice_no: string|null}> */
    private array $duplicates  = [];

    public function getImportedCount(): int { return $this->importedCount; }
    public function getSkippedCount(): int  { return $this->skippedCount; }
    public function getDuplicates(): array  { return $this->duplicates; }

    public function startRow(): int  { return 5; }
    public function chunkSize(): int { return 500; }

    public function collection(Collection $rows): void
    {
        // ── 1. Parse every row in the chunk into candidate records ──────────
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

        // ── 2. Fetch existing keys in one bulk query ─────────────────────────
        $existingKeys = $this->fetchExistingKeys($candidates);

        // ── 3. Insert new records, skip duplicates ───────────────────────────
        foreach ($candidates as $candidate) {
            $key = $this->makeKey(
                $candidate['patient_name'],
                $candidate['date_of_service']
            );

            if (isset($existingKeys[$key])) {
                $this->skippedCount++;
                $this->duplicates[] = [
                    'patient_name'    => $candidate['patient_name'],
                    'date_of_service' => $candidate['date_of_service'],
                    'invoice_no'      => $candidate['invoice_no'],
                ];
            } else {
                Appointment::create($candidate);
                $this->importedCount++;
                // Prevent intra-chunk duplicates from inserting twice
                $existingKeys[$key] = true;
            }
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function parseRow(array $row): ?array
    {
        $name = trim((string) ($row[1] ?? ''));
        if ($name === '' || strtolower($name) === 'total') {
            return null;
        }

        $date = $this->parseDate($row[2] ?? null);
        if (! $date) {
            return null;
        }

        $ampm          = strtoupper(trim((string) ($row[3] ?? '')));
        $ebStatus      = trim((string) ($row[4] ?? ''));
        $invoiceNo     = trim((string) ($row[9] ?? '')) ?: null;

        return [
            'patient_name'           => $name,
            'patient_dob'            => null, // CSV layout has no DOB column
            'date_of_service'        => $date,
            'appointment_time'       => in_array($ampm, ['AM', 'PM']) ? $ampm : null,
            'eligibility_status'     => in_array($ebStatus, ['Eligible', 'Not Eligible', 'Verification Pending'])
                                            ? $ebStatus
                                            : 'Verification Pending',
            'appointment_status'     => trim((string) ($row[5] ?? 'New')),
            'provider'               => trim((string) ($row[6] ?? '')),
            'visit_type'             => trim((string) ($row[7] ?? '')),
            'location'               => trim((string) ($row[8] ?? '')) ?: null,
            'invoice_no'             => $invoiceNo,
            'invoice_status'         => trim((string) ($row[10] ?? '')) ?: null,
            'current_responsibility' => trim((string) ($row[11] ?? '')) ?: null,
            'claim_created'          => strtolower(trim((string) ($row[12] ?? ''))) === 'yes',
            'charges'                => is_numeric($row[13] ?? null) ? (float) $row[13] : 0,
            'payments'               => is_numeric($row[14] ?? null) ? (float) $row[14] : 0,
            'units'                  => is_numeric($row[15] ?? null) ? (int) $row[15] : 0,
            'created_by'             => trim((string) ($row[16] ?? '')) ?: null,
            'cancellation_reason'    => trim((string) ($row[17] ?? '')) ?: null,
            'modification_history'   => trim((string) ($row[18] ?? '')) ?: null,
            'payment_method'         => trim((string) ($row[19] ?? '')) ?: null,
        ];
    }

    /**
     * Build a "name|dos" => true hashmap for candidates that already exist in DB.
     *
     * Dedup criteria: patient_name + date_of_service only (DOB excluded).
     */
    private function fetchExistingKeys(array $candidates): array
    {
        $existing = [];

        if (empty($candidates)) {
            return $existing;
        }

        $q     = Appointment::query();
        $first = true;
        foreach ($candidates as $c) {
            $method = $first ? 'where' : 'orWhere';
            $q->$method(function ($sq) use ($c) {
                $sq->where('patient_name', $c['patient_name'])
                   ->where('date_of_service', $c['date_of_service']);
            });
            $first = false;
        }
        $q->select(['patient_name', 'date_of_service'])
          ->get()
          ->each(function ($row) use (&$existing) {
              $existing[$this->makeKey($row->patient_name, $row->date_of_service->format('Y-m-d'))] = true;
          });

        return $existing;
    }

    private function makeKey(string $name, string $dos): string
    {
        return strtolower(trim($name)) . '|' . $dos;
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
