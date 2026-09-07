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
use App\UseCases\Account\RegisterAccount;
use App\UseCases\Account\UpdateAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contas bancárias de cadastro manual (F0), sempre dentro de um contexto.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 07/09/2026
 */
final class AccountController extends Controller
{
    public function index(Context $context): AnonymousResourceCollection
    {
        return AccountResource::collection($context->accounts()->get());
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
