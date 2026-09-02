<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;

/**
 * Validação de `POST /api/v1/account/reset` — o "apagar tudo" da tela de
 * segurança. Exige a senha atual do usuário: a checagem é feita aqui, por
 * `Hash::check`, sem depender do guard padrão (a rota é Sanctum por token,
 * não sessão).
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final class ResetAccountDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, list<ValidationRule|string>> */
    public function rules(): array
    {
        return [
            'password' => ['required', 'string', $this->matchesCurrentPassword()],
        ];
    }

    /** Regra fechada: o valor precisa bater com a senha gravada do usuário. */
    private function matchesCurrentPassword(): ValidationRule
    {
        return new class($this->user()?->password) implements ValidationRule
        {
            public function __construct(private readonly ?string $hashedPassword) {}

            public function validate(string $attribute, mixed $value, \Closure $fail): void
            {
                if ($this->hashedPassword === null || ! Hash::check((string) $value, $this->hashedPassword)) {
                    $fail('validation.current_password')->translate();
                }
            }
        };
    }
}
