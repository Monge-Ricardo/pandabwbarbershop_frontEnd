<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\BarbershopMember;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class BarberAppointmentController extends Controller
{
    private function currentUser(): ?User
    {
        $userId = session('user_id');

        if (!$userId) {
            return null;
        }

        return User::find($userId);
    }

    private function currentBarberMembership(?User $user): ?BarbershopMember
    {
        if (!$user) {
            return null;
        }

        return BarbershopMember::where('user_id', $user->id)
            ->where('role', 'barber')
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
            'message' => 'Esta función solo está disponible para barberos activos.',
        ], 403);
    }

    private function belongsToCurrentBarber(Appointment $appointment, User $user, BarbershopMember $membership): bool
    {
        return $appointment->barber_id === $user->id
            && $appointment->barbershop_id === $membership->barbershop_id;
    }

    public function index(Request $request)
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        $membership = $this->currentBarberMembership($user);

        if (!$membership) {
            return $this->forbiddenResponse();
        }

        $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
        ]);

        $baseQuery = Appointment::where('barber_id', $user->id)
            ->where('barbershop_id', $membership->barbershop_id);

        $query = (clone $baseQuery)
            ->with(['client', 'services'])
            ->orderBy('appointment_date')
            ->orderBy('start_time');

        if ($request->filled('date')) {
            $query->where('appointment_date', $request->query('date'));
        }

        $appointments = $query->get();
        $today = Carbon::today()->toDateString();

        return response()->json([
            'success' => true,
            'data' => $appointments,
            'stats' => [
                'today_appointments' => (clone $baseQuery)
                    ->where('appointment_date', $today)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->count(),
                'pending_requests' => (clone $baseQuery)
                    ->where('status', 'pending')
                    ->count(),
            ],
        ]);
    }

    public function confirm(Appointment $appointment)
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        $membership = $this->currentBarberMembership($user);

        if (!$membership) {
            return $this->forbiddenResponse();
        }

        if (!$this->belongsToCurrentBarber($appointment, $user, $membership)) {
            return response()->json([
                'success' => false,
                'message' => 'No puede confirmar una cita que no le pertenece.',
            ], 403);
        }

        if ($appointment->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'No puede confirmar una cita cancelada.',
            ], 422);
        }

        $appointment->update([
            'status' => 'confirmed',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cita confirmada correctamente.',
            'data' => $appointment->fresh(['client', 'services']),
        ]);
    }

    public function cancel(Appointment $appointment)
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        $membership = $this->currentBarberMembership($user);

        if (!$membership) {
            return $this->forbiddenResponse();
        }

        if (!$this->belongsToCurrentBarber($appointment, $user, $membership)) {
            return response()->json([
                'success' => false,
                'message' => 'No puede cancelar una cita que no le pertenece.',
            ], 403);
        }

        if ($appointment->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'La cita ya se encuentra cancelada.',
            ], 422);
        }

        $appointment->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cita cancelada correctamente.',
            'data' => $appointment->fresh(['client', 'services']),
        ]);
    }
}
