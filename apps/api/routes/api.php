<?php

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BillCaptureController;
use App\Http\Controllers\Api\V1\BillController;
use App\Http\Controllers\Api\V1\BillImportController;
use App\Http\Controllers\Api\V1\BoletoPasswordRuleController;
use App\Http\Controllers\Api\V1\BudgetController;
use App\Http\Controllers\Api\V1\CardInvoiceController;
use App\Http\Controllers\Api\V1\CardInvoiceImportController;
use App\Http\Controllers\Api\V1\CardPurchaseController;
use App\Http\Controllers\Api\V1\CashFlowController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ConsolidatedController;
use App\Http\Controllers\Api\V1\ContextController;
use App\Http\Controllers\Api\V1\CreditCardController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DebtController;
use App\Http\Controllers\Api\V1\GoalController;
use App\Http\Controllers\Api\V1\IntegrationSettingsController;
use App\Http\Controllers\Api\V1\InvestmentContributionController;
use App\Http\Controllers\Api\V1\InvestmentController;
use App\Http\Controllers\Api\V1\MfaController;
use App\Http\Controllers\Api\V1\MoveTransactionController;
use App\Http\Controllers\Api\V1\NotificationCaptureController;
use App\Http\Controllers\Api\V1\PayBillController;
use App\Http\Controllers\Api\V1\PayCardInvoiceController;
use App\Http\Controllers\Api\V1\PollBillCapturesController;
use App\Http\Controllers\Api\V1\RecurringBillController;
use App\Http\Controllers\Api\V1\RecurringTransactionController;
use App\Http\Controllers\Api\V1\ResetAccountDataController;
use App\Http\Controllers\Api\V1\SimulationController;
use App\Http\Controllers\Api\V1\StatementImportController;
use App\Http\Controllers\Api\V1\TelegramWebhookController;
use App\Http\Controllers\Api\V1\TransactionController;
use App\Http\Controllers\Api\V1\TransferController;
use App\Http\Controllers\Api\V1\UnlockBillCaptureController;
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

    // Público de propósito — o Telegram não carrega token Sanctum nosso.
    // Protegido pelo secret_token do webhook (ver TelegramWebhookController).
    Route::post('webhooks/telegram', [TelegramWebhookController::class, 'store']);

    // Token "pendente" do login com MFA (ability mfa-pending) só entra
    // aqui — não abre nenhuma outra rota da API. Ver IssueApiToken.
    Route::middleware(['auth:sanctum', 'ability:mfa-pending'])->group(function () {
        Route::post('auth/mfa/verify', [MfaController::class, 'verify']);
    });

    // Token de acesso normal (ability api, ou '*' dos tokens antigos).
    Route::middleware(['auth:sanctum', 'ability:api'])->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);

        // Apaga todo o dado financeiro do usuário e recria um contexto PF
        // limpo — "começar do zero" da tela de segurança. Exige a senha
        // atual (ResetAccountDataRequest). Ver App\UseCases\User\ResetUserData.
        Route::post('account/reset', ResetAccountDataController::class);

        Route::post('auth/mfa/enroll', [MfaController::class, 'enroll']);
        Route::post('auth/mfa/confirm', [MfaController::class, 'confirm']);
        Route::delete('auth/mfa', [MfaController::class, 'disable']);

        Route::get('contexts', [ContextController::class, 'index']);
        Route::post('contexts', [ContextController::class, 'store']);

        Route::get('dashboard/consolidated', [DashboardController::class, 'consolidated']);
        Route::get('dashboard/consolidated/evolution', [DashboardController::class, 'consolidatedEvolution']);

        // Visão consolidada de listagem (não só totais do dashboard) —
        // fora do grupo /contexts/{context} de propósito, já que junta
        // todos os contextos do usuário.
        Route::get('consolidated/accounts', [ConsolidatedController::class, 'accounts']);
        Route::get('consolidated/transactions', [ConsolidatedController::class, 'transactions']);
        Route::get('consolidated/bills', [ConsolidatedController::class, 'bills']);
        Route::get('consolidated/credit-cards', [ConsolidatedController::class, 'creditCards']);

        // Fila de captura por e-mail (F1, D-06) — sem contexto até
        // confirmar, por isso fora do grupo /contexts/{context} abaixo.
        Route::get('bill-captures', [BillCaptureController::class, 'index']);
        Route::post('bill-captures/poll', [PollBillCapturesController::class, 'store']);
        Route::post('bill-captures/{capture}/confirm', [BillCaptureController::class, 'confirm']);
        Route::post('bill-captures/{capture}/reject', [BillCaptureController::class, 'reject']);
        Route::delete('bill-captures/{capture}', [BillCaptureController::class, 'destroy']);
        // Boleto com PDF protegido por senha (DT-07) — resolve manualmente
        // uma pendência password_required, e o cadastro das regras que
        // tentam abrir sozinho da próxima vez.
        Route::post('bill-captures/{capture}/unlock', [UnlockBillCaptureController::class, 'store']);
        Route::get('boleto-password-rules', [BoletoPasswordRuleController::class, 'index']);
        Route::post('boleto-password-rules', [BoletoPasswordRuleController::class, 'store']);
        Route::delete('boleto-password-rules/{boletoPasswordRule}', [BoletoPasswordRuleController::class, 'destroy']);

        // Configuração das integrações da F1 (Telegram, caixa IMAP de
        // boletos) por tela — recurso global, sem contexto. Segredo sai
        // só como booleano "configurado".
        Route::get('integrations', [IntegrationSettingsController::class, 'show']);
        Route::put('integrations', [IntegrationSettingsController::class, 'update']);
        Route::post('integrations/telegram/test', [IntegrationSettingsController::class, 'testTelegram']);
        Route::post('integrations/telegram/webhook', [IntegrationSettingsController::class, 'registerTelegramWebhook']);
        Route::get('integrations/telegram/webhook-info', [IntegrationSettingsController::class, 'telegramWebhookInfo']);
        Route::get('integrations/telegram/events', [IntegrationSettingsController::class, 'telegramEvents']);
        Route::post('integrations/boleto-mailbox/test', [IntegrationSettingsController::class, 'testBoletoMailbox']);

        // Inbox de notificações de banco/carteira lidas pelo app Android —
        // sem contexto até salvar (o app escolhe PF/PJ), por isso fora do
        // grupo /contexts/{context} abaixo.
        Route::get('notification-captures', [NotificationCaptureController::class, 'index']);
        Route::post('notification-captures', [NotificationCaptureController::class, 'ingest']);
        Route::post('notification-captures/{capture}/save', [NotificationCaptureController::class, 'save']);
        Route::post('notification-captures/{capture}/ignore', [NotificationCaptureController::class, 'ignore']);

        Route::prefix('contexts/{context}')->middleware('can:view,context')->scopeBindings()->group(function () {
            Route::get('dashboard', [DashboardController::class, 'show']);
            Route::get('dashboard/evolution', [DashboardController::class, 'evolution']);

            Route::get('accounts', [AccountController::class, 'index']);
            Route::get('accounts/{account}', [AccountController::class, 'show']);
            Route::post('accounts', [AccountController::class, 'store']);
            Route::patch('accounts/{account}', [AccountController::class, 'update']);
            Route::delete('accounts/{account}', [AccountController::class, 'destroy']);
            Route::get('accounts/{account}/statement-imports/template', [StatementImportController::class, 'template']);
            Route::post('accounts/{account}/statement-imports/preview', [StatementImportController::class, 'preview']);
            Route::post('accounts/{account}/statement-imports', [StatementImportController::class, 'store']);

            Route::get('categories', [CategoryController::class, 'index']);
            Route::post('categories', [CategoryController::class, 'store']);
            Route::patch('categories/{category}', [CategoryController::class, 'update']);
            Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

            Route::get('bills', [BillController::class, 'index']);
            Route::post('bills', [BillController::class, 'store']);
            Route::patch('bills/{bill}', [BillController::class, 'update']);
            Route::delete('bills/{bill}', [BillController::class, 'destroy']);
            Route::post('bills/{bill}/pay', [PayBillController::class, 'store']);
            Route::get('bills/import/template', [BillImportController::class, 'template']);
            Route::post('bills/import/preview', [BillImportController::class, 'preview']);
            Route::post('bills/import', [BillImportController::class, 'store']);

            Route::get('debts', [DebtController::class, 'index']);
            Route::post('debts', [DebtController::class, 'store']);
            Route::patch('debts/{debt}', [DebtController::class, 'update']);
            Route::post('debts/{debt}/settle', [DebtController::class, 'settle']);
            Route::delete('debts/{debt}', [DebtController::class, 'destroy']);

            Route::get('goals', [GoalController::class, 'index']);
            Route::post('goals', [GoalController::class, 'store']);
            Route::patch('goals/{goal}', [GoalController::class, 'update']);
            Route::delete('goals/{goal}', [GoalController::class, 'destroy']);

            Route::get('budgets', [BudgetController::class, 'index']);
            Route::get('budgets/{budget}', [BudgetController::class, 'show']);
            Route::post('budgets', [BudgetController::class, 'store']);
            Route::patch('budgets/{budget}', [BudgetController::class, 'update']);
            Route::delete('budgets/{budget}', [BudgetController::class, 'destroy']);

            Route::post('simulations/installment-purchase', [SimulationController::class, 'installmentPurchase']);
            Route::get('cash-flow', [CashFlowController::class, 'show']);

            Route::get('transactions', [TransactionController::class, 'index']);
            Route::post('transactions', [TransactionController::class, 'store']);
            Route::get('transactions/{transaction}', [TransactionController::class, 'show']);
            Route::patch('transactions/{transaction}', [TransactionController::class, 'update']);
            Route::delete('transactions/{transaction}', [TransactionController::class, 'destroy']);
            Route::post('transactions/{transaction}/settle', [TransactionController::class, 'settle']);
            Route::post('transactions/{transaction}/move', [MoveTransactionController::class, 'store']);

            Route::post('transfers', [TransferController::class, 'store']);

            Route::get('recurring-transactions', [RecurringTransactionController::class, 'index']);
            Route::post('recurring-transactions', [RecurringTransactionController::class, 'store']);
            Route::delete('recurring-transactions/{recurringTransaction}', [RecurringTransactionController::class, 'destroy']);

            Route::get('recurring-bills', [RecurringBillController::class, 'index']);
            Route::post('recurring-bills', [RecurringBillController::class, 'store']);
            Route::delete('recurring-bills/{recurringBill}', [RecurringBillController::class, 'destroy']);

            Route::get('credit-cards', [CreditCardController::class, 'index']);
            Route::post('credit-cards', [CreditCardController::class, 'store']);
            Route::patch('credit-cards/{creditCard}', [CreditCardController::class, 'update']);
            Route::delete('credit-cards/{creditCard}', [CreditCardController::class, 'destroy']);
            Route::get('credit-cards/{creditCard}/invoices', [CardInvoiceController::class, 'index']);
            Route::post('credit-cards/{creditCard}/invoices', [CardInvoiceController::class, 'store']);
            Route::post('credit-cards/{creditCard}/invoices/{invoice}/pay', PayCardInvoiceController::class);
            Route::get('credit-cards/{creditCard}/purchases', [CardPurchaseController::class, 'index']);
            Route::post('credit-cards/{creditCard}/purchases', [CardPurchaseController::class, 'store']);
            Route::patch('credit-cards/{creditCard}/purchases/{purchase}', [CardPurchaseController::class, 'update']);
            Route::delete('credit-cards/{creditCard}/purchases/{purchase}', [CardPurchaseController::class, 'destroy']);
            Route::get('credit-cards/{creditCard}/invoice-import/template', [CardInvoiceImportController::class, 'template']);
            Route::post('credit-cards/{creditCard}/invoice-import/preview', [CardInvoiceImportController::class, 'preview']);
            Route::post('credit-cards/{creditCard}/invoice-import', [CardInvoiceImportController::class, 'store']);

            Route::get('investments', [InvestmentController::class, 'index']);
            Route::post('investments', [InvestmentController::class, 'store']);
            Route::patch('investments/{investment}', [InvestmentController::class, 'update']);
            Route::delete('investments/{investment}', [InvestmentController::class, 'destroy']);
            Route::get('investments/{investment}/contributions', [InvestmentContributionController::class, 'index']);
            Route::post('investments/{investment}/contributions', [InvestmentContributionController::class, 'store']);
        });
    });
});
