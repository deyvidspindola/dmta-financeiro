<?php

declare(strict_types=1);

use App\Models\CardPurchase;
use App\Models\CreditCard;
use Illuminate\Http\UploadedFile;
use Tests\Feature\Support\FinanceScenario;

/**
 * Preview + importação seletiva de fatura de cartão CSV.
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

test('preview anota parcela N/M na descrição quando N>1', function () {
    $this->post($this->base.'/preview', [
        'file' => invoiceCsv(
            "data,descricao,valor,categoria,parcela\n"
            ."08/09/2026,Notebook,499.90,Eletrônicos,2/6\n"
        ),
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('rows.0.parsed.description', 'Notebook (2/6)');
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
