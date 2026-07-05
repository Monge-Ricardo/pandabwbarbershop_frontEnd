<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BarbershopController;
use App\Http\Controllers\Api\AppointmentController;

// ─── Rutas de datos del Owner Dashboard (web middleware = sesión disponible) ──
Route::prefix('owner/data')->middleware('web')->group(function () {
    // Info de la barbería del owner autenticado
    Route::get('/barbershop', [BarbershopController::class, 'myBarbershop']);
    Route::put('/barbershop', function (\Illuminate\Http\Request $request) {
        // Obtener la barbería del owner desde la sesión
        $barbershopId = session('barbershop_id');
        if (!$barbershopId) return response()->json(['message' => 'No barbershop'], 404);
        $req = $request; $req->merge(['_barbershop_id' => $barbershopId]);
        return app(BarbershopController::class)->update($req, $barbershopId);
    });
    // Barberos
    Route::get('/members',  [BarbershopController::class, 'getMembersFromSession']);
    Route::post('/members', [BarbershopController::class, 'addBarberFromSession']);
    Route::delete('/members/{memberId}', [BarbershopController::class, 'removeBarberFromSession']);
    // Buscar usuario
    Route::get('/search-user', [BarbershopController::class, 'searchUsers']);
    // Citas
    Route::get('/appointments', [AppointmentController::class, 'ownerAppointments']);
});

/*
|--------------------------------------------------------------------------
| Public information pages
|--------------------------------------------------------------------------
| Visible URLs such as /about, /service or /contact render the main layout.
| JavaScript then loads the corresponding partial content from /info/content.
*/

Route::get('/', function () {
    return view('info.index');
});

Route::get('/info/content/{section}', function (string $section) {
    $views = [
        'about' => 'info.about',
        'service' => 'info.service',
        'price' => 'info.price',
        'team' => 'info.team',
        'open' => 'info.open',
        'testimonial' => 'info.testimonial',
        'contact' => 'info.contact',
        'not-found' => 'info.404',
    ];

    abort_unless(array_key_exists($section, $views), 404);

    return view($views[$section]);
});

Route::get('/{page}', function () {
    return view('info.index');
})->where('page', 'about|service|price|team|open|testimonial|contact|404');

/*
|--------------------------------------------------------------------------
| Dashboards
|--------------------------------------------------------------------------
*/

Route::get('/barber/dashboard/{tab?}', function ($tab = 'agenda') {
    return view('barber.dashboard');
})->where('tab', 'agenda|services|products');

Route::get('/customer/dashboard/{tab?}', function ($tab = 'my-appointments') {
    return view('customer.dashboard');
})->where('tab', 'my-appointments|book-appointment|profile');

<<<<<<< HEAD
Route::get('/owner/dashboard/{tab?}', function ($tab = 'dashboard') {
    return view('owner.dashboard');
})->where('tab', 'dashboard|barbershop-info|manage-barbers|global-agenda');
=======
Route::get('/owner/dashboard', function () {
    if (!session('user_id')) {
        return redirect('/customer/login');
    }
    return view('owner.dashboard', [
        'sessionUserId'      => session('user_id'),
        'sessionUserName'    => session('user_name'),
        'sessionUserEmail'   => session('user_email'),
        'sessionBarbershopId'=> session('barbershop_id'),
    ]);
});
>>>>>>> OAuth-Ricardo

/*
|--------------------------------------------------------------------------
| Customer authentication views
|--------------------------------------------------------------------------
*/

Route::get('/customer/login', function () {
    return view('customer.auth.login');
})->name('login');

Route::get('/customer/register', function () {
    return view('customer.auth.register');
});
