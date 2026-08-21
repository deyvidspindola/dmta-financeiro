<?php

declare(strict_types=1);

namespace App\UseCases\Admin\User;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Remove um usuário do sistema.
 *
 * Exclusão permanente (sem soft delete). A regra "nunca apagar a si
 * mesmo" já foi barrada em App\Policies\UserPolicy antes deste caso de
 * uso ser chamado.
 *
 * Pode falhar se houver restrição de integridade referencial no banco.
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
final class DeleteUser
{
    /**
     * Apaga o registro.
     */
    public function execute(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $user->delete();
        });
    }
}
