<?php

namespace App\Http\Controllers;

use App\Models\PaExportLog;
use App\Models\PaExportSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;

class PaExportSettingsController extends Controller
{
    public function index(Request $request): Response
    {
        $settings = PaExportSetting::instance();

        $logs = PaExportLog::query()
            ->orderByDesc('executed_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('PaExportSettings', [
            'settings' => [
                'enabled'       => $settings->enabled,
                'schedule_time' => $settings->schedule_time,
                'export_scope'  => $settings->export_scope,
                'recipients'    => $settings->recipients,
            ],
            'logs' => [
                'data' => $logs->items(),
                'meta' => [
                    'current_page' => $logs->currentPage(),
                    'last_page'    => $logs->lastPage(),
                    'per_page'     => $logs->perPage(),
                    'total'        => $logs->total(),
                    'from'         => $logs->firstItem(),
                    'to'           => $logs->lastItem(),
                ],
                'links' => [
                    'first' => $logs->url(1),
                    'last'  => $logs->url($logs->lastPage()),
                    'prev'  => $logs->previousPageUrl(),
                    'next'  => $logs->nextPageUrl(),
                ],
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'enabled'       => ['required', 'boolean'],
            'schedule_time' => ['required', 'date_format:H:i'],
            'export_scope'  => ['required', 'in:all,today'],
            'recipients'    => ['present', 'array'],
            'recipients.*'  => ['required', 'email'],
        ]);

        $settings = PaExportSetting::instance();
        $settings->update($validated);

        return back()->with('success', 'PA Export settings updated.');
    }

    public function sendNow(): RedirectResponse
    {
        Artisan::call('pa-dept:send-export', ['--force' => true]);
        $output = trim(Artisan::output());

        return back()->with('success', $output ?: 'Export triggered.');
    }
}
