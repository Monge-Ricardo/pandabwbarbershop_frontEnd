<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BarbershopMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AuthController extends Controller
{
    // Retorna datos del usuario autenticado desde la sesión PHP
    public function me()
    {
        $userId = session('user_id');
        if (!$userId) {
            return response()->json(['message' => 'Not authenticated'], 401);
        }
        return response()->json([
            'user_id'       => session('user_id'),
            'user_name'     => session('user_name'),
            'user_email'    => session('user_email'),
            'role'          => session('role'),
            'barbershop_id' => session('barbershop_id'),
        ]);
    }

    public function register(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'username' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        $supabaseUrl = rtrim(config('services.supabase.url'), '/');
        $supabaseAnonKey = config('services.supabase.anon_key');

        if (!$supabaseUrl || !$supabaseAnonKey) {
            return response()->json([
                'success' => false,
                'message' => 'Supabase no está configurado.',
            ], 500);
        }

        $signupResponse = Http::withHeaders([
            'apikey' => $supabaseAnonKey,
            'Authorization' => 'Bearer ' . $supabaseAnonKey,
            'Content-Type' => 'application/json',
        ])->post($supabaseUrl . '/auth/v1/signup', [
            'email' => $validatedData['email'],
            'password' => $validatedData['password'],
            'data' => [
                'full_name' => $validatedData['name'],
                'username' => $validatedData['username'],
            ]
        ]);

        if (!$signupResponse->successful()) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar en Supabase Auth: ' . $signupResponse->json('msg', 'Error desconocido'),
            ], 400);
        }

        $authData = $signupResponse->json();
        $authUserId = $authData['user']['id'] ?? $authData['id'] ?? null;

        if (!$authUserId) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudo obtener el ID del usuario desde Supabase.',
            ], 500);
        }

        try {
            $user = User::firstOrCreate(
                ['id' => $authUserId],
                [
                    'full_name' => $validatedData['name'],
                    'email' => $validatedData['email'],
                ]
            );
        } catch (\Exception $e) {
            // Ignorar el error si un trigger ya insertó al usuario u otro problema ocurrió, 
            // pero podríamos hacer un log. Para este caso continuamos.
        }

        return response()->json([
            'success' => true,
            'message' => 'Usuario registrado exitosamente.',
        ]);
    }

    public function login(Request $request)
    {
        $validatedData = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $supabaseUrl = rtrim(config('services.supabase.url'), '/');
        $supabaseAnonKey = config('services.supabase.anon_key');

        if (!$supabaseUrl || !$supabaseAnonKey) {
            return response()->json([
                'success' => false,
                'message' => 'Supabase no está configurado correctamente en Laravel.',
            ], 500);
        }

        $authResponse = Http::withHeaders([
            'apikey' => $supabaseAnonKey,
            'Authorization' => 'Bearer ' . $supabaseAnonKey,
            'Content-Type' => 'application/json',
        ])->post($supabaseUrl . '/auth/v1/token?grant_type=password', [
            'email' => $validatedData['email'],
            'password' => $validatedData['password'],
        ]);

        if (!$authResponse->successful()) {
            return response()->json([
                'success' => false,
                'message' => 'Credenciales inválidas.',
            ], 401);
        }

        $authData = $authResponse->json();

        $authUserId = $authData['user']['id'] ?? null;

        if (!$authUserId) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudo obtener el usuario autenticado.',
            ], 500);
        }

        $user = User::where('id', $authUserId)
            ->orWhere('email', $validatedData['email'])
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario existe en Supabase Auth, pero no existe en la tabla pública users.',
            ], 404);
        }

        $membership = BarbershopMember::with('barbershop')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        session([
            'user_id' => $user->id,
            'user_name' => $user->full_name,
            'user_email' => $user->email,
            'role' => $membership?->role,
            'barbershop_id' => $membership?->barbershop_id,
            'supabase_access_token' => $authData['access_token'] ?? null,
        ]);

        session()->save(); // <--- IMPORTANTE: Forzar persistencia inmediata

        // Autenticar oficialmente en Laravel para que Auth::user() funcione en Policies/Gates
        \Illuminate\Support\Facades\Auth::login($user);

        $redirectUrl = '/customer/dashboard';

        if ($membership && $membership->role === 'owner') {
            $redirectUrl = '/owner/dashboard';
        }

        if ($membership && $membership->role === 'barber') {
            $redirectUrl = '/barber/dashboard';
        }

        return response()->json([
            'success' => true,
            'message' => 'Inicio de sesión correcto.',
            'redirect' => $redirectUrl,
            'access_token' => $authData['access_token'] ?? null,
            'user' => [
                'id'           => $user->id,
                'name'         => $user->full_name,
                'email'        => $user->email,
                'role'         => $membership?->role,
                'barbershop_id'=> $membership?->barbershop_id,
            ],
        ]);
    }

    public function logout()
    {
        session()->flush();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada correctamente.',
            'redirect' => '/',
        ]);
    }
    public function me()
    {
        $userId = session('user_id');

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'No hay una sesión activa.',
            ], 401);
        }

        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario de la sesión no existe en la tabla users.',
            ], 404);
        }

        $membership = BarbershopMember::with('barbershop')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_url,
                'role' => $membership?->role ?? 'customer',
                'barbershop_id' => $membership?->barbershop_id,
                'barbershop_name' => $membership?->barbershop?->name,
            ],
        ]);
    }

}