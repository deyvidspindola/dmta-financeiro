<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação de `POST /api/v1/boleto-password-rules` (DT-07). O formato
 * exigido de `rule_params` depende de `rule_type` — ver
 * `App\Enums\BoletoPasswordRuleType` — não é validado campo a campo
 * aqui pra não duplicar essa regra; um `rule_params` incompleto só gera
 * uma lista de candidatas vazia em `RuleBasedPasswordResolver`, nunca
 * quebra nada.
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class StoreBoletoPasswordRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'sender_domain' => ['nullable', 'string', 'max:255'],
            'rule_type' => ['required', Rule::in(['cpf_digits', 'cnpj_digits', 'birth_date', 'fixed'])],
            'rule_params' => ['required', 'array'],
            'label' => ['nullable', 'string', 'max:150'],
        ];
    }
}
