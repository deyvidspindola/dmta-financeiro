<?php

declare(strict_types=1);

namespace App\Livewire\Admin;

use Illuminate\Contracts\View\View;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;
use Livewire\Component;
use TallStackUi\Traits\Interactions;

/**
 * Gestão de tokens de API pessoais do Sanctum (área /admin/tokens).
 *
 * Permite que o próprio usuário autenticado crie e revogue tokens de
 * acesso pessoal (Bearer), para uso em integrações externas — mobile,
 * outro serviço, um script. É o padrão de autenticação por token que o
 * app lumen-casa/backend usa para clientes de API; aqui ele fica
 * disponível dentro do backoffice de sessão, então qualquer app externo
 * pode reaproveitar `auth:sanctum` (ver rota GET /api/user) seguindo o
 * mesmo exemplo.
 *
 * Não gerencia scopes/abilities refinados neste template — o campo
 * "abilities" aceita uma string livre separada por vírgula e vira uma
 * lista simples. Não revoga tokens de outro usuário.
 *
 * @package App\Livewire\Admin
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 07/09/2026
 */
final class ApiTokens extends Component
{
    use Interactions;

    public string $name = '';

    public string $abilities = '';

    /** Token em texto puro, exibido uma única vez logo após a criação. */
    public ?string $plainTextToken = null;

    /**
     * Cria um novo token pessoal para o usuário autenticado.
     *
     * @throws ValidationException Nome do token não informado.
     */
    public function create(): void
    {
        $this->validate(['name' => ['required', 'string', 'max:255']]);

        $abilities = $this->abilities !== ''
            ? array_values(array_filter(array_map('trim', explode(',', $this->abilities))))
            : ['*'];

        $token = Auth::user()->createToken($this->name, $abilities);

        $this->plainTextToken = $token->plainTextToken;
        $this->reset(['name', 'abilities']);
    }

    /**
     * Abre o diálogo de confirmação antes de revogar.
     * Não apaga o token ainda.
     */
    public function confirmRevoke(int $tokenId): void
    {
        $this->dialog()
            ->question(__('admin.tokens.revoke_title'), __('admin.tokens.revoke_message'))
            ->confirm(__('admin.tokens.revoke_confirm'), 'revoke', $tokenId)
            ->cancel(__('admin.tokens.revoke_cancel'))
            ->send();
    }

    /**
     * Revoga (apaga) um token do usuário autenticado.
     */
    public function revoke(int $tokenId): void
    {
        Auth::user()->tokens()->whereKey($tokenId)->delete();
        $this->dialog()
            ->success(__('ui.dialog.success'), __('admin.tokens.revoked'))
            ->send();
    }

    public function render(): View
    {
        $heading = __('admin.tokens.heading');

        return view('admin.api-tokens', [
            /** @var Collection<int, PersonalAccessToken> $tokens */
            'tokens' => Auth::user()->tokens()->latest()->get(),
        ])->layout('layouts.admin', [
            'title' => $heading,
            'heading' => $heading,
        ]);
    }
}
