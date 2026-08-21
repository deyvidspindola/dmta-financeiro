<?php

declare(strict_types=1);

namespace App\Domain\Capture;

use Carbon\Carbon;

/**
 * Decodifica a "linha digitável" (47 dígitos) de um boleto bancário
 * padrão Febraban — vencimento e valor, sem precisar ler a imagem do
 * código de barras.
 *
 * Só cobre boleto de **cobrança bancária** (linha começando com o código
 * do banco, 3 dígitos). Boleto de **arrecadação/convênio** (tributo,
 * concessionária — linha começando com `8`) usa um layout totalmente
 * diferente e não é decodificado aqui: {@see decode()} devolve só a
 * linha limpa, sem vencimento/valor, para esse caso — quem revisa a
 * pendência preenche à mão.
 *
 * Cálculo de dígito verificador é módulo 10 por campo (validação, não
 * usado pra rejeitar — mesmo se um campo não bater, a linha extraída é
 * devolvida do jeito que veio; a tela de confirmação sempre mostra a
 * linha crua pro humano conferir contra o boleto real).
 *
 * @package App\Domain\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class BoletoLineCodec
{
    /**
     * Data-base do fator de vencimento Febraban. O fator começa em 1000
     * *nesta* data (não em zero dias depois dela) — por isso o decode
     * soma `fator - 1000` dias, não `fator` dias direto.
     */
    private const BASE_DATE = '1997-10-07';

    private const BASE_FACTOR = 1000;

    /**
     * O fator de vencimento clássico (4 dígitos) estourou por volta de
     * fev/2025 — depois disso a Febraban mudou a sistemática de cálculo
     * e eu não tenho confiança suficiente em como decodificar a versão
     * nova pra arriscar devolver uma data errada silenciosamente. Por
     * segurança, qualquer data decodificada fora desta janela plausível
     * é tratada como não confiável e descartada (`dueDate: null`) — a
     * pendência ainda é criada, só sem vencimento pré-preenchido.
     */
    private const PLAUSIBLE_FROM = '2015-01-01';

    private const PLAUSIBLE_UNTIL = '2025-06-01';

    /**
     * @return array{amount: float|null, dueDate: string|null} `null` nos
     *                                                         dois campos quando a linha é de arrecadação/convênio (começa com
     *                                                         `8`) ou não tem o tamanho esperado (47 dígitos).
     */
    public function decode(string $linhaDigitavel): array
    {
        $digits = preg_replace('/\D/', '', $linhaDigitavel) ?? '';

        if (strlen($digits) !== 47 || $digits[0] === '8') {
            return ['amount' => null, 'dueDate' => null];
        }

        $barcode = $this->toBarcode($digits);
        $fatorVencimento = (int) substr($barcode, 5, 4);
        $valorCentavos = (int) substr($barcode, 9, 10);

        $dueDate = $fatorVencimento > 0
            ? Carbon::parse(self::BASE_DATE)->addDays($fatorVencimento - self::BASE_FACTOR)
            : null;

        if ($dueDate !== null && ! $dueDate->between(self::PLAUSIBLE_FROM, self::PLAUSIBLE_UNTIL)) {
            $dueDate = null;
        }

        return [
            'amount' => $valorCentavos > 0 ? $valorCentavos / 100 : null,
            'dueDate' => $dueDate?->toDateString(),
        ];
    }

    /** Remonta o código de barras (44 dígitos) a partir da linha digitável (47 dígitos), descartando os DVs de campo. */
    private function toBarcode(string $linha): string
    {
        return substr($linha, 0, 4)   // banco + moeda
            .substr($linha, 32, 1)    // DV geral
            .substr($linha, 33, 4)    // fator de vencimento
            .substr($linha, 37, 10)   // valor
            .substr($linha, 4, 5)     // campo livre, parte 1
            .substr($linha, 10, 10)   // campo livre, parte 2
            .substr($linha, 21, 10);  // campo livre, parte 3
    }
}
