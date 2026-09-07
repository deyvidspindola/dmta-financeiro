<?php

declare(strict_types=1);

namespace App\Domain\Capture;

use App\DTOs\TransactionDraftData;
use App\Enums\CaptureOrigin;
use App\Enums\StatementEntryType;
use App\Enums\TelegramConversationStage;
use App\Models\Category;
use App\Models\Context;
use App\Models\TelegramConversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

/**
 * Implementação de produção de {@see QuickEntryChannelInterface} —
 * conversa guiada em 2 ou 3 passos: valor → [contexto, só se houver mais
 * de um] → categoria. Contexto entra antes de categoria porque categoria
 * é sempre de um contexto específico (D-12).
 *
 * Estado entre mensagens fica em {@see TelegramConversation} (webhook é
 * stateless). O nome de contexto/categoria é casado por "a resposta está
 * contida no nome" (sem acento) — e quando não bate, o bot lista as
 * opções válidas pro usuário copiar o nome exato, ou "cancelar" pra sair.
 *
 * @package App\Domain\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   25/08/2026
 *
 * @updated 07/09/2026
 */
final class TelegramQuickEntryChannel implements QuickEntryChannelInterface
{
    public function __construct(private readonly TelegramMessageParser $parser) {}

    public function origin(): CaptureOrigin
    {
        return CaptureOrigin::Telegram;
    }

    public function cancel(string $chatId): void
    {
        TelegramConversation::query()->where('chat_id', $chatId)->delete();
    }

    public function parseMessage(string $chatId, string $message): ?TransactionDraftData
    {
        $user = $this->owner();

        if ($user === null || str_starts_with(trim($message), '/')) {
            $this->cancel($chatId);

            return null;
        }

        $conversation = TelegramConversation::query()->firstOrCreate(
            ['chat_id' => $chatId],
            ['stage' => TelegramConversationStage::AwaitingAmount->value, 'draft' => []],
        );

        /** @var TelegramConversationStage $stage */
        $stage = $conversation->stage;

        return match ($stage) {
            TelegramConversationStage::AwaitingAmount => $this->handleAmount($conversation, $message, $user),
            TelegramConversationStage::AwaitingContext => $this->handleContext($conversation, $message, $user),
            TelegramConversationStage::AwaitingCategory => $this->handleCategory($conversation, $message),
        };
    }

    public function describeExpectedReply(string $chatId): ?string
    {
        $conversation = TelegramConversation::query()->where('chat_id', $chatId)->first();

        if ($conversation === null) {
            return null;
        }

        /** @var TelegramConversationStage $stage */
        $stage = $conversation->stage;

        return match ($stage) {
            TelegramConversationStage::AwaitingAmount => 'Manda o valor e uma descrição (ex.: "gastei 45 no mercado").',
            TelegramConversationStage::AwaitingContext => 'Em qual contexto? '.$this->options($this->owner()?->contexts()->pluck('name')->all() ?? []),
            TelegramConversationStage::AwaitingCategory => $this->categoryPrompt($conversation),
        };
    }

    private function owner(): ?User
    {
        // O e-mail já foi validado por HandleTelegramMessage antes de chegar aqui.
        $email = config('services.telegram.user_email');

        return $email ? User::query()->where('email', $email)->first() : null;
    }

    private function handleAmount(TelegramConversation $conversation, string $message, User $user): ?TransactionDraftData
    {
        $amount = $this->parser->extractAmount($message);

        if ($amount === null) {
            return null;
        }

        $draft = [
            'amount' => $amount,
            'type' => $this->parser->extractType($message)->value,
            'description' => $this->parser->extractDescription($message),
        ];

        $contexts = $user->contexts()->get();

        if ($contexts->count() === 1) {
            $draft = [...$draft, ...$this->contextFields($contexts->first())];
            $next = TelegramConversationStage::AwaitingCategory;
        } else {
            $next = TelegramConversationStage::AwaitingContext;
        }

        $conversation->update(['draft' => $draft, 'stage' => $next->value]);

        return $this->toDto($draft);
    }

    private function handleContext(TelegramConversation $conversation, string $message, User $user): ?TransactionDraftData
    {
        $context = $user->contexts()->get()
            ->first(fn (Context $c) => $this->matches($c->name, $message));

        if ($context === null) {
            return null;
        }

        /** @var array<string, mixed> $current */
        $current = $conversation->draft;
        $draft = [...$current, ...$this->contextFields($context)];
        $conversation->update(['draft' => $draft, 'stage' => TelegramConversationStage::AwaitingCategory->value]);

        return $this->toDto($draft);
    }

    private function handleCategory(TelegramConversation $conversation, string $message): ?TransactionDraftData
    {
        /** @var array<string, mixed> $draft */
        $draft = $conversation->draft;
        $category = $this->categoriesFor($draft)
            ->first(fn (Category $c) => $this->matches($c->name, $message));

        if ($category === null) {
            return null;
        }

        $draft['category_id'] = $category->id;
        $conversation->delete();

        return $this->toDto($draft);
    }

    private function categoryPrompt(TelegramConversation $conversation): string
    {
        /** @var array<string, mixed> $draft */
        $draft = $conversation->draft;

        if (($draft['account_id'] ?? null) === null) {
            $this->cancel((string) $conversation->chat_id);

            return 'Esse contexto não tem conta cadastrada — cadastre uma no app antes de lançar por aqui.';
        }

        $names = $this->categoriesFor($draft)->pluck('name')->all();

        if ($names === []) {
            $this->cancel((string) $conversation->chat_id);

            return 'Esse contexto não tem categoria cadastrada pra esse tipo — cadastre uma no app primeiro.';
        }

        return 'Qual categoria? '.$this->options($names);
    }

    /**
     * @param  array<string, mixed>  $draft
     * @return Collection<int, Category>
     */
    private function categoriesFor(array $draft): Collection
    {
        return Category::query()
            ->where('context_id', $draft['context_id'] ?? 0)
            ->where('type', $draft['type'] ?? '')
            ->orderBy('name')
            ->get();
    }

    /** A resposta do usuário (parte do) nome da opção, sem acento. Não o contrário — "gastei 100..." não pode casar com "gás". */
    private function matches(string $name, string $message): bool
    {
        $b = $this->normalize($message);

        return $b !== '' && str_contains($this->normalize($name), $b);
    }

    private function normalize(string $value): string
    {
        $value = mb_strtolower(trim($value));

        return strtr($value, [
            'á' => 'a', 'à' => 'a', 'ã' => 'a', 'â' => 'a', 'é' => 'e', 'ê' => 'e',
            'í' => 'i', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ú' => 'u', 'ç' => 'c',
        ]);
    }

    /** @param  list<string>  $names */
    private function options(array $names): string
    {
        return $names === [] ? 'Responda com o nome.' : 'Opções: '.implode(', ', $names).'.';
    }

    /** @return array{context_id: int, account_id: ?int} */
    private function contextFields(Context $context): array
    {
        return ['context_id' => $context->id, 'account_id' => $context->accounts()->first()?->id];
    }

    /** @param  array<string, mixed>  $draft */
    private function toDto(array $draft): TransactionDraftData
    {
        return new TransactionDraftData(
            description: $draft['description'] ?? '',
            amount: $draft['amount'] ?? null,
            type: isset($draft['type']) ? StatementEntryType::from($draft['type']) : null,
            categoryId: $draft['category_id'] ?? null,
            contextId: $draft['context_id'] ?? null,
            accountId: $draft['account_id'] ?? null,
        );
    }
}
