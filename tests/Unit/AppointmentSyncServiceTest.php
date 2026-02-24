<?php

namespace Tests\Unit;

use App\Services\AppointmentSyncService;
use Carbon\Carbon;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AppointmentSyncServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        parent::tearDown();
        Carbon::setTestNow();
    }

    public function test_sync_uses_default_window_when_not_configured(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-24'));

        Config::set('services.appointments_api.login_url', 'https://login.test/auth/token');
        Config::set('services.appointments_api.url', 'https://data.test/report/general-visit');
        Config::set('services.appointments_api.username', 'user');
        Config::set('services.appointments_api.password', 'pass');
        Config::set('services.appointments_api.from_date', null);
        Config::set('services.appointments_api.to_date', null);

        $captured = null;

        Http::fake([
            'https://login.test/*' => Http::response(['accessToken' => 'token'], 200),
            'https://data.test/*'  => function (Request $request) use (&$captured) {
                $captured = $request;
                return Http::response(['docs' => []], 200);
            },
        ]);

        $service = app(AppointmentSyncService::class);
        $result  = $service->syncBatch(1, 1, 1);

        $this->assertNotNull($captured, 'Data request was not sent');
        $this->assertSame('2026-01-01', $captured->data()['from']);
        $this->assertSame('2026-02-24', $captured->data()['to']);
        $this->assertSame(1, (int) $captured->data()['page']);
        $this->assertSame(100, (int) $captured->data()['per_page']);

        $this->assertSame(0, $result['imported']);
        $this->assertSame(0, $result['skipped']);
        $this->assertFalse($result['has_more']);
    }

    public function test_sync_uses_configured_window_overrides(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-24'));

        Config::set('services.appointments_api.login_url', 'https://login.test/auth/token');
        Config::set('services.appointments_api.url', 'https://data.test/report/general-visit');
        Config::set('services.appointments_api.username', 'user');
        Config::set('services.appointments_api.password', 'pass');
        Config::set('services.appointments_api.from_date', '2026-02-01');
        Config::set('services.appointments_api.to_date', '2026-02-15');

        $captured = null;

        Http::fake([
            'https://login.test/*' => Http::response(['accessToken' => 'token'], 200),
            'https://data.test/*'  => function (Request $request) use (&$captured) {
                $captured = $request;
                return Http::response(['docs' => []], 200);
            },
        ]);

        $service = app(AppointmentSyncService::class);
        $service->syncBatch(1, 1, 1);

        $this->assertNotNull($captured, 'Data request was not sent');
        $this->assertSame('2026-02-01', $captured->data()['from']);
        $this->assertSame('2026-02-15', $captured->data()['to']);
    }

    public function test_misordered_window_throws_exception(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-24'));

        Config::set('services.appointments_api.login_url', 'https://login.test/auth/token');
        Config::set('services.appointments_api.url', 'https://data.test/report/general-visit');
        Config::set('services.appointments_api.username', 'user');
        Config::set('services.appointments_api.password', 'pass');
        Config::set('services.appointments_api.from_date', '2026-03-01');
        Config::set('services.appointments_api.to_date', '2026-02-01');

        Http::fake([
            'https://login.test/*' => Http::response(['accessToken' => 'token'], 200),
        ]);

        $service = app(AppointmentSyncService::class);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('APPOINTMENTS_API_FROM_DATE cannot be after APPOINTMENTS_API_TO_DATE.');

        $service->syncBatch(1, 1, 1);
    }
}
