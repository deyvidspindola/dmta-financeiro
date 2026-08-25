<?php

declare(strict_types=1);

namespace App\UseCases\Goal;

use App\DTOs\UpdateGoalData;
use App\Enums\GoalStatus;
use App\Models\Goal;

/**
 * Atualiza nome, alvo, prazo e notas de uma meta já cadastrada. Não mexe
 * em `current_amount` — isso é exclusivo de {@see UpdateGoalProgress}.
 * Reavalia `status` porque mudar o alvo pode completar ou reabrir a
 * meta sem nenhum aporte novo (ex.: baixar o alvo pra um valor já
 * atingido).
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
final class UpdateGoal
{
    public function execute(Goal $goal, UpdateGoalData $data): Goal
    {
        $goal->update([
            'name' => $data->name,
            'target_amount' => $data->targetAmount,
            'target_date' => $data->targetDate,
            'notes' => $data->notes,
        ]);

        $goal->refresh();
        $goal->update([
            'status' => $goal->isComplete() ? GoalStatus::Completed->value : GoalStatus::Active->value,
        ]);

        return $goal->refresh();
    }
}
