<?php

declare(strict_types=1);

/**
 * PR — o canal `sentry` tem que estar sempre no stack de log, independente
 * do `LOG_STACK` do ambiente. "Toda falha aparece no Sentry" é regra.
 */
test('o canal sentry está sempre no stack de log', function () {
    $channels = config('logging.channels.stack.channels');

    expect($channels)->toBeArray()
        ->and($channels)->toContain('sentry');
});

test('LOG_STACK sem sentry ainda inclui sentry', function () {
    // Simula um .env com LOG_STACK=single e recarrega a config do arquivo.
    putenv('LOG_STACK=single');
    $config = require base_path('config/logging.php');

    expect($config['channels']['stack']['channels'])->toContain('sentry')
        ->and($config['channels']['stack']['channels'])->toContain('single');

    putenv('LOG_STACK');
});
