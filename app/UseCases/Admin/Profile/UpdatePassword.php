<?php

declare(strict_types=1);

namespace App\UseCases\Admin\Profile;

use App\Models\User;

/**
 * Troca a senha do próprio usuário autenticado.
 *
 * A conferência da senha atual acontece na validação do Livewire (regra
 * `current_password`, antes de chegar aqui) — este UseCase só grava a
 * senha nova, já em texto puro (o cast `hashed` do Model faz o resto).
 *
 * @package App\UseCases\Admin\Profile
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
final class UpdatePassword
{
    public function execute(User $user, string $password): void
    {
        $user->password = $password;
        $user->save();
    }
}
