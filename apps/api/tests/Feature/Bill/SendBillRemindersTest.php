<?php

declare(strict_types=1);

use App\Enums\BillDirection;
use App\Enums\BillStatus;
use App\Jobs\SendBillReminders;
use App\Models\Bill;
use App\Services\TelegramBotClient;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Tests\Feature\Support\FinanceScenario;

beforeEach(function () {
    Carbon::setTestNow('2026-09-14');
    Http::fake(['api.telegram.org/*' => Http::response(['ok' => true])]);
    config(['services.telegram.bot_token' => 'TESTTOKEN', 'services.telegram.allowed_chat_id' => '10']);
    $this->scenario = FinanceScenario::create();
});

afterEach(fn () => Carbon::setTestNow());

test('manda lembrete só do boleto que vence amanhã', function () {
    Bill::factory()->for($this->scenario->pf)->create([
        'description' => 'Aluguel',
        'amount' => 1500,
        'due_date' => '2026-09-15', // amanhã
        'status' => BillStatus::Pending->value,
        'direction' => BillDirection::Payable->value,
    ]);
    Bill::factory()->for($this->scenario->pf)->create([
        'due_date' => '2026-09-20', // não é amanhã
        'status' => BillStatus::Pending->value,
    ]);
    Bill::factory()->for($this->scenario->pf)->create([
        'due_date' => '2026-09-15', // amanhã, mas já pago
        'status' => BillStatus::Paid->value,
    ]);

    (new SendBillReminders)->handle(app(TelegramBotClient::class));

    Http::assertSent(function ($request) {
        return str_contains((string) $request->url(), 'sendMessage')
            && str_contains($request['text'], 'Aluguel')
            && str_contains($request['text'], '1 boleto vence amanhã');
    });
});

test('sem boleto vencendo amanhã, não manda nada', function () {
    Bill::factory()->for($this->scenario->pf)->create([
        'due_date' => '2026-09-20',
        'status' => BillStatus::Pending->value,
    ]);

    (new SendBillReminders)->handle(app(TelegramBotClient::class));

    Http::assertNotSent(fn ($request) => str_contains((string) $request->url(), 'sendMessage'));
});

test('sem allowed_chat_id configurado, não manda nada', function () {
    config(['services.telegram.allowed_chat_id' => null]);
    Bill::factory()->for($this->scenario->pf)->create([
        'due_date' => '2026-09-15',
        'status' => BillStatus::Pending->value,
    ]);

    (new SendBillReminders)->handle(app(TelegramBotClient::class));

    Http::assertNotSent(fn ($request) => str_contains((string) $request->url(), 'sendMessage'));
});

test('junta mais de um boleto na mesma mensagem, com o contexto de cada um', function () {
    $this->scenario->withCompany();
    Bill::factory()->for($this->scenario->pf)->create([
        'description' => 'Internet',
        'due_date' => '2026-09-15',
        'status' => BillStatus::Pending->value,
    ]);
    Bill::factory()->for($this->scenario->company)->create([
        'description' => 'DAS',
        'due_date' => '2026-09-15',
        'status' => BillStatus::Pending->value,
    ]);

    (new SendBillReminders)->handle(app(TelegramBotClient::class));

    Http::assertSent(function ($request) {
        $text = $request['text'];

        return str_contains($text, '2 boletos vencem amanhã')
            && str_contains($text, 'Internet')
            && str_contains($text, 'DAS')
            && str_contains($text, $this->scenario->company->name);
    });
});
