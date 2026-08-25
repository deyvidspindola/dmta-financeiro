<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\BoletoPasswordRule;

/**
 * Como {@see BoletoPasswordRule::rule_params} deve ser interpretado pra
 * gerar as senhas candidatas de um remetente — ver DT-07.
 *
 * @package App\Enums
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
enum BoletoPasswordRuleType: string
{
    /** `rule_params: {"document": "12345678901"}` — CPF (só dígitos); gera variações (11/5/4 primeiros dígitos). */
    case CpfDigits = 'cpf_digits';

    /** `rule_params: {"document": "12345678000199"}` — CNPJ (só dígitos); gera variações (14/8/4 primeiros dígitos). */
    case CnpjDigits = 'cnpj_digits';

    /** `rule_params: {"date": "1990-05-20"}` — gera `ddMMyyyy`/`ddMMyy`/`MMddyyyy`/`yyyyMMdd`. */
    case BirthDate = 'birth_date';

    /** `rule_params: {"password": "..."}` — uma senha literal, sem variação. */
    case Fixed = 'fixed';
}
