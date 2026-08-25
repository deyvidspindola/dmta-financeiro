<?php

declare(strict_types=1);

use App\Domain\Capture\PdfDecryption\EncryptedPdfDecryptor;
use App\Domain\Capture\PdfDecryption\PdfEncryptDictionaryParser;
use App\Domain\Capture\PdfDecryption\PdfObjectScanner;
use App\Domain\Capture\PdfDecryption\PdfRewriter;
use App\Domain\Capture\PdfDecryption\PdfStringDecoder;
use App\Domain\Capture\PdfDecryption\Rc4Cipher;
use App\Domain\Capture\PdfDecryption\StandardSecurityHandler;
use App\Exceptions\Domain\UnsupportedEncryptedPdfException;
use Smalot\PdfParser\Parser as PdfParser;
use Tests\Support\MinimalEncryptedPdfBuilder;

function decryptor(): EncryptedPdfDecryptor
{
    return new EncryptedPdfDecryptor(
        new PdfObjectScanner,
        new PdfEncryptDictionaryParser(new PdfStringDecoder),
        new PdfStringDecoder,
        new StandardSecurityHandler(new Rc4Cipher),
        new PdfRewriter,
    );
}

dataset('handler revisions', [
    'R2 (RC4-40)' => [2, 'RC4'],
    'R3 (RC4-128)' => [3, 'RC4'],
    'R4 (AES-128)' => [4, 'AESV2'],
]);

test('decifra o stream com a senha correta e recupera o texto original', function (int $r, string $cipher) {
    ['bytes' => $bytes, 'contentText' => $contentText] = (new MinimalEncryptedPdfBuilder)->build($r, 'segredo123', $cipher);

    $document = decryptor()->inspect($bytes);
    expect($document)->not->toBeNull();

    $decrypted = decryptor()->tryPassword($document, 'segredo123');
    expect($decrypted)->not->toBeNull();

    // Prova de ponta a ponta: o próprio smalot/pdfparser (usado em
    // produção por PdfBoletoReader) consegue ler o PDF reescrito.
    $text = (new PdfParser)->parseContent($decrypted)->getText();
    expect($text)->toContain('linha digitavel 12345');
})->with('handler revisions');

test('senha errada não autentica e não decifra nada', function (int $r, string $cipher) {
    ['bytes' => $bytes] = (new MinimalEncryptedPdfBuilder)->build($r, 'segredo123', $cipher);

    $document = decryptor()->inspect($bytes);

    expect(decryptor()->tryPassword($document, 'senha-errada'))->toBeNull();
})->with('handler revisions');

test('isEncrypted é falso para PDF sem /Encrypt', function () {
    expect(decryptor()->isEncrypted("%PDF-1.4\n1 0 obj\n<< >>\nendobj\n"))->toBeFalse();
});

test('estrutura sem trailer clássico (xref stream) lança UnsupportedEncryptedPdfException', function () {
    $bytes = "%PDF-1.5\n1 0 obj\n<< /Type /XRef /Encrypt 2 0 R >>\nendobj\n";

    decryptor()->inspect($bytes);
})->throws(UnsupportedEncryptedPdfException::class);
