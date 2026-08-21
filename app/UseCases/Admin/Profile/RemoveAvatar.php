<?php

declare(strict_types=1);

namespace App\UseCases\Admin\Profile;

use App\Models\User;
use Illuminate\Support\Facades\Storage;

/**
 * Remove a foto de perfil do usuário autenticado, voltando ao avatar
 * de iniciais ({@see User::initial()}).
 *
 * Não falha se o usuário já não tinha foto — só não faz nada.
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
final class RemoveAvatar
{
    public function execute(User $user): void
    {
        if (! $user->avatar_path) {
            return;
        }

        Storage::disk('public')->delete($user->avatar_path);

        $user->avatar_path = null;
        $user->save();
    }
}
