<?php

namespace Database\Seeders;

use App\Imports\AppointmentsImport;
use Illuminate\Database\Seeder;
use Maatwebsite\Excel\Facades\Excel;

class AppointmentSeeder extends Seeder
{
    /**
     * Imports the General Visit Report Excel file.
     *
     * The file is expected at:
     *   C:\Users\AaronCarlCladoLibago\Downloads\GeneralVisitReport02_16_2026 (1).xlsx
     *
     * Usage:  php artisan db:seed --class=AppointmentSeeder
     */
    public function run(): void
    {
        $path = 'C:\\Users\\AaronCarlCladoLibago\\Downloads\\GeneralVisitReport02_16_2026 (1).xlsx';

        if (! file_exists($path)) {
            $this->command->error("Excel file not found at: {$path}");
            $this->command->line('Please place the file at the expected path and re-run the seeder.');
            return;
        }

        $this->command->info('Importing appointments from Excel…');
        Excel::import(new AppointmentsImport(), $path);
        $this->command->info('Import complete.');
    }
}
