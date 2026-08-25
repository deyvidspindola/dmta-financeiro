<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Goal\CreateGoal;

/**
 * Entrada do caso de uso {@see CreateGoal}.
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
final readonly class RegisterGoalData
{
    public function __construct(
        public int $contextId,
        public string $name,
        public float $targetAmount,
        public ?string $targetDate = null,
        public ?string $notes = null,
    ) {}
}
