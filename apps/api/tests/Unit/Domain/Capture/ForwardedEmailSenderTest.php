<?php

declare(strict_types=1);

use App\Domain\Capture\ForwardedEmailSender;

/**
 * Recupera o remetente original de um boleto reencaminhado. Amostras de
 * corpo de Gmail/Outlook/Apple Mail — servem também de calibração pro
 * parser quando chegar e-mail real.
 */
beforeEach(function () {
    $this->resolver = new ForwardedEmailSender;
});

test('e-mail não reencaminhado devolve null (usa o From do envelope)', function () {
    $original = $this->resolver->original(
        'cobranca@bancoxyz.com.br',
        'Seu boleto chegou',
        "Olá, segue o boleto em anexo.\nAtenciosamente,\nBanco XYZ",
    );

    expect($original)->toBeNull();
});

test('encaminho do Gmail (pt) — pega o From do bloco citado', function () {
    $body = implode("\n", [
        'segue',
        '',
        '---------- Forwarded message ---------',
        'De: Banco XYZ <cobranca@bancoxyz.com.br>',
        'Date: sex., 5 de set. de 2026 às 10:12',
        'Subject: Boleto disponível',
        'To: Deyvid <spindoladeyvid@gmail.com>',
        '',
        'Prezado cliente, seu boleto...',
    ]);

    $original = $this->resolver->original('spindoladeyvid@gmail.com', 'Fwd: Boleto disponível', $body);

    expect($original)->toBe('cobranca@bancoxyz.com.br');
});

test('assunto sem prefixo mas com bloco encaminhado ainda detecta', function () {
    $body = "Begin forwarded message:\n\nFrom: Enel <atendimento@enel.com>\nSubject: Sua fatura\n\n...";

    $original = $this->resolver->original('spindoladeyvid@gmail.com', 'Sua fatura de energia', $body);

    expect($original)->toBe('atendimento@enel.com');
});

test('encaminho do Outlook (De:/Enviada em:/Para:)', function () {
    $body = implode("\n", [
        '________________________________',
        'De: Condomínio Central <financeiro@condominiocentral.com.br>',
        'Enviada em: quinta-feira, 4 de setembro de 2026 18:03',
        'Para: Deyvid Spindola',
        'Assunto: Boleto do mês',
        '',
        'Segue boleto.',
    ]);

    $original = $this->resolver->original('spindoladeyvid@gmail.com', 'ENC: Boleto do mês', $body);

    expect($original)->toBe('financeiro@condominiocentral.com.br');
});

test('corpo em HTML é tolerado', function () {
    $body = '<div>segue</div><br><div>---------- Forwarded message ---------<br>'
        .'De: <b>Vivo</b> &lt;faturas@vivo.com.br&gt;<br>Para: eu</div>';

    $original = $this->resolver->original('spindoladeyvid@gmail.com', 'Fwd: fatura', $body);

    expect($original)->toBe('faturas@vivo.com.br');
});

test('lista de forwarders reforça a detecção quando não há prefixo nem bloco padrão', function () {
    $body = "From: SABESP <boletos@sabesp.com.br>\nassunto: conta de água\n\nsegue";

    $original = $this->resolver->original(
        'meu.outro.email@gmail.com',
        'conta de água',
        $body,
        ['meu.outro.email@gmail.com'],
    );

    expect($original)->toBe('boletos@sabesp.com.br');
});

test('ignora o próprio encaminhador se ele aparecer citado primeiro', function () {
    $body = implode("\n", [
        '---------- Forwarded message ---------',
        'De: spindoladeyvid@gmail.com',
        'Para: boletos@casa.com',
        '',
        'De: Claro <cobranca@claro.com.br>',
        'Para: spindoladeyvid@gmail.com',
    ]);

    $original = $this->resolver->original('spindoladeyvid@gmail.com', 'Fwd: boleto', $body);

    expect($original)->toBe('cobranca@claro.com.br');
});
