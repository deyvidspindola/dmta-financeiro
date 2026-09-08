<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Capture\TelegramCategorySuggester;
use App\DTOs\UpdateTransactionData;
use App\Enums\CaptureOrigin;
use App\Exceptions\Domain\TransactionNotEditableException;
use App\Models\StatementEntry;
use App\Models\TelegramConversation;
use App\UseCases\Transaction\UpdateTransaction;
use Illuminate\Support\Collection;

/**
 * "categoria" no bot do Telegram: troca só a categoria do último
 * lançamento registrado pela conversa (`draft._txn`) via
 * {@see UpdateTransaction}, sem refazer o lançamento. Dois passos —
 * {@see self::start()} lista as opções, {@see self::apply()} grava a
 * escolha. Não mexe em lançamento que não seja de origem `telegram`, nem
 * em perna de transferência / vínculo de boleto (o {@see UpdateTransaction}
 * recusa e a mensagem explica).
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 */
final class TelegramCategoryReclassifier
{
    private const MAX_OPTIONS = 12;

    public function __construct(
        private readonly UpdateTransaction $updateTransaction,
        private readonly TelegramCategorySuggester $suggester,
        private readonly TelegramReplyFormatter $formatter,
    ) {}

    /** A conversa está no meio de uma troca de categoria (esperando o número). */
    public function isAwaiting(string $chatId): bool
    {
        $conversation = $this->conversation($chatId);

        return $conversation !== null && isset($this->draftOf($conversation)['_reclassify']);
    }

    /**
     * Passo 1: lista as categorias possíveis pro último lançamento.
     *
     * @return array{0: string, 1: ?string, 2: string} outcome/detail/reply pro HandleTelegramMessage
     */
    public function start(string $chatId): array
    {
        $conversation = $this->conversation($chatId);
        $entry = $conversation !== null ? $this->lastEntry($this->draftOf($conversation)) : null;

        if ($entry === null) {
            return ['reclassify_nothing', null, 'Não achei um lançamento recente do bot pra trocar a categoria.'];
        }

        $options = $this->options($entry);

        if ($options === []) {
            return ['reclassify_nothing', null, 'Esse contexto não tem categoria pra esse tipo.'];
        }

        $draft = $this->draftOf($conversation);
        $draft['_reclassify'] = ['txn' => $entry->getKey(), 'options' => $options];
        $conversation->update(['draft' => $draft]);

        return ['reclassify_asked', "txn:{$entry->getKey()}", "Qual a categoria certa pra \"{$entry->description}\"?\n"
            .$this->formatter->numbered($options)."\n\n(número, ou \"cancelar\")"];
    }

    /**
     * Passo 2: grava a categoria escolhida (por número).
     *
     * @return array{0: string, 1: ?string, 2: string}
     */
    public function apply(string $chatId, string $message): array
    {
        $conversation = $this->conversation($chatId);
        $state = $conversation !== null ? ($this->draftOf($conversation)['_reclassify'] ?? null) : null;

        if ($conversation === null || ! is_array($state)) {
            return ['reclassify_nothing', null, 'Não achei o que reclassificar. Manda um novo lançamento.'];
        }

        /** @var list<array{n: int, id: int, label: string}> $options */
        $options = $state['options'];
        $chosen = ctype_digit(trim($message))
            ? Collection::make($options)->firstWhere('n', (int) trim($message))
            : null;

        if (! is_array($chosen)) {
            return ['reclassify_asked', null, "Responde o número:\n".$this->formatter->numbered($options)];
        }

        $this->clear($conversation);
        $entry = StatementEntry::query()->find($state['txn']);

        if ($entry === null || $entry->origin !== CaptureOrigin::Telegram->value) {
            return ['reclassify_nothing', null, 'O lançamento não está mais aqui.'];
        }

        try {
            $updated = $this->updateTransaction->execute($entry, $this->dataWithCategory($entry, (int) $chosen['id']));
        } catch (TransactionNotEditableException) {
            return ['reclassify_blocked', null, 'Esse lançamento não dá pra reclassificar por aqui (transferência ou boleto).'];
        }

        return ['reclassified', "txn:{$entry->getKey()}", $this->formatter->reclassified($updated, (string) $chosen['label'])];
    }

    private function dataWithCategory(StatementEntry $entry, int $categoryId): UpdateTransactionData
    {
        return new UpdateTransactionData(
            accountId: (int) $entry->account_id,
            description: (string) $entry->description,
            amount: (float) $entry->amount,
            // @phpstan-ignore-next-line argument.type (larastan infere os casts de StatementEntry errado — ver Models/StatementEntry.php)
            type: $entry->type,
            // @phpstan-ignore-next-line method.nonObject (idem — occurred_at é Carbon em runtime)
            occurredAt: $entry->occurred_at->toDateString(),
            categoryId: $categoryId,
            goalId: $entry->goal_id !== null ? (int) $entry->goal_id : null,
        );
    }

    /**
     * @param  array<string, mixed>  $draft
     */
    private function lastEntry(array $draft): ?StatementEntry
    {
        $id = $draft['_txn'] ?? null;
        $entry = $id !== null ? StatementEntry::query()->find($id) : null;

        return $entry !== null && $entry->origin === CaptureOrigin::Telegram->value ? $entry : null;
    }

    /** @return list<array{n: int, id: int, label: string}> */
    private function options(StatementEntry $entry): array
    {
        // @phpstan-ignore-next-line property.nonObject (larastan infere StatementEntry->type como string — ver Models/StatementEntry.php)
        $ranked = $this->suggester->rank((string) $entry->description, (int) $entry->context_id, $entry->type->value);

        $options = [];
        foreach (array_slice($ranked, 0, self::MAX_OPTIONS) as $i => $category) {
            $options[] = ['n' => $i + 1, 'id' => $category['id'], 'label' => $category['name']];
        }

        return $options;
    }

    private function conversation(string $chatId): ?TelegramConversation
    {
        return TelegramConversation::query()->where('chat_id', $chatId)->first();
    }

    /** @return array<string, mixed> */
    private function draftOf(TelegramConversation $conversation): array
    {
        /** @var array<string, mixed> $draft */
        $draft = $conversation->draft;

        return $draft;
    }

    private function clear(TelegramConversation $conversation): void
    {
        $draft = $this->draftOf($conversation);
        unset($draft['_reclassify']);
        $conversation->update(['draft' => $draft]);
    }
}
