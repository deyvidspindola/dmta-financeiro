<?php

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BillController;
use App\Http\Controllers\Api\V1\CardInvoiceController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ContextController;
use App\Http\Controllers\Api\V1\CreditCardController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\InvestmentContributionController;
use App\Http\Controllers\Api\V1\InvestmentController;
use App\Http\Controllers\Api\V1\MfaController;
use App\Http\Controllers\Api\V1\TransactionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1 — consumida por apps/web (SPA) e apps/mobile (Expo), D-09.
|--------------------------------------------------------------------------
| Toda rota de domínio é aninhada em /contexts/{context}/... — isolamento
| de dado (capítulo 12 do documento de concepção) é garantido em dois
| pontos, os dois nativos do framework, nenhum controller precisa checar
| nada na mão:
|   1. `can:view,context` — só o dono do contexto passa (ContextPolicy).
|   2. `scopeBindings()` — {account}/{bill}/etc. só resolvem dentro da
|      relação do próprio Context (Context::accounts(), ::bills()...);
|      um ID de outro contexto vira 404 automaticamente, antes do
|      controller rodar.
*/

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);

    // Token "pendente" do login com MFA (ability mfa-pending) só entra
    // aqui — não abre nenhuma outra rota da API. Ver IssueApiToken.
    Route::middleware(['auth:sanctum', 'ability:mfa-pending'])->group(function () {
        Route::post('auth/mfa/verify', [MfaController::class, 'verify']);
    });

    // Token de acesso normal (ability api, ou '*' dos tokens antigos).
    Route::middleware(['auth:sanctum', 'ability:api'])->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);

        Route::post('auth/mfa/enroll', [MfaController::class, 'enroll']);
        Route::post('auth/mfa/confirm', [MfaController::class, 'confirm']);
        Route::delete('auth/mfa', [MfaController::class, 'disable']);

        Route::get('contexts', [ContextController::class, 'index']);
        Route::post('contexts', [ContextController::class, 'store']);

        Route::get('dashboard/consolidated', [DashboardController::class, 'consolidated']);

        Route::prefix('contexts/{context}')->middleware('can:view,context')->scopeBindings()->group(function () {
            Route::get('dashboard', [DashboardController::class, 'show']);

            Route::get('accounts', [AccountController::class, 'index']);
            Route::post('accounts', [AccountController::class, 'store']);
            Route::patch('accounts/{account}', [AccountController::class, 'update']);
            Route::delete('accounts/{account}', [AccountController::class, 'destroy']);

            Route::get('categories', [CategoryController::class, 'index']);
            Route::post('categories', [CategoryController::class, 'store']);
            Route::patch('categories/{category}', [CategoryController::class, 'update']);
            Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

            Route::get('bills', [BillController::class, 'index']);
            Route::post('bills', [BillController::class, 'store']);
            Route::patch('bills/{bill}', [BillController::class, 'update']);
            Route::delete('bills/{bill}', [BillController::class, 'destroy']);

            Route::get('transactions', [TransactionController::class, 'index']);
            Route::post('transactions', [TransactionController::class, 'store']);
            Route::delete('transactions/{transaction}', [TransactionController::class, 'destroy']);

            Route::get('credit-cards', [CreditCardController::class, 'index']);
            Route::post('credit-cards', [CreditCardController::class, 'store']);
            Route::patch('credit-cards/{creditCard}', [CreditCardController::class, 'update']);
            Route::delete('credit-cards/{creditCard}', [CreditCardController::class, 'destroy']);
            Route::get('credit-cards/{creditCard}/invoices', [CardInvoiceController::class, 'index']);
            Route::post('credit-cards/{creditCard}/invoices', [CardInvoiceController::class, 'store']);

            Route::get('investments', [InvestmentController::class, 'index']);
            Route::post('investments', [InvestmentController::class, 'store']);
            Route::patch('investments/{investment}', [InvestmentController::class, 'update']);
            Route::delete('investments/{investment}', [InvestmentController::class, 'destroy']);
            Route::get('investments/{investment}/contributions', [InvestmentContributionController::class, 'index']);
            Route::post('investments/{investment}/contributions', [InvestmentContributionController::class, 'store']);
        });
    });
});
