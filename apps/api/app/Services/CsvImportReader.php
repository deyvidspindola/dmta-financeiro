<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Throwable;

/**
 * Lê planilha CSV de importação: valida cabeçalho e itera linhas de
 * dados. Não interpreta colunas de negócio — só normaliza o arquivo
 * para o caso de uso montar preview/import.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class CsvImportReader
{
    /**
     * Percorre as linhas de dados (a partir da 2). Linhas em branco são
     * ignoradas. Fecha o handle ao terminar o gerador.
     *
     * @param  list<string>  $requiredColumns
     * @param  class-string<Throwable>  $exceptionClass
     * @return \Generator<int, array{line: int, raw: array<string, string>}>
     *
     * @throws Throwable Se o arquivo estiver vazio ou faltar coluna obrigatória.
     */
    public function eachRow(UploadedFile $file, array $requiredColumns, string $exceptionClass): \Generator
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $header = $this->readHeader($handle, $requiredColumns, $exceptionClass);
        $rowNumber = 1;

        try {
            while (($cells = fgetcsv($handle, escape: '\\')) !== false) {
                $rowNumber++;

                if ($cells === [null]) {
                    continue;
                }

                $raw = array_combine(
                    $header,
                    array_pad(array_slice($cells, 0, count($header)), count($header), ''),
                );

                yield ['line' => $rowNumber, 'raw' => $raw];
            }
        } finally {
            fclose($handle);
        }
    }

    /**
     * @param  resource  $handle
     * @param  list<string>  $requiredColumns
     * @param  class-string<Throwable>  $exceptionClass
     * @return list<string>
     */
    private function readHeader($handle, array $requiredColumns, string $exceptionClass): array
    {
        $header = fgetcsv($handle, escape: '\\');

        if ($header === false || $header === [null]) {
            throw $this->makeException($exceptionClass, 'Planilha vazia.');
        }

        $header[0] = preg_replace('/^\x{FEFF}/u', '', (string) $header[0]) ?? $header[0];
        $header = array_map(static fn (string $column) => mb_strtolower(trim($column)), $header);
        $missing = array_diff($requiredColumns, $header);

        if ($missing !== []) {
            throw $this->makeException(
                $exceptionClass,
                'Colunas obrigatórias faltando: '.implode(', ', $missing).'.',
            );
        }

        return $header;
    }

    /** @param  class-string<Throwable>  $exceptionClass */
    private function makeException(string $exceptionClass, string $message): Throwable
    {
        return new $exceptionClass($message);
    }
}
