<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\DTOs\RegisterCardPurchaseData;
use App\DTOs\RegisterRecurringTransactionData;
use App\Enums\RecurrenceInterval;
use App\Enums\StatementEntryType;
use App\Models\CardPurchase;
use App\Models\RecurringTransaction;
use App\Services\RecurringTransactionMaterializer;
use App\UseCases\Transaction\RegisterRecurringTransaction;

/**
 * Assinatura no cartão de crédito (pedido do dono, 23/09/2026): cria uma
 * {@see RecurringTransaction} com `credit_card_id` — despesa, sem conta —
 * via {@see RegisterRecurringTransaction}, que já materializa as cobranças
 * como {@see CardPurchase} até
 * {@see RecurringTransactionMaterializer::CARD_HORIZON_MONTHS} à frente.
 *
 * @package App\UseCases\CreditCard
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/09/2026
 *
 * @updated 23/09/2026
 */
final class RegisterCardSubscription
{
    public function __construct(private readonly RegisterRecurringTransaction $registerRecurring) {}

    /**
     * @param  RegisterCardPurchaseData  $data  Dados da compra; `occurredAt` é a 1ª cobrança.
     * @param  RecurrenceInterval  $interval  Frequência da assinatura.
     * @param  string|null  $endDate  Última data possível de cobrança (null = sem fim).
     * @return CardPurchase|RecurringTransaction A primeira cobrança gerada ou, se ela
     *                                           cai além do horizonte, a própria regra.
     */
    public function execute(
        RegisterCardPurchaseData $data,
        RecurrenceInterval $interval,
        ?string $endDate = null,
    ): CardPurchase|RecurringTransaction {
        $rule = $this->registerRecurring->execute(new RegisterRecurringTransactionData(
            contextId: $data->contextId,
            accountId: null,
            description: $data->description,
            amount: $data->amount,
            type: StatementEntryType::Expense,
            interval: $interval,
            startDate: $data->occurredAt,
            endDate: $endDate,
            categoryId: $data->categoryId,
            creditCardId: $data->creditCardId,
        ));

        return CardPurchase::query()
            ->where('recurring_transaction_id', $rule->id)
            ->oldest('occurred_at')
            ->first() ?? $rule;
    }
}
