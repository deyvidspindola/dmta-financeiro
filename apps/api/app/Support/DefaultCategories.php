<?php

declare(strict_types=1);

namespace App\Support;

use App\Enums\CategoryType;

/**
 * Conjunto fixo de categorias com que todo contexto novo já nasce —
 * evita a tela de categorias vazia no primeiro uso (pedido do dono,
 * 22/09/2026). Cor e ícone usam a mesma paleta `CATEGORY_COLORS` e os
 * mesmos nomes Feather do seletor manual em `apps/app` e `apps/web`, pra
 * renderizar igual nos dois clientes sem mapeamento extra.
 *
 * @package App\Support
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/09/2026
 */
final class DefaultCategories
{
    /**
     * @return list<array{name: string, type: CategoryType, color: string, icon: string}>
     */
    public static function list(): array
    {
        return [
            ['name' => 'Alimentação', 'type' => CategoryType::Expense, 'color' => '#10b981', 'icon' => 'shopping-cart'],
            ['name' => 'Moradia', 'type' => CategoryType::Expense, 'color' => '#3b82f6', 'icon' => 'home'],
            ['name' => 'Transporte', 'type' => CategoryType::Expense, 'color' => '#8b5cf6', 'icon' => 'truck'],
            ['name' => 'Saúde', 'type' => CategoryType::Expense, 'color' => '#ec4899', 'icon' => 'heart'],
            ['name' => 'Educação', 'type' => CategoryType::Expense, 'color' => '#f97316', 'icon' => 'book-open'],
            ['name' => 'Lazer', 'type' => CategoryType::Expense, 'color' => '#eab308', 'icon' => 'umbrella'],
            ['name' => 'Assinaturas', 'type' => CategoryType::Expense, 'color' => '#14b8a6', 'icon' => 'refresh-cw'],
            ['name' => 'Compras', 'type' => CategoryType::Expense, 'color' => '#6366f1', 'icon' => 'shopping-bag'],
            ['name' => 'Contas e serviços', 'type' => CategoryType::Expense, 'color' => '#ef4444', 'icon' => 'zap'],
            ['name' => 'Salário', 'type' => CategoryType::Income, 'color' => '#06b6d4', 'icon' => 'dollar-sign'],
            ['name' => 'Freelance', 'type' => CategoryType::Income, 'color' => '#84cc16', 'icon' => 'briefcase'],
            ['name' => 'Investimentos', 'type' => CategoryType::Income, 'color' => '#a855f7', 'icon' => 'trending-up'],
            ['name' => 'Outras receitas', 'type' => CategoryType::Income, 'color' => '#ec4899', 'icon' => 'tag'],
        ];
    }
}
