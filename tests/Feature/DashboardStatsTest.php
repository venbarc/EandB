<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardStatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_stats_payload_contains_only_new_keys(): void
    {
        $this->actingAs(User::factory()->create());

        $this->createAppointment([
            'eligibility_status' => 'Eligible',
            'auth_status' => 'Auth Required',
            'referral_status' => 'Required',
        ]);

        $response = $this->get('/');
        $response->assertOk();

        $page = $this->extractInertiaPage($response->viewData('page'));
        $stats = $page['props']['stats'];

        $this->assertEqualsCanonicalizing(
            ['totalAppointments', 'eligibleCount', 'notEligibleCount', 'verificationPendingCount', 'authCount', 'refCount'],
            array_keys($stats)
        );

        $this->assertArrayNotHasKey('eligibilityCompleted', $stats);
        $this->assertArrayNotHasKey('paymentsCompleted', $stats);
        $this->assertArrayNotHasKey('totalAmount', $stats);
        $this->assertArrayNotHasKey('totalCollections', $stats);
        $this->assertArrayNotHasKey('totalUnpaid', $stats);
    }

    public function test_dashboard_stats_counts_match_business_rules(): void
    {
        $this->actingAs(User::factory()->create());

        $this->createAppointment([
            'eligibility_status' => 'Eligible',
            'auth_status' => 'Auth Required',
            'referral_status' => 'Required',
        ]);

        $this->createAppointment([
            'eligibility_status' => 'Not Eligible',
            'auth_status' => 'N/A',
            'referral_status' => 'N/A',
        ]);

        $this->createAppointment([
            'eligibility_status' => 'Verification Needed',
            'auth_status' => 'Auth Required',
            'referral_status' => 'N/A',
        ]);

        $this->createAppointment([
            'eligibility_status' => 'Verification Pending',
            'auth_status' => 'N/A',
            'referral_status' => 'Required',
        ]);

        // Null/empty statuses should not inflate any counts.
        $this->createAppointment([
            'eligibility_status' => null,
            'auth_status' => null,
            'referral_status' => null,
        ]);

        // Unknown status should not be counted in the tracked buckets.
        $this->createAppointment([
            'eligibility_status' => 'Unknown',
            'auth_status' => 'Optional',
            'referral_status' => 'Optional',
        ]);

        $response = $this->get('/');
        $response->assertOk();

        $page = $this->extractInertiaPage($response->viewData('page'));
        $stats = $page['props']['stats'];

        $this->assertSame(6, $stats['totalAppointments']);
        $this->assertSame(1, $stats['eligibleCount']);
        $this->assertSame(1, $stats['notEligibleCount']);
        $this->assertSame(2, $stats['verificationPendingCount']);
        $this->assertSame(2, $stats['authCount']);
        $this->assertSame(2, $stats['refCount']);
    }

    private function createAppointment(array $overrides = []): Appointment
    {
        static $counter = 1;

        $appointment = Appointment::create(array_merge([
            'patient_name' => "Test Patient {$counter}",
            'date_of_service' => '2026-02-18',
            'provider' => 'Test Provider',
        ], $overrides));

        $counter++;

        return $appointment;
    }

    /**
     * @param  array<string, mixed>|string  $page
     * @return array<string, mixed>
     */
    private function extractInertiaPage(array|string $page): array
    {
        if (is_array($page)) {
            return $page;
        }

        return json_decode($page, true, 512, JSON_THROW_ON_ERROR);
    }
}
