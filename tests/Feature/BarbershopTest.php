<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Barbershop;
use Illuminate\Support\Str;

class BarbershopTest extends TestCase
{
    use RefreshDatabase;

    /**
     * HU8: Crear barbería
     */
    public function test_owner_can_create_barbershop(): void
    {
        $user = User::create([
            'id' => (string) Str::uuid(),
            'full_name' => 'Test Owner',
            'email' => 'owner@test.com',
        ]);

        $response = $this->actingAs($user)->postJson('/api/barbershops', [
            'name' => 'Test Barbershop',
            'description' => 'A great place',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.name', 'Test Barbershop');

        $this->assertDatabaseHas('barbershops', ['name' => 'Test Barbershop']);
        $this->assertDatabaseHas('barbershop_members', [
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active'
        ]);
    }

    /**
     * HU9: Editar barbería solo por el Owner
     */
    public function test_owner_can_edit_barbershop(): void
    {
        $owner = User::create([
            'id' => (string) Str::uuid(),
            'full_name' => 'Owner User',
            'email' => 'owner2@test.com',
        ]);

        // Crear barbería directamente
        $barbershop = Barbershop::create([
            'id' => (string) Str::uuid(),
            'name' => 'Old Name',
            'slug' => 'old-name',
            'is_active' => true,
        ]);

        \App\Models\BarbershopMember::create([
            'id' => (string) Str::uuid(),
            'barbershop_id' => $barbershop->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $response = $this->actingAs($owner)->putJson("/api/barbershops/{$barbershop->id}", [
            'name' => 'New Barbershop Name',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('barbershops', ['name' => 'New Barbershop Name']);
    }

    /**
     * HU26: Solo el owner puede editar la barbería
     */
    public function test_non_owner_cannot_edit_barbershop(): void
    {
        $randomUser = User::create([
            'id' => (string) Str::uuid(),
            'full_name' => 'Random User',
            'email' => 'random@test.com',
        ]);

        $barbershop = Barbershop::create([
            'id' => (string) Str::uuid(),
            'name' => 'My Shop',
            'slug' => 'my-shop',
            'is_active' => true,
        ]);

        $response = $this->actingAs($randomUser)->putJson("/api/barbershops/{$barbershop->id}", [
            'name' => 'Hacked Name',
        ]);

        $response->assertStatus(403);
    }

    /**
     * HU10 & HU11: Owner puede agregar barbero
     */
    public function test_owner_can_add_barber(): void
    {
        $owner = User::create([
            'id' => (string) Str::uuid(),
            'full_name' => 'Owner',
            'email' => 'owner3@test.com',
        ]);
        $barberUser = User::create([
            'id' => (string) Str::uuid(),
            'full_name' => 'New Barber',
            'email' => 'newbarber@test.com',
        ]);

        $barbershop = Barbershop::create([
            'id' => (string) Str::uuid(),
            'name' => 'Barber Shop',
            'slug' => 'barber-shop',
            'is_active' => true,
        ]);
        \App\Models\BarbershopMember::create([
            'id' => (string) Str::uuid(),
            'barbershop_id' => $barbershop->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $response = $this->actingAs($owner)->postJson("/api/barbershops/{$barbershop->id}/barbers", [
            'user_id' => $barberUser->id,
            'role' => 'barber',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('barbershop_members', [
            'user_id' => $barberUser->id,
            'role' => 'barber',
            'barbershop_id' => $barbershop->id,
        ]);
    }
}

