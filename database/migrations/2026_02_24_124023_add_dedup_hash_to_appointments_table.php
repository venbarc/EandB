<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Add nullable column first ─────────────────────────────────────
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('dedup_hash', 32)->nullable()->after('id');
        });

        // ── 2. Backfill dedup_hash for all existing rows ──────────────────────
        DB::statement("
            UPDATE appointments
            SET dedup_hash = MD5(
                CONCAT(
                    LOWER(TRIM(patient_name)),
                    '|',
                    COALESCE(DATE_FORMAT(date_of_service, '%Y-%m-%d'), 'null-date')
                )
            )
            WHERE dedup_hash IS NULL
        ");

        // ── 3. Remove duplicate rows — keep only the highest id per hash ──────
        DB::statement("
            DELETE a
            FROM appointments a
            INNER JOIN (
                SELECT dedup_hash, MAX(id) AS keep_id
                FROM appointments
                WHERE dedup_hash IS NOT NULL
                GROUP BY dedup_hash
                HAVING COUNT(*) > 1
            ) dups ON a.dedup_hash = dups.dedup_hash
            WHERE a.id != dups.keep_id
        ");

        // ── 4. Now it is safe to add the unique constraint ────────────────────
        Schema::table('appointments', function (Blueprint $table) {
            $table->unique('dedup_hash', 'appointments_dedup_hash_unique');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropUnique('appointments_dedup_hash_unique');
            $table->dropColumn('dedup_hash');
        });
    }
};
