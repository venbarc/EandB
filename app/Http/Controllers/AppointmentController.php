<?php

namespace App\Http\Controllers;

use App\Exports\AppointmentsExport;
use App\Exports\AvailityExport;
use App\Exports\PaDeptExport;
use App\Imports\AppointmentsImport;
use App\Jobs\ImportAppointmentsJob;
use App\Jobs\SyncAppointmentsJob;
use App\Models\Appointment;
use App\Services\AppointmentSyncService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AppointmentController extends Controller
{
    /** Update eligibility + collection data from the 3-step modal. */
    public function update(Request $request, Appointment $appointment): RedirectResponse
    {
        $data = $this->validateAppointmentUpdateData($request);
        $this->applyAppointmentUpdates($appointment, $data);

        return back()->with('success', 'Record updated successfully.');
    }

    /** Save appointment updates and toggle PA department submission in one action. */
    public function togglePaDeptSubmission(Request $request, Appointment $appointment): RedirectResponse
    {
        $toggle = $request->validate([
            'submitted' => ['required', 'boolean'],
        ]);

        $data = $this->validateAppointmentUpdateData($request);

        DB::transaction(function () use ($appointment, $data, $toggle, $request) {
            $this->applyAppointmentUpdates($appointment, $data);

            if ($toggle['submitted']) {
                $appointment->paDepartmentSubmission()->updateOrCreate([], [
                    'submitted_by' => $request->user()?->id,
                    'submitted_at' => now(),
                ]);
                return;
            }

            $appointment->paDepartmentSubmission()->delete();
        });

        return back()->with(
            'success',
            $toggle['submitted']
                ? 'Record submitted to PA Department successfully.'
                : 'Record removed from PA Department successfully.'
        );
    }

    /** Update PSC code + description. */
    public function updatePsc(Request $request, Appointment $appointment): RedirectResponse
    {
        $data = $request->validate([
            'psc_code'        => ['nullable', 'string', 'max:100'],
            'psc_description' => ['nullable', 'string'],
        ]);

        $appointment->update($data);

        return back()->with('success', 'PSC updated successfully.');
    }

    /**
     * Preview a CSV upload: parse the file, compare against DB,
     * and return categorized records (new / update / skip).
     */
    public function importPreview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:51200'],
        ]);

        $path = $request->file('file')->store('imports');

        $importer = new AppointmentsImport();

        // Use native fgetcsv instead of Excel::toCollection to avoid
        // Maatwebsite's garbage-collect deleting the stored file on Windows.
        $absPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, Storage::path($path));
        $handle = fopen($absPath, 'r');

        if ($handle === false) {
            Storage::delete($path);
            return response()->json([
                'file_path'      => null,
                'new_records'    => [],
                'update_records' => [],
                'skip_count'     => 0,
                'total_rows'     => 0,
            ]);
        }

        fgetcsv($handle); // skip header row

        $parsed = [];
        while (($csvRow = fgetcsv($handle)) !== false) {
            $record = $importer->parseRowForPreview($csvRow);
            if ($record !== null) {
                $hash = $importer->computeHash(
                    $record['patient_name'],
                    $record['date_of_service'] ?? null,
                    $record['appointment_status'] ?? null
                );
                $record['_dedup_hash'] = $hash;

                // Auto-tag auth_status for preview display
                if (!empty($record['expiration_date'])) {
                    $record['_auth_tag'] = 'Auth Active';
                } else {
                    $record['_auth_tag'] = 'For Review';
                }

                $parsed[] = $record;
            }
        }

        fclose($handle);

        if (empty($parsed)) {
            Storage::delete($path);
            return response()->json([
                'file_path'      => null,
                'new_records'    => [],
                'update_records' => [],
                'skip_count'     => 0,
                'total_rows'     => 0,
            ]);
        }

        // Deduplicate by hash, keeping the last occurrence (matches upsert behaviour)
        $deduped = [];
        foreach ($parsed as $record) {
            $deduped[$record['_dedup_hash']] = $record;
        }
        $dupCount = count($parsed) - count($deduped);
        $parsed   = array_values($deduped);

        // Collect all hashes and query DB
        $hashes = array_column($parsed, '_dedup_hash');
        $existing = Appointment::whereIn('dedup_hash', $hashes)
            ->get(['id', 'dedup_hash', 'modification_history', 'patient_name', 'date_of_service', 'appointment_status'])
            ->keyBy('dedup_hash');

        $newRecords    = [];
        $updateRecords = [];
        $skipCount     = $dupCount;
        $modParser     = new AppointmentsImport();

        foreach ($parsed as $record) {
            $hash = $record['_dedup_hash'];
            $authTag = $record['_auth_tag'];
            unset($record['_dedup_hash'], $record['_auth_tag']);

            $preview = [
                'patient_id'       => $record['patient_external_id'] ?? '',
                'patient_name'     => $record['patient_name'],
                'date_of_service'  => $record['date_of_service'],
                'appointment_status' => $record['appointment_status'],
                'provider'         => $record['provider'],
                'visit_type'       => $record['visit_type'] ?? '',
                'location'         => $record['location'] ?? '',
                'auth_tag'         => $authTag,
                'authorization_number' => $record['authorization_number'] ?? '',
                'expiration_date'  => $record['expiration_date'] ?? '',
            ];

            if (!$existing->has($hash)) {
                $newRecords[] = $preview;
            } else {
                $dbRecord = $existing->get($hash);
                $dbModHistory  = $modParser->parseModificationDate($dbRecord->modification_history) ?? '';
                $csvModHistory = trim((string) ($record['modification_history'] ?? ''));

                if ($dbModHistory !== $csvModHistory && $csvModHistory !== '') {
                    $preview['existing_modification'] = $dbModHistory;
                    $preview['new_modification']      = $csvModHistory;
                    $updateRecords[] = $preview;
                } else {
                    $skipCount++;
                }
            }
        }

        return response()->json([
            'file_path'      => $path,
            'new_records'    => $newRecords,
            'update_records' => $updateRecords,
            'skip_count'     => $skipCount,
            'total_rows'     => count($parsed),
        ]);
    }

    /**
     * Confirm and process the previewed import file.
     * Accepts mode: 'all' (new + updates), 'new_only', 'updates_only'.
     */
    public function importConfirm(Request $request): JsonResponse
    {
        $request->validate([
            'file_path' => ['required', 'string'],
            'mode'      => ['required', 'string', 'in:all,new_only,updates_only'],
        ]);

        $filePath = $request->input('file_path');
        $mode     = $request->input('mode');

        if (!Storage::exists($filePath)) {
            return response()->json(['error' => 'File not found. Please upload again.'], 422);
        }

        Cache::put(ImportAppointmentsJob::CACHE_KEY, [
            'state'      => 'running',
            'chunk'      => 0,
            'imported'   => 0,
            'skipped'    => 0,
            'started_at' => now()->toIso8601String(),
        ], 3600);

        ImportAppointmentsJob::dispatch($filePath, $mode);

        return response()->json(['message' => 'Import started — records are being processed in the background.']);
    }

    /** Store the uploaded file and dispatch an async background job to process it. */
    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:51200'],
        ]);

        $path = $request->file('file')->store('imports');

        Cache::put(ImportAppointmentsJob::CACHE_KEY, [
            'state'      => 'running',
            'chunk'      => 0,
            'imported'   => 0,
            'skipped'    => 0,
            'started_at' => now()->toIso8601String(),
        ], 3600);

        ImportAppointmentsJob::dispatch($path);

        return back()->with('success', 'Import started — records are being processed in the background.');
    }

    /** Return current import progress from cache (polled by the frontend). */
    public function importProgress(): JsonResponse
    {
        $progress = Cache::get(ImportAppointmentsJob::CACHE_KEY, ['state' => 'idle']);
        return response()->json($progress);
    }

    /** Dispatch a background job to pull appointments from the external API in batches. */
    public function syncFromApi(Request $request): RedirectResponse
    {
        // Initialise progress so the frontend can start polling immediately.
        Cache::put(AppointmentSyncService::CACHE_KEY, [
            'state'      => 'running',
            'batch'      => 0,
            'imported'   => 0,
            'skipped'    => 0,
            'page'       => 1,
            'started_at' => now()->toIso8601String(),
        ], 3600);

        SyncAppointmentsJob::dispatch(1, 1);

        return back()->with('success', 'Sync started — batches are being processed in the background.');
    }

    /** Return current sync progress from cache (polled by the frontend). */
    public function syncProgress(): JsonResponse
    {
        $progress = Cache::get(AppointmentSyncService::CACHE_KEY, ['state' => 'idle']);
        return response()->json($progress);
    }

    /** Export all appointments as xlsx. */
    public function exportAll(Request $request): BinaryFileResponse
    {
        $filters = $request->only(['date', 'patient', 'insurances', 'provider', 'status']);
        return Excel::download(new AppointmentsExport($filters), 'appointments.xlsx');
    }

    /** Export in Availity-compatible format. */
    public function exportAvailty(Request $request): BinaryFileResponse
    {
        $filters = $request->only(['date', 'patient', 'insurances', 'provider', 'status']);
        return Excel::download(new AvailityExport($filters), 'availity-export.xlsx');
    }

    /** Export records currently submitted to PA Department. */
    public function exportPaDept(Request $request): BinaryFileResponse
    {
        $filters = $request->only(['date', 'patient', 'insurances', 'provider', 'status']);
        return Excel::download(new PaDeptExport($filters), 'pa-dept-submissions.xlsx');
    }

    private function validateAppointmentUpdateData(Request $request): array
    {
        $providerCredentialed = $this->normalizeBooleanInput($request->input('provider_credentialed'));

        if ($request->has('provider_credentialed')) {
            $request->merge(['provider_credentialed' => $providerCredentialed]);
        }

        return $request->validate($this->appointmentUpdateRules());
    }

    private function applyAppointmentUpdates(Appointment $appointment, array $data): void
    {
        $appointment->update(array_filter($data, fn ($value) => $value !== null && $value !== ''));
    }

    private function appointmentUpdateRules(): array
    {
        return [
            'primary_insurance'     => ['nullable', 'string', 'max:200'],
            'secondary_insurance'   => ['nullable', 'string', 'max:200'],
            'insurance_type'        => ['nullable', 'string', 'max:100'],
            'provider_credentialed' => ['nullable', 'boolean'],
            'eligibility_status'    => ['nullable', 'string', 'max:100'],
            'collection_status'     => ['nullable', 'string', 'max:100'],
            'payments'              => ['nullable', 'numeric', 'min:0'],
            'auth_status'           => ['nullable', 'string', 'max:100'],
            'referral_status'       => ['nullable', 'string', 'max:100'],
            'notes'                 => ['nullable', 'string'],
            'collected_amount'      => ['nullable', 'numeric', 'min:0'],
            'collected_method'      => ['nullable', 'string', 'max:100'],
            'collected_receipt_no'  => ['nullable', 'string', 'max:100'],
        ];
    }

    private function normalizeBooleanInput(mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));

            return match ($normalized) {
                'yes', 'true', '1', 'on' => true,
                'no', 'false', '0', 'off' => false,
                default => $value,
            };
        }

        return $value;
    }
}
