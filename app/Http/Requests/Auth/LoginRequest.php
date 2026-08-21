<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação do formulário de login (e-mail, senha e "lembrar").
 *
 * Não autentica, não aplica rate limit e não grava last_login_at — isso é
 * do caso de uso LoginUser. O componente Livewire de login (App\Livewire\
 * Auth\Login) reaproveita `rules()` desta classe via `(new LoginRequest())
 * ->rules()`, para não duplicar as regras entre um eventual endpoint HTTP
 * tradicional e o formulário reativo.
 *
 * Pode dar errado se o campo obrigatório vier vazio ou se o e-mail for
 * inválido.
 *
 * @package App\Http\Requests\Auth
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
final class LoginRequest extends FormRequest
{
    /**
     * Quem pode enviar este formulário (visitante; a rota já exige guest).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Regras de validação dos campos do login.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }
}
