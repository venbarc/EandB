<?php

namespace App\Jobs;

use App\Services\AppointmentSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SyncAppointmentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Seconds before the job is considered failed. */
    public int $timeout = 600;

    /** Retry the job up to 3 times if it fails. */
    public int $tries = 3;

    /** Pages fetched per job run (100 records/page × 20 pages = 2,000 records). */
    private const PAGES_PER_BATCH = 20;

    public function __construct(
        private readonly int $startPage   = 1,
        private readonly int $batchNumber = 1,
    ) {}

    public function handle(AppointmentSyncService $service): void
    {
        Log::info('[SyncAppointmentsJob] Starting batch', [
            'startPage'   => $this->startPage,
            'batchNumber' => $this->batchNumber,
        ]);

        try {
            $result = $service->syncBatch($this->startPage, self::PAGES_PER_BATCH, $this->batchNumber);
        } catch (\Throwable $e) {
            Log::error('[SyncAppointmentsJob] Batch failed', [
                'startPage'   => $this->startPage,
                'batchNumber' => $this->batchNumber,
                'error'       => $e->getMessage(),
            ]);
            throw $e; // Let Laravel mark the job as failed / retry
        }

        Log::info('[SyncAppointmentsJob] Batch complete', [
            'startPage'   => $this->startPage,
            'batchNumber' => $this->batchNumber,
            'imported'    => $result['imported'],
            'skipped'     => $result['skipped'],
            'has_more'    => $result['has_more'],
            'next_page'   => $result['next_page'],
        ]);

        if ($result['has_more']) {
            // Chain the next batch with the incremented batch number
            self::dispatch($result['next_page'], $this->batchNumber + 1);
        } else {
            Log::info('[SyncAppointmentsJob] Full sync complete.');
        }
    }

    /**
     * Called by Laravel after all $tries are exhausted.
     * Updates the cache so the frontend can surface the error.
     */
    public function failed(\Throwable $e): void
    {
        $prev = Cache::get(AppointmentSyncService::CACHE_KEY, []);
        Cache::put(AppointmentSyncService::CACHE_KEY, array_merge($prev, [
            'state' => 'error',
            'error' => $e->getMessage(),
        ]), 3600);

        Log::error('[SyncAppointmentsJob] Job permanently failed', [
            'startPage'   => $this->startPage,
            'batchNumber' => $this->batchNumber,
            'error'       => $e->getMessage(),
        ]);
    }
}
