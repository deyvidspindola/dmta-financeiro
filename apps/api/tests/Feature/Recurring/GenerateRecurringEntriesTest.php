<?php

declare(strict_types=1);

use App\Enums\BillStatus;
use App\Enums\RecurrenceInterval;
use App\Enums\StatementEntryType;
use App\Jobs\GenerateRecurringBillEntries;
use App\Jobs\GenerateRecurringTransactionEntries;
use App\Models\Bill;
use App\Models\RecurringBill;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

/**
 * Caracteriza os dois jobs de recorrência (fase A0), incluindo o teste
 * que marca a NÃO-idempotência: reprocessar a mesma ocorrência duplica,
 * porque não há índice único `(recurring_*_id, data)`. O PR A7 fecha isso
 * e é pré-requisito da unificação em `Commitment` (fase A3).
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
    (new GenerateRecurringTransactionEntries)->handle(app(RegisterTransaction::class));
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

    expect(StatementEntry::query()->count())->toBe(1)
        ->and((float) $account->refresh()->balance)->toBe(900.0)
        ->and($rule->refresh()->next_occurrence_date->toDateString())->toBe('2026-09-10')
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

    // 15/05, 15/06, 15/07, 15/08 — quatro ocorrências até "hoje" (15/08).
    expect(StatementEntry::query()->count())->toBe(4)
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
    runTransactionJob();

    expect(StatementEntry::query()->count())->toBe(1);
});

test('BUG (ver PR A7): reprocessar a mesma ocorrência duplica — não há índice único', function () {
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
    expect(StatementEntry::query()->count())->toBe(1);

    // Simula falha entre RegisterTransaction (commitado) e rule->update:
    // a data volta pra ocorrência já materializada.
    $rule->refresh()->update(['next_occurrence_date' => '2026-08-10']);
    runTransactionJob();

    // Comportamento atual: a ocorrência de 10/08 é materializada de novo.
    // O PR A7 (índice único) impede.
    expect(StatementEntry::query()->count())->toBe(2);
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

    (new GenerateRecurringBillEntries)->handle();

    $bill = Bill::query()->sole();
    expect($bill->status)->toBe(BillStatus::Pending->value)
        ->and((float) $bill->amount)->toBe(200.0)
        ->and($bill->due_date->toDateString())->toBe('2026-08-05')
        ->and($rule->refresh()->next_due_date->toDateString())->toBe('2026-09-05');
});

test('obrigação recorrente: rodar de novo no mesmo dia não duplica', function () {
    RecurringBill::factory()->for($this->scenario->pf)->create([
        'amount' => 200.0,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-08-05',
        'next_due_date' => '2026-08-05',
        'active' => true,
    ]);

    (new GenerateRecurringBillEntries)->handle();
    (new GenerateRecurringBillEntries)->handle();

    expect(Bill::query()->count())->toBe(1);
});
