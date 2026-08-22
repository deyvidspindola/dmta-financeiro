<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

use App\Models\StatementEntry;
use App\UseCases\Transaction\ImportStatementFromCsv;

/**
 * Lançada quando uma linha da planilha de importação de extrato não tem
 * dado suficiente/válido pra virar um {@see StatementEntry}.
 * Capturada linha a linha por
 * {@see ImportStatementFromCsv} — nunca aborta
 * o restante do lote.
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final class InvalidStatementImportRowException extends DomainException {}
