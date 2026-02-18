<?php

namespace App\Imports;

use App\Models\Appointment;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class AppointmentsImport implements ToModel, WithStartRow, WithChunkReading
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
     *  4  Appointment Status
     *  5  Provider
     *  6  Service (visit type)
     *  7  Location
     *  8  Invoice No.
     *  9  Invoice Status
     * 10  Current Responsibility
     * 11  Claim Created (Yes/No)
     * 12  Charges
     * 13  Payments
     * 14  Units
     * 15  Created by
     * 16  Cancellation Reason
     * 17  Modification History
     * 18  Payment Method
     */
    public function startRow(): int
    {
        return 5; // skip title, blank, headers, totals
    }

    public function chunkSize(): int
    {
        return 500;
    }

    public function model(array $row): ?Appointment
    {
        $name = trim((string) ($row[1] ?? ''));
        if ($name === '' || strtolower($name) === 'total') {
            return null; // skip blank or summary rows
        }

        $date = $this->parseDate($row[2] ?? null);
        if (! $date) {
            return null;
        }

        return new Appointment([
            'patient_name'           => $name,
            'date_of_service'        => $date,
            'appointment_status'     => trim((string) ($row[3] ?? 'New')),
            'provider'               => trim((string) ($row[4] ?? '')),
            'visit_type'             => trim((string) ($row[5] ?? '')),
            'location'               => trim((string) ($row[6] ?? '')) ?: null,
            'invoice_no'             => trim((string) ($row[7] ?? '')) ?: null,
            'invoice_status'         => trim((string) ($row[8] ?? '')) ?: null,
            'current_responsibility' => trim((string) ($row[9] ?? '')) ?: null,
            'claim_created'          => strtolower(trim((string) ($row[10] ?? ''))) === 'yes',
            'charges'                => is_numeric($row[11] ?? null) ? (float) $row[11] : 0,
            'payments'               => is_numeric($row[12] ?? null) ? (float) $row[12] : 0,
            'units'                  => is_numeric($row[13] ?? null) ? (int) $row[13] : 0,
            'created_by'             => trim((string) ($row[14] ?? '')) ?: null,
            'cancellation_reason'    => trim((string) ($row[15] ?? '')) ?: null,
            'modification_history'   => trim((string) ($row[16] ?? '')) ?: null,
            'payment_method'         => trim((string) ($row[17] ?? '')) ?: null,
        ]);
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
