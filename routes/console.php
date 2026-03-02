<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Sync appointments from the external API daily at midnight
Schedule::command('appointments:sync')->dailyAt('00:00');

// Send PA Department export email on a user-configurable schedule
Schedule::command('pa-dept:send-export')
    ->dailyAt(
        rescue(fn () => \App\Models\PaExportSetting::instance()->schedule_time, '08:00', false)
    )
    ->when(fn () => rescue(fn () => \App\Models\PaExportSetting::instance()->enabled, false, false))
    ->onOneServer()
    ->withoutOverlapping();
