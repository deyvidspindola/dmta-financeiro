<?php

declare(strict_types=1);

use App\Enums\BoletoPasswordRuleType;
use App\Enums\CardInvoiceStatus;
use App\Models\BoletoPasswordRule;
use App\Models\CardInvoice;
use App\Models\CardPurchase;
use App\Models\CreditCard;
use Illuminate\Http\UploadedFile;
use Tests\Feature\Support\FinanceScenario;
use Tests\Support\MinimalEncryptedPdfBuilder;

/**
 * Preview + importação seletiva de fatura de cartão — CSV e PDF (com
 * desbloqueio por senha de boleto cadastrada, DT-07).
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->card = CreditCard::factory()->for($this->scenario->pf)->create([
        'closing_day' => 10,
        'due_day' => 20,
        'credit_limit' => 5000.0,
    ]);
    $this->base = "/api/v1/contexts/{$this->scenario->pf->id}/credit-cards/{$this->card->id}/invoice-import";
});

function invoiceCsv(string $body): UploadedFile
{
    return UploadedFile::fake()->createWithContent('fatura.csv', $body);
}

/** PDF de fatura com texto pesquisável, sem senha. */
function invoicePdf(string ...$purchaseLines): UploadedFile
{
    $stream = 'BT /F1 12 Tf 50 780 Td ';
    foreach ($purchaseLines as $line) {
        $stream .= '('.str_replace(['(', ')'], ['', ''], $line).') Tj 0 -18 Td ';
    }
    $stream .= 'ET';

    $objs = [
        1 => '<< /Type /Catalog /Pages 2 0 R >>',
        2 => '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        3 => '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
        5 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];
    $buf = "%PDF-1.4\n";
    $off = [];
    foreach ($objs as $n => $d) {
        $off[$n] = strlen($buf);
        $buf .= "{$n} 0 obj\n{$d}\nendobj\n";
    }
    $off[4] = strlen($buf);
    $buf .= "4 0 obj\n<< /Length ".strlen($stream)." >>\nstream\n{$stream}\nendstream\nendobj\n";
    $xref = strlen($buf);
    $buf .= "xref\n0 6\n0000000000 65535 f \n";
    for ($i = 1; $i <= 5; $i++) {
        $buf .= sprintf("%010d 00000 n \n", $off[$i]);
    }
    $buf .= "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";

    return UploadedFile::fake()->createWithContent('fatura.pdf', $buf);
}

test('preview não grava compras e classifica ok/invalid', function () {
    $file = invoiceCsv(
        "data,descricao,valor,categoria,parcela\n"
        ."05/09/2026,Mercado,50.00,,\n"
        ."06/09/2026,,10.00,,\n"
    );

    $this->post($this->base.'/preview', ['file' => $file], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('summary.total', 2)
        ->assertJsonPath('summary.ok', 1)
        ->assertJsonPath('summary.invalid', 1)
        ->assertJsonPath('rows.0.status', 'ok')
        ->assertJsonPath('rows.0.parsed.description', 'Mercado')
        ->assertJsonPath('rows.1.status', 'invalid');

    expect(CardPurchase::query()->count())->toBe(0);
});

test('preview de parcela N/M mostra a parcela e quantas ainda faltam criar', function () {
    $this->post($this->base.'/preview', [
        'file' => invoiceCsv(
            "data,descricao,valor,categoria,parcela\n"
            ."08/09/2026,Notebook,499.90,Eletrônicos,2/6\n"
        ),
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('rows.0.parsed.description', 'Notebook')
        ->assertJsonPath('rows.0.parsed.installment_number', 2)
        ->assertJsonPath('rows.0.parsed.installment_total', 6)
        ->assertJsonPath('rows.0.parsed.installments_pending', 5);
});

test('importar parcela N/M cria a parcela atual e projeta as futuras nas faturas seguintes', function () {
    // cartão fecha dia 10 / vence 20; compra 04/08 parcela 1/3
    $this->post($this->base, [
        'file' => invoiceCsv("data,descricao,valor,categoria,parcela\n04/08/2026,Geladeira,300.00,,1/3\n"),
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('imported', 3)
        ->assertJsonPath('duplicates', 0);

    $purchases = CardPurchase::query()->orderBy('installment_number')->get();
    expect($purchases)->toHaveCount(3);
    expect($purchases->pluck('installment_number')->all())->toBe([1, 2, 3]);
    expect($purchases->every(fn ($p) => (float) $p->amount === 300.0))->toBeTrue();

    // três faturas distintas, uma por mês (ago / set / out)
    $months = $purchases
        ->map(fn ($p) => $p->cardInvoice->reference_month->format('Y-m'))
        ->sort()->values()->all();
    expect($months)->toBe(['2026-08', '2026-09', '2026-10']);
});

test('importação fecha as faturas de meses já passados', function () {
    // hoje é depois de 2026-09; a fatura de julho (fecha dia 10) já passou
    $this->post($this->base, [
        'file' => invoiceCsv("data,descricao,valor,categoria,parcela\n03/07/2026,Compra antiga,80.00,,\n"),
    ], ['Accept' => 'application/json'])->assertOk()->assertJsonPath('imported', 1);

    $invoice = CardInvoice::query()->where('credit_card_id', $this->card->id)->sole();
    expect($invoice->status)->toBe(CardInvoiceStatus::Closed);
});

test('reimportar uma fatura que se sobrepõe não duplica parcelas', function () {
    // fatura de agosto: parcela 1/3
    $this->post($this->base, [
        'file' => invoiceCsv("data,descricao,valor,categoria,parcela\n04/08/2026,Geladeira,300.00,,1/3\n"),
    ], ['Accept' => 'application/json'])->assertJsonPath('imported', 3);

    // fatura de setembro (mesma compra, agora aparece como 2/3)
    $this->post($this->base, [
        'file' => invoiceCsv("data,descricao,valor,categoria,parcela\n04/08/2026,Geladeira,300.00,,2/3\n"),
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('imported', 0)
        ->assertJsonPath('duplicates', 2);

    expect(CardPurchase::query()->count())->toBe(3);
});

test('preview marca duplicata quando já existe a compra', function () {
    $this->post($this->base, [
        'file' => invoiceCsv("data,descricao,valor,categoria,parcela\n05/09/2026,Mercado,50.00,,\n"),
    ], ['Accept' => 'application/json'])->assertOk();

    $this->post($this->base.'/preview', [
        'file' => invoiceCsv("data,descricao,valor,categoria,parcela\n05/09/2026,Mercado,50.00,,\n"),
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('summary.duplicates', 1)
        ->assertJsonPath('rows.0.status', 'duplicate');
});

test('store com lines importa só o subconjunto', function () {
    $file = invoiceCsv(
        "data,descricao,valor,categoria,parcela\n"
        ."05/09/2026,Mercado,50.00,,\n"
        ."06/09/2026,Farmácia,20.00,,\n"
        ."07/09/2026,Uber,30.00,,\n"
    );

    $this->post($this->base, [
        'file' => $file,
        'lines' => [2, 4],
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('imported', 2)
        ->assertJsonPath('failed', []);

    expect(CardPurchase::query()->pluck('description')->sort()->values()->all())
        ->toBe(['Mercado', 'Uber']);
});

test('reenviar o mesmo arquivo sem lines continua seguro via dedup', function () {
    $csv = "data,descricao,valor,categoria,parcela\n05/09/2026,Mercado,50.00,,\n";

    $this->post($this->base, ['file' => invoiceCsv($csv)], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('imported', 1);

    $this->post($this->base, ['file' => invoiceCsv($csv)], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('imported', 0)
        ->assertJsonPath('duplicates', 1);

    expect(CardPurchase::query()->count())->toBe(1);
});

test('template devolve CSV modelo', function () {
    $this->get($this->base.'/template')
        ->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8')
        ->assertSee('data,descricao,valor,categoria,parcela', false);
});

test('preview de fatura em PDF (sem senha) extrai as compras', function () {
    $file = invoicePdf(
        '05/09/2026 SUPERMERCADO BOM PRECO 189,90',
        '08/09/2026 POSTO SHELL 250,00',
        'TOTAL DA FATURA 439,90',
    );

    $response = $this->post($this->base.'/preview', ['file' => $file], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('needs_password', false)
        ->assertJsonPath('summary.ok', 2)
        ->assertJsonPath('rows.0.parsed.description', 'SUPERMERCADO BOM PRECO')
        ->assertJsonPath('rows.1.parsed.amount', 250);

    // texto extraído volta no preview pra diagnóstico quando algo falha
    expect($response->json('raw_text'))->toContain('POSTO SHELL');
    expect(CardPurchase::query()->count())->toBe(0);
});

test('preview de PDF ilegível devolve raw_text vazio e nenhuma linha', function () {
    // PDF sem camada de texto (só o cabeçalho) — smalot não extrai nada
    $file = UploadedFile::fake()->createWithContent('fatura.pdf', "%PDF-1.4\n%%EOF");

    $this->post($this->base.'/preview', ['file' => $file], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('needs_password', false)
        ->assertJsonPath('summary.total', 0)
        ->assertJsonPath('rows', []);
});

test('PDF protegido sem senha cadastrada volta needs_password', function () {
    ['bytes' => $bytes] = (new MinimalEncryptedPdfBuilder)->build(4, 'segredo-da-fatura', 'AESV2');
    $file = UploadedFile::fake()->createWithContent('fatura.pdf', $bytes);

    $this->post($this->base.'/preview', ['file' => $file], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('needs_password', true)
        ->assertJsonPath('rows', []);
});

test('PDF protegido abre com senha de boleto cadastrada (qualquer remetente)', function () {
    BoletoPasswordRule::factory()->create([
        'sender_domain' => 'banco-qualquer.com.br',
        'rule_type' => BoletoPasswordRuleType::Fixed->value,
        'rule_params' => ['password' => 'segredo-da-fatura'],
    ]);

    ['bytes' => $bytes] = (new MinimalEncryptedPdfBuilder)->build(
        4,
        'segredo-da-fatura',
        'AESV2',
        'BT /F1 12 Tf 50 780 Td (05/09/2026 LOJA DESBLOQUEADA 77,00) Tj ET',
    );
    $file = UploadedFile::fake()->createWithContent('fatura.pdf', $bytes);

    $this->post($this->base.'/preview', ['file' => $file], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('needs_password', false)
        ->assertJsonPath('summary.ok', 1)
        ->assertJsonPath('rows.0.parsed.description', 'LOJA DESBLOQUEADA');
});

test('PDF protegido abre com a senha informada na hora e importa', function () {
    ['bytes' => $bytes] = (new MinimalEncryptedPdfBuilder)->build(
        4,
        'minha-senha',
        'AESV2',
        'BT /F1 12 Tf 50 780 Td (09/09/2026 COMPRA MANUAL 42,00) Tj ET',
    );

    $preview = $this->post($this->base.'/preview', [
        'file' => UploadedFile::fake()->createWithContent('fatura.pdf', $bytes),
        'password' => 'minha-senha',
    ], ['Accept' => 'application/json']);
    $preview->assertOk()->assertJsonPath('needs_password', false)->assertJsonPath('summary.ok', 1);

    $this->post($this->base, [
        'file' => UploadedFile::fake()->createWithContent('fatura.pdf', $bytes),
        'password' => 'minha-senha',
        'lines' => [2],
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('imported', 1);

    expect(CardPurchase::query()->value('description'))->toBe('COMPRA MANUAL');
});
