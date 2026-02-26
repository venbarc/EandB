<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('patient_external_id')->nullable()->after('patient_name');
            $table->string('authorization_number')->nullable()->after('payment_method');
            $table->unsignedInteger('scheduled_visits')->nullable()->after('authorization_number');
            $table->unsignedInteger('total_visits')->nullable()->after('scheduled_visits');
            $table->date('expiration_date')->nullable()->after('total_visits');
            $table->text('authorization_text')->nullable()->after('expiration_date');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'patient_external_id',
                'authorization_number',
                'scheduled_visits',
                'total_visits',
                'expiration_date',
                'authorization_text',
            ]);
        });
    }
};
