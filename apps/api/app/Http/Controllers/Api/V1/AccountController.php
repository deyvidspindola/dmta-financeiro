<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterAccountData;
use App\Http\Controllers\Api\V1\Concerns\AuthorizesContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreAccountRequest;
use App\Http\Resources\AccountResource;
use App\Models\Context;
use App\UseCases\Account\RegisterAccount;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contas bancárias de cadastro manual (F0), sempre dentro de um contexto.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class AccountController extends Controller
{
    use AuthorizesContext;

    public function index(Context $context): AnonymousResourceCollection
    {
        $this->assertOwnsContext($context);

        return AccountResource::collection($context->accounts()->get());
    }

    public function store(StoreAccountRequest $request, Context $context, RegisterAccount $useCase): AccountResource
    {
        $this->assertOwnsContext($context);

        $account = $useCase->execute(new RegisterAccountData(
            contextId: $context->id,
            name: $request->string('name')->toString(),
            institution: $request->input('institution'),
            initialBalance: (float) $request->input('initial_balance', 0),
        ));

        return new AccountResource($account);
    }
}
