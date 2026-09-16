<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CategoryType;
use Database\Factories\CategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['context_id', 'parent_id', 'name', 'type', 'color', 'icon'])]
/**
 * Categoria ou subcategoria (D-12) — a mesma tabela serve os dois papéis
 * via `parent_id`. Categoria raiz tem `parent_id` nulo. `type` separa
 * despesa de receita — uma subcategoria sempre tem o mesmo tipo da mãe.
 * `color`/`icon` são nullable: escolha explícita do usuário (reforma
 * Mobills, D-19) sobrepõe a heurística por nome que o cliente já usava.
 *
 * @property-read CategoryType $type
 * @property-read string|null $color
 * @property-read string|null $icon
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 16/09/2026
 */
class Category extends Model
{
    /** @use HasFactory<CategoryFactory> */
    use HasFactory;

    /** @return BelongsTo<Context, $this> */
    public function context(): BelongsTo
    {
        return $this->belongsTo(Context::class);
    }

    /** @return BelongsTo<Category, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /** @return HasMany<Category, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    /** Se esta é uma categoria raiz (sem categoria-mãe). */
    public function isRoot(): bool
    {
        return $this->parent_id === null;
    }

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => CategoryType::class,
        ];
    }
}
