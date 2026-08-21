<?php

declare(strict_types=1);

namespace App\UseCases\Admin\Profile;

use App\Models\User;

/**
 * Atualiza nome e e-mail do próprio usuário autenticado.
 *
 * Não mexe em senha nem em avatar — são intenções separadas
 * ({@see UpdatePassword}, {@see UpdateAvatar}), cada uma com seu próprio
 * botão de salvar na tela de perfil.
 *
 * Pode falhar se o e-mail colidir com outro usuário (checagem de
 * unicidade acontece na validação do Livewire, antes de chegar aqui).
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
final class UpdateProfile
{
    /**
     * Persiste nome e e-mail novos.
     *
     * @param  array{name: string, email: string}  $data
     */
    public function execute(User $user, array $data): User
    {
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->save();

        return $user->refresh();
    }
}
