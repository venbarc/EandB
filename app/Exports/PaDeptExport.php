<?php

namespace App\Exports;

use App\Models\Appointment;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PaDeptExport implements FromQuery, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    public function __construct(private readonly array $filters = []) {}

    public function query()
    {
        return Appointment::query()
            ->whereHas('paDepartmentSubmission')
            ->with('paDepartmentSubmission')
            ->forDate($this->filters['date'] ?? null)
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
            'Provider',
            'Primary Insurance',
            'Auth Status',
            'Referral Status',
            'Eligibility Status',
            'Collection Status',
            'Paid Amount',
            'Notes',
            'Submitted At',
        ];
    }

    public function map($row): array
    {
        return [
            $row->formatted_id,
            $row->patient_name,
            $row->patient_dob?->format('m/d/Y') ?? '',
            $row->date_of_service->format('m/d/Y'),
            $row->provider,
            $row->primary_insurance ?? '',
            $row->auth_status ?? '',
            $row->referral_status ?? '',
            $row->eligibility_status ?? '',
            $row->collection_status ?? '',
            number_format((float) $row->payments, 2),
            $row->notes ?? '',
            $row->paDepartmentSubmission?->submitted_at?->format('Y-m-d H:i:s') ?? '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
