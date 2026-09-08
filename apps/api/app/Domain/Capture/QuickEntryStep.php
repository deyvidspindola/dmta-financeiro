<?php

declare(strict_types=1);

namespace App\Domain\Capture;

use App\DTOs\TransactionDraftData;

/**
 * O resultado de processar uma mensagem do bot: ou o rascunho está
 * completo e pronto pra virar lançamento (`ready`), ou o bot precisa
 * mostrar/repetir uma pergunta (`needInput`), ou a mensagem não faz
 * sentido nesse ponto (`notUnderstood`), ou a conversa foi descartada
 * (`cancelled`).
 *
 * O texto de `ready` é composto pelo caso de uso depois de registrar
 * (precisa do lançamento salvo) — aqui `reply` fica vazio.
 *
 * @package App\Domain\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
final readonly class QuickEntryStep
{
    private function __construct(
        public string $kind,
        public string $reply,
        public ?TransactionDraftData $draft = null,
    ) {}

    public static function ready(TransactionDraftData $draft): self
    {
        return new self('ready', '', $draft);
    }

    public static function needInput(string $reply): self
    {
        return new self('need_input', $reply);
    }

    public static function notUnderstood(string $reply): self
    {
        return new self('not_understood', $reply);
    }

    public static function cancelled(string $reply): self
    {
        return new self('cancelled', $reply);
    }
}
