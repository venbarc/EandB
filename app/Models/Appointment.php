<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    protected $fillable = [
        'patient_name',
        'patient_dob',
        'patient_phone',
        'patient_email',
        'patient_address',
        'date_of_service',
        'appointment_time',
        'appointment_status',
        'confirmation_method',
        'provider',
        'visit_type',
        'location',
        'invoice_no',
        'invoice_status',
        'current_responsibility',
        'claim_created',
        'charges',
        'payments',
        'units',
        'created_by',
        'cancellation_reason',
        'modification_history',
        'payment_method',
        'primary_insurance',
        'primary_insurance_id',
        'secondary_insurance',
        'insurance_status',
        'auth_status',
        'referral_status',
        'eligibility_status',
        'provider_credentialed',
        'collection_status',
        'credits',
        'deductible',
        'oop',
        'collected_amount',
        'collected_method',
        'collected_receipt_no',
        'psc_code',
        'psc_description',
        'notes',
    ];

    protected $casts = [
        'date_of_service'     => 'date',
        'patient_dob'         => 'date',
        'claim_created'       => 'boolean',
        'provider_credentialed' => 'boolean',
        'charges'             => 'float',
        'payments'            => 'float',
        'credits'             => 'float',
        'deductible'          => 'float',
        'oop'                 => 'float',
        'collected_amount'    => 'float',
    ];

    /** Formatted patient ID shown in the table (PT-000001). */
    public function getFormattedIdAttribute(): string
    {
        return 'PT-' . str_pad((string) $this->id, 6, '0', STR_PAD_LEFT);
    }

    // ── Filter Scopes ──────────────────────────────────────────────────────────

    public function scopeForDate(Builder $query, ?string $date): Builder
    {
        return $date ? $query->whereDate('date_of_service', $date) : $query;
    }

    public function scopeForPatient(Builder $query, ?string $search): Builder
    {
        return $search
            ? $query->where(function (Builder $q) use ($search) {
                $q->where('patient_name', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            })
            : $query;
    }

    public function scopeForInsurances(Builder $query, ?array $insurances): Builder
    {
        return ($insurances && count($insurances))
            ? $query->whereIn('primary_insurance', $insurances)
            : $query;
    }

    public function scopeForProvider(Builder $query, ?string $provider): Builder
    {
        return $provider ? $query->where('provider', $provider) : $query;
    }

    public function scopeForStatus(Builder $query, ?string $status): Builder
    {
        return $status ? $query->where('appointment_status', $status) : $query;
    }

    public function scopeForLocation(Builder $query, ?string $location): Builder
    {
        return $location ? $query->where('location', $location) : $query;
    }

    public function scopeForAuth(Builder $query, ?string $auth): Builder
    {
        return $auth ? $query->where('auth_status', $auth) : $query;
    }

    public function scopeForReferral(Builder $query, ?string $referral): Builder
    {
        return $referral ? $query->where('referral_status', $referral) : $query;
    }

    public function paDepartmentSubmission(): HasOne
    {
        return $this->hasOne(PaDepartmentSubmission::class);
    }
}
