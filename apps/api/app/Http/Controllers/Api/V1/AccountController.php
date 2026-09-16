<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterAccountData;
use App\DTOs\UpdateAccountData;
use App\Enums\AccountType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreAccountRequest;
use App\Http\Requests\Api\UpdateAccountRequest;
use App\Http\Resources\AccountResource;
use App\Models\Account;
use App\Models\Context;
use App\Services\HistoricalBalanceService;
use App\UseCases\Account\RegisterAccount;
use App\UseCases\Account\UpdateAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

/**
 * Contas bancárias de cadastro manual (F0), sempre dentro de um contexto.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.2.0
 *
 * @since   21/08/2026
 *
 * @updated 15/09/2026
 */
final class AccountController extends Controller
{
    /**
     * `?month=YYYY-MM` opcional — quando aponta pra um mês já fechado, cada
     * conta volta com o saldo **como estava** no fim daquele mês (replay via
     * {@see HistoricalBalanceService::perAccountAsOf}), pro passador de mês
     * da tela de Contas. Mês corrente/futuro (ou sem o param) devolve o
     * `balance` de agora, igual antes.
     *
     * Retorna também `meta.totals` com `current_balance` (soma dos saldos) e
     * `projected_balance` (saldo + lançamentos pending do contexto).
     */
    public function index(Context $context, Request $request, HistoricalBalanceService $history): AnonymousResourceCollection
    {
        $accounts = $context->accounts()->get();
        $month = $request->query('month');

        if (is_string($month) && $month !== '') {
            $monthEnd = Carbon::createFromFormat('Y-m-d', $month.'-01')->endOfMonth();

            if ($monthEnd->lt(Carbon::now()->startOfMonth())) {
                $balances = $history->perAccountAsOf($context, $monthEnd);
                $accounts->each(function (Account $account) use ($balances): void {
                    $account->setAttribute('balance', $balances[$account->id] ?? 0.0);
                });
            }
        }

        $currentBalance = (float) $accounts->sum('balance');
        $projectedBalance = $history->projected($context, $currentBalance);

        return AccountResource::collection($accounts)->additional([
            'meta' => [
                'totals' => [
                    'current_balance' => (float) $currentBalance,
                    'projected_balance' => (float) $projectedBalance,
                ],
            ],
        ]);
    }

    /** Uma conta do contexto. `scopeBindings` garante 404 para conta de outro contexto. */
    public function show(Context $context, Account $account): AccountResource
    {
        return new AccountResource($account);
    }

    public function store(StoreAccountRequest $request, Context $context, RegisterAccount $useCase): AccountResource
    {
        $account = $useCase->execute(new RegisterAccountData(
            contextId: $context->id,
            name: $request->string('name')->toString(),
            institution: $request->input('institution'),
            initialBalance: (float) $request->input('initial_balance', 0),
            type: AccountType::from($request->string('type', AccountType::Checking->value)->toString()),
            includeInDashboard: (bool) $request->input('include_in_dashboard', true),
        ));

        return new AccountResource($account);
    }

    public function update(UpdateAccountRequest $request, Context $context, Account $account, UpdateAccount $useCase): AccountResource
    {
        $updated = $useCase->execute($account, new UpdateAccountData(
            name: $request->string('name')->toString(),
            // @phpstan-ignore-next-line property.nonObject (cast AccountType da migration, confirmado em runtime)
            type: AccountType::from($request->string('type', $account->type->value)->toString()),
            institution: $request->input('institution'),
            includeInDashboard: $request->has('include_in_dashboard') ? (bool) $request->input('include_in_dashboard') : null,
        ));

        return new AccountResource($updated);
    }

    /** Apaga a conta e, em cascata (FK), todo lançamento dela — sem confirmação extra nesta fase. */
    public function destroy(Context $context, Account $account): JsonResponse
    {
        $account->delete();

        return response()->json(status: 204);
    }
}
