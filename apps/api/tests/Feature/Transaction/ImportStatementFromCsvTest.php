<?php

declare(strict_types=1);

use App\Models\StatementEntry;
use Illuminate\Http\UploadedFile;
use Tests\Feature\Support\FinanceScenario;

/**
 * Preview + importação seletiva de extrato CSV.
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->account = $this->scenario->account(balance: 1000.0);
    $this->base = "/api/v1/contexts/{$this->scenario->pf->id}/accounts/{$this->account->id}/statement-imports";
});

function statementCsv(string $body): UploadedFile
{
    return UploadedFile::fake()->createWithContent('extrato.csv', $body);
}

test('preview não grava lançamentos e classifica ok/invalid', function () {
    $file = statementCsv(
        "data,descricao,valor,categoria\n"
        ."10/09/2026,Mercado,-50.00,\n"
        ."11/09/2026,,-10.00,\n"
    );

    $this->post($this->base.'/preview', ['file' => $file], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('summary.total', 2)
        ->assertJsonPath('summary.ok', 1)
        ->assertJsonPath('summary.invalid', 1)
        ->assertJsonPath('rows.0.status', 'ok')
        ->assertJsonPath('rows.0.parsed.description', 'Mercado')
        ->assertJsonPath('rows.1.status', 'invalid');

    expect(StatementEntry::query()->count())->toBe(0);
});

test('preview marca duplicata quando já existe o lançamento', function () {
    $this->post($this->base, [
        'file' => statementCsv("data,descricao,valor,categoria\n10/09/2026,Mercado,-50.00,\n"),
    ], ['Accept' => 'application/json'])->assertOk();

    $this->post($this->base.'/preview', [
        'file' => statementCsv("data,descricao,valor,categoria\n10/09/2026,Mercado,-50.00,\n"),
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('summary.duplicates', 1)
        ->assertJsonPath('rows.0.status', 'duplicate');
});

test('store com lines importa só o subconjunto', function () {
    $file = statementCsv(
        "data,descricao,valor,categoria\n"
        ."10/09/2026,Mercado,-50.00,\n"
        ."11/09/2026,Farmácia,-20.00,\n"
        ."12/09/2026,Salário,1000.00,\n"
    );

    $this->post($this->base, [
        'file' => $file,
        'lines' => [2, 4],
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('imported', 2)
        ->assertJsonPath('failed', []);

    expect(StatementEntry::query()->pluck('description')->sort()->values()->all())
        ->toBe(['Mercado', 'Salário']);
});

test('reenviar o mesmo arquivo sem lines continua seguro via dedup', function () {
    $csv = "data,descricao,valor,categoria\n10/09/2026,Mercado,-50.00,\n";

    $this->post($this->base, ['file' => statementCsv($csv)], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('imported', 1);

    $this->post($this->base, ['file' => statementCsv($csv)], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('imported', 0)
        ->assertJsonPath('duplicates', 1);

    expect(StatementEntry::query()->count())->toBe(1);
});
