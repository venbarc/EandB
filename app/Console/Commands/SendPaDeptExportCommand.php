<?php

namespace App\Console\Commands;

use App\Exports\PaDeptExport;
use App\Mail\PaDeptExportMail;
use App\Models\PaExportLog;
use App\Models\PaExportSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Maatwebsite\Excel\Excel as ExcelType;
use Maatwebsite\Excel\Facades\Excel;

class SendPaDeptExportCommand extends Command
{
    protected $signature   = 'pa-dept:send-export {--force : Run even if disabled in settings}';
    protected $description = 'Generate the PA Department CSV and email it to configured recipients.';

    public function handle(): int
    {
        $settings = PaExportSetting::instance();

        if (!$settings->enabled && !$this->option('force')) {
            $this->info('PA Dept export is disabled. Use --force to override.');
            return self::SUCCESS;
        }

        $recipients = $settings->recipients;

        if (empty($recipients)) {
            $this->warn('No recipients configured. Skipping.');
            PaExportLog::create([
                'status'        => 'failed',
                'recipients'    => [],
                'record_count'  => 0,
                'file_name'     => null,
                'error_message' => 'No recipients configured.',
                'executed_at'   => now(),
            ]);
            return self::FAILURE;
        }

        $fileName = 'pa-dept-' . now()->format('Y-m-d') . '.csv';
        $filePath = 'exports/' . $fileName;

        try {
            $filters = [];
            if ($settings->export_scope === 'today') {
                $filters['submittedToday'] = true;
            }

            $export = new PaDeptExport($filters);

            Excel::store($export, $filePath, 'local', ExcelType::CSV);

            $recordCount = $export->query()->count();

            Mail::to($recipients)
                ->send(new PaDeptExportMail($filePath, $recordCount));

            PaExportLog::create([
                'status'        => 'success',
                'recipients'    => $recipients,
                'record_count'  => $recordCount,
                'file_name'     => $fileName,
                'error_message' => null,
                'executed_at'   => now(),
            ]);

            $this->info("PA Dept export sent to " . count($recipients) . " recipient(s). {$recordCount} records.");

            return self::SUCCESS;
        } catch (\Throwable $e) {
            PaExportLog::create([
                'status'        => 'failed',
                'recipients'    => $recipients,
                'record_count'  => 0,
                'file_name'     => $fileName,
                'error_message' => $e->getMessage(),
                'executed_at'   => now(),
            ]);

            $this->error("Export failed: " . $e->getMessage());

            return self::FAILURE;
        }
    }
}
