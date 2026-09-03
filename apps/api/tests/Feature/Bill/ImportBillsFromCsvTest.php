<?php

declare(strict_types=1);

use App\Enums\BillDirection;
use App\Models\Bill;
use Illuminate\Http\UploadedFile;
use Tests\Feature\Support\FinanceScenario;

/**
 * Preview + importação seletiva de boletos CSV (com dedup).
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->base = "/api/v1/contexts/{$this->scenario->pf->id}/bills/import";
});

function billsCsv(string $body): UploadedFile
{
    return UploadedFile::fake()->createWithContent('boletos.csv', $body);
}

test('preview não grava boletos e classifica ok/invalid', function () {
    $file = billsCsv(
        "descricao,valor,vencimento,tipo,categoria,beneficiario,codigo_barras\n"
        ."Conta de luz,150.90,10/09/2026,pagar,Utilidades,Enel,\n"
        .",10.00,10/09/2026,pagar,,,\n"
    );

    $this->post($this->base.'/preview', ['file' => $file], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('summary.total', 2)
        ->assertJsonPath('summary.ok', 1)
        ->assertJsonPath('summary.invalid', 1)
        ->assertJsonPath('rows.0.status', 'ok')
        ->assertJsonPath('rows.0.parsed.description', 'Conta de luz')
        ->assertJsonPath('rows.1.status', 'invalid');

    expect(Bill::query()->count())->toBe(0);
});

test('preview marca duplicata quando já existe o boleto', function () {
    Bill::factory()->for($this->scenario->pf)->create([
        'description' => 'Conta de luz',
        'amount' => 150.90,
        'due_date' => '2026-09-10',
        'direction' => BillDirection::Payable->value,
    ]);

    $this->post($this->base.'/preview', [
        'file' => billsCsv(
            "descricao,valor,vencimento,tipo,categoria,beneficiario,codigo_barras\n"
            ."Conta de luz,150.90,10/09/2026,pagar,Utilidades,Enel,\n"
        ),
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('summary.duplicates', 1)
        ->assertJsonPath('rows.0.status', 'duplicate');
});

test('store com lines importa só o subconjunto', function () {
    $file = billsCsv(
        "descricao,valor,vencimento,tipo,categoria,beneficiario,codigo_barras\n"
        ."Luz,100.00,10/09/2026,pagar,,,\n"
        ."Água,50.00,11/09/2026,pagar,,,\n"
        ."Cliente,200.00,12/09/2026,receber,,,\n"
    );

    $this->post($this->base, [
        'file' => $file,
        'lines' => [2, 4],
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('imported', 2)
        ->assertJsonPath('failed', []);

    expect(Bill::query()->pluck('description')->sort()->values()->all())
        ->toBe(['Cliente', 'Luz']);
});

test('reenviar o mesmo arquivo sem lines continua seguro via dedup', function () {
    $csv = "descricao,valor,vencimento,tipo,categoria,beneficiario,codigo_barras\n"
        ."Luz,100.00,10/09/2026,pagar,,,\n";

    $this->post($this->base, ['file' => billsCsv($csv)], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('imported', 1);

    $this->post($this->base, ['file' => billsCsv($csv)], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('imported', 0)
        ->assertJsonPath('duplicates', 1);

    expect(Bill::query()->count())->toBe(1);
});
