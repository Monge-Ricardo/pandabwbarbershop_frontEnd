<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Barbershop;
use App\Models\BarbershopMember;
use App\Models\Availability;
use App\Models\Appointment;
use App\Models\Service;
use Illuminate\Support\Str;

class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    private function makeSetup(): array
    {
        $client = User::create(['id' => (string) Str::uuid(), 'full_name' => 'Client', 'email' => 'client@test.com']);
        $barber = User::create(['id' => (string) Str::uuid(), 'full_name' => 'Barber', 'email' => 'barber@test.com']);
        $owner  = User::create(['id' => (string) Str::uuid(), 'full_name' => 'Owner',  'email' => 'owner@test.com']);

        $barbershop = Barbershop::create([
            'id' => (string) Str::uuid(),
            'name' => 'Test Barbershop',
            'slug' => 'test-barbershop-' . uniqid(),
            'is_active' => true,
        ]);

        BarbershopMember::create(['id' => (string) Str::uuid(), 'barbershop_id' => $barbershop->id, 'user_id' => $owner->id,  'role' => 'owner',  'status' => 'active', 'joined_at' => now()]);
        BarbershopMember::create(['id' => (string) Str::uuid(), 'barbershop_id' => $barbershop->id, 'user_id' => $barber->id, 'role' => 'barber', 'status' => 'active', 'joined_at' => now()]);

        $date      = now()->addDays(1);
        $dayOfWeek = (int) $date->format('w');

        Availability::create([
            'id'             => (string) Str::uuid(),
            'barbershop_id'  => $barbershop->id,
            'barber_id'      => $barber->id,
            'day_of_week'    => $dayOfWeek,
            'start_time'     => '09:00',
            'end_time'       => '17:00',
            'is_available'   => true,
        ]);

        return compact('client', 'barber', 'owner', 'barbershop', 'date');
    }

    /** HU20 & HU22: Cliente puede reservar cita con servicio */
    public function test_client_can_book_appointment(): void
    {
        ['client' => $client, 'barber' => $barber, 'barbershop' => $barbershop, 'date' => $date] = $this->makeSetup();

        $response = $this->actingAs($client)->postJson('/api/appointments', [
            'barbershop_id'    => $barbershop->id,
            'barber_id'        => $barber->id,
            'services'         => [],
            'appointment_date' => $date->format('Y-m-d'),
            'start_time'       => '10:00',
            'end_time'         => '11:00',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('appointments', ['client_id' => $client->id, 'status' => 'PENDING']);
    }

    /** HU21 & HU28: No se puede reservar fuera de horario disponible */
    public function test_booking_outside_availability_is_rejected(): void
    {
        ['client' => $client, 'barber' => $barber, 'barbershop' => $barbershop, 'date' => $date] = $this->makeSetup();

        // 22:00 está fuera del horario 09:00-17:00
        $response = $this->actingAs($client)->postJson('/api/appointments', [
            'barbershop_id'    => $barbershop->id,
            'barber_id'        => $barber->id,
            'services'         => [],
            'appointment_date' => $date->format('Y-m-d'),
            'start_time'       => '22:00',
            'end_time'         => '23:00',
        ]);

        $response->assertStatus(400)
                 ->assertJsonFragment(['message' => 'Barber is not available at this time']);
    }

    /** HU28: No se puede reservar en horario ya ocupado */
    public function test_double_booking_is_rejected(): void
    {
        ['client' => $client, 'barber' => $barber, 'barbershop' => $barbershop, 'date' => $date] = $this->makeSetup();

        // Primera cita
        $this->actingAs($client)->postJson('/api/appointments', [
            'barbershop_id'    => $barbershop->id,
            'barber_id'        => $barber->id,
            'services'         => [],
            'appointment_date' => $date->format('Y-m-d'),
            'start_time'       => '10:00',
            'end_time'         => '11:00',
        ]);

        // Segunda cita en el mismo horario → debe fallar
        $response = $this->actingAs($client)->postJson('/api/appointments', [
            'barbershop_id'    => $barbershop->id,
            'barber_id'        => $barber->id,
            'services'         => [],
            'appointment_date' => $date->format('Y-m-d'),
            'start_time'       => '10:00',
            'end_time'         => '11:00',
        ]);

        $response->assertStatus(400)
                 ->assertJsonFragment(['message' => 'Time slot is already booked']);
    }

    /** HU23 & HU24: Ver agenda propia (cliente/barbero/owner) */
    public function test_user_can_view_their_appointments(): void
    {
        ['client' => $client, 'barber' => $barber, 'barbershop' => $barbershop, 'date' => $date] = $this->makeSetup();

        Appointment::create([
            'id'               => (string) Str::uuid(),
            'barbershop_id'    => $barbershop->id,
            'client_id'        => $client->id,
            'barber_id'        => $barber->id,
            'appointment_date' => $date->format('Y-m-d'),
            'start_time'       => '10:00',
            'end_time'         => '11:00',
            'status'           => 'PENDING',
        ]);

        $response = $this->actingAs($client)->getJson('/api/appointments');
        $response->assertStatus(200)
                 ->assertJsonPath('data.0.client_id', $client->id);
    }

    /** HU25: Barbero puede actualizar estado de cita */
    public function test_barber_can_update_appointment_status(): void
    {
        ['client' => $client, 'barber' => $barber, 'barbershop' => $barbershop, 'date' => $date] = $this->makeSetup();

        $appointment = Appointment::create([
            'id'               => (string) Str::uuid(),
            'barbershop_id'    => $barbershop->id,
            'client_id'        => $client->id,
            'barber_id'        => $barber->id,
            'appointment_date' => $date->format('Y-m-d'),
            'start_time'       => '10:00',
            'end_time'         => '11:00',
            'status'           => 'PENDING',
        ]);

        $response = $this->actingAs($barber)->putJson("/api/appointments/{$appointment->id}/status", [
            'status' => 'ACCEPTED',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('appointments', ['id' => $appointment->id, 'status' => 'ACCEPTED']);
    }

    /** HU25: Usuario no autorizado NO puede cambiar estado */
    public function test_unauthorized_user_cannot_update_appointment_status(): void
    {
        ['client' => $client, 'barber' => $barber, 'barbershop' => $barbershop, 'date' => $date] = $this->makeSetup();
        $stranger = User::create(['id' => (string) Str::uuid(), 'full_name' => 'Stranger', 'email' => 'stranger@test.com']);

        $appointment = Appointment::create([
            'id'               => (string) Str::uuid(),
            'barbershop_id'    => $barbershop->id,
            'client_id'        => $client->id,
            'barber_id'        => $barber->id,
            'appointment_date' => $date->format('Y-m-d'),
            'start_time'       => '10:00',
            'end_time'         => '11:00',
            'status'           => 'PENDING',
        ]);

        $response = $this->actingAs($stranger)->putJson("/api/appointments/{$appointment->id}/status", [
            'status' => 'CANCELLED',
        ]);

        $response->assertStatus(403);
    }
}
