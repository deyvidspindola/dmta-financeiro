<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Domain\Auth\TotpCode;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação de formato do código TOTP — usada por `mfa/confirm` e
 * `mfa/verify` (mesmo formato, 6 dígitos). Não confere se o código é
 * válido — isso é o {@see TotpCode}, via caso de uso.
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class MfaCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'digits:6'],
        ];
    }
}
