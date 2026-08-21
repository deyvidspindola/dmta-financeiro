<?php

declare(strict_types=1);

namespace App\UseCases\Admin\User;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Lista usuários paginados, com busca opcional por nome ou e-mail.
 *
 * Só monta e executa a query — não decide autorização (isso é da
 * Policy, chamada pelo Livewire antes) nem formata a resposta.
 *
 * Não deveria falhar em uso normal; uma página fora do intervalo
 * simplesmente volta uma coleção vazia (comportamento do paginator).
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
final class ListUsers
{
    /** Registros por página. */
    private const PER_PAGE = 15;

    /**
     * Executa a listagem.
     *
     * @param  string  $search  Termo de busca (nome ou e-mail). Vazio = sem filtro.
     * @param  string  $sortColumn  Coluna de ordenação (name ou email).
     * @param  string  $sortDirection  'asc' ou 'desc'.
     * @return LengthAwarePaginator<int, User>
     */
    public function execute(string $search, string $sortColumn, string $sortDirection): LengthAwarePaginator
    {
        $column = in_array($sortColumn, ['name', 'email', 'last_login_at'], true) ? $sortColumn : 'name';
        $direction = $sortDirection === 'desc' ? 'desc' : 'asc';

        return User::query()
            ->when($search !== '', fn ($query) => $query->search($search))
            ->orderBy($column, $direction)
            ->paginate(self::PER_PAGE);
    }
}
