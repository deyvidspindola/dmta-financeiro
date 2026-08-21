<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Context;
use App\Models\User;

/**
 * Autorização de um {@see Context}: só o dono pode ver ou operar dentro
 * dele. Não existe compartilhamento de contexto entre usuários (D-11 —
 * uso pessoal, sem multiusuário).
 *
 * @package App\Policies
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class ContextPolicy
{
    public function view(User $user, Context $context): bool
    {
        return $context->user_id === $user->id;
    }

    public function update(User $user, Context $context): bool
    {
        return $this->view($user, $context);
    }
}
