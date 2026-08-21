<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Transaction\TransferBetweenAccounts;

/**
 * Entrada do caso de uso {@see TransferBetweenAccounts}.
 * `fromContextId`/`toContextId` podem ser o mesmo contexto (transferência
 * comum entre contas) ou diferentes (transferência entre PF e empresa,
 * ou entre duas empresas) — o caso de uso não distingue os dois casos,
 * só confere que cada conta pertence ao contexto informado pro seu lado.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final readonly class TransferBetweenAccountsData
{
    public function __construct(
        public int $fromContextId,
        public int $toContextId,
        public int $fromAccountId,
        public int $toAccountId,
        public float $amount,
        public string $description,
        public string $occurredAt,
    ) {}
}
