<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pa_export_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('enabled')->default(false);
            $table->string('schedule_time', 5)->default('08:00');
            $table->enum('export_scope', ['all', 'today'])->default('all');
            $table->json('recipients');
            $table->timestamps();
        });

        DB::table('pa_export_settings')->insert([
            'enabled'       => false,
            'schedule_time' => '08:00',
            'export_scope'  => 'all',
            'recipients'    => json_encode([]),
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('pa_export_settings');
    }
};
