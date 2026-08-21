<?php

declare(strict_types=1);

namespace App\UseCases\Admin\User;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Cria um usuário do sistema na área /admin.
 *
 * Exemplo canônico de UseCase de escrita: Livewire valida e autoriza,
 * este caso de uso só persiste. Não envia convite nem notifica o novo
 * usuário — isso seria um Job/Notification separado se o projeto
 * derivado precisar.
 *
 * Pode falhar se o e-mail já existir (unique) ou a transação abortar.
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
final class CreateUser
{
    /**
     * Grava o usuário.
     *
     * @param  array{name: string, email: string, password: string}  $data
     */
    public function execute(array $data): User
    {
        return DB::transaction(function () use ($data): User {
            return User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);
        });
    }
}
