<?php

namespace App\Console\Commands;

use App\Jobs\SyncAppointmentsJob;
use Illuminate\Console\Command;

class SyncAppointmentsCommand extends Command
{
    protected $signature   = 'appointments:sync';
    protected $description = 'Dispatch a background job to sync appointments from the external API in batches.';

    public function handle(): int
    {
        SyncAppointmentsJob::dispatch(1);

        $this->info('Appointment sync job dispatched. The first batch starts at page 1 and will self-chain until all records are fetched.');

        return self::SUCCESS;
    }
}
