<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Transaction\TransferBetweenAccounts;

/**
 * Entrada do caso de uso {@see TransferBetweenAccounts}.
 * `fromContextId`/`toContextId` iguais é a transferência comum entre
 * contas do mesmo contexto — puro movimento de saldo, sem categoria,
 * nunca entra em receita/despesa de lugar nenhum. Diferentes (PF ⇄
 * empresa, ou entre duas empresas) é uma transação de verdade entre duas
 * entidades (ex.: pró-labore): a perna de origem vira despesa, a de
 * destino vira receita — cada uma pode levar categoria do seu próprio
 * contexto (`fromCategoryId`/`toCategoryId`, ambas opcionais).
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   21/08/2026
 *
 * @updated 16/09/2026
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
        public ?int $fromCategoryId = null,
        public ?int $toCategoryId = null,
    ) {}
}
