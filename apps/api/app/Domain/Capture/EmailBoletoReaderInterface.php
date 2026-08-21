<?php

declare(strict_types=1);

namespace App\Domain\Capture;

use App\DTOs\BoletoDraftData;

/**
 * Lê um anexo de e-mail (PDF de boleto) e extrai os dados necessários
 * para pré-cadastrar um lançamento como pendência de confirmação.
 *
 * A implementação de produção ({@see PdfBoletoReader}) lê a "linha
 * digitável" do texto embutido no PDF — não decodifica a imagem do
 * código de barras (ver docblock da implementação para o porquê). Não
 * decide categoria nem confirma o lançamento — só extrai dado bruto.
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
interface EmailBoletoReaderInterface extends TransactionCaptureChannelInterface
{
    /** @param  string  $pdfPath  Caminho local do PDF já baixado do anexo. */
    public function readAttachment(string $pdfPath): BoletoDraftData;
}
