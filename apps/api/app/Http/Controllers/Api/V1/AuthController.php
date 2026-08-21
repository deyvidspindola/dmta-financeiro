<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LoginRequest;
use App\UseCases\Auth\IssueApiToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Login/logout de API para o app web e mobile (D-09), via token Sanctum.
 * Não tem relação com a sessão do `/admin` (Livewire) — guards separados.
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
final class AuthController extends Controller
{
    /**
     * Se o usuário tem MFA (D-10), devolve `mfa_required: true` +
     * `mfa_token` — o front chama `POST /auth/mfa/verify` com esse token
     * e o código do app autenticador para receber o token de acesso de
     * verdade. Sem MFA, devolve o token direto, como antes.
     */
    public function login(LoginRequest $request, IssueApiToken $useCase): JsonResponse
    {
        $result = $useCase->execute(
            $request->string('email')->toString(),
            $request->string('password')->toString(),
            $request->string('device_name')->toString(),
        );

        if ($result['mfaRequired']) {
            return response()->json(['mfa_required' => true, 'mfa_token' => $result['mfaToken']]);
        }

        return response()->json([
            'mfa_required' => false,
            'token' => $result['token'],
            'user' => [
                'id' => $result['user']->id,
                'name' => $result['user']->name,
                'email' => $result['user']->email,
            ],
        ], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(status: 204);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'id' => $request->user()->id,
            'name' => $request->user()->name,
            'email' => $request->user()->email,
            'mfa_enabled' => $request->user()->hasMfaEnabled(),
        ]);
    }
}
