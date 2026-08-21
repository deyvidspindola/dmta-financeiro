<?php

declare(strict_types=1);

namespace App\UseCases\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
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
    /** Máximo de tentativas de login por janela de um minuto. */
    private const MAX_ATTEMPTS = 5;

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
        $this->ensureIsNotRateLimited($email);

        if (! Auth::attempt(['email' => $email, 'password' => $password], $remember)) {
            RateLimiter::hit($this->throttleKey($email));

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey($email));

        /** @var User $user */
        $user = Auth::user();

        DB::transaction(function () use ($user): void {
            $user->forceFill(['last_login_at' => now()])->save();
        });

        return $user;
    }

    /**
     * Bloqueia se já houve MAX_ATTEMPTS falhas na janela de um minuto.
     *
     * @throws ValidationException Quando o limite foi atingido.
     */
    private function ensureIsNotRateLimited(string $email): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey($email), self::MAX_ATTEMPTS)) {
            return;
        }

        $seconds = RateLimiter::availableIn($this->throttleKey($email));

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', ['seconds' => $seconds]),
        ]);
    }

    /**
     * Chave do RateLimiter só pelo e-mail (não inclui IP).
     */
    private function throttleKey(string $email): string
    {
        return 'login:'.Str::lower($email);
    }
}
