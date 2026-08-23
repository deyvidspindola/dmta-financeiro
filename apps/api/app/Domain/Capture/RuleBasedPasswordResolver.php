<?php

declare(strict_types=1);

namespace App\Domain\Capture;

use App\Enums\BoletoPasswordRuleType;
use App\Models\BoletoPasswordRule;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Throwable;

/**
 * Implementação de produção de {@see PdfPasswordResolverInterface}:
 * consulta {@see BoletoPasswordRule} pelo domínio do remetente e expande
 * cada regra em uma ou mais senhas candidatas (DT-07). O dado bruto
 * (CPF/CNPJ/data) vive em `rule_params` da própria regra, não em
 * `User`/`Company` — não existe cadastro de CPF/data de nascimento hoje,
 * e uma regra pode precisar de um documento que não é nem o do dono da
 * conta (ex.: boleto de terceiro).
 *
 * @package App\Domain\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class RuleBasedPasswordResolver implements PdfPasswordResolverInterface
{
    public function resolveCandidates(string $senderEmail): array
    {
        $domain = strtolower(Str::after($senderEmail, '@'));

        if ($domain === '' || $domain === $senderEmail) {
            return [];
        }

        $candidates = [];

        foreach (BoletoPasswordRule::query()->where('sender_domain', $domain)->get() as $rule) {
            array_push($candidates, ...$this->expand($rule));
        }

        return array_values(array_unique(array_filter($candidates, fn (string $c): bool => $c !== '')));
    }

    /**
     * @return list<string>
     *
     * Cada braço abaixo tem uma anotação de supressão porque larastan
     * infere `$rule->rule_type`/`$rule->rule_params` como `string` puro em
     * vez dos tipos do cast (mesma classe de erro documentada em
     * `StatementEntry.php` — confirmado em runtime via `php artisan tinker`
     * que o cast funciona certo).
     */
    private function expand(BoletoPasswordRule $rule): array
    {
        // @phpstan-ignore-next-line match.unhandled
        return match ($rule->rule_type) {
            // @phpstan-ignore-next-line match.alwaysFalse, nullCoalesce.offset
            BoletoPasswordRuleType::CpfDigits => $this->documentVariants((string) ($rule->rule_params['document'] ?? ''), [11, 5, 4]),
            // @phpstan-ignore-next-line match.alwaysFalse, nullCoalesce.offset
            BoletoPasswordRuleType::CnpjDigits => $this->documentVariants((string) ($rule->rule_params['document'] ?? ''), [14, 8, 4]),
            // @phpstan-ignore-next-line match.alwaysFalse, nullCoalesce.offset
            BoletoPasswordRuleType::BirthDate => $this->dateVariants((string) ($rule->rule_params['date'] ?? '')),
            // @phpstan-ignore-next-line match.alwaysFalse, nullCoalesce.offset, arrayFilter.alwaysEmpty
            BoletoPasswordRuleType::Fixed => array_filter([(string) ($rule->rule_params['password'] ?? '')]),
        };
    }

    /** @param list<int> $lengths Quantos dos primeiros dígitos usar em cada variação — o comprimento total do documento sempre entra também. */
    private function documentVariants(string $document, array $lengths): array
    {
        $digits = preg_replace('/\D/', '', $document) ?? '';

        if ($digits === '') {
            return [];
        }

        $variants = [];

        foreach ($lengths as $length) {
            if (strlen($digits) >= $length) {
                $variants[] = substr($digits, 0, $length);
            }
        }

        if (strlen($digits) >= 4) {
            $variants[] = substr($digits, -4);
        }

        return $variants;
    }

    private function dateVariants(string $date): array
    {
        try {
            $parsed = Carbon::parse($date);
        } catch (Throwable) {
            return [];
        }

        return [
            $parsed->format('dmY'),
            $parsed->format('dmy'),
            $parsed->format('mdY'),
            $parsed->format('Ymd'),
        ];
    }
}
