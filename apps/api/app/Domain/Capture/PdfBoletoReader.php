<?php

declare(strict_types=1);

namespace App\Domain\Capture;

use App\DTOs\BoletoDraftData;
use App\Enums\CaptureOrigin;
use Smalot\PdfParser\Parser as PdfParser;

/**
 * Implementação de produção de {@see EmailBoletoReaderInterface}: extrai
 * a linha digitável do **texto** embutido no PDF (não da imagem do
 * código de barras) via `smalot/pdfparser`.
 *
 * Por que texto e não imagem de código de barras: todo boleto emitido
 * digitalmente (o caso de "anexo de e-mail") carrega a linha digitável
 * como texto pesquisável — é exigência de acessibilidade do próprio
 * layout Febraban. Ler o texto é ordens de magnitude mais simples e
 * confiável que renderizar a página em imagem e decodificar um código
 * de barras I-25 (a abordagem original cogitada nos docs, que dependeria
 * de ZXing/Ghostscript — indisponíveis ou arriscados numa hospedagem
 * compartilhada). Só falha se o PDF for puramente escaneado (sem texto),
 * caso em que devolve tudo `null` — a pendência ainda é criada, sem
 * dado pré-preenchido, para revisão manual.
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
final class PdfBoletoReader implements EmailBoletoReaderInterface
{
    /** Linha digitável: 5 blocos de dígitos (9,10,10 + 1 + 4,10) com pontuação opcional entre eles. */
    private const LINE_PATTERN = '/(\d{5}[.\s]?\d{5})[.\s]+(\d{5}[.\s]?\d{6})[.\s]+(\d{5}[.\s]?\d{6})[.\s]+(\d)[.\s]+(\d{14})/';

    public function __construct(
        private readonly PdfParser $parser,
        private readonly BoletoLineCodec $codec,
    ) {}

    public function origin(): CaptureOrigin
    {
        return CaptureOrigin::Email;
    }

    public function readAttachment(string $pdfPath): BoletoDraftData
    {
        $text = $this->parser->parseFile($pdfPath)->getText();

        $linhaDigitavel = $this->extractLine($text);
        $decoded = $linhaDigitavel !== null
            ? $this->codec->decode($linhaDigitavel)
            : ['amount' => null, 'dueDate' => null];

        return new BoletoDraftData(
            linhaDigitavel: $linhaDigitavel,
            amount: $decoded['amount'],
            dueDate: $decoded['dueDate'],
            beneficiary: $this->extractBeneficiary($text),
        );
    }

    /** Acha a linha digitável em qualquer lugar do texto e devolve só os 47 dígitos, sem pontuação. */
    private function extractLine(string $text): ?string
    {
        if (! preg_match(self::LINE_PATTERN, $text, $matches)) {
            return null;
        }

        $digits = preg_replace('/\D/', '', implode('', array_slice($matches, 1)));

        return strlen($digits) === 47 ? $digits : null;
    }

    /**
     * Melhor esforço: pega o texto depois de "Beneficiário"/"Cedente" até
     * a próxima sequência de 3+ dígitos (CPF/CNPJ, linha digitável...) —
     * nome de empresa raramente tem número. Não tenta layouts de banco
     * específicos; extração de PDF nem sempre preserva quebra de linha,
     * por isso não dá pra confiar só em `\n` como fim de campo. Se não
     * achar um nome plausível, devolve `null` e quem revisa preenche à
     * mão — nunca bloqueia a captura por causa disso.
     */
    private function extractBeneficiary(string $text): ?string
    {
        if (! preg_match('/(?:Benefici[aá]rio|Cedente)\s*:?\s*([^\d\n\r]{3,80}?)(?=\s*\d{3,}|[\n\r]|$)/ui', $text, $matches)) {
            return null;
        }

        return trim($matches[1]) ?: null;
    }
}
