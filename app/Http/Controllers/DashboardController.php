<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        // ── Filters ─────────────────────────────────────────────────────────────
        $filters = $request->only([
            'date', 'patient', 'insurances', 'provider',
            'status', 'location', 'auth', 'referral',
        ]);

        // ── Appointments query ───────────────────────────────────────────────────
        $appointments = Appointment::query()
            ->with('paDepartmentSubmission')
            ->forDate($filters['date'] ?? null)
            ->forPatient($filters['patient'] ?? null)
            ->forInsurances(isset($filters['insurances']) ? (array) $filters['insurances'] : null)
            ->forProvider($filters['provider'] ?? null)
            ->forStatus($filters['status'] ?? null)
            ->forLocation($filters['location'] ?? null)
            ->forAuth($filters['auth'] ?? null)
            ->forReferral($filters['referral'] ?? null)
            ->orderBy('date_of_service', 'asc')
            ->orderBy('patient_name', 'asc')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Appointment $a) => $this->transformAppointment($a));

        // ── Live stats ───────────────────────────────────────────────────────────
        $aggregates = Appointment::query()
            ->selectRaw('COUNT(*) AS total_appointments')
            ->selectRaw("SUM(CASE WHEN eligibility_status = 'Eligible' THEN 1 ELSE 0 END) AS eligible_count")
            ->selectRaw("SUM(CASE WHEN eligibility_status = 'Not Eligible' THEN 1 ELSE 0 END) AS not_eligible_count")
            ->selectRaw("SUM(CASE WHEN eligibility_status IN ('Verification Pending', 'Verification Needed') THEN 1 ELSE 0 END) AS verification_pending_count")
            ->selectRaw("SUM(CASE WHEN auth_status = 'Auth Required' THEN 1 ELSE 0 END) AS auth_count")
            ->selectRaw("SUM(CASE WHEN referral_status = 'Required' THEN 1 ELSE 0 END) AS ref_count")
            ->first();

        $stats = [
            'totalAppointments'        => (int) ($aggregates?->total_appointments ?? 0),
            'eligibleCount'            => (int) ($aggregates?->eligible_count ?? 0),
            'notEligibleCount'         => (int) ($aggregates?->not_eligible_count ?? 0),
            'verificationPendingCount' => (int) ($aggregates?->verification_pending_count ?? 0),
            'authCount'                => (int) ($aggregates?->auth_count ?? 0),
            'refCount'                 => (int) ($aggregates?->ref_count ?? 0),
        ];

        // ── Filter options (for populating dropdowns) ────────────────────────────
        $filterOptions = [
            'providers'  => Appointment::select('provider')->distinct()->orderBy('provider')->pluck('provider'),
            'locations'  => Appointment::select('location')->whereNotNull('location')->distinct()->orderBy('location')->pluck('location'),
            'insurances' => Appointment::select('primary_insurance')->whereNotNull('primary_insurance')->distinct()->orderBy('primary_insurance')->pluck('primary_insurance'),
            'statuses'   => Appointment::select('appointment_status')->distinct()->orderBy('appointment_status')->pluck('appointment_status'),
        ];

        return Inertia::render('Dashboard', [
            'stats'        => $stats,
            'appointments' => [
                'data'  => $appointments->items(),
                'meta'  => [
                    'current_page' => $appointments->currentPage(),
                    'last_page'    => $appointments->lastPage(),
                    'per_page'     => $appointments->perPage(),
                    'total'        => $appointments->total(),
                    'from'         => $appointments->firstItem(),
                    'to'           => $appointments->lastItem(),
                ],
                'links' => [
                    'first' => $appointments->url(1),
                    'last'  => $appointments->url($appointments->lastPage()),
                    'prev'  => $appointments->previousPageUrl(),
                    'next'  => $appointments->nextPageUrl(),
                ],
            ],
            'filters'       => $filters,
            'filterOptions' => $filterOptions,
        ]);
    }

    private function transformAppointment(Appointment $a): array
    {
        return [
            'id'                   => (string) $a->id,
            'formattedId'          => $a->formatted_id,
            'patient' => [
                'id'      => $a->formatted_id,
                'name'    => $a->patient_name,
                'dob'     => $a->patient_dob?->format('m/d/Y') ?? 'N/A',
                'phone'   => $a->patient_phone ?? 'N/A',
                'email'   => $a->patient_email ?? 'N/A',
                'address' => $a->patient_address ?? 'N/A',
            ],
            'provider'             => $a->provider,
            'date'                 => $a->date_of_service->format('m/d/Y'),
            'time'                 => $a->appointment_time ?? '',
            'status'               => $a->appointment_status,
            'confirmationMethod'   => $a->confirmation_method ?? 'N/A',
            'authStatus'           => $a->auth_status ?? 'N/A',
            'referralStatus'       => $a->referral_status ?? 'N/A',
            'insurance' => [
                'primary'   => $a->primary_insurance ?? 'N/A',
                'primaryId' => $a->primary_insurance_id ?? 'N/A',
                'secondary' => $a->secondary_insurance,
                'status'    => $a->insurance_status ?? 'N/A',
            ],
            'visitType'            => $a->visit_type ?? 'N/A',
            'paidAmount'           => (float) $a->payments,
            'pscCode'              => $a->psc_code ?? '',
            'pscDescription'       => $a->psc_description ?? '',
            'credits'              => (float) $a->credits,
            'deductible'           => (float) $a->deductible,
            'oop'                  => (float) $a->oop,
            'eligibilityStatus'    => $a->eligibility_status ?? 'Verification Needed',
            'charges'              => (float) $a->charges,
            'invoiceStatus'        => $a->invoice_status ?? '',
            'location'             => $a->location ?? '',
            'collectionStatus'     => $a->collection_status ?? '',
            'providerCredentialed' => $a->provider_credentialed,
            'collectedAmount'      => $a->collected_amount,
            'collectedMethod'      => $a->collected_method ?? '',
            'collectedReceiptNo'   => $a->collected_receipt_no ?? '',
            'notes'                => $a->notes ?? '',
            'isSubmittedToPaDept'  => $a->paDepartmentSubmission !== null,
            'paSubmittedAt'        => $a->paDepartmentSubmission?->submitted_at?->toIso8601String(),
        ];
    }
}
