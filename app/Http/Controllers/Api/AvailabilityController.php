<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Availability;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AvailabilityController extends Controller
{
    // HU21: Ver disponibilidad
    public function index(Request $request)
    {
        $request->validate([
            'barbershop_id' => 'required|exists:barbershops,id',
            'barber_id' => 'required|exists:users,id',
            'date' => 'required|date'
        ]);

        $dayOfWeek = date('w', strtotime($request->date));

        $availabilities = Availability::where('barbershop_id', $request->barbershop_id)
            ->where('barber_id', $request->barber_id)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_available', true)
            ->orderBy('start_time')
            ->get();

        return response()->json(['data' => $availabilities]);
    }

    // El barbero define su disponibilidad
    public function store(Request $request)
    {
        $request->validate([
            'barbershop_id' => 'required|exists:barbershops,id',
            'day_of_week' => 'required|integer|between:0,6',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'is_available' => 'boolean'
        ]);

        $availability = Availability::create([
            'id' => (string) Str::uuid(),
            'barbershop_id' => $request->barbershop_id,
            'barber_id' => $request->user()->id,
            'day_of_week' => $request->day_of_week,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'is_available' => $request->is_available ?? true,
        ]);

        return response()->json([
            'message' => 'Availability set successfully',
            'data' => $availability
        ], 201);
    }
}
