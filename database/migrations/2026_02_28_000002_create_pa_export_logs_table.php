<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pa_export_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('status', ['success', 'failed']);
            $table->json('recipients');
            $table->unsignedInteger('record_count')->default(0);
            $table->string('file_name')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('executed_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pa_export_logs');
    }
};
