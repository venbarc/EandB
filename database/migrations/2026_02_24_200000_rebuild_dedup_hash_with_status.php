<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop unique constraint so bulk UPDATE doesn't trip on transient collisions.
        Schema::table('appointments', function ($table) {
            $table->dropUnique('appointments_dedup_hash_unique');
        });

        // 2. Backfill every row with the new hash: name | dos | status
        DB::statement("
            UPDATE appointments
            SET dedup_hash = MD5(
                CONCAT(
                    LOWER(TRIM(patient_name)),
                    '|',
                    COALESCE(DATE_FORMAT(date_of_service, '%Y-%m-%d'), 'null-date'),
                    '|',
                    LOWER(TRIM(COALESCE(appointment_status, '')))
                )
            )
        ");

        // 3. Remove duplicates — keep the highest ID per new hash.
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

        // 4. Restore unique constraint.
        Schema::table('appointments', function ($table) {
            $table->unique('dedup_hash');
        });
    }

    public function down(): void
    {
        // Revert to old formula: name | dos (without status).
        Schema::table('appointments', function ($table) {
            $table->dropUnique('appointments_dedup_hash_unique');
        });

        DB::statement("
            UPDATE appointments
            SET dedup_hash = MD5(
                CONCAT(
                    LOWER(TRIM(patient_name)),
                    '|',
                    COALESCE(DATE_FORMAT(date_of_service, '%Y-%m-%d'), 'null-date')
                )
            )
        ");

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

        Schema::table('appointments', function ($table) {
            $table->unique('dedup_hash');
        });
    }
};
