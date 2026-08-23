<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\Capture\RuleBasedPasswordResolver;
use App\Enums\BoletoPasswordRuleType;
use Database\Factories\BoletoPasswordRuleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['sender_domain', 'rule_type', 'rule_params', 'label'])]
/**
 * Regra que gera senha(s) candidata(s) pra abrir PDF de boleto protegido,
 * por domínio de remetente — ver {@see RuleBasedPasswordResolver}
 * e DT-07. Nunca guarda a senha em si, só o dado bruto que a deriva.
 *
 * @property-read BoletoPasswordRuleType $rule_type
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
class BoletoPasswordRule extends Model
{
    /** @use HasFactory<BoletoPasswordRuleFactory> */
    use HasFactory;

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rule_type' => BoletoPasswordRuleType::class,
            'rule_params' => 'array',
            'last_used_at' => 'datetime',
        ];
    }
}
