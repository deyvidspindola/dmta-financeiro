<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\Exceptions\Domain\StatementPdfPasswordRequiredException;
use App\Services\StatementImportClassifier;
use App\Services\StatementRowReader;
use Illuminate\Http\UploadedFile;

/**
 * Classifica linhas de um extrato (CSV **ou** PDF) sem gravar — etapa de
 * preview antes de {@see ImportStatement}. PDF protegido cujo segredo
 * nada abriu não é erro aqui: volta `needs_password` pra tela pedir a
 * senha.
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   03/09/2026
 *
 * @updated 16/09/2026
 */
final class PreviewStatement
{
    /** Texto de PDF mostrado no preview quando nada foi identificado — corta em ~12k. */
    private const RAW_TEXT_LIMIT = 12000;

    public function __construct(
        private readonly StatementRowReader $reader,
        private readonly StatementImportClassifier $classifier,
    ) {}

    /**
     * @return array{rows: list<array<string, mixed>>, summary: array{total: int, ok: int, duplicates: int, invalid: int}, bank: ?string, needs_password: bool, unsupported: bool, raw_text: ?string}
     */
    public function execute(UploadedFile $file, int $contextId, int $accountId, ?string $pdfPassword = null): array
    {
        $summary = ['total' => 0, 'ok' => 0, 'duplicates' => 0, 'invalid' => 0];

        try {
            $read = $this->reader->read($file, $pdfPassword);
        } catch (StatementPdfPasswordRequiredException $e) {
            return ['rows' => [], 'summary' => $summary, 'bank' => null, 'needs_password' => true, 'unsupported' => $e->unsupported, 'raw_text' => null];
        }

        $rows = [];

        foreach ($read['rows'] as $item) {
            $classified = $this->classifier->classify($item['raw'], $item['line'], $contextId, $accountId);
            $rows[] = $classified;
            $summary['total']++;
            $summary[match ($classified['status']) {
                'ok' => 'ok',
                'duplicate' => 'duplicates',
                default => 'invalid',
            }]++;
        }

        return [
            'rows' => $rows,
            'summary' => $summary,
            'bank' => $read['bank'],
            'needs_password' => false,
            'unsupported' => false,
            'raw_text' => $read['pdf_text'] !== null ? mb_substr($read['pdf_text'], 0, self::RAW_TEXT_LIMIT) : null,
        ];
    }
}
