<?php

declare(strict_types=1);

namespace App\UseCases\Goal;

use App\Enums\GoalStatus;
use App\Models\Goal;
use App\UseCases\Transaction\DeleteTransaction;
use App\UseCases\Transaction\RegisterTransaction;

/**
 * Aplica a variação de um aporte (ou o desfazer de um) sobre
 * `current_amount` e reavalia `status`. Chamado por
 * {@see RegisterTransaction} (delta positivo,
 * lançamento novo com `goal_id`) e por
 * {@see DeleteTransaction} (delta negativo,
 * lançamento apagado) — nunca chamado direto de um controller, um aporte
 * sempre é consequência de um lançamento real.
 *
 * `current_amount` nunca fica negativo (defensivo contra reversão dupla
 * ou dado inconsistente) — o pior caso vira progresso zerado, não um
 * número sem sentido na tela.
 *
 * @package App\UseCases\Goal
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final class UpdateGoalProgress
{
    public function execute(Goal $goal, float $delta): Goal
    {
        $current = max(0.0, (float) $goal->current_amount + $delta);
        $goal->update(['current_amount' => $current]);
        $goal->refresh();

        $goal->update([
            'status' => $goal->isComplete() ? GoalStatus::Completed->value : GoalStatus::Active->value,
        ]);

        return $goal->refresh();
    }
}
