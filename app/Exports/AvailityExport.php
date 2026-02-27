<?php

namespace App\Exports;

use App\Models\Appointment;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Exports appointments in Availity-compatible format.
 * Columns match the General Visit Report structure used for imports.
 */
class AvailityExport implements FromQuery, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    public function __construct(private readonly array $filters = []) {}

    public function query()
    {
        return Appointment::query()
            ->forDateRange($this->filters['dateFrom'] ?? null, $this->filters['dateTo'] ?? null)
            ->forPatient($this->filters['patient'] ?? null)
            ->forInsurances($this->filters['insurances'] ?? null)
            ->forProvider($this->filters['provider'] ?? null)
            ->forStatus($this->filters['status'] ?? null)
            ->orderBy('date_of_service')
            ->orderBy('patient_name');
    }

    public function headings(): array
    {
        return [
            'Patient Name',
            'Date of Service',
            'Appointment Status',
            'Provider',
            'Service',
            'Location',
            'Invoice No.',
            'Invoice Status',
            'Current Responsibility',
            'Claim Created',
            'Charges',
            'Payments',
            'Units',
            'Created by',
            'Cancellation Reason',
            'Modification History',
            'Payment Method',
        ];
    }

    public function map($row): array
    {
        return [
            $row->patient_name,
            $row->date_of_service->format('Y-m-d'),
            $row->appointment_status,
            $row->provider,
            $row->visit_type ?? '',
            $row->location ?? '',
            $row->invoice_no ?? '',
            $row->invoice_status ?? '',
            $row->current_responsibility ?? '',
            $row->claim_created ? 'Yes' : 'No',
            number_format((float) $row->charges, 2),
            number_format((float) $row->payments, 2),
            $row->units,
            $row->created_by ?? '',
            $row->cancellation_reason ?? '',
            $row->modification_history ?? '',
            $row->payment_method ?? '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
