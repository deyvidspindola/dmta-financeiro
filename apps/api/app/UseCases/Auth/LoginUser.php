<?php

declare(strict_types=1);

namespace App\UseCases\Auth;

use App\Models\User;
use App\Services\AuthRateLimiterService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Autentica o usuário com e-mail e senha e grava o último acesso.
 *
 * Aplica limite de 5 tentativas por minuto por e-mail. Não regenera a
 * sessão HTTP (isso é responsabilidade do middleware de sessão do
 * Laravel) e não decide a URL de destino — quem redireciona é o
 * componente Livewire que chamou este caso de uso.
 *
 * Pode dar errado se as credenciais forem inválidas ou se o limite de
 * tentativas for atingido — lança ValidationException em ambos os casos.
 *
 * @package App\UseCases\Auth
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
final class LoginUser
{
    public function __construct(
        private readonly AuthRateLimiterService $rateLimiter,
    ) {}

    /**
     * Autentica e atualiza last_login_at.
     *
     * @param  string  $email  E-mail informado no formulário.
     * @param  string  $password  Senha em texto puro (não persiste).
     * @param  bool  $remember  Se a sessão deve durar além do browser.
     * @return User Usuário autenticado, com last_login_at atualizado.
     *
     * @throws ValidationException Credenciais inválidas ou rate limit.
     */
    public function execute(string $email, string $password, bool $remember): User
    {
        $this->rateLimiter->ensureIsNotRateLimited($email);

        if (! Auth::attempt(['email' => $email, 'password' => $password], $remember)) {
            $this->rateLimiter->registerFailure($email);

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $this->rateLimiter->clear($email);

        /** @var User $user */
        $user = Auth::user();

        DB::transaction(function () use ($user): void {
            $user->forceFill(['last_login_at' => now()])->save();
        });

        return $user;
    }
}
