<?php

namespace App\Http\Controllers;

use App\Exports\AppointmentsExport;
use App\Exports\AvailityExport;
use App\Imports\AppointmentsImport;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AppointmentController extends Controller
{
    /** Update eligibility + collection data from the 3-step modal. */
    public function update(Request $request, Appointment $appointment): RedirectResponse
    {
        $data = $request->validate([
            'provider_credentialed' => ['nullable', 'boolean'],
            'eligibility_status'    => ['nullable', 'string', 'max:100'],
            'collection_status'     => ['nullable', 'string', 'max:100'],
            'payments'              => ['nullable', 'numeric', 'min:0'],
            'auth_status'           => ['nullable', 'string', 'max:100'],
            'referral_status'       => ['nullable', 'string', 'max:100'],
            'notes'                 => ['nullable', 'string'],
            'collected_amount'      => ['nullable', 'numeric', 'min:0'],
            'collected_method'      => ['nullable', 'string', 'max:100'],
            'collected_receipt_no'  => ['nullable', 'string', 'max:100'],
        ]);

        $appointment->update(array_filter($data, fn ($v) => $v !== null && $v !== ''));

        return back()->with('success', 'Record updated successfully.');
    }

    /** Update PSC code + description. */
    public function updatePsc(Request $request, Appointment $appointment): RedirectResponse
    {
        $data = $request->validate([
            'psc_code'        => ['nullable', 'string', 'max:100'],
            'psc_description' => ['nullable', 'string'],
        ]);

        $appointment->update($data);

        return back()->with('success', 'PSC updated successfully.');
    }

    /** Import appointments from an uploaded xlsx/csv file. */
    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:20480'],
        ]);

        Excel::import(new AppointmentsImport(), $request->file('file'));

        return back()->with('success', 'Appointments imported successfully.');
    }

    /** Export all appointments as xlsx. */
    public function exportAll(Request $request): BinaryFileResponse
    {
        $filters = $request->only(['date', 'patient', 'insurances', 'provider', 'status']);
        return Excel::download(new AppointmentsExport($filters), 'appointments.xlsx');
    }

    /** Export in Availity-compatible format. */
    public function exportAvailty(Request $request): BinaryFileResponse
    {
        $filters = $request->only(['date', 'patient', 'insurances', 'provider', 'status']);
        return Excel::download(new AvailityExport($filters), 'availity-export.xlsx');
    }
}
