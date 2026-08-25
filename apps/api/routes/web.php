<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\LogoutController;
use App\Livewire\Auth\Login;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rotas públicas e de autenticação
|--------------------------------------------------------------------------
|
| A área autenticada (/admin) mora em routes/admin.php — mantém este
| arquivo curto e fácil de ler.
*/

Route::get('/', function () {
    return redirect()->away('/app/');
})->name('home');

Route::middleware('guest')->group(function (): void {
    Route::get('/entrar', Login::class)->name('login');
});

Route::post('/sair', LogoutController::class)
    ->middleware('auth')
    ->name('logout');

require __DIR__.'/admin.php';
