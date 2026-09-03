<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Linha inválida na planilha de importação de fatura de cartão.
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class InvalidCardInvoiceImportRowException extends DomainException {}
