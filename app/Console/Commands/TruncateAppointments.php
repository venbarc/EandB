<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TruncateAppointments extends Command
{
    protected $signature = 'appointments:truncate';

    protected $description = 'Truncate all records from the appointments table';

    public function handle(): int
    {
        if (! $this->confirm('This will permanently delete ALL appointment records. Are you sure?')) {
            $this->info('Aborted.');
            return self::SUCCESS;
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        Appointment::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $this->info('Appointments table truncated successfully.');

        return self::SUCCESS;
    }
}
