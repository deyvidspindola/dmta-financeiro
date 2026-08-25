<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\Enums\BoletoPasswordRuleType;
use App\Models\BoletoPasswordRule;

/**
 * Cadastra uma regra de senha de boleto por domínio de remetente
 * (DT-07) — normaliza o domínio (minúsculo, sem espaço), o resto é
 * gravado como veio.
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class RegisterBoletoPasswordRule
{
    /** @param array<string, mixed> $ruleParams Formato depende de `$ruleType` — ver `App\Enums\BoletoPasswordRuleType`. */
    public function execute(string $senderDomain, BoletoPasswordRuleType $ruleType, array $ruleParams, ?string $label): BoletoPasswordRule
    {
        return BoletoPasswordRule::query()->create([
            'sender_domain' => strtolower(trim($senderDomain)),
            'rule_type' => $ruleType->value,
            'rule_params' => $ruleParams,
            'label' => $label,
        ]);
    }
}
