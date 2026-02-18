<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();

            // Patient info (populated via Update modal or seeder)
            $table->string('patient_name');
            $table->date('patient_dob')->nullable();
            $table->string('patient_phone')->nullable();
            $table->string('patient_email')->nullable();
            $table->string('patient_address')->nullable();

            // Appointment core (from Excel import)
            $table->date('date_of_service');
            $table->time('appointment_time')->nullable();
            $table->string('appointment_status')->default('New'); // New, Confirmed, Pending, Cancelled, No Show, Checked In
            $table->string('confirmation_method')->nullable();
            $table->string('provider');
            $table->string('visit_type')->nullable();   // maps to "Service" in Excel
            $table->string('location')->nullable();

            // Invoice / billing (from Excel)
            $table->string('invoice_no')->nullable();
            $table->string('invoice_status')->nullable();           // Paid, Unpaid
            $table->string('current_responsibility')->nullable();   // Unidentified, Patient, Insurance, etc.
            $table->boolean('claim_created')->default(false);
            $table->decimal('charges', 10, 2)->default(0);
            $table->decimal('payments', 10, 2)->default(0);        // total payments recorded
            $table->unsignedInteger('units')->default(0);
            $table->string('created_by')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->text('modification_history')->nullable();
            $table->string('payment_method')->nullable();

            // Insurance (from Update modal)
            $table->string('primary_insurance')->nullable();
            $table->string('primary_insurance_id')->nullable();
            $table->string('secondary_insurance')->nullable();
            $table->string('insurance_status')->nullable();        // Active, Inactive

            // Eligibility & authorisation (from Update modal)
            $table->string('auth_status')->nullable();             // Auth Required, N/A
            $table->string('referral_status')->nullable();         // Required, N/A
            $table->string('eligibility_status')->nullable();      // Eligible, Not Eligible, Verification Needed
            $table->boolean('provider_credentialed')->nullable();
            $table->string('collection_status')->nullable();       // Collected, Pending, Not Required

            // Financial details (from Update modal)
            $table->decimal('credits', 10, 2)->default(0);
            $table->decimal('deductible', 10, 2)->default(0);
            $table->decimal('oop', 10, 2)->default(0);             // out of pocket

            // Payment collected at appointment (from Collect step)
            $table->decimal('collected_amount', 10, 2)->nullable();
            $table->string('collected_method')->nullable();        // Cash, Credit Card, Check, Insurance, Other
            $table->string('collected_receipt_no')->nullable();

            // PSC (Patient Service Center)
            $table->string('psc_code')->nullable();                // Eligibility Completed, etc.
            $table->text('psc_description')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes for common filter queries
            $table->index('date_of_service');
            $table->index('provider');
            $table->index('appointment_status');
            $table->index('primary_insurance');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
