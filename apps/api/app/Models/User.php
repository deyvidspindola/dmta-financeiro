<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'avatar_path'])]
#[Hidden(['password', 'remember_token'])]
/**
 * Usuário autenticável do sistema (área /admin).
 *
 * Autentica por sessão no `/admin` e pode gerar tokens pessoais do Sanctum
 * (ver App\Livewire\Admin\ApiTokens) para acesso de API por aplicações
 * externas. Não concentra regra de negócio — apenas identidade, casts
 * e relações. Papéis/permissões não existem neste template base; quando
 * o projeto derivado precisar, adicione via Gate/Policy nativo (nunca
 * spatie/laravel-permission).
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** @return HasMany<Context, $this> */
    public function contexts(): HasMany
    {
        return $this->hasMany(Context::class);
    }

    /**
     * Filtra por trecho de nome ou e-mail.
     *
     * Não ordena nem pagina — só restringe o conjunto de resultados.
     */
    public function scopeSearch(Builder $query, string $term): void
    {
        $like = '%'.$term.'%';

        $query->where(function (Builder $inner) use ($like): void {
            $inner->where('name', 'like', $like)
                ->orWhere('email', 'like', $like);
        });
    }

    /**
     * URL pública da foto de perfil, ou `null` se o usuário não tem uma.
     *
     * Quem exibe o avatar decide o que fazer com `null` (normalmente cai
     * para {@see initial()}) — este método nunca devolve um placeholder.
     */
    public function avatarUrl(): ?string
    {
        return $this->avatar_path ? Storage::disk('public')->url($this->avatar_path) : null;
    }

    /**
     * Primeira letra do nome, maiúscula — usada como avatar de fallback
     * (sidebar, topbar) quando não há foto de perfil.
     */
    public function initial(): string
    {
        return mb_strtoupper(mb_substr($this->name, 0, 1));
    }

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
        ];
    }
}
