<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Limite de tentativas de autenticação por e-mail — reusado por qualquer
 * caso de uso de login (sessão web ou emissão de token de API), para não
 * duplicar a janela de 5 tentativas/minuto em cada um.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class AuthRateLimiterService
{
    private const MAX_ATTEMPTS = 5;

    /** @throws ValidationException Se já houve MAX_ATTEMPTS falhas na janela de um minuto. */
    public function ensureIsNotRateLimited(string $email): void
    {
        $key = $this->key($email);

        if (! RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            return;
        }

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', ['seconds' => RateLimiter::availableIn($key)]),
        ]);
    }

    public function registerFailure(string $email): void
    {
        RateLimiter::hit($this->key($email));
    }

    public function clear(string $email): void
    {
        RateLimiter::clear($this->key($email));
    }

    private function key(string $email): string
    {
        return 'login:'.Str::lower($email);
    }
}
