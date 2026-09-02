<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\StatementEntry;

/**
 * Situação de um {@see StatementEntry} no fluxo de provisionamento.
 *
 * - `Pending` (previsto): o lançamento existe e aparece nas listas, mas
 *   ainda NÃO moveu `accounts.balance` — é uma receita a receber ou uma
 *   despesa a pagar.
 * - `Settled` (efetivado): o dinheiro entrou/saiu de fato; foi este
 *   lançamento que moveu o saldo da conta.
 *
 * "Saldo real" = só os `Settled`. "Saldo provisionado" = real + os
 * `Pending` do período. Ver App\UseCases\Transaction\SettleTransaction.
 *
 * @package App\Enums
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 *
 * @updated 02/09/2026
 */
enum StatementEntryStatus: string
{
    case Pending = 'pending';
    case Settled = 'settled';
}
