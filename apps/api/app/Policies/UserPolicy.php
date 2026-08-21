<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

/**
 * Autorização do CRUD de usuários na área /admin.
 *
 * Este template não tem papéis (roles) — qualquer usuário autenticado
 * é "admin" por definição de acessar /admin. Quando o projeto derivado
 * precisar de papéis, adicione um Enum + a checagem aqui (Gate/Policy
 * nativo, nunca spatie/laravel-permission).
 *
 * A única regra de negócio real hoje é: ninguém apaga a si mesmo.
 *
 * @package App\Policies
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
final class UserPolicy
{
    /** Lista de usuários. */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /** Visualização de um usuário. */
    public function view(User $user, User $model): bool
    {
        return true;
    }

    /** Criação de usuário. */
    public function create(User $user): bool
    {
        return true;
    }

    /** Atualização de usuário. */
    public function update(User $user, User $model): bool
    {
        return true;
    }

    /** Exclusão de usuário (nunca a si mesmo). */
    public function delete(User $user, User $model): bool
    {
        return $user->isNot($model);
    }
}
