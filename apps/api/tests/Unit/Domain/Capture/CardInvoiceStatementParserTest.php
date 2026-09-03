<?php

declare(strict_types=1);

use App\Domain\Capture\CardInvoiceStatementParser;

/**
 * Heurística de extração de compras do texto de uma fatura de cartão em
 * PDF. Melhor esforço: pega data + descrição + valor de cada linha,
 * ignora ruído (totais, pagamentos, encargos) e créditos.
 */
beforeEach(function () {
    $this->parser = new CardInvoiceStatementParser;
});

test('extrai compras com data dd/mm e valor no fim da linha', function () {
    $rows = $this->parser->parse(implode("\n", [
        'Demonstrativo da fatura',
        '05/09 SUPERMERCADO BOM PRECO 189,90',
        '08/09 POSTO SHELL AV BRASIL R$ 250,00',
        '12/09 NETFLIX.COM 2/12 55,90',
        'PAGAMENTO EFETUADO -1.500,00',
        'TOTAL DA FATURA 495,80',
    ]));

    expect($rows)->toHaveCount(3)
        ->and($rows[0])->toMatchArray(['data' => '05/09/'.date('Y'), 'descricao' => 'SUPERMERCADO BOM PRECO', 'valor' => '189,90'])
        ->and($rows[1]['valor'])->toBe('250,00')
        ->and($rows[2]['descricao'])->toContain('NETFLIX.COM');
});

test('usa o ano do vencimento quando a data da compra não tem ano', function () {
    $rows = $this->parser->parse("Vencimento: 10/01/2027\n15/12 LOJA X 99,00");

    expect($rows[0]['data'])->toBe('15/12/2027');
});

test('entende data por mês abreviado (12 FEV ...)', function () {
    $rows = $this->parser->parse("12 FEV UBER *TRIP 24,99\n03 MAR IFOOD 61,40");

    expect($rows)->toHaveCount(2)
        ->and($rows[0]['data'])->toBe('12/02/'.date('Y'))
        ->and($rows[1]['data'])->toBe('03/03/'.date('Y'));
});

test('ignora crédito/estorno (valor negativo) e linhas de encargo', function () {
    $rows = $this->parser->parse(implode("\n", [
        '05/09 ESTORNO COMPRA -45,90',
        '05/09 IOF 3,21',
        '06/09 PADARIA 12,00',
    ]));

    expect($rows)->toHaveCount(1)
        ->and($rows[0]['descricao'])->toBe('PADARIA');
});

test('separa compras mesmo quando o extractor concatenou tudo numa linha só', function () {
    $rows = $this->parser->parse('05/09 MERCADO 50,00 06/09 FARMACIA 20,00 07/09 UBER 30,00');

    expect($rows)->toHaveCount(3)
        ->and(array_column($rows, 'valor'))->toBe(['50,00', '20,00', '30,00']);
});

test('limpa câmbio internacional da descrição', function () {
    $rows = $this->parser->parse('10/09 AMAZON MARKETPLACE USD 12,00 65,40');

    expect($rows[0]['descricao'])->toBe('AMAZON MARKETPLACE')
        ->and($rows[0]['valor'])->toBe('65,40');
});
