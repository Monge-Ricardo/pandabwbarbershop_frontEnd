<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::query();

        if ($request->has('barbershop_id')) {
            $query->where('barbershop_id', $request->query('barbershop_id'));
        }

        $query->where('is_active', true);

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'barbershop_id' => 'required|uuid',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:1',
        ]);

        $validatedData['id'] = (string) Str::uuid();
        $validatedData['is_active'] = true;
        $validatedData['created_at'] = now();

        $service = Service::create($validatedData);

        return response()->json($service, 201);
    }

    public function show(Service $service)
    {
        return response()->json($service);
    }

    public function update(Request $request, Service $service)
    {
        $this->authorize('update', $service);

        $validatedData = $request->validate([
            'barbershop_id' => 'sometimes|required|uuid',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'duration_minutes' => 'sometimes|required|integer|min:1',
            'is_active' => 'sometimes|boolean',
        ]);

        $service->update($validatedData);

        return response()->json($service);
    }

    public function destroy(Service $service)
    {
        $this->authorize('update', $service);

        $service->update([
            'is_active' => false,
        ]);

        return response()->json([
            'message' => 'Servicio desactivado correctamente.'
        ]);
    }
}