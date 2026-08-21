<?php

declare(strict_types=1);

namespace App\UseCases\Auth;

use App\Domain\Auth\TotpCode;
use App\Models\User;

/**
 * Gera um novo secret de MFA para o usuário e devolve o que a tela de
 * configuração precisa (secret pra digitar à mão, URI pra virar QR code).
 * Não ativa o MFA — isso só acontece em {@see ConfirmMfa}, depois que o
 * usuário provar que configurou o app autenticador certo.
 *
 * Chamar de novo com um enrollment já confirmado reseta o MFA (troca o
 * secret, exige nova confirmação) — é o fluxo de "perdi o celular".
 *
 * @package App\UseCases\Auth
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class EnrollMfa
{
    /** @return array{secret: string, otpauth_uri: string} */
    public function execute(User $user): array
    {
        $secret = TotpCode::generateSecret();

        $user->forceFill(['mfa_secret' => $secret, 'mfa_confirmed_at' => null])->save();

        return [
            'secret' => $secret,
            'otpauth_uri' => TotpCode::otpauthUri($secret, $user->email, config('app.name')),
        ];
    }
}
