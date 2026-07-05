<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Barbershop;
use App\Models\BarbershopMember;
use App\Models\Availability;
use Illuminate\Support\Str;

class AvailabilityTest extends TestCase
{
    use RefreshDatabase;

    /** HU21: Barbero puede registrar disponibilidad */
    public function test_barber_can_set_availability(): void
    {
        $barber = User::create(['id' => (string) Str::uuid(), 'full_name' => 'Barber', 'email' => 'barber@test.com']);
        $barbershop = Barbershop::create(['id' => (string) Str::uuid(), 'name' => 'Shop', 'slug' => 'shop', 'is_active' => true]);
        BarbershopMember::create(['id' => (string) Str::uuid(), 'barbershop_id' => $barbershop->id, 'user_id' => $barber->id, 'role' => 'barber', 'status' => 'active', 'joined_at' => now()]);

        $response = $this->actingAs($barber)->postJson('/api/availabilities', [
            'barbershop_id' => $barbershop->id,
            'day_of_week'   => 1,
            'start_time'    => '09:00',
            'end_time'      => '17:00',
            'is_available'  => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('availabilities', ['barber_id' => $barber->id, 'day_of_week' => 1]);
    }

    /** HU21: Cliente puede consultar horarios disponibles */
    public function test_client_can_query_availability(): void
    {
        $barber = User::create(['id' => (string) Str::uuid(), 'full_name' => 'Barber', 'email' => 'barber2@test.com']);
        $client = User::create(['id' => (string) Str::uuid(), 'full_name' => 'Client', 'email' => 'client@test.com']);
        $barbershop = Barbershop::create(['id' => (string) Str::uuid(), 'name' => 'Shop', 'slug' => 'shop2', 'is_active' => true]);

        // Día 1 (lunes)
        Availability::create(['id' => (string) Str::uuid(), 'barbershop_id' => $barbershop->id, 'barber_id' => $barber->id, 'day_of_week' => 1, 'start_time' => '09:00', 'end_time' => '17:00', 'is_available' => true]);

        // Buscar un lunes próximo
        $nextMonday = now()->next('Monday')->format('Y-m-d');

        $response = $this->actingAs($client)->getJson("/api/availabilities?barbershop_id={$barbershop->id}&barber_id={$barber->id}&date={$nextMonday}");

        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data');
    }
}

