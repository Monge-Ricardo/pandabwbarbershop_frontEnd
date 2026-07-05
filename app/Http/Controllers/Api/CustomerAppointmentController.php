<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentService;
use App\Models\Availability;
use App\Models\BarbershopMember;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CustomerAppointmentController extends Controller
{
    private function currentUser()
    {
        $userId = session('user_id');

        if (!$userId) {
            return null;
        }

        return User::find($userId);
    }

    private function unauthorizedResponse()
    {
        return response()->json([
            'success' => false,
            'message' => 'Debe iniciar sesión para usar esta función.',
        ], 401);
    }

    public function barbers()
    {
        $barbers = BarbershopMember::with(['user', 'barbershop'])
            ->where('role', 'barber')
            ->where('status', 'active')
            ->get()
            ->map(function ($member) {
                return [
                    'id' => $member->user?->id,
                    'full_name' => $member->user?->full_name,
                    'email' => $member->user?->email,
                    'barbershop_id' => $member->barbershop_id,
                    'barbershop_name' => $member->barbershop?->name,
                ];
            })
            ->filter(fn ($barber) => !empty($barber['id']))
            ->values();

        return response()->json([
            'success' => true,
            'data' => $barbers,
        ]);
    }

    public function services(Request $request)
    {
        $query = Service::query()
            ->where('is_active', true)
            ->orderBy('name');

        if ($request->filled('barbershop_id')) {
            $query->where('barbershop_id', $request->query('barbershop_id'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function availableTimes(Request $request)
    {
        $validatedData = $request->validate([
            'barber_id' => 'required|uuid',
            'service_id' => 'required|uuid',
            'date' => 'required|date_format:Y-m-d|after_or_equal:today',
        ]);

        $barberMembership = BarbershopMember::where('user_id', $validatedData['barber_id'])
            ->where('role', 'barber')
            ->where('status', 'active')
            ->first();

        $service = Service::where('id', $validatedData['service_id'])
            ->where('is_active', true)
            ->first();

        if (!$barberMembership || !$service || $service->barbershop_id !== $barberMembership->barbershop_id) {
            return response()->json([
                'success' => false,
                'message' => 'El barbero o el servicio seleccionado no es válido.',
            ], 422);
        }

        $duration = (int) $service->duration_minutes;
        $date = $validatedData['date'];
        $dayOfWeek = Carbon::parse($date)->dayOfWeekIso;

        $availabilityRows = Availability::where('barber_id', $validatedData['barber_id'])
            ->where('barbershop_id', $barberMembership->barbershop_id)
            ->where('is_available', true)
            ->where('day_of_week', $dayOfWeek)
            ->get();

        $candidateSlots = [];

        if ($availabilityRows->isEmpty()) {
            $candidateSlots = ['09:00', '10:00', '11:00', '13:00', '14:30', '16:00'];
        } else {
            foreach ($availabilityRows as $availability) {
                $cursor = Carbon::createFromFormat('H:i:s', $availability->start_time);
                $limit = Carbon::createFromFormat('H:i:s', $availability->end_time);

                while ($cursor->copy()->addMinutes($duration)->lessThanOrEqualTo($limit)) {
                    $candidateSlots[] = $cursor->format('H:i');
                    $cursor->addMinutes(30);
                }
            }
        }

        $slots = collect($candidateSlots)
            ->unique()
            ->sort()
            ->map(function ($time) use ($date, $duration, $validatedData) {
                $start = Carbon::createFromFormat('H:i', $time);
                $end = $start->copy()->addMinutes($duration);

                $hasConflict = Appointment::where('barber_id', $validatedData['barber_id'])
                    ->where('appointment_date', $date)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->where('start_time', '<', $end->format('H:i:s'))
                    ->where('end_time', '>', $start->format('H:i:s'))
                    ->exists();

                return [
                    'time' => $start->format('H:i'),
                    'label' => $start->format('H:i'),
                    'available' => !$hasConflict,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => $slots,
        ]);
    }

    public function index()
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        $appointments = Appointment::with(['barber', 'services'])
            ->where('client_id', $user->id)
            ->orderBy('appointment_date')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $appointments,
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        $validatedData = $request->validate([
            'barber_id' => 'required|uuid',
            'service_id' => 'required|uuid',
            'appointment_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'notes' => 'nullable|string|max:500',
        ]);

        $barberMembership = BarbershopMember::where('user_id', $validatedData['barber_id'])
            ->where('role', 'barber')
            ->where('status', 'active')
            ->first();

        if (!$barberMembership) {
            return response()->json([
                'success' => false,
                'message' => 'El barbero seleccionado no está activo.',
            ], 422);
        }

        $service = Service::where('id', $validatedData['service_id'])
            ->where('barbershop_id', $barberMembership->barbershop_id)
            ->where('is_active', true)
            ->first();

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'El servicio seleccionado no pertenece a la barbería del barbero.',
            ], 422);
        }

        $start = Carbon::createFromFormat('H:i', $validatedData['start_time']);
        $end = $start->copy()->addMinutes((int) $service->duration_minutes);
        $startTime = $start->format('H:i:s');
        $endTime = $end->format('H:i:s');

        $hasConflict = Appointment::where('barber_id', $validatedData['barber_id'])
            ->where('appointment_date', $validatedData['appointment_date'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->exists();

        if ($hasConflict) {
            return response()->json([
                'success' => false,
                'message' => 'Ese horario ya fue reservado. Seleccione otro horario.',
            ], 409);
        }

        $appointment = DB::transaction(function () use ($validatedData, $user, $barberMembership, $startTime, $endTime) {
            $appointment = Appointment::create([
                'id' => (string) Str::uuid(),
                'barbershop_id' => $barberMembership->barbershop_id,
                'client_id' => $user->id,
                'barber_id' => $validatedData['barber_id'],
                'appointment_date' => $validatedData['appointment_date'],
                'start_time' => $startTime,
                'end_time' => $endTime,
                'status' => 'pending',
                'notes' => $validatedData['notes'] ?? null,
                'created_at' => now(),
            ]);

            AppointmentService::create([
                'id' => (string) Str::uuid(),
                'appointment_id' => $appointment->id,
                'service_id' => $validatedData['service_id'],
            ]);

            return $appointment;
        });

        return response()->json([
            'success' => true,
            'message' => 'Cita registrada correctamente.',
            'data' => $appointment->load(['barber', 'services']),
        ], 201);
    }

    public function cancel(Appointment $appointment)
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        if ($appointment->client_id !== $user->id) {
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
        ]);
    }
}
