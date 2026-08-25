<?php

declare(strict_types=1);

namespace App\UseCases\Goal;

use App\DTOs\RegisterGoalData;
use App\Enums\GoalStatus;
use App\Models\Goal;

/**
 * Cadastra uma meta financeira (capítulo 9.7). Sempre começa `active`
 * com `current_amount` zerado — progresso só entra depois, via
 * {@see UpdateGoalProgress}, quando um lançamento é marcado como aporte.
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
final class CreateGoal
{
    public function execute(RegisterGoalData $data): Goal
    {
        return Goal::create([
            'context_id' => $data->contextId,
            'name' => $data->name,
            'target_amount' => $data->targetAmount,
            'current_amount' => 0,
            'target_date' => $data->targetDate,
            'status' => GoalStatus::Active->value,
            'notes' => $data->notes,
        ]);
    }
}
