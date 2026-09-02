<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ResetAccountDataRequest;
use App\Http\Resources\ContextResource;
use App\UseCases\User\ResetUserData;

/**
 * `POST /api/v1/account/reset` — apaga todo o dado financeiro do usuário
 * autenticado e recria um contexto PF limpo. A conta de acesso é
 * preservada. Ver {@see ResetUserData}.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final class ResetAccountDataController extends Controller
{
    public function __invoke(ResetAccountDataRequest $request, ResetUserData $useCase): ContextResource
    {
        $context = $useCase->execute($request->user());

        return new ContextResource($context);
    }
}
