<?php

namespace Tests\Feature;

use App\Exports\PaDeptExport;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Maatwebsite\Excel\Facades\Excel;
use Tests\TestCase;

class PaDeptSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_submit_creates_pa_department_submission_record(): void
    {
        $this->actingAs(User::factory()->create());
        $appointment = $this->createAppointment();

        $response = $this->patch("/appointments/{$appointment->id}/pa-dept-submission", [
            'submitted' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('pa_department_submissions', [
            'appointment_id' => $appointment->id,
        ]);
    }

    public function test_remove_deletes_pa_department_submission_record(): void
    {
        $this->actingAs(User::factory()->create());
        $appointment = $this->createAppointment();

        $this->patch("/appointments/{$appointment->id}/pa-dept-submission", ['submitted' => true])->assertRedirect();
        $this->patch("/appointments/{$appointment->id}/pa-dept-submission", ['submitted' => false])->assertRedirect();

        $this->assertDatabaseMissing('pa_department_submissions', [
            'appointment_id' => $appointment->id,
        ]);
    }

    public function test_submit_also_saves_record_updates(): void
    {
        $this->actingAs(User::factory()->create());
        $appointment = $this->createAppointment();

        $this->patch("/appointments/{$appointment->id}/pa-dept-submission", [
            'submitted' => true,
            'provider_credentialed' => 'Yes',
            'eligibility_status' => 'Not Eligible',
            'notes' => 'Needs PA handoff',
        ])->assertRedirect();

        $appointment->refresh();

        $this->assertTrue($appointment->provider_credentialed);
        $this->assertSame('Not Eligible', $appointment->eligibility_status);
        $this->assertSame('Needs PA handoff', $appointment->notes);
    }

    public function test_dashboard_payload_marks_record_as_submitted_to_pa_dept(): void
    {
        $this->actingAs(User::factory()->create());
        $appointment = $this->createAppointment();

        $this->patch("/appointments/{$appointment->id}/pa-dept-submission", [
            'submitted' => true,
        ])->assertRedirect();

        $response = $this->get('/');
        $response->assertOk();

        $page = $this->extractInertiaPage($response->viewData('page'));
        $record = collect($page['props']['appointments']['data'])
            ->firstWhere('id', (string) $appointment->id);

        $this->assertNotNull($record);
        $this->assertTrue((bool) ($record['isSubmittedToPaDept'] ?? false));
        $this->assertNotNull($record['paSubmittedAt'] ?? null);
    }

    public function test_pa_dept_export_downloads_only_submitted_records(): void
    {
        $this->actingAs(User::factory()->create());
        Excel::fake();

        $submittedAppointment = $this->createAppointment(['patient_name' => 'Submitted Patient']);
        $unsubmittedAppointment = $this->createAppointment(['patient_name' => 'Regular Patient']);

        $this->patch("/appointments/{$submittedAppointment->id}/pa-dept-submission", [
            'submitted' => true,
        ])->assertRedirect();

        $this->get('/appointments/export/pa-dept')->assertOk();

        Excel::assertDownloaded('pa-dept-submissions.xlsx', function (PaDeptExport $export) use ($submittedAppointment, $unsubmittedAppointment) {
            $ids = $export->query()->pluck('id')->all();
            sort($ids);

            return $ids === [$submittedAppointment->id]
                && ! in_array($unsubmittedAppointment->id, $ids, true);
        });
    }

    public function test_duplicate_submit_keeps_single_submission_row(): void
    {
        $this->actingAs(User::factory()->create());
        $appointment = $this->createAppointment();

        $this->patch("/appointments/{$appointment->id}/pa-dept-submission", ['submitted' => true])->assertRedirect();
        $this->patch("/appointments/{$appointment->id}/pa-dept-submission", ['submitted' => true])->assertRedirect();

        $this->assertDatabaseCount('pa_department_submissions', 1);
    }

    private function createAppointment(array $overrides = []): Appointment
    {
        static $counter = 1;

        $appointment = Appointment::create(array_merge([
            'patient_name' => "PA Test Patient {$counter}",
            'date_of_service' => '2026-02-18',
            'provider' => 'PA Test Provider',
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
