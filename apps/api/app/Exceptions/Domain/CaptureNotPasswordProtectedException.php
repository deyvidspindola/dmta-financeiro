<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

use App\UseCases\Bill\UnlockBillCapture;

/**
 * Lançada ao tentar desbloquear ({@see UnlockBillCapture})
 * uma pendência que não está (ou não está mais) com
 * `status: password_required` — já foi desbloqueada, confirmada,
 * rejeitada, ou nunca precisou de senha.
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class CaptureNotPasswordProtectedException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Esta pendência não está aguardando senha.');
    }
}
