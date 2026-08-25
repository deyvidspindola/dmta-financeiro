<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Goal\UpdateGoal;
use App\UseCases\Goal\UpdateGoalProgress;

/**
 * Entrada do caso de uso {@see UpdateGoal}. Não inclui `current_amount`
 * nem `status` — isso é exclusivo de
 * {@see UpdateGoalProgress}, disparado por
 * lançamento marcado como aporte, nunca editado à mão.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final readonly class UpdateGoalData
{
    public function __construct(
        public string $name,
        public float $targetAmount,
        public ?string $targetDate = null,
        public ?string $notes = null,
    ) {}
}
