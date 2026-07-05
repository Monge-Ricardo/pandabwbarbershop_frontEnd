<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware que autentica al usuario leyendo la sesión PHP.
 * Compatibilidad con la sesión creada por AuthController::login().
 */
class SessionAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        // Compatibilidad con actingAs() en tests — Laravel ya autenticó al usuario
        if (auth()->check()) {
            return $next($request);
        }

        // Autenticación por sesión PHP (producción — peticiones desde el browser)
        $userId = session('user_id');

        if (!$userId) {
            return response()->json(['message' => 'Unauthorized. Please log in.'], 401);
        }

        $user = User::find($userId);

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 401);
        }

        // Inyectar el usuario en el guard de Laravel
        auth()->setUser($user);

        return $next($request);
    }
}
