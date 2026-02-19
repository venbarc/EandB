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

        $ampm = strtoupper(trim((string) ($row[3] ?? '')));
        $appointmentTime = in_array($ampm, ['AM', 'PM']) ? $ampm : null;

        $ebStatus = trim((string) ($row[4] ?? ''));
        $eligibilityStatus = in_array($ebStatus, ['Eligible', 'Not Eligible', 'Verification Pending'])
            ? $ebStatus
            : 'Verification Pending';

        return new Appointment([
            'patient_name'           => $name,
            'date_of_service'        => $date,
            'appointment_time'       => $appointmentTime,
            'eligibility_status'     => $eligibilityStatus,
            'appointment_status'     => trim((string) ($row[5] ?? 'New')),
            'provider'               => trim((string) ($row[6] ?? '')),
            'visit_type'             => trim((string) ($row[7] ?? '')),
            'location'               => trim((string) ($row[8] ?? '')) ?: null,
            'invoice_no'             => trim((string) ($row[9] ?? '')) ?: null,
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
