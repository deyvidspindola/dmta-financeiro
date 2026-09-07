<?php

declare(strict_types=1);

namespace App\Domain\Capture;

use App\DTOs\TransactionDraftData;

/**
 * Interpreta uma mensagem de texto recebida do bot do Telegram e produz
 * um rascunho de lançamento (capítulo 6.4, `docs/03_INTERFACES_PLUGAVEIS.md`).
 * F1 usa conversa guiada (pergunta valor → contexto → categoria quando
 * faltar informação) — evita depender de NLP. Uma implementação futura
 * mais sofisticada pode substituir esta sem mudar o Controller do
 * webhook.
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
interface QuickEntryChannelInterface extends TransactionCaptureChannelInterface
{
    /**
     * Interpreta uma mensagem recebida e devolve o rascunho acumulado da
     * conversa (pode vir incompleto — ver {@see TransactionDraftData::isComplete()}),
     * ou `null` se a mensagem não foi entendida (não é um valor, ou a
     * resposta não bateu com nenhuma opção da pergunta atual).
     *
     * @param  string  $chatId  Identificador da conversa no Telegram.
     * @param  string  $message  Texto recebido.
     */
    public function parseMessage(string $chatId, string $message): ?TransactionDraftData;

    /** Descarta a conversa em aberto deste chat (comando "cancelar"). */
    public function cancel(string $chatId): void;

    /**
     * Descreve, em português, o que a conversa em aberto deste chat espera
     * como próxima resposta — com as opções válidas listadas quando fizer
     * sentido. `null` se não há conversa em aberto.
     */
    public function describeExpectedReply(string $chatId): ?string;
}
