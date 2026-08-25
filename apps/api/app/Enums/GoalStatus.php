<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\Goal;
use App\UseCases\Goal\UpdateGoalProgress;

/**
 * Situação de uma {@see Goal}. Passa a `Completed` sozinha quando
 * {@see UpdateGoalProgress} detecta
 * `current_amount >= target_amount` — nunca por ação manual do usuário
 * (evita marcar "concluída" com valor ainda faltando).
 *
 * @package App\Enums
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
enum GoalStatus: string
{
    case Active = 'active';
    case Completed = 'completed';
}
