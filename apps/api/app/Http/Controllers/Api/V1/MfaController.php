<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\MfaCodeRequest;
use App\Http\Requests\Api\VerifyMfaRequest;
use App\UseCases\Auth\ConfirmMfa;
use App\UseCases\Auth\DisableMfa;
use App\UseCases\Auth\EnrollMfa;
use App\UseCases\Auth\VerifyMfaChallenge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Configuração e verificação de MFA por app autenticador (D-10). `enroll`,
 * `confirm` e `disable` exigem sessão já autenticada (token com ability
 * `api`); `verify` é o único que aceita o token "pendente" emitido pelo
 * login — ver `routes/api.php` para a diferença de middleware entre eles.
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
final class MfaController extends Controller
{
    public function enroll(Request $request, EnrollMfa $useCase): JsonResponse
    {
        return response()->json($useCase->execute($request->user()));
    }

    public function confirm(MfaCodeRequest $request, ConfirmMfa $useCase): JsonResponse
    {
        $useCase->execute($request->user(), $request->string('code')->toString());

        return response()->json(['mfa_enabled' => true]);
    }

    public function disable(Request $request, DisableMfa $useCase): JsonResponse
    {
        $useCase->execute($request->user());

        return response()->json(status: 204);
    }

    /**
     * Troca o token pendente por um de verdade e revoga o pendente — ele
     * já cumpriu o papel dele, não faz sentido continuar existindo.
     */
    public function verify(VerifyMfaRequest $request, VerifyMfaChallenge $useCase): JsonResponse
    {
        $token = $useCase->execute(
            $request->user(),
            $request->string('code')->toString(),
            $request->string('device_name')->toString(),
        );

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ],
        ]);
    }
}
