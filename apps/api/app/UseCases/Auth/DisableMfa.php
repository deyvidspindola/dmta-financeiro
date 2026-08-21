<?php

declare(strict_types=1);

namespace App\UseCases\Auth;

use App\Models\User;

/**
 * Desliga o MFA — limpa o secret e a confirmação. Login volta a pedir só
 * e-mail/senha. Sem confirmação extra por senha nesta fase (D-11: uso
 * pessoal); se isto virar produto multiusuário um dia, exigir senha
 * aqui antes de desligar é o primeiro endurecimento a fazer.
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
final class DisableMfa
{
    public function execute(User $user): void
    {
        $user->forceFill(['mfa_secret' => null, 'mfa_confirmed_at' => null])->save();
    }
}
