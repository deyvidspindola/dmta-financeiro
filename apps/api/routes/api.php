<?php

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BillController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ContextController;
use App\Http\Controllers\Api\V1\CreditCardController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\InvestmentController;
use App\Http\Controllers\Api\V1\TransactionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1 — consumida por apps/web (SPA) e apps/mobile (Expo), D-09.
|--------------------------------------------------------------------------
| Toda rota de domínio é aninhada em /contexts/{context}/... — o
| controller sempre confere posse do contexto antes de tocar em qualquer
| dado (App\Http\Controllers\Api\V1\Concerns\AuthorizesContext).
*/

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);

        Route::get('contexts', [ContextController::class, 'index']);
        Route::post('contexts', [ContextController::class, 'store']);

        Route::get('dashboard/consolidated', [DashboardController::class, 'consolidated']);

        Route::prefix('contexts/{context}')->group(function () {
            Route::get('dashboard', [DashboardController::class, 'show']);

            Route::get('accounts', [AccountController::class, 'index']);
            Route::post('accounts', [AccountController::class, 'store']);

            Route::get('categories', [CategoryController::class, 'index']);
            Route::post('categories', [CategoryController::class, 'store']);

            Route::get('bills', [BillController::class, 'index']);
            Route::post('bills', [BillController::class, 'store']);

            Route::get('transactions', [TransactionController::class, 'index']);
            Route::post('transactions', [TransactionController::class, 'store']);

            Route::get('credit-cards', [CreditCardController::class, 'index']);
            Route::post('credit-cards', [CreditCardController::class, 'store']);

            Route::get('investments', [InvestmentController::class, 'index']);
            Route::post('investments', [InvestmentController::class, 'store']);
        });
    });
});
