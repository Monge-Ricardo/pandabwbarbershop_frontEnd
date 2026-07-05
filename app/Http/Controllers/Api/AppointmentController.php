<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentService;
use App\Models\Availability;
use App\Models\BarbershopMember;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AppointmentController extends Controller
{
    // Citas del owner — lee barbershop_id desde la sesión PHP (ruta web)
    public function ownerAppointments(Request $request)
    {
        $barbershopId = session('barbershop_id');
        if (!$barbershopId) {
            return response()->json(['message' => 'Not authenticated'], 401);
        }

        $appointments = \App\Models\Appointment::with(['client', 'barber'])
            ->where('barbershop_id', $barbershopId)
            ->orderBy('appointment_date', 'desc')
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json(['data' => $appointments]);
    }

    // HU20, HU22, HU28: Reservar cita

    public function store(Request $request)
    {
        $request->validate([
            'barbershop_id' => 'required|exists:barbershops,id',
            'barber_id' => 'required|exists:users,id',
            'services' => 'nullable|array',
            'services.*' => 'exists:services,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'notes' => 'nullable|string',
        ]);

        $dayOfWeek = date('w', strtotime($request->appointment_date));

        // Verificar disponibilidad del barbero (HU28)
        $availability = Availability::where('barbershop_id', $request->barbershop_id)
            ->where('barber_id', $request->barber_id)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_available', true)
            ->where('start_time', '<=', $request->start_time)
            ->where('end_time', '>=', $request->end_time)
            ->first();

        if (!$availability) {
            return response()->json(['message' => 'Barber is not available at this time'], 400);
        }

        // Verificar cruce de horarios (citas previas confirmadas o pendientes)
        $conflict = Appointment::where('barber_id', $request->barber_id)
            ->where('appointment_date', $request->appointment_date)
            ->whereIn('status', ['PENDING', 'ACCEPTED'])
            ->where(function ($query) use ($request) {
                $query->whereBetween('start_time', [$request->start_time, $request->end_time])
                      ->orWhereBetween('end_time', [$request->start_time, $request->end_time])
                      ->orWhere(function ($q) use ($request) {
                          $q->where('start_time', '<', $request->start_time)
                            ->where('end_time', '>', $request->end_time);
                      });
            })->exists();

        if ($conflict) {
            return response()->json(['message' => 'Time slot is already booked'], 400);
        }

        $appointment = Appointment::create([
            'id' => (string) Str::uuid(),
            'barbershop_id' => $request->barbershop_id,
            'client_id' => $request->user()->id,
            'barber_id' => $request->barber_id,
            'appointment_date' => $request->appointment_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'status' => 'PENDING',
            'notes' => $request->notes,
            'created_at' => now(),
        ]);

        foreach ($request->services as $service_id) {
            AppointmentService::create([
                'id' => (string) Str::uuid(),
                'appointment_id' => $appointment->id,
                'service_id' => $service_id,
            ]);
        }

        return response()->json([
            'message' => 'Appointment booked successfully',
            'data' => $appointment->load('services')
        ], 201);
    }

    // HU23, HU24: Visualizar agenda
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Appointment::with(['client', 'barber', 'services']);

        // Si el usuario es el dueño de una barbería (Owner), ve todas las de su barbería
        $ownerMembership = BarbershopMember::where('user_id', $user->id)
            ->where('role', 'owner')
            ->where('status', 'active')
            ->first();

        if ($ownerMembership) {
            $query->where('barbershop_id', $ownerMembership->barbershop_id);
        } else {
            // Si es un barbero o cliente, ve sus citas donde él es barber o client
            $query->where(function ($q) use ($user) {
                $q->where('client_id', $user->id)
                  ->orWhere('barber_id', $user->id);
            });
        }

        $appointments = $query->orderBy('appointment_date', 'desc')
                              ->orderBy('start_time', 'asc')
                              ->get();

        return response()->json(['data' => $appointments]);
    }

    // HU25: Actualizar estado de cita
    public function updateStatus(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);

        $request->validate([
            'status' => 'required|in:PENDING,ACCEPTED,CANCELLED,COMPLETED'
        ]);

        $user = $request->user();
        
        $isOwner = BarbershopMember::where('barbershop_id', $appointment->barbershop_id)
            ->where('user_id', $user->id)
            ->where('role', 'owner')
            ->exists();

        if ($appointment->barber_id !== $user->id && $appointment->client_id !== $user->id && !$isOwner) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $appointment->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Appointment status updated successfully',
            'data' => $appointment
        ]);
    }
}
