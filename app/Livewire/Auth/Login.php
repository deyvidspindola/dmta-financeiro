<?php

declare(strict_types=1);

namespace App\Livewire\Auth;

use App\Http\Requests\Auth\LoginRequest;
use App\UseCases\Auth\LoginUser;
use Illuminate\Contracts\View\View;
use Illuminate\Validation\ValidationException;
use Livewire\Component;

/**
 * Formulário de login da área /admin.
 *
 * Localiza os dados do formulário, valida com as mesmas regras de
 * LoginRequest, delega a autenticação a LoginUser e redireciona para o
 * dashboard. Não decide política de senha nem registra tentativa — isso
 * é do caso de uso.
 *
 * Pode falhar com ValidationException se as credenciais forem inválidas
 * ou o rate limit for atingido (ver LoginUser).
 *
 * @package App\Livewire\Auth
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
final class Login extends Component
{
    public string $email = '';

    public string $password = '';

    public bool $remember = false;

    /**
     * Autentica o usuário e redireciona para o painel.
     *
     * @throws ValidationException Credenciais inválidas ou rate limit.
     */
    public function authenticate(LoginUser $useCase): void
    {
        $data = $this->validate((new LoginRequest)->rules());

        $useCase->execute($data['email'], $data['password'], $this->remember);

        $this->redirect(route('admin.dashboard'), navigate: false);
    }

    public function render(): View
    {
        return view('auth.login')
            ->layout('layouts.auth', ['title' => __('auth.login_title')]);
    }
}
