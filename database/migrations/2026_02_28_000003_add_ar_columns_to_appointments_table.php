<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('installment_id')->nullable()->after('authorization_text');
            $table->string('invoice_no_ar_aging')->nullable()->after('installment_id');
            $table->string('primary_secondary_patient')->nullable()->after('invoice_no_ar_aging');
            $table->string('insurance_patient_name')->nullable()->after('primary_secondary_patient');
            $table->decimal('ar_charges', 10, 2)->default(0)->after('insurance_patient_name');
            $table->decimal('ar_payments', 10, 2)->default(0)->after('ar_charges');
            $table->decimal('ar_adjustments', 10, 2)->default(0)->after('ar_payments');
            $table->decimal('balance', 10, 2)->default(0)->after('ar_adjustments');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'installment_id',
                'invoice_no_ar_aging',
                'primary_secondary_patient',
                'insurance_patient_name',
                'ar_charges',
                'ar_payments',
                'ar_adjustments',
                'balance',
            ]);
        });
    }
};
