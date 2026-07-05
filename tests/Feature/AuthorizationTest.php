<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Barbershop;
use App\Models\BarbershopMember;
use App\Models\Service;
use App\Models\Product;
use Illuminate\Support\Str;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function setupBarbershopWithMembers(): array
    {
        $owner  = User::create(['id' => (string) Str::uuid(), 'full_name' => 'Owner',  'email' => 'owner@test.com']);
        $barber = User::create(['id' => (string) Str::uuid(), 'full_name' => 'Barber', 'email' => 'barber@test.com']);
        $other  = User::create(['id' => (string) Str::uuid(), 'full_name' => 'Other',  'email' => 'other@test.com']);

        $barbershop = Barbershop::create(['id' => (string) Str::uuid(), 'name' => 'Shop', 'slug' => 'shop-' . uniqid(), 'is_active' => true]);
        BarbershopMember::create(['id' => (string) Str::uuid(), 'barbershop_id' => $barbershop->id, 'user_id' => $owner->id,  'role' => 'owner',  'status' => 'active', 'joined_at' => now()]);
        BarbershopMember::create(['id' => (string) Str::uuid(), 'barbershop_id' => $barbershop->id, 'user_id' => $barber->id, 'role' => 'barber', 'status' => 'active', 'joined_at' => now()]);

        return compact('owner', 'barber', 'other', 'barbershop');
    }

    /** HU26 & HU7: Solo el owner puede editar la barbería */
    public function test_only_owner_can_edit_barbershop(): void
    {
        ['barbershop' => $barbershop, 'barber' => $barber] = $this->setupBarbershopWithMembers();

        $response = $this->actingAs($barber)->putJson("/api/barbershops/{$barbershop->id}", [
            'name' => 'Hack Attempt',
        ]);
        $response->assertStatus(403);
    }

    /** HU27: Barbero solo puede editar sus propios servicios */
    public function test_barber_can_update_own_service(): void
    {
        ['barbershop' => $barbershop, 'barber' => $barber] = $this->setupBarbershopWithMembers();

        $service = Service::create([
            'id'               => (string) Str::uuid(),
            'barbershop_id'    => $barbershop->id,
            'name'             => 'Haircut',
            'price'            => 15,
            'duration_minutes' => 30,
            'is_active'        => true,
        ]);

        $response = $this->actingAs($barber)->putJson("/api/barber/services/{$service->id}", [
            'name' => 'Updated Haircut',
        ]);
        $response->assertStatus(200);
    }

    /** HU27: Usuario ajeno NO puede editar servicios de otro barbero */
    public function test_outsider_cannot_update_service(): void
    {
        ['barbershop' => $barbershop, 'other' => $other] = $this->setupBarbershopWithMembers();

        $service = Service::create([
            'id'               => (string) Str::uuid(),
            'barbershop_id'    => $barbershop->id,
            'name'             => 'Shave',
            'price'            => 10,
            'duration_minutes' => 20,
            'is_active'        => true,
        ]);

        $response = $this->actingAs($other)->putJson("/api/barber/services/{$service->id}", [
            'name' => 'Hacked Shave',
        ]);
        $response->assertStatus(403);
    }

    /** HU27: Barbero puede gestionar sus productos */
    public function test_barber_can_update_own_product(): void
    {
        ['barbershop' => $barbershop, 'barber' => $barber] = $this->setupBarbershopWithMembers();

        $product = Product::create([
            'id'            => (string) Str::uuid(),
            'barbershop_id' => $barbershop->id,
            'name'          => 'Pomade',
            'price'         => 20,
            'stock'         => 10,
            'is_active'     => true,
        ]);

        $response = $this->actingAs($barber)->putJson("/api/barber/products/{$product->id}", [
            'name' => 'Premium Pomade',
        ]);
        $response->assertStatus(200);
    }

    /** HU27: Usuario ajeno NO puede editar productos */
    public function test_outsider_cannot_update_product(): void
    {
        ['barbershop' => $barbershop, 'other' => $other] = $this->setupBarbershopWithMembers();

        $product = Product::create([
            'id'            => (string) Str::uuid(),
            'barbershop_id' => $barbershop->id,
            'name'          => 'Shampoo',
            'price'         => 15,
            'stock'         => 5,
            'is_active'     => true,
        ]);

        $response = $this->actingAs($other)->putJson("/api/barber/products/{$product->id}", [
            'name' => 'Hacked Shampoo',
        ]);
        $response->assertStatus(403);
    }
}

