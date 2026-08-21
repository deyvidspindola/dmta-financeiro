<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\SearchController;
use App\Livewire\Admin\ApiTokens;
use App\Livewire\Admin\Dashboard;
use App\Livewire\Admin\Profile;
use App\Livewire\Admin\User\Create as UserCreate;
use App\Livewire\Admin\User\Edit as UserEdit;
use App\Livewire\Admin\User\Index as UserIndex;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Área /admin — autenticada por sessão
|--------------------------------------------------------------------------
|
| Prefixo de rota e de nome "admin.". URL em português (kebab-case);
| nome de rota e classe em inglês (ver CONVENTIONS.md).
*/

Route::middleware('auth')->prefix('admin')->name('admin.')->group(function (): void {
    Route::get('/', Dashboard::class)->name('dashboard');

    Route::get('/usuarios', UserIndex::class)->name('users.index');
    Route::get('/usuarios/novo', UserCreate::class)->name('users.create');
    Route::get('/usuarios/{user}/editar', UserEdit::class)->name('users.edit');

    Route::get('/tokens', ApiTokens::class)->name('tokens');

    Route::get('/perfil', Profile::class)->name('profile');

    Route::get('/buscar', SearchController::class)->name('search');
});
