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

/**
 * Implementação de produção de {@see QuickEntryChannelInterface} —
 * conversa guiada em 2 ou 3 passos: valor → [contexto, só se houver mais
 * de um] → categoria. Contexto entra antes de categoria mesmo o
 * documento de concepção sugerindo a ordem "valor → categoria →
 * contexto": categoria é sempre de um contexto específico neste modelo
 * de dados (D-12), não dá pra resolver o nome sem saber antes qual
 * contexto — decisão registrada aqui, não uma divergência silenciosa.
 *
 * Estado entre mensagens fica em {@see TelegramConversation} (webhook é
 * stateless). Sem `TELEGRAM_USER_EMAIL` configurado, não sabe de quem
 * são os contextos — devolve `null` sempre, mesmo espírito de
 * "desligado até configurar" do resto da F1.
 *
 * @package App\Domain\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final class TelegramQuickEntryChannel implements QuickEntryChannelInterface
{
    public function __construct(private readonly TelegramMessageParser $parser) {}

    public function origin(): CaptureOrigin
    {
        return CaptureOrigin::Telegram;
    }

    public function parseMessage(string $chatId, string $message): ?TransactionDraftData
    {
        $user = $this->owner();

        if ($user === null || str_starts_with(trim($message), '/')) {
            TelegramConversation::query()->where('chat_id', $chatId)->delete();

            return null;
        }

        $conversation = TelegramConversation::query()->firstOrCreate(
            ['chat_id' => $chatId],
            ['stage' => TelegramConversationStage::AwaitingAmount->value, 'draft' => []],
        );

        // stage já vem cast pra enum (casts() do model) — larastan não
        // infere isso sozinho, então ajuda com @var em vez de suprimir.
        /** @var TelegramConversationStage $stage */
        $stage = $conversation->stage;

        return match ($stage) {
            TelegramConversationStage::AwaitingAmount => $this->handleAmount($conversation, $message, $user),
            TelegramConversationStage::AwaitingContext => $this->handleContext($conversation, $message, $user),
            TelegramConversationStage::AwaitingCategory => $this->handleCategory($conversation, $message),
        };
    }

    private function owner(): ?User
    {
        // O e-mail já foi validado por HandleTelegramMessage antes de
        // chegar aqui — a checagem de null continua só por segurança.
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
            $conversation->update(['draft' => $draft, 'stage' => TelegramConversationStage::AwaitingCategory->value]);
        } else {
            $conversation->update(['draft' => $draft, 'stage' => TelegramConversationStage::AwaitingContext->value]);
        }

        return $this->toDto($draft);
    }

    private function handleContext(TelegramConversation $conversation, string $message, User $user): ?TransactionDraftData
    {
        $context = $user->contexts()
            ->get()
            ->first(fn (Context $c) => str_contains(mb_strtolower($c->name), mb_strtolower(trim($message))));

        if ($context === null) {
            return null;
        }

        /** @var array<string, mixed> $currentDraft */
        $currentDraft = $conversation->draft;
        $draft = [...$currentDraft, ...$this->contextFields($context)];
        $conversation->update(['draft' => $draft, 'stage' => TelegramConversationStage::AwaitingCategory->value]);

        return $this->toDto($draft);
    }

    private function handleCategory(TelegramConversation $conversation, string $message): ?TransactionDraftData
    {
        /** @var array<string, mixed> $draft */
        $draft = $conversation->draft;
        $category = Category::query()
            ->where('context_id', $draft['context_id'])
            ->where('type', $draft['type'])
            ->get()
            ->first(fn (Category $c) => str_contains(mb_strtolower($c->name), mb_strtolower(trim($message))));

        if ($category === null) {
            return null;
        }

        $draft['category_id'] = $category->id;
        $conversation->delete();

        return $this->toDto($draft);
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
