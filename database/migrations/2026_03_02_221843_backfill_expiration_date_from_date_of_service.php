<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::update('UPDATE appointments SET expiration_date = DATE(date_of_service) WHERE expiration_date IS NULL');
    }

    public function down(): void
    {
        //
    }
};
