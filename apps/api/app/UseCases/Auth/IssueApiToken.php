<?php

declare(strict_types=1);

namespace App\UseCases\Auth;

use App\Models\User;
use App\Services\AuthRateLimiterService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Emite um token Sanctum para o app web (SPA) ou mobile (Expo), consumido
 * via `/api/v1` (D-09). Diferente de {@see LoginUser}: não usa `Auth::attempt`
 * nem sessão — é o padrão de token pessoal recomendado para cliente
 * externo, checando a senha direto.
 *
 * @package App\UseCases\Auth
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class IssueApiToken
{
    public function __construct(
        private readonly AuthRateLimiterService $rateLimiter,
    ) {}

    /**
     * @param  string  $deviceName  Identifica o token na lista de sessões do usuário.
     * @return array{user: User, token: string}
     *
     * @throws ValidationException Credenciais inválidas ou rate limit atingido.
     */
    public function execute(string $email, string $password, string $deviceName): array
    {
        $this->rateLimiter->ensureIsNotRateLimited($email);

        $user = User::query()->where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            $this->rateLimiter->registerFailure($email);

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $this->rateLimiter->clear($email);
        $user->forceFill(['last_login_at' => now()])->save();

        return [
            'user' => $user,
            'token' => $user->createToken($deviceName)->plainTextToken,
        ];
    }
}
