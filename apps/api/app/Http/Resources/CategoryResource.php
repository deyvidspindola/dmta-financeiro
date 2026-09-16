<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de uma {@see Category}.
 *
 * @mixin Category
 *
 * @package App\Http\Resources
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 16/09/2026
 */
final class CategoryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // @phpstan-ignore-next-line property.nonObject (cast CategoryType da migration)
            'type' => $this->type->value,
            'parent_id' => $this->parent_id,
            // `null` = categoria antiga, sem escolha explícita — o cliente
            // deriva cor/ícone por heurística do nome (ver migration).
            'color' => $this->color,
            'icon' => $this->icon,
        ];
    }
}
