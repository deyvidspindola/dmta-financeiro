<?php

declare(strict_types=1);

use App\Domain\Recurrence\RecurrenceWindow;
use App\Enums\BillStatus;
use App\Enums\RecurrenceInterval;
use App\Enums\StatementEntryType;
use App\Jobs\GenerateRecurringBillEntries;
use App\Jobs\GenerateRecurringTransactionEntries;
use App\Models\Bill;
use App\Models\RecurringBill;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use App\Services\RecurringTransactionMaterializer;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

/**
 * Os dois jobs de recorrência — comportamento caracterizado na fase A0;
 * idempotência no PR A7; laço compartilhado ({@see RecurrenceWindow}) no
 * PR A13.
 *
 * Atualizado: o job de lançamento recorrente agora materializa também as
 * ocorrências FUTURAS (até {@see RecurringTransactionMaterializer::HORIZON_MONTHS}
 * meses) como `pending`, além das vencidas (`settled`). As asserções de
 * saldo/efeito não mudam — só passam a contar `->settled()` onde antes
 * `count()` bastava.
 */
beforeEach(function () {
    Carbon::setTestNow('2026-08-15');
    $this->scenario = FinanceScenario::create();
});

afterEach(function () {
    Carbon::setTestNow();
});

function runTransactionJob(): void
{
    (new GenerateRecurringTransactionEntries)->handle(app(RecurringTransactionMaterializer::class));
}

function runBillJob(): void
{
    (new GenerateRecurringBillEntries)->handle(app(RecurrenceWindow::class));
}

test('lançamento recorrente: uma ocorrência vencida gera um lançamento e avança a data', function () {
    $account = $this->scenario->account(balance: 1000.0);
    $rule = RecurringTransaction::factory()->for($this->scenario->pf)->create([
        'account_id' => $account->id,
        'amount' => 100.0,
        'type' => StatementEntryType::Expense->value,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-08-10',
        'next_occurrence_date' => '2026-08-10',
        'end_date' => null,
        'active' => true,
    ]);

    runTransactionJob();

    expect(StatementEntry::query()->settled()->count())->toBe(1)
        ->and((float) $account->refresh()->balance)->toBe(900.0)
        ->and($rule->refresh()->next_occurrence_date->toDateString())->toBe('2027-09-10')
        ->and($rule->active)->toBeTrue();
});

test('lançamento recorrente: catch-up gera uma ocorrência por mês perdido, sem pular', function () {
    $account = $this->scenario->account(balance: 1000.0);
    RecurringTransaction::factory()->for($this->scenario->pf)->create([
        'account_id' => $account->id,
        'amount' => 10.0,
        'type' => StatementEntryType::Expense->value,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-05-15',
        'next_occurrence_date' => '2026-05-15',
        'end_date' => null,
        'active' => true,
    ]);

    runTransactionJob();

    // 15/05, 15/06, 15/07, 15/08 — quatro ocorrências efetivadas até "hoje" (15/08).
    expect(StatementEntry::query()->settled()->count())->toBe(4)
        ->and((float) $account->refresh()->balance)->toBe(960.0);
});

test('lançamento recorrente: end_date desativa a regra depois da última ocorrência', function () {
    $account = $this->scenario->account(balance: 1000.0);
    $rule = RecurringTransaction::factory()->for($this->scenario->pf)->create([
        'account_id' => $account->id,
        'amount' => 10.0,
        'type' => StatementEntryType::Expense->value,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-06-01',
        'next_occurrence_date' => '2026-06-01',
        'end_date' => '2026-07-15',
        'active' => true,
    ]);

    runTransactionJob();

    // 01/06 e 01/07 entram; a de 01/08 ultrapassa o end_date → regra para.
    expect(StatementEntry::query()->count())->toBe(2)
        ->and($rule->refresh()->active)->toBeFalse();
});

test('lançamento recorrente: rodar o job de novo no mesmo dia não duplica (data já avançou)', function () {
    $account = $this->scenario->account(balance: 1000.0);
    RecurringTransaction::factory()->for($this->scenario->pf)->create([
        'account_id' => $account->id,
        'amount' => 100.0,
        'type' => StatementEntryType::Expense->value,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-08-10',
        'next_occurrence_date' => '2026-08-10',
        'active' => true,
    ]);

    runTransactionJob();
    $after = StatementEntry::query()->count();
    runTransactionJob();

    expect(StatementEntry::query()->count())->toBe($after)
        ->and(StatementEntry::query()->settled()->count())->toBe(1);
});

test('reprocessar a mesma ocorrência não duplica (checagem de idempotência)', function () {
    $account = $this->scenario->account(balance: 1000.0);
    $rule = RecurringTransaction::factory()->for($this->scenario->pf)->create([
        'account_id' => $account->id,
        'amount' => 100.0,
        'type' => StatementEntryType::Expense->value,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-08-10',
        'next_occurrence_date' => '2026-08-10',
        'active' => true,
    ]);

    runTransactionJob();
    $after = StatementEntry::query()->count();
    expect(StatementEntry::query()->settled()->count())->toBe(1);

    // Simula falha entre RegisterTransaction (commitado) e rule->update:
    // a data volta pra ocorrência já materializada.
    $rule->refresh()->update(['next_occurrence_date' => '2026-08-10']);
    runTransactionJob();

    // A ocorrência de 10/08 já existe — não é materializada de novo.
    expect(StatementEntry::query()->count())->toBe($after)
        ->and((float) $account->refresh()->balance)->toBe(900.0);
});

test('obrigação recorrente: gera Bill pendente e avança next_due_date', function () {
    $rule = RecurringBill::factory()->for($this->scenario->pf)->create([
        'amount' => 200.0,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-08-05',
        'next_due_date' => '2026-08-05',
        'end_date' => null,
        'active' => true,
    ]);

    runBillJob();

    $bill = Bill::query()->sole();
    expect($bill->status)->toBe(BillStatus::Pending->value)
        ->and((float) $bill->amount)->toBe(200.0)
        ->and($bill->recurring_bill_id)->toBe($rule->id)
        ->and($bill->due_date->toDateString())->toBe('2026-08-05')
        ->and($rule->refresh()->next_due_date->toDateString())->toBe('2026-09-05');
});

test('o banco rejeita duas ocorrências da mesma regra na mesma data', function () {
    $account = $this->scenario->account(balance: 0.0);
    $rule = RecurringTransaction::factory()->for($this->scenario->pf)->create([
        'account_id' => $account->id,
    ]);

    StatementEntry::factory()->forAccount($account)->create([
        'recurring_transaction_id' => $rule->id,
        'occurred_at' => '2026-08-10',
    ]);

    expect(fn () => StatementEntry::factory()->forAccount($account)->create([
        'recurring_transaction_id' => $rule->id,
        'occurred_at' => '2026-08-10',
    ]))->toThrow(QueryException::class);
});

test('obrigação recorrente: rodar de novo no mesmo dia não duplica', function () {
    RecurringBill::factory()->for($this->scenario->pf)->create([
        'amount' => 200.0,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-08-05',
        'next_due_date' => '2026-08-05',
        'active' => true,
    ]);

    runBillJob();
    runBillJob();

    expect(Bill::query()->count())->toBe(1);
});
