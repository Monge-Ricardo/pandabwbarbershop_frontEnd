<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Barbershop;
use App\Models\BarbershopMember;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OwnerController extends Controller
{
    private function currentUser(): ?User
    {
        $userId = session('user_id');

        if (!$userId) {
            return null;
        }

        return User::find($userId);
    }

    private function currentOwnerMembership(?User $user): ?BarbershopMember
    {
        if (!$user) {
            return null;
        }

        return BarbershopMember::with('barbershop')
            ->where('user_id', $user->id)
            ->where('role', 'owner')
            ->where('status', 'active')
            ->first();
    }

    private function unauthorizedResponse()
    {
        return response()->json([
            'success' => false,
            'message' => 'Debe iniciar sesión para usar esta función.',
        ], 401);
    }

    private function forbiddenResponse()
    {
        return response()->json([
            'success' => false,
            'message' => 'Esta función solo está disponible para propietarios activos.',
        ], 403);
    }

    private function ownerContext()
    {
        $user = $this->currentUser();

        if (!$user) {
            return [null, null, $this->unauthorizedResponse()];
        }

        $membership = $this->currentOwnerMembership($user);

        if (!$membership) {
            return [$user, null, $this->forbiddenResponse()];
        }

        return [$user, $membership, null];
    }

    public function overview()
    {
        [$user, $membership, $errorResponse] = $this->ownerContext();

        if ($errorResponse) {
            return $errorResponse;
        }

        $barbershopId = $membership->barbershop_id;
        $monthStart = Carbon::now()->startOfMonth()->toDateString();
        $monthEnd = Carbon::now()->endOfMonth()->toDateString();

        $monthlyRevenue = DB::table('appointments')
            ->join('appointment_services', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('services', 'services.id', '=', 'appointment_services.service_id')
            ->where('appointments.barbershop_id', $barbershopId)
            ->where('appointments.status', 'confirmed')
            ->whereBetween('appointments.appointment_date', [$monthStart, $monthEnd])
            ->sum('services.price');

        $recentAppointments = Appointment::with(['client', 'barber', 'services'])
            ->where('barbershop_id', $barbershopId)
            ->orderByDesc('appointment_date')
            ->orderByDesc('start_time')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_appointments' => Appointment::where('barbershop_id', $barbershopId)->count(),
                'active_barbers' => BarbershopMember::where('barbershop_id', $barbershopId)
                    ->where('role', 'barber')
                    ->where('status', 'active')
                    ->count(),
                'monthly_revenue' => (float) $monthlyRevenue,
                'recent_appointments' => $recentAppointments,
            ],
        ]);
    }

    public function showBarbershop()
    {
        [$user, $membership, $errorResponse] = $this->ownerContext();

        if ($errorResponse) {
            return $errorResponse;
        }

        return response()->json([
            'success' => true,
            'data' => $membership->barbershop,
        ]);
    }

    public function updateBarbershop(Request $request)
    {
        [$user, $membership, $errorResponse] = $this->ownerContext();

        if ($errorResponse) {
            return $errorResponse;
        }

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'description' => 'nullable|string|max:1000',
            'logo_url' => 'nullable|string|max:1000',
        ]);

        $barbershop = Barbershop::findOrFail($membership->barbershop_id);
        $validatedData['updated_at'] = now();
        $barbershop->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Información de la barbería actualizada correctamente.',
            'data' => $barbershop->fresh(),
        ]);
    }

    public function barbers()
    {
        [$user, $membership, $errorResponse] = $this->ownerContext();

        if ($errorResponse) {
            return $errorResponse;
        }

        $barbers = BarbershopMember::with('user')
            ->where('barbershop_id', $membership->barbershop_id)
            ->where('role', 'barber')
            ->orderBy('status')
            ->get()
            ->map(function ($member) {
                return [
                    'membership_id' => $member->id,
                    'user_id' => $member->user_id,
                    'full_name' => $member->user?->full_name,
                    'email' => $member->user?->email,
                    'phone' => $member->user?->phone,
                    'status' => $member->status,
                    'joined_at' => $member->joined_at,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => $barbers,
        ]);
    }

    public function storeBarber(Request $request)
    {
        [$owner, $membership, $errorResponse] = $this->ownerContext();

        if ($errorResponse) {
            return $errorResponse;
        }

        $validatedData = $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $validatedData['email'])->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No existe un usuario registrado con ese correo. Primero debe registrarse en el sistema.',
            ], 404);
        }

        if ($user->id === $owner->id) {
            return response()->json([
                'success' => false,
                'message' => 'El propietario ya administra la barbería y no debe agregarse como barbero.',
            ], 422);
        }

        $existingMembership = BarbershopMember::where('barbershop_id', $membership->barbershop_id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingMembership) {
            $existingMembership->update([
                'role' => 'barber',
                'status' => 'active',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'El usuario fue activado como barbero correctamente.',
                'data' => $existingMembership->fresh('user'),
            ]);
        }

        $newMembership = BarbershopMember::create([
            'id' => (string) Str::uuid(),
            'barbershop_id' => $membership->barbershop_id,
            'user_id' => $user->id,
            'role' => 'barber',
            'status' => 'active',
            'joined_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Barbero agregado correctamente.',
            'data' => $newMembership->load('user'),
        ], 201);
    }

    public function updateBarberStatus(Request $request, BarbershopMember $member)
    {
        [$user, $membership, $errorResponse] = $this->ownerContext();

        if ($errorResponse) {
            return $errorResponse;
        }

        if ($member->barbershop_id !== $membership->barbershop_id || $member->role !== 'barber') {
            return response()->json([
                'success' => false,
                'message' => 'El barbero seleccionado no pertenece a esta barbería.',
            ], 403);
        }

        $validatedData = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $member->update([
            'status' => $validatedData['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Estado del barbero actualizado correctamente.',
            'data' => $member->fresh('user'),
        ]);
    }

    public function appointments(Request $request)
    {
        [$user, $membership, $errorResponse] = $this->ownerContext();

        if ($errorResponse) {
            return $errorResponse;
        }

        $validatedData = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'barber_id' => 'nullable|uuid',
        ]);

        $query = Appointment::with(['client', 'barber', 'services'])
            ->where('barbershop_id', $membership->barbershop_id)
            ->orderBy('appointment_date')
            ->orderBy('start_time');

        if (!empty($validatedData['date'])) {
            $query->where('appointment_date', $validatedData['date']);
        }

        if (!empty($validatedData['barber_id'])) {
            $query->where('barber_id', $validatedData['barber_id']);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function updateAppointmentStatus(Request $request, Appointment $appointment)
    {
        [$user, $membership, $errorResponse] = $this->ownerContext();

        if ($errorResponse) {
            return $errorResponse;
        }

        if ($appointment->barbershop_id !== $membership->barbershop_id) {
            return response()->json([
                'success' => false,
                'message' => 'La cita seleccionada no pertenece a esta barbería.',
            ], 403);
        }

        $validatedData = $request->validate([
            'status' => 'required|in:pending,confirmed,cancelled',
        ]);

        $appointment->update([
            'status' => $validatedData['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Estado de la cita actualizado correctamente.',
            'data' => $appointment->fresh(['client', 'barber', 'services']),
        ]);
    }
}
