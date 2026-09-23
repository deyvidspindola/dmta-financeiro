<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Recurrence\RecurrenceWindow;
use App\DTOs\RegisterCardPurchaseData;
use App\DTOs\RegisterTransactionData;
use App\Http\Resources\CreditCardResource;
use App\Models\CardPurchase;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use App\UseCases\CreditCard\RegisterCardPurchase;
use App\UseCases\Transaction\RegisterRecurringTransaction;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Materializa em {@see StatementEntry} as ocorrências vencidas de uma
 * regra de lançamento recorrente e avança o cursor da regra.
 *
 * Extraído do job `GenerateRecurringTransactionEntries` porque passou a
 * ter dois donos: o job diário (varre todas as regras) e o caso de uso
 * {@see RegisterRecurringTransaction}, que
 * materializa na hora a ocorrência do mês corrente ao cadastrar a regra —
 * sem isso o lançamento só apareceria no dia seguinte, depois do cron.
 *
 * A matemática de "quais ocorrências venceram / qual o próximo cursor /
 * a regra acabou?" continua em {@see RecurrenceWindow}. Não abre transação
 * própria: cada ocorrência é gravada pela transação de {@see RegisterTransaction}.
 * Idempotente: ocorrência já gravada é pulada (checagem + índice único
 * `se_recurrence_occurrence_unique` como backstop).
 *
 * Regra de cartão (assinatura, `credit_card_id`) vira {@see CardPurchase}
 * via {@see RegisterCardPurchase} — e só materializa até
 * {@see self::CARD_HORIZON_MONTHS} à frente: compra no cartão consome
 * limite ({@see CreditCardResource}), e 12 meses de
 * assinatura adiantados travariam o limite disponível. O que fica além do
 * cursor continua projetado pela regra (orçamento/fluxo).
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   01/09/2026
 *
 * @updated 23/09/2026
 */
final class RecurringTransactionMaterializer
{
    /**
     * Quantos meses à frente materializar as ocorrências futuras (como
     * `pending`) — dá visibilidade dos próximos meses na lista sem esperar
     * cada data chegar. O job diário estende essa janela.
     */
    public const HORIZON_MONTHS = 12;

    /**
     * Horizonte de regra de cartão: a próxima cobrança já aparece na fatura
     * seguinte, sem ocupar o limite com meses de assinatura adiantados.
     */
    public const CARD_HORIZON_MONTHS = 1;

    public function __construct(
        private readonly RecurrenceWindow $window,
        private readonly RegisterTransaction $register,
        private readonly RegisterCardPurchase $registerCardPurchase,
    ) {}

    /**
     * Gera as ocorrências de `$rule` até `$asOf` (inclusive) e grava o
     * novo `next_occurrence_date` / `active` uma única vez ao final.
     * Ocorrência com data até hoje entra efetivada (moveu o saldo); data
     * futura entra `pending` (previsto) — ver {@see StatementEntry}.
     *
     * @param  RecurringTransaction  $rule  Regra ativa a processar.
     * @param  Carbon  $asOf  Data-limite — hoje + {@see self::HORIZON_MONTHS} nos chamadores.
     */
    public function materializeDue(RecurringTransaction $rule, Carbon $asOf): void
    {
        if ($rule->isCreditCard()) {
            $asOf = $asOf->copy()->min(Carbon::today()->addMonthsNoOverflow(self::CARD_HORIZON_MONTHS));
        }

        $result = $this->window->due(
            Carbon::parse($rule->next_occurrence_date),
            // @phpstan-ignore-next-line argument.type (cast RecurrenceInterval confirmado em runtime — larastan não infere casts())
            $rule->interval,
            $rule->end_date !== null ? Carbon::parse($rule->end_date) : null,
            $asOf,
        );

        $today = Carbon::today();

        foreach ($result['occurrences'] as $occurrence) {
            if ($rule->isCreditCard()) {
                $this->materializeCardPurchase($rule, $occurrence);

                continue;
            }

            $this->materializeOne($rule, $occurrence, settled: $occurrence->lte($today));
        }

        $rule->update([
            'next_occurrence_date' => $result['nextCursor'],
            'active' => ! $result['deactivate'],
        ]);
    }

    /** Cria o lançamento da ocorrência só se ele ainda não existe. */
    private function materializeOne(RecurringTransaction $rule, Carbon $occurrence, bool $settled): void
    {
        $alreadyDone = StatementEntry::query()
            ->where('recurring_transaction_id', $rule->id)
            ->whereDate('occurred_at', $occurrence->toDateString())
            ->exists();

        if ($alreadyDone) {
            return;
        }

        try {
            $this->register->execute(new RegisterTransactionData(
                contextId: $rule->context_id,
                accountId: $rule->account_id,
                description: $rule->description,
                amount: (float) $rule->amount,
                // @phpstan-ignore-next-line argument.type (verificado em runtime)
                type: $rule->type,
                occurredAt: $occurrence->toDateString(),
                categoryId: $rule->category_id,
                recurringTransactionId: $rule->id,
                settled: $settled,
            ));
        } catch (QueryException) {
            Log::warning('Ocorrência de lançamento recorrente já existia (índice único)', [
                'recurring_transaction_id' => $rule->id,
                'occurred_at' => $occurrence->toDateString(),
            ]);
        }
    }

    /** Cria a compra da ocorrência no cartão só se ela ainda não existe. */
    private function materializeCardPurchase(RecurringTransaction $rule, Carbon $occurrence): void
    {
        $alreadyDone = CardPurchase::query()
            ->where('recurring_transaction_id', $rule->id)
            ->whereDate('occurred_at', $occurrence->toDateString())
            ->exists();

        if ($alreadyDone) {
            return;
        }

        try {
            $this->registerCardPurchase->execute(new RegisterCardPurchaseData(
                contextId: $rule->context_id,
                creditCardId: (int) $rule->credit_card_id,
                description: $rule->description,
                amount: (float) $rule->amount,
                occurredAt: $occurrence->toDateString(),
                categoryId: $rule->category_id,
                recurringTransactionId: $rule->id,
            ));
        } catch (QueryException) {
            Log::warning('Ocorrência de assinatura no cartão já existia (índice único)', [
                'recurring_transaction_id' => $rule->id,
                'occurred_at' => $occurrence->toDateString(),
            ]);
        }
    }
}
