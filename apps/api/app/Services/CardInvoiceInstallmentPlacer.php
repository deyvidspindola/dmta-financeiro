<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\CardInvoiceRowData;
use App\Models\CardPurchase;
use App\Models\CreditCard;
use Illuminate\Support\Carbon;
use Ramsey\Uuid\Uuid;

/**
 * Coloca as compras de uma linha de fatura importada nas faturas certas
 * — uma só (à vista) ou a parcela N e as seguintes N+1..M nos meses
 * consecutivos. Idempotente por parcela: `installment_group` vem do
 * conteúdo e cada parcela já existente é pulada, então reimportar
 * faturas que se sobrepõem é seguro.
 *
 * Sem transação própria — só chame de dentro de um caso de uso que já
 * abriu uma (o `lockForUpdate` do cartão depende disso).
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class CardInvoiceInstallmentPlacer
{
    public function __construct(private readonly CardInvoiceResolver $invoices) {}

    /**
     * @param  array{reference_month: Carbon, due_date: Carbon}  $window  Janela da 1ª parcela.
     * @param  bool  $force  Ignora a dedup da compra à vista (linha marcada de propósito).
     * @return array{created: int, skipped: int}
     */
    public function place(CardInvoiceRowData $row, CreditCard $card, array $window, bool $force = false): array
    {
        if (! $row->isInstallment()) {
            return $this->placeSingle($row, $card, $window, $force);
        }

        return $this->placeInstallments($row, $card, $window);
    }

    /**
     * @param  array{reference_month: Carbon, due_date: Carbon}  $window
     * @return array{created: int, skipped: int}
     */
    private function placeSingle(CardInvoiceRowData $row, CreditCard $card, array $window, bool $force): array
    {
        if ($this->singleExists($row) && ! $force) {
            return ['created' => 0, 'skipped' => 1];
        }

        $this->create($row, $card, $window['reference_month'], $window['due_date'], null, null, null);

        return ['created' => 1, 'skipped' => 0];
    }

    /**
     * @param  array{reference_month: Carbon, due_date: Carbon}  $window
     * @return array{created: int, skipped: int}
     */
    private function placeInstallments(CardInvoiceRowData $row, CreditCard $card, array $window): array
    {
        $group = $this->groupFor($row);
        $created = 0;
        $skipped = 0;

        for ($number = $row->firstInstallment; $number <= $row->installmentTotal; $number++) {
            if ($this->installmentExists($row, $number)) {
                $skipped++;

                continue;
            }

            $offset = $number - 1;
            $this->create(
                $row,
                $card,
                $window['reference_month']->copy()->addMonthsNoOverflow($offset),
                $window['due_date']->copy()->addMonthsNoOverflow($offset),
                $number,
                $row->installmentTotal,
                $group,
            );
            $created++;
        }

        return ['created' => $created, 'skipped' => $skipped];
    }

    /** A compra à vista dessa linha já está lançada nesse cartão? */
    public function singleExists(CardInvoiceRowData $row): bool
    {
        return CardPurchase::query()
            ->where('credit_card_id', $row->creditCardId)
            ->whereDate('occurred_at', $row->occurredAt)
            ->where('amount', $row->amount)
            ->where('description', $row->description)
            ->whereNull('installment_number')
            ->exists();
    }

    /** A parcela `$number` dessa compra já está lançada nesse cartão? */
    public function installmentExists(CardInvoiceRowData $row, int $number): bool
    {
        return CardPurchase::query()
            ->where('credit_card_id', $row->creditCardId)
            ->where('description', $row->description)
            ->where('amount', $row->amount)
            ->where('installment_number', $number)
            ->where('installment_total', $row->installmentTotal)
            ->exists();
    }

    /** Quantas compras essa linha ainda criaria (0 = tudo já importado). */
    public function pendingCount(CardInvoiceRowData $row): int
    {
        if (! $row->isInstallment()) {
            return $this->singleExists($row) ? 0 : 1;
        }

        $pending = 0;

        for ($number = $row->firstInstallment; $number <= $row->installmentTotal; $number++) {
            if (! $this->installmentExists($row, $number)) {
                $pending++;
            }
        }

        return $pending;
    }

    private function create(
        CardInvoiceRowData $row,
        CreditCard $card,
        Carbon $referenceMonth,
        Carbon $dueDate,
        ?int $installmentNumber,
        ?int $installmentTotal,
        ?string $group,
    ): void {
        $invoice = $this->invoices->forMonth($card, $referenceMonth, $dueDate);

        CardPurchase::create([
            'context_id' => $row->contextId,
            'credit_card_id' => $card->id,
            'card_invoice_id' => $invoice->id,
            'category_id' => $row->categoryId,
            'description' => $row->description,
            'amount' => $row->amount,
            'occurred_at' => $row->occurredAt,
            'installment_number' => $installmentNumber,
            'installment_total' => $installmentTotal,
            'installment_group' => $group,
        ]);

        $invoice->increment('total_amount', $row->amount);
    }

    /** Grupo determinístico: parcelas da mesma compra se ligam mesmo vindas de faturas diferentes. */
    private function groupFor(CardInvoiceRowData $row): string
    {
        $key = implode('|', [$row->creditCardId, $row->description, $row->amount, $row->installmentTotal, $row->occurredAt]);

        return Uuid::uuid5(Uuid::NAMESPACE_OID, $key)->toString();
    }
}
