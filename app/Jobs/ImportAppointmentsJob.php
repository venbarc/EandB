<?php

namespace App\Jobs;

use App\Imports\AppointmentsImport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ImportAppointmentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Seconds before the job is considered failed. */
    public int $timeout = 600;

    /** Retry the job up to 3 times if it fails. */
    public int $tries = 3;

    /** Cache key polled by the frontend. */
    public const CACHE_KEY = 'appointment_import_progress';

    /**
     * @param string $filePath  Path to the stored import file.
     * @param string $mode      Import mode: 'all', 'new_only', or 'updates_only'.
     */
    public function __construct(
        private readonly string $filePath,
        private readonly string $mode = 'all',
    ) {}

    public function handle(): void
    {
        Log::info('[ImportAppointmentsJob] Starting file import', [
            'file' => $this->filePath,
            'mode' => $this->mode,
        ]);

        // Ensure file is normalized (UTF-8 comma-separated) before processing
        $absPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, Storage::path($this->filePath));
        $this->normalizeCsvFile($absPath);

        $importer = (new AppointmentsImport())->withCacheKey(self::CACHE_KEY);

        // Apply mode filtering
        if ($this->mode === 'new_only') {
            $importer->newOnly();
        } elseif ($this->mode === 'updates_only') {
            $importer->updatesOnly();
        }

        Excel::import($importer, $this->filePath, 'local');

        Cache::put(self::CACHE_KEY, [
            'state'    => 'complete',
            'chunk'    => $importer->getChunkCount(),
            'imported' => $importer->getImportedCount(),
            'skipped'  => 0,
        ], 3600);

        Log::info('[ImportAppointmentsJob] Import complete', [
            'imported' => $importer->getImportedCount(),
            'chunks'   => $importer->getChunkCount(),
        ]);

        // Clean up on success; failed() handles cleanup after all retries are exhausted
        Storage::delete($this->filePath);
    }

    /**
     * Normalize a CSV file: convert UTF-16 (LE/BE) to UTF-8, and
     * convert tab-separated values to comma-separated.
     */
    private function normalizeCsvFile(string $absPath): void
    {
        $raw = file_get_contents($absPath);
        if ($raw === false) {
            return;
        }

        $encoding = null;

        if (str_starts_with($raw, "\xFF\xFE")) {
            $encoding = 'UTF-16LE';
            $raw = substr($raw, 2);
        } elseif (str_starts_with($raw, "\xFE\xFF")) {
            $encoding = 'UTF-16BE';
            $raw = substr($raw, 2);
        } elseif (str_starts_with($raw, "\xEF\xBB\xBF")) {
            $raw = substr($raw, 3);
        }

        if ($encoding !== null) {
            $raw = mb_convert_encoding($raw, 'UTF-8', $encoding);
        }

        $firstLine = strtok($raw, "\n");
        $tabCount   = substr_count($firstLine, "\t");
        $commaCount = substr_count($firstLine, ",");

        // Write UTF-8 content (with BOM stripped) to file first
        file_put_contents($absPath, $raw);

        // If tab-separated, re-parse with fgetcsv(tab) and rewrite as fputcsv(comma).
        // This properly handles quoted multiline fields (e.g. Modification History).
        if ($tabCount > $commaCount) {
            $input   = fopen($absPath, 'r');
            $tmpPath = $absPath . '.tmp';
            $output  = fopen($tmpPath, 'w');

            while (($fields = fgetcsv($input, 0, "\t")) !== false) {
                fputcsv($output, $fields);
            }

            fclose($input);
            fclose($output);
            rename($tmpPath, $absPath);
        }
    }

    /**
     * Called by Laravel after all $tries are exhausted.
     */
    public function failed(\Throwable $e): void
    {
        $prev = Cache::get(self::CACHE_KEY, []);
        Cache::put(self::CACHE_KEY, array_merge($prev, [
            'state' => 'error',
            'error' => $e->getMessage(),
        ]), 3600);

        Storage::delete($this->filePath);

        Log::error('[ImportAppointmentsJob] Job permanently failed', [
            'file'  => $this->filePath,
            'error' => $e->getMessage(),
        ]);
    }
}
