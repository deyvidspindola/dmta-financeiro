<?php

declare(strict_types=1);

namespace App\UseCases\Auth;

use App\Domain\Auth\TotpCode;
use App\Exceptions\Domain\InvalidMfaCodeException;
use App\Exceptions\Domain\MfaNotEnrolledException;
use App\Models\User;

/**
 * Segundo passo do login (D-10): troca um código TOTP válido por um
 * token de API de verdade. Só é chamado com um token "pendente" já
 * autenticado (ability `mfa-pending`, emitido por {@see IssueApiToken})
 * — quem chama (Controller) é responsável por revogar esse token
 * pendente depois, aqui só emitimos o novo.
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
final class VerifyMfaChallenge
{
    /**
     * @throws MfaNotEnrolledException Se o usuário não tiver MFA confirmado.
     * @throws InvalidMfaCodeException Se o código não bater.
     */
    public function execute(User $user, string $code, string $deviceName): string
    {
        if (! $user->hasMfaEnabled() || $user->mfa_secret === null) {
            throw new MfaNotEnrolledException;
        }

        if (! TotpCode::verify($user->mfa_secret, $code)) {
            throw new InvalidMfaCodeException;
        }

        return $user->createToken($deviceName)->plainTextToken;
    }
}
