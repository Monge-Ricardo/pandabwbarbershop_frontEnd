<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barbershop;
use App\Models\BarbershopMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BarbershopController extends Controller
{
    // ─── Helpers para rutas web (sesión directa) ──────────────────

    /** Obtener barbershop_id del owner desde la sesión */
    private function ownerBarbershopId(): ?string
    {
        return session('barbershop_id');
    }

    /** Listar miembros usando la sesión */
    public function getMembersFromSession(Request $request)
    {
        $barbershopId = $this->ownerBarbershopId();
        if (!$barbershopId) return response()->json(['message' => 'Not authenticated'], 401);
        return $this->getMembers($request, $barbershopId);
    }

    /** Agregar barbero usando la sesión */
    public function addBarberFromSession(Request $request)
    {
        $barbershopId = $this->ownerBarbershopId();
        if (!$barbershopId) return response()->json(['message' => 'Not authenticated'], 401);
        return $this->addBarber($request, $barbershopId);
    }

    /** Remover barbero usando la sesión */
    public function removeBarberFromSession(Request $request, string $memberId)
    {
        $barbershopId = $this->ownerBarbershopId();
        if (!$barbershopId) return response()->json(['message' => 'Not authenticated'], 401);
        return $this->removeBarber($request, $barbershopId, $memberId);
    }

    // ─── Información pública de la barbería ───────────────────────

    public function publicInfo($id = null)
    {
        if ($id) {
            $barbershop = Barbershop::with('members.user')->findOrFail($id);
        } else {
            $barbershop = Barbershop::with('members.user')->where('is_active', true)->first();
        }

        if (!$barbershop) {
            return response()->json(['message' => 'No barbershop found'], 404);
        }

        return response()->json(['data' => $barbershop]);
    }

    // Obtener la barbería del owner autenticado
    public function myBarbershop(Request $request)
    {
        $membership = BarbershopMember::where('user_id', $request->user()->id)
            ->where('role', 'owner')
            ->where('status', 'active')
            ->first();

        if (!$membership) {
            return response()->json(['message' => 'No barbershop found for this owner'], 404);
        }

        $barbershop = Barbershop::findOrFail($membership->barbershop_id);

        return response()->json(['data' => $barbershop]);
    }

    // HU8: Crear barbería
    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'address'     => 'nullable|string',
            'phone'       => 'nullable|string',
            'email'       => 'nullable|email',
        ]);

        $barbershop = Barbershop::create([
            'id'          => (string) Str::uuid(),
            'name'        => $request->name,
            'slug'        => Str::slug($request->name) . '-' . uniqid(),
            'description' => $request->description,
            'address'     => $request->address,
            'phone'       => $request->phone,
            'email'       => $request->email,
            'is_active'   => true,
            'created_at'  => now(),
        ]);

        BarbershopMember::create([
            'id'            => (string) Str::uuid(),
            'barbershop_id' => $barbershop->id,
            'user_id'       => $request->user()->id,
            'role'          => 'owner',
            'status'        => 'active',
            'joined_at'     => now(),
        ]);

        return response()->json(['message' => 'Barbershop created successfully', 'data' => $barbershop], 201);
    }

    // HU9: Editar información de barbería (HU26: solo owner)
    public function update(Request $request, $id)
    {
        $barbershop = Barbershop::findOrFail($id);
        $this->authorize('update', $barbershop);

        $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'address'     => 'nullable|string',
            'phone'       => 'nullable|string',
            'email'       => 'nullable|email',
        ]);

        $barbershop->update($request->only(['name', 'description', 'address', 'phone', 'email']));

        return response()->json(['message' => 'Barbershop updated successfully', 'data' => $barbershop]);
    }

    // HU10: Listar miembros (barberos) de la barbería
    public function getMembers(Request $request, $id)
    {
        $barbershop = Barbershop::findOrFail($id);
        $this->authorize('update', $barbershop);

        $members = BarbershopMember::with('user')
            ->where('barbershop_id', $barbershop->id)
            ->where('role', '!=', 'owner')
            ->get()
            ->map(fn($m) => [
                'member_id' => $m->id,
                'user_id'   => $m->user_id,
                'full_name' => $m->user?->full_name ?? 'N/A',
                'email'     => $m->user?->email ?? 'N/A',
                'role'      => $m->role,
                'status'    => $m->status,
                'joined_at' => $m->joined_at,
            ]);

        return response()->json(['data' => $members]);
    }

    // Buscar usuario registrado por email (para agregar como barbero)
    public function searchUsers(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(['data' => [
            'id'        => $user->id,
            'full_name' => $user->full_name,
            'email'     => $user->email,
        ]]);
    }

    // HU11: Agregar barbero a la barbería
    public function addBarber(Request $request, $id)
    {
        $barbershop = Barbershop::findOrFail($id);
        $this->authorize('update', $barbershop);

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'role'    => 'required|in:barber',
        ]);

        $exists = BarbershopMember::where('barbershop_id', $barbershop->id)
            ->where('user_id', $request->user_id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'User is already a member'], 400);
        }

        $member = BarbershopMember::create([
            'id'            => (string) Str::uuid(),
            'barbershop_id' => $barbershop->id,
            'user_id'       => $request->user_id,
            'role'          => $request->role,
            'status'        => 'active',
            'joined_at'     => now(),
        ]);

        $user = User::find($request->user_id);

        return response()->json([
            'message' => 'Barber added successfully',
            'data'    => array_merge($member->toArray(), [
                'full_name' => $user?->full_name,
                'email'     => $user?->email,
            ]),
        ], 201);
    }

    // HU10: Eliminar barbero de la barbería
    public function removeBarber(Request $request, $barbershopId, $memberId)
    {
        $barbershop = Barbershop::findOrFail($barbershopId);
        $this->authorize('update', $barbershop);

        $member = BarbershopMember::where('id', $memberId)
            ->where('barbershop_id', $barbershopId)
            ->where('role', '!=', 'owner')
            ->firstOrFail();

        $member->delete();

        return response()->json(['message' => 'Barber removed successfully']);
    }
}
