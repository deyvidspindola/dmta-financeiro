<?php

declare(strict_types=1);

/**
 * Registra app/Support/helpers.php no autoload do Composer.
 *
 * Chamado por bin/init-laravel.sh. Escrito como arquivo em vez de one-liner
 * para não depender de escape de aspas dentro do shell.
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/08/2026
 *
 * @updated 03/08/2026
 */
$path = dirname(__DIR__).'/composer.json';

if (! is_file($path)) {
    fwrite(STDERR, "composer.json não encontrado.\n");
    exit(1);
}

$json = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

$files = $json['autoload']['files'] ?? [];

if (! in_array('app/Support/helpers.php', $files, true)) {
    $files[] = 'app/Support/helpers.php';
}

$json['autoload']['files'] = array_values($files);

file_put_contents(
    $path,
    json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n"
);

echo "helpers.php registrado no autoload.\n";
