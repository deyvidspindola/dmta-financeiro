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
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 25/08/2026
 */
final class BoletoLineCodec
{
    /**
     * Data-base da sistemática clássica do fator de vencimento Febraban.
     * O fator é a contagem de dias direto a partir daqui, sem deslocamento
     * — o exemplo canônico usado em toda documentação de boleto é
     * fator `1000` = `03/07/2000` (1000 dias depois de 07/10/1997).
     */
    private const BASE_DATE = '1997-10-07';

    /**
     * O campo de 4 dígitos da sistemática clássica esgota o intervalo
     * (`9999`) em 21/02/2025 — {@see BASE_DATE} `+ 9999` dias. A partir do
     * dia seguinte, a Febraban reiniciou a contagem em `1000` (não em
     * zero) usando esta nova data-base; por isso, ao contrário da
     * clássica, a sistemática atual subtrai {@see BASE_FACTOR}.
     */
    private const BASE_DATE_SINCE_2025 = '2025-02-22';

    private const BASE_FACTOR = 1000;

    /**
     * A linha digitável sozinha não diz qual das duas sistemáticas
     * (clássica ou pós-22/02/2025) o fator usa — o mesmo número de 4
     * dígitos decodifica pra datas completamente diferentes em cada uma.
     * {@see resolveDueDate()} calcula as duas e fica com a mais perto de
     * hoje: um boleto chega pra captura perto de ser emitido (ou vencido
     * há pouco), nunca anos de distância. Fora desta janela (± 5 anos),
     * nenhuma das duas é confiável — devolve `null` em vez de arriscar
     * uma data errada; a pendência ainda é criada, só sem vencimento
     * pré-preenchido.
     */
    private const PLAUSIBLE_WINDOW_DAYS = 365 * 5;

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

        return [
            'amount' => $valorCentavos > 0 ? $valorCentavos / 100 : null,
            'dueDate' => $this->resolveDueDate($fatorVencimento)?->toDateString(),
        ];
    }

    /** @see PLAUSIBLE_WINDOW_DAYS */
    private function resolveDueDate(int $fatorVencimento): ?Carbon
    {
        if ($fatorVencimento <= 0) {
            return null;
        }

        $classic = Carbon::parse(self::BASE_DATE)->addDays($fatorVencimento);
        $current = Carbon::parse(self::BASE_DATE_SINCE_2025)->addDays($fatorVencimento - self::BASE_FACTOR);

        $now = Carbon::now();
        $best = abs($now->diffInDays($classic)) <= abs($now->diffInDays($current)) ? $classic : $current;

        return abs($now->diffInDays($best)) <= self::PLAUSIBLE_WINDOW_DAYS ? $best : null;
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
