<?php

declare(strict_types=1);

namespace App\UseCases\Auth;

use App\Domain\Auth\TotpCode;
use App\Exceptions\Domain\InvalidMfaCodeException;
use App\Exceptions\Domain\MfaNotEnrolledException;
use App\Models\User;

/**
 * Confirma o enrollment de MFA: só depois desta chamada o login passa a
 * exigir o segundo fator ({@see User::hasMfaEnabled()}).
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
final class ConfirmMfa
{
    /**
     * @throws MfaNotEnrolledException Se não houver `EnrollMfa` chamado antes.
     * @throws InvalidMfaCodeException Se o código não bater com o secret pendente.
     */
    public function execute(User $user, string $code): void
    {
        if ($user->mfa_secret === null) {
            throw new MfaNotEnrolledException;
        }

        if (! TotpCode::verify($user->mfa_secret, $code)) {
            throw new InvalidMfaCodeException;
        }

        $user->forceFill(['mfa_confirmed_at' => now()])->save();
    }
}
