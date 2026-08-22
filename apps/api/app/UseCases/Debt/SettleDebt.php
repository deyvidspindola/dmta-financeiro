<?php

declare(strict_types=1);

namespace App\UseCases\Debt;

use App\Enums\DebtStatus;
use App\Models\Debt;

/**
 * Marca uma dívida como quitada. Só atualiza o registro em si — se a
 * quitação também envolveu dinheiro saindo/entrando de uma conta de
 * verdade, isso é um lançamento à parte (`POST transactions`), não algo
 * que este caso de uso decide sozinho (ver docblock de {@see Debt}).
 *
 * @package App\UseCases\Debt
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final class SettleDebt
{
    public function execute(Debt $debt): Debt
    {
        $debt->update([
            'status' => DebtStatus::Settled->value,
            'settled_at' => now(),
        ]);

        return $debt->refresh();
    }
}
