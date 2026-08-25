<?php

declare(strict_types=1);

use App\Domain\Capture\PdfDecryption\PdfEncryptionInfo;
use App\Domain\Capture\PdfDecryption\Revision6PasswordAuthenticator;

test('R5 autentica a senha de usuário e recupera a chave de arquivo', function () {
    $password = '12345678901';
    $fileKey = random_bytes(32);
    $validationSalt = random_bytes(8);
    $keySalt = random_bytes(8);
    $u = hash('sha256', $password.$validationSalt, true).$validationSalt.$keySalt;
    $intermediate = hash('sha256', $password.$keySalt, true);
    $ue = openssl_encrypt(
        $fileKey,
        'aes-256-cbc',
        $intermediate,
        OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING,
        str_repeat("\x00", 16),
    );

    $info = new PdfEncryptionInfo(
        v: 5,
        r: 5,
        o: str_repeat("\x00", 48),
        u: $u,
        oe: null,
        ue: $ue === false ? '' : $ue,
        p: -4,
        keyLengthBytes: 32,
        cipher: 'AESV3',
        encryptMetadata: true,
        fileId: '',
    );

    $recovered = (new Revision6PasswordAuthenticator)->fileKeyFromPassword($info, $password);

    expect($recovered)->toBe($fileKey);
});

test('R5 rejeita senha errada', function () {
    $password = '12345678901';
    $fileKey = random_bytes(32);
    $validationSalt = random_bytes(8);
    $keySalt = random_bytes(8);
    $u = hash('sha256', $password.$validationSalt, true).$validationSalt.$keySalt;
    $intermediate = hash('sha256', $password.$keySalt, true);
    $ue = openssl_encrypt(
        $fileKey,
        'aes-256-cbc',
        $intermediate,
        OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING,
        str_repeat("\x00", 16),
    );

    $info = new PdfEncryptionInfo(
        v: 5,
        r: 5,
        o: str_repeat("\x00", 48),
        u: $u,
        oe: null,
        ue: $ue === false ? '' : $ue,
        p: -4,
        keyLengthBytes: 32,
        cipher: 'AESV3',
        encryptMetadata: true,
        fileId: '',
    );

    expect((new Revision6PasswordAuthenticator)->fileKeyFromPassword($info, '00000000000'))->toBeNull();
});
