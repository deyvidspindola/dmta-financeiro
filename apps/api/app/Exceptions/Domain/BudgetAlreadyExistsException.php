<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada ao tentar criar um segundo teto para a mesma categoria no mesmo
 * mês (ou um segundo teto padrão). Edite o que já existe.
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 *
 * @updated 02/09/2026
 */
final class BudgetAlreadyExistsException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Já existe um orçamento para essa categoria nesse período.');
    }
}
