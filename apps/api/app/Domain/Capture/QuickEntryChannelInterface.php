<?php

declare(strict_types=1);

namespace App\Domain\Capture;

/**
 * Assistente de lançamento rápido do bot do Telegram (capítulo 6.4,
 * `docs/03_INTERFACES_PLUGAVEIS.md`). Conversa guiada por listas
 * numeradas — o usuário digita o valor uma vez e responde os passos
 * seguintes só com números. Avança sozinho o que dá pra resolver sem
 * perguntar (contexto/conta únicos, categoria óbvia pelo histórico).
 * Sem NLP de verdade; uma implementação futura pode substituir esta sem
 * mudar o Controller do webhook.
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
interface QuickEntryChannelInterface extends TransactionCaptureChannelInterface
{
    /**
     * Processa uma mensagem e devolve o próximo passo da conversa.
     *
     * @param  string  $chatId  Identificador da conversa no Telegram.
     * @param  string  $message  Texto recebido.
     */
    public function handle(string $chatId, string $message): QuickEntryStep;

    /** Descarta a conversa em aberto deste chat. */
    public function cancel(string $chatId): void;

    /**
     * Marca a conversa como registrada (`Confirmed`), guardando o id do
     * lançamento pra um eventual "desfazer". Chamado pelo caso de uso
     * logo depois de gravar.
     */
    public function markRegistered(string $chatId, int $transactionId): void;
}
