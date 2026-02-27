<?php

namespace App\Exports;

use App\Models\Appointment;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AppointmentsExport implements FromQuery, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
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
            'Patient ID',
            'Patient Name',
            'Date of Birth',
            'Date of Service',
            'Appt Time',
            'Appointment Status',
            'Provider',
            'Visit Type',
            'Location',
            'Primary Insurance',
            'Primary Insurance ID',
            'Secondary Insurance',
            'Insurance Status',
            'Invoice No.',
            'Invoice Status',
            'Charges',
            'Payments',
            'Units',
            'Auth Status',
            'Referral Status',
            'Eligibility Status',
            'Collection Status',
            'Collected Amount',
            'Collected Method',
            'Receipt No.',
            'PSC Code',
            'PSC Description',
            'Notes',
            'Created By',
        ];
    }

    public function map($row): array
    {
        return [
            $row->formatted_id,
            $row->patient_name,
            $row->patient_dob?->format('m/d/Y') ?? '',
            $row->date_of_service->format('m/d/Y'),
            $row->appointment_time ?? '',
            $row->appointment_status,
            $row->provider,
            $row->visit_type ?? '',
            $row->location ?? '',
            $row->primary_insurance ?? '',
            $row->primary_insurance_id ?? '',
            $row->secondary_insurance ?? '',
            $row->insurance_status ?? '',
            $row->invoice_no ?? '',
            $row->invoice_status ?? '',
            number_format((float) $row->charges, 2),
            number_format((float) $row->payments, 2),
            $row->units,
            $row->auth_status ?? '',
            $row->referral_status ?? '',
            $row->eligibility_status ?? '',
            $row->collection_status ?? '',
            $row->collected_amount !== null ? number_format((float) $row->collected_amount, 2) : '',
            $row->collected_method ?? '',
            $row->collected_receipt_no ?? '',
            $row->psc_code ?? '',
            $row->psc_description ?? '',
            $row->notes ?? '',
            $row->created_by ?? '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
