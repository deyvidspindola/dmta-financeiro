<?php

declare(strict_types=1);

namespace App\Domain\Capture;

use App\Enums\CaptureOrigin;

/**
 * Contrato comum a qualquer canal que produz um rascunho de lançamento
 * (boleto, despesa, receita) a partir de uma fonte externa (D-06, F1).
 *
 * Implementações NUNCA gravam no banco diretamente — devolvem um DTO que
 * um caso de uso consome. Isso mantém a regra de negócio (contexto,
 * categoria, confirmação humana) num único lugar, não espalhada em cada
 * integração. Ver `docs/03_INTERFACES_PLUGAVEIS.md`.
 *
 * @package App\Domain\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
interface TransactionCaptureChannelInterface
{
    /** Identifica a origem para o campo `origin` do lançamento/pendência. */
    public function origin(): CaptureOrigin;
}
