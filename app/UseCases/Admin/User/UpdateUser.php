<?php

declare(strict_types=1);

namespace App\UseCases\Admin\User;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Atualiza um usuário existente na área /admin.
 *
 * Altera nome e e-mail; senha só se vier preenchida. Não invalida
 * sessões nem envia e-mail de aviso.
 *
 * Pode falhar se o e-mail colidir com outro usuário (a checagem de
 * unicidade acontece na validação do Livewire, antes de chegar aqui).
 *
 * @package App\UseCases\Admin\User
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
final class UpdateUser
{
    /**
     * Persiste as alterações.
     *
     * @param  array{name: string, email: string, password?: string|null}  $data
     */
    public function execute(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data): User {
            $user->name = $data['name'];
            $user->email = $data['email'];

            if (filled($data['password'] ?? null)) {
                $user->password = $data['password'];
            }

            $user->save();

            return $user->refresh();
        });
    }
}
