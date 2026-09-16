<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\DTOs\TransferBetweenAccountsData;
use App\Enums\CaptureOrigin;
use App\Enums\CategoryType;
use App\Enums\StatementEntryStatus;
use App\Enums\StatementEntryType;
use App\Enums\TransferRole;
use App\Exceptions\Domain\AccountContextMismatchException;
use App\Exceptions\Domain\SameAccountTransferException;
use App\Exceptions\Domain\TransferCategoryMismatchException;
use App\Http\Controllers\Api\V1\TransferController;
use App\Models\Account;
use App\Models\Category;
use App\Models\StatementEntry;
use Illuminate\Support\Facades\DB;

/**
 * Transfere valor entre duas contas. Mesmo contexto: puro movimento de
 * saldo, `type = transfer`, sem categoria, nunca entra em receita/despesa.
 * Contextos diferentes (PF ⇄ empresa): transação de verdade entre duas
 * entidades (ex.: pró-labore) — origem vira `expense`, destino vira
 * `income`, categoria opcional do próprio contexto em cada perna;
 * `DashboardSummaryService`/`DashboardEvolutionService` excluem o par da
 * visão consolidada (D-20). Autorização de contexto é de quem chama
 * ({@see TransferController}) — aqui só confere que cada conta bate com
 * o contexto passado pro seu lado.
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   21/08/2026
 *
 * @updated 16/09/2026
 */
final class TransferBetweenAccounts
{
    /**
     * @return array{from: StatementEntry, to: StatementEntry}
     *
     * @throws SameAccountTransferException Origem e destino são a mesma conta.
     * @throws AccountContextMismatchException Conta não pertence ao contexto do seu lado.
     * @throws TransferCategoryMismatchException Categoria de outro contexto ou tipo errado.
     */
    public function execute(TransferBetweenAccountsData $data): array
    {
        if ($data->fromAccountId === $data->toAccountId) {
            throw new SameAccountTransferException;
        }
        $crossContext = $data->fromContextId !== $data->toContextId;

        return DB::transaction(function () use ($data, $crossContext): array {
            /** @var Account $from */
            $from = Account::query()->whereKey($data->fromAccountId)->lockForUpdate()->firstOrFail();
            /** @var Account $to */
            $to = Account::query()->whereKey($data->toAccountId)->lockForUpdate()->firstOrFail();
            if ($from->context_id !== $data->fromContextId || $to->context_id !== $data->toContextId) {
                throw new AccountContextMismatchException;
            }
            $fromCategoryId = $this->resolveCategory($crossContext, $data->fromCategoryId, $data->fromContextId, CategoryType::Expense);
            $toCategoryId = $this->resolveCategory($crossContext, $data->toCategoryId, $data->toContextId, CategoryType::Income);
            $fromType = $crossContext ? StatementEntryType::Expense : StatementEntryType::Transfer;
            $toType = $crossContext ? StatementEntryType::Income : StatementEntryType::Transfer;
            $fromEntry = $this->buildLeg($from, $fromCategoryId, $fromType, TransferRole::Origin, $data);
            $toEntry = $this->buildLeg($to, $toCategoryId, $toType, TransferRole::Destination, $data);
            $toEntry->update(['transfer_pair_id' => $fromEntry->id]);
            $fromEntry->update(['transfer_pair_id' => $toEntry->id]);
            $from->decrement('balance', $data->amount);
            $to->increment('balance', $data->amount);

            return ['from' => $fromEntry->fresh(), 'to' => $toEntry->fresh()];
        });
    }

    private function buildLeg(
        Account $account,
        ?int $categoryId,
        StatementEntryType $type,
        TransferRole $role,
        TransferBetweenAccountsData $data,
    ): StatementEntry {
        return StatementEntry::create([
            'context_id' => $account->context_id,
            'account_id' => $account->id,
            'category_id' => $categoryId,
            'description' => $data->description,
            'amount' => $data->amount,
            'type' => $type->value,
            'transfer_role' => $role->value,
            'status' => StatementEntryStatus::Settled->value,
            'settled_at' => now(),
            'occurred_at' => $data->occurredAt,
            'origin' => CaptureOrigin::Manual->value,
        ]);
    }

    /** @throws TransferCategoryMismatchException Categoria não existe, é de outro contexto, ou tem o tipo errado. */
    private function resolveCategory(bool $crossContext, ?int $categoryId, int $contextId, CategoryType $expectedType): ?int
    {
        if (! $crossContext || $categoryId === null) {
            return null;
        }
        // Filtra `type` na query (evita comparar `$category->type` em PHP —
        // Larastan não infere o cast de enum aí, ver CreateCategory).
        $exists = Category::query()->whereKey($categoryId)->where('context_id', $contextId)->where('type', $expectedType->value)->exists();

        if (! $exists) {
            throw new TransferCategoryMismatchException;
        }

        return $categoryId;
    }
}
