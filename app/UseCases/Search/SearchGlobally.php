<?php

declare(strict_types=1);

namespace App\UseCases\Search;

use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Busca global do command palette (Ctrl+K), acionado pelo topbar da
 * área /admin.
 *
 * Este template só tem usuários pra buscar — é o exemplo canônico de
 * como alimentar o `<x-command-palette>` do TallStackUI. Quando o
 * projeto derivado ganhar mais entidades pesquisáveis (produtos,
 * pedidos, etc.), junte os resultados aqui: cada item só precisa de
 * `label`, `value` (a URL de destino) e, opcionalmente, `description`.
 *
 * O `value` já é a URL completa de destino — {@see
 * HandleCommandPaletteSelection} só redireciona pra ele, sem precisar
 * saber que tipo de entidade foi selecionada.
 *
 * @package App\UseCases\Search
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
final class SearchGlobally
{
    /**
     * @return Collection<int, array{label: string, description: string, value: string}>
     */
    public function execute(string $term): Collection
    {
        if (blank($term)) {
            return collect();
        }

        return User::query()
            ->search($term)
            ->limit(8)
            ->get()
            ->map(fn (User $user): array => [
                'label' => $user->name,
                'description' => $user->email,
                'value' => route('admin.users.edit', $user),
            ])
            ->values();
    }
}
