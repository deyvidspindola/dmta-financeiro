<?php

declare(strict_types=1);

use App\Domain\Capture\RuleBasedPasswordResolver;
use App\Enums\BoletoPasswordRuleType;
use App\Models\BoletoPasswordRule;

test('cpf_digits gera variações de comprimento a partir do documento cru', function () {
    BoletoPasswordRule::factory()->create([
        'sender_domain' => 'banco.com.br',
        'rule_type' => BoletoPasswordRuleType::CpfDigits->value,
        'rule_params' => ['document' => '123.456.789-01'],
    ]);

    $candidates = (new RuleBasedPasswordResolver)->resolveCandidates('boletos@banco.com.br');

    expect($candidates)->toEqualCanonicalizing(['12345678901', '12345', '1234', '8901']);
});

test('birth_date gera os quatro formatos comuns', function () {
    BoletoPasswordRule::factory()->create([
        'sender_domain' => 'banco.com.br',
        'rule_type' => BoletoPasswordRuleType::BirthDate->value,
        'rule_params' => ['date' => '1990-05-20'],
    ]);

    $candidates = (new RuleBasedPasswordResolver)->resolveCandidates('x@banco.com.br');

    expect($candidates)->toEqualCanonicalizing(['20051990', '200590', '05201990', '19900520']);
});

test('fixed devolve a senha literal', function () {
    BoletoPasswordRule::factory()->create([
        'sender_domain' => 'banco.com.br',
        'rule_type' => BoletoPasswordRuleType::Fixed->value,
        'rule_params' => ['password' => 'abc123'],
    ]);

    expect((new RuleBasedPasswordResolver)->resolveCandidates('x@banco.com.br'))->toBe(['abc123']);
});

test('combina candidatas de várias regras do mesmo domínio, sem duplicar', function () {
    BoletoPasswordRule::factory()->create([
        'sender_domain' => 'banco.com.br',
        'rule_type' => BoletoPasswordRuleType::Fixed->value,
        'rule_params' => ['password' => 'abc123'],
    ]);
    BoletoPasswordRule::factory()->create([
        'sender_domain' => 'banco.com.br',
        'rule_type' => BoletoPasswordRuleType::CnpjDigits->value,
        'rule_params' => ['document' => '12345678000199'],
    ]);

    $candidates = (new RuleBasedPasswordResolver)->resolveCandidates('cobranca@BANCO.COM.BR');

    expect($candidates)->toEqualCanonicalizing(['abc123', '12345678000199', '12345678', '1234', '0199']);
});

test('domínio sem regra cadastrada devolve lista vazia', function () {
    expect((new RuleBasedPasswordResolver)->resolveCandidates('x@desconhecido.com.br'))->toBe([]);
});

test('endereço sem @ não quebra, só devolve vazio', function () {
    expect((new RuleBasedPasswordResolver)->resolveCandidates('nao-e-email'))->toBe([]);
});
