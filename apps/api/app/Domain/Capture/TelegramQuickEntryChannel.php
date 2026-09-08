<?php

declare(strict_types=1);

namespace App\Domain\Capture;

use App\DTOs\TransactionDraftData;
use App\Enums\CaptureOrigin;
use App\Enums\TelegramConversationStage;
use App\Models\Account;
use App\Models\TelegramConversation;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Assistente de lançamento rápido do bot do Telegram. O usuário manda
 * "gastei 100 no mercado" e responde os passos seguintes só com números.
 * Contexto e conta únicos são resolvidos sem perguntar; a categoria é
 * palpitada pelo histórico ({@see TelegramCategorySuggester}). Estado
 * entre mensagens em {@see TelegramConversation} (webhook é stateless).
 *
 * @package App\Domain\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   25/08/2026
 *
 * @updated 07/09/2026
 */
final class TelegramQuickEntryChannel implements QuickEntryChannelInterface
{
    private const MAX_OPTIONS = 12;

    public function __construct(
        private readonly TelegramMessageParser $parser,
        private readonly TelegramCategorySuggester $suggester,
    ) {}

    public function origin(): CaptureOrigin
    {
        return CaptureOrigin::Telegram;
    }

    public function cancel(string $chatId): void
    {
        TelegramConversation::query()->where('chat_id', $chatId)->delete();
    }

    public function markRegistered(string $chatId, int $transactionId): void
    {
        $conversation = TelegramConversation::query()->where('chat_id', $chatId)->first();

        if ($conversation !== null) {
            $draft = $this->draftOf($conversation);
            $draft['_txn'] = $transactionId;
            unset($draft['_options'], $draft['_field']);
            $conversation->update(['draft' => $draft, 'stage' => TelegramConversationStage::Confirmed->value]);
        }
    }

    public function handle(string $chatId, string $message): QuickEntryStep
    {
        $message = trim($message);
        $conversation = TelegramConversation::query()->firstOrCreate(
            ['chat_id' => $chatId],
            ['stage' => TelegramConversationStage::AwaitingAmount->value, 'draft' => []],
        );

        if (str_starts_with($message, '/')) {
            $this->cancel($chatId);

            return QuickEntryStep::notUnderstood($this->help());
        }

        /** @var TelegramConversationStage $stage */
        $stage = $conversation->stage;

        // Lançamento anterior já confirmado — qualquer mensagem começa um novo.
        if ($stage === TelegramConversationStage::Confirmed) {
            $conversation->update(['stage' => TelegramConversationStage::AwaitingAmount->value, 'draft' => []]);
            $stage = TelegramConversationStage::AwaitingAmount;
        }

        $draft = $this->draftOf($conversation);

        if (isset($draft['_options'])) {
            return $this->answerOption($conversation, $message);
        }

        if ($stage === TelegramConversationStage::AwaitingAmount) {
            $amount = $this->parser->extractAmount($message);

            if ($amount === null) {
                return QuickEntryStep::notUnderstood($this->help());
            }

            $conversation->update(['draft' => [
                'amount' => $amount,
                'type' => $this->parser->extractType($message)->value,
                'description' => $message,
            ]]);
        }

        return $this->advance($conversation->refresh());
    }

    private function answerOption(TelegramConversation $conversation, string $message): QuickEntryStep
    {
        $draft = $this->draftOf($conversation);
        /** @var list<array{n: int, id: int, label: string}> $options */
        $options = $draft['_options'];
        $field = (string) $draft['_field'];

        $chosen = ctype_digit($message)
            ? collect($options)->firstWhere('n', (int) $message)
            : collect($options)->first(fn (array $o): bool => $this->matches($o['label'], $message));

        if ($chosen === null) {
            return QuickEntryStep::needInput("Responde o número:\n".$this->numbered($options));
        }

        $draft[$field.'_id'] = $chosen['id'];
        unset($draft['_options'], $draft['_field']);
        $conversation->update(['draft' => $draft]);

        return $this->advance($conversation->refresh());
    }

    private function advance(TelegramConversation $conversation): QuickEntryStep
    {
        $user = $this->owner();

        if ($user === null) {
            return QuickEntryStep::notUnderstood($this->help());
        }

        $draft = $this->draftOf($conversation);

        if (! isset($draft['context_id'])) {
            $contexts = $user->contexts()->orderBy('name')->get(['id', 'name']);
            if ($contexts->count() > 1) {
                return $this->ask($conversation, 'context', 'Em qual contexto?', $contexts->map(
                    fn ($c): array => ['id' => (int) $c->id, 'label' => (string) $c->name],
                )->all());
            }

            $draft['context_id'] = $contexts->first()?->id;
            $conversation->update(['draft' => $draft]);
        }

        if (! isset($draft['account_id'])) {
            $accounts = Account::query()->where('context_id', $draft['context_id'])->orderBy('name')->get(['id', 'name']);
            if ($accounts->isEmpty()) {
                $conversation->delete();

                return QuickEntryStep::notUnderstood('Esse contexto não tem conta cadastrada — cadastra uma no app primeiro.');
            }

            if ($accounts->count() > 1) {
                return $this->ask($conversation, 'account', 'Qual conta?', $accounts->map(
                    fn ($a): array => ['id' => (int) $a->id, 'label' => (string) $a->name],
                )->all());
            }

            $draft['account_id'] = $accounts->first()->id;
            $conversation->update(['draft' => $draft]);
        }

        if (! isset($draft['category_id'])) {
            $ranked = $this->suggester->rank((string) $draft['description'], (int) $draft['context_id'], (string) $draft['type']);
            if ($ranked === []) {
                $conversation->delete();

                return QuickEntryStep::notUnderstood('Esse contexto não tem categoria pra esse tipo — cadastra uma no app primeiro.');
            }

            // Categoria sempre confirmada pelo dono (o palpite vem na opção
            // 1) — adivinhar sozinho já lançou na categoria errada. Atalho
            // só quando não há escolha.
            if (count($ranked) > 1) {
                return $this->ask($conversation, 'category', 'Qual categoria?', array_map(
                    fn (array $c): array => ['id' => $c['id'], 'label' => $c['name']],
                    $ranked,
                ));
            }

            $draft['category_id'] = $ranked[0]['id'];
            $conversation->update(['draft' => $draft]);
        }

        return QuickEntryStep::ready(TransactionDraftData::fromDraft($this->draftOf($conversation->refresh())));
    }

    /** @param  list<array{id: int, label: string}>  $items */
    private function ask(TelegramConversation $conversation, string $field, string $question, array $items): QuickEntryStep
    {
        $options = [];
        foreach (array_slice($items, 0, self::MAX_OPTIONS) as $i => $item) {
            $options[] = ['n' => $i + 1, 'id' => $item['id'], 'label' => $item['label']];
        }

        $draft = $this->draftOf($conversation);
        $draft['_options'] = $options;
        $draft['_field'] = $field;
        $stage = match ($field) {
            'context' => TelegramConversationStage::AwaitingContext,
            'account' => TelegramConversationStage::AwaitingAccount,
            default => TelegramConversationStage::AwaitingCategory,
        };
        $conversation->update(['draft' => $draft, 'stage' => $stage->value]);

        return QuickEntryStep::needInput($question."\n".$this->numbered($options)."\n\n(número, ou \"cancelar\")");
    }

    /** @param  list<array{n: int, id: int, label: string}>  $options */
    private function numbered(array $options): string
    {
        return implode("\n", array_map(fn (array $o): string => "{$o['n']}) {$o['label']}", $options));
    }

    /** @return array<string, mixed> */
    private function draftOf(TelegramConversation $conversation): array
    {
        /** @var array<string, mixed> $draft */
        $draft = $conversation->draft;

        return $draft;
    }

    private function owner(): ?User
    {
        $email = config('services.telegram.user_email');

        return $email ? User::query()->where('email', $email)->first() : null;
    }

    private function matches(string $label, string $message): bool
    {
        $needle = Str::of($message)->lower()->ascii()->trim()->toString();

        return $needle !== '' && str_contains(Str::of($label)->lower()->ascii()->toString(), $needle);
    }

    private function help(): string
    {
        return 'Manda o valor e a descrição, ex.: "gastei 45 no mercado" ou "recebi 200 de freela".';
    }
}
