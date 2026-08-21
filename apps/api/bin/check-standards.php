#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Verificador de padrões de código do template (ver CONVENTIONS.md).
 *
 * Checa automaticamente as regras que podem ser verificadas por script:
 * limites de tamanho, PHPDoc de classe, env() fora de config, lógica em
 * lugar errado, query em view e componente de biblioteca usado sem wrapper.
 *
 * Não substitui revisão humana: duplicação de lógica e "isso poderia estar
 * num lugar melhor?" continuam sendo do desenvolvedor.
 *
 * Uso:   php bin/check-standards.php [--quiet]
 * Saída: 0 se tudo certo, 1 se houver qualquer violação.
 *
 * @package Bin
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

/** Limite de linhas por pasta. */
const SIZE_LIMITS = [
    'app/UseCases' => 120,
    'app/Services' => 200,
    'app/Domain' => 250,
    'app/Livewire' => 150,
    'app/Models' => 150,
    'app/Http/Controllers' => 80,
];

/** Limite de linhas para views Blade. */
const BLADE_LIMIT = 200;

/** Diretórios ignorados em qualquer varredura. */
const IGNORED = ['vendor', 'node_modules', 'storage', 'cache', '.git'];

// ---------------------------------------------------------------------------
// Funções de apoio
// ---------------------------------------------------------------------------

/**
 * Lista arquivos de um diretório recursivamente, filtrando por sufixo.
 *
 * @param  string  $dir  Caminho absoluto.
 * @param  string  $suffix  Sufixo do arquivo. Ex.: '.php' ou '.blade.php'.
 * @return list<string> Caminhos absolutos, ordenados.
 */
function filesIn(string $dir, string $suffix): array
{
    if (! is_dir($dir)) {
        return [];
    }

    $found = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)
    );

    foreach ($iterator as $file) {
        $path = $file->getPathname();

        foreach (IGNORED as $skip) {
            if (str_contains($path, DIRECTORY_SEPARATOR.$skip.DIRECTORY_SEPARATOR)) {
                continue 2;
            }
        }

        if ($file->isFile() && str_ends_with($path, $suffix)) {
            $found[] = $path;
        }
    }

    sort($found);

    return $found;
}

/**
 * Converte caminho absoluto em caminho relativo à raiz do projeto.
 *
 * @param  string  $path  Caminho absoluto.
 * @param  string  $root  Raiz do projeto.
 */
function relativePath(string $path, string $root): string
{
    return str_replace($root.DIRECTORY_SEPARATOR, '', $path);
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

$root = dirname(__DIR__);
$quiet = in_array('--quiet', $argv, true);

/** @var array<string, list<string>> Violações agrupadas por regra. */
$violations = [];

/**
 * Registra uma violação no acumulador.
 *
 * @param  string  $rule  Nome da regra violada.
 * @param  string  $message  Detalhe legível para o desenvolvedor.
 */
$fail = function (string $rule, string $message) use (&$violations): void {
    $violations[$rule][] = $message;
};

// --- 1. Limites de tamanho -------------------------------------------------

foreach (SIZE_LIMITS as $folder => $limit) {
    foreach (filesIn($root.'/'.$folder, '.php') as $file) {
        $lines = count(file($file));

        if ($lines > $limit) {
            $fail('Limite de tamanho', sprintf(
                '%s — %d linhas (máx. %d)',
                relativePath($file, $root),
                $lines,
                $limit
            ));
        }
    }
}

foreach (filesIn($root.'/resources/views', '.blade.php') as $file) {
    $lines = count(file($file));

    if ($lines > BLADE_LIMIT) {
        $fail('Limite de tamanho', sprintf(
            '%s — %d linhas (máx. %d)',
            relativePath($file, $root),
            $lines,
            BLADE_LIMIT
        ));
    }
}

// --- 2. PHPDoc de classe ---------------------------------------------------

foreach (filesIn($root.'/app', '.php') as $file) {
    $code = file_get_contents($file);

    $declaresType = (bool) preg_match(
        '/^\s*(final\s+|abstract\s+|readonly\s+)*(class|interface|enum|trait)\s+\w+/m',
        $code
    );

    if (! $declaresType) {
        continue;
    }

    $hasDocblock = (bool) preg_match(
        '/\/\*\*.*?\*\/\s*(#\[[^\]]*\]\s*)*(final\s+|abstract\s+|readonly\s+)*(class|interface|enum|trait)\s+\w+/s',
        $code
    );

    if (! $hasDocblock) {
        $fail('PHPDoc de classe ausente', relativePath($file, $root));

        continue;
    }

    if (! str_contains($code, '@package')) {
        $fail('PHPDoc sem @package', relativePath($file, $root));
    }
}

// --- 3. env() fora de config/ ----------------------------------------------

$phpSources = array_merge(
    filesIn($root.'/app', '.php'),
    filesIn($root.'/resources', '.php'),
    filesIn($root.'/routes', '.php'),
);

foreach ($phpSources as $file) {
    foreach (file($file) as $number => $line) {
        if (preg_match('/(?<![\w>$])env\s*\(/', $line)) {
            $fail('env() fora de config/', sprintf(
                '%s:%d — use config()',
                relativePath($file, $root),
                $number + 1
            ));
        }
    }
}

// --- 4. Caso de uso: um método público, classe final -----------------------

foreach (filesIn($root.'/app/UseCases', '.php') as $file) {
    $code = file_get_contents($file);

    preg_match_all('/public\s+function\s+(\w+)/', $code, $matches);
    $methods = array_values(array_diff($matches[1] ?? [], ['__construct', '__invoke']));

    if (count($methods) > 1) {
        $fail('Caso de uso com mais de um método público', sprintf(
            '%s — %s',
            relativePath($file, $root),
            implode(', ', $methods)
        ));
    }

    if (! str_contains($code, 'final class')) {
        $fail('Caso de uso não é final', relativePath($file, $root));
    }
}

// --- 5. DB::transaction fora de UseCases -----------------------------------

foreach (filesIn($root.'/app', '.php') as $file) {
    if (str_contains($file, DIRECTORY_SEPARATOR.'UseCases'.DIRECTORY_SEPARATOR)) {
        continue;
    }

    foreach (file($file) as $number => $line) {
        if (str_contains($line, 'DB::transaction')) {
            $fail('DB::transaction fora de UseCases', sprintf(
                '%s:%d',
                relativePath($file, $root),
                $number + 1
            ));
        }
    }
}

// --- 6. Query dentro de view Blade -----------------------------------------

foreach (filesIn($root.'/resources/views', '.blade.php') as $file) {
    foreach (file($file) as $number => $line) {
        if (preg_match('/::\s*(where|find|findOrFail|all|first|get|create|update|delete)\s*\(/', $line)) {
            $fail('Query dentro de view', sprintf(
                '%s:%d',
                relativePath($file, $root),
                $number + 1
            ));
        }
    }
}

// --- 7. style inline ---------------------------------------------------

foreach (filesIn($root.'/resources/views', '.blade.php') as $file) {
    foreach (file($file) as $number => $line) {
        if (preg_match('/\sstyle\s*=\s*["\']/', $line)) {
            $fail('style inline', sprintf(
                '%s:%d — use utilitários do Tailwind',
                relativePath($file, $root),
                $number + 1
            ));
        }
    }
}

// --- 8. HTML cru de interface fora de components/ ---------------------
//
// Tela de negócio não escreve <input>, <button>, <table>. Se este check
// não existisse, o primeiro formulário do projeto sairia em HTML puro e
// todos os seguintes copiariam dele.

const RAW_TAGS = ['input', 'button', 'select', 'textarea', 'table', 'label'];

foreach (filesIn($root.'/resources/views', '.blade.php') as $file) {
    if (str_contains($file, DIRECTORY_SEPARATOR.'components'.DIRECTORY_SEPARATOR)) {
        continue;
    }

    foreach (file($file) as $number => $line) {
        foreach (RAW_TAGS as $tag) {
            if (preg_match('/<'.$tag.'[\s>]/i', $line)) {
                $fail('HTML cru fora de components/', sprintf(
                    '%s:%d — <%s> deve vir de x-form.* ou x-ui.*',
                    relativePath($file, $root),
                    $number + 1,
                    $tag
                ));
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------

if ($violations === []) {
    if (! $quiet) {
        echo "\033[32m✓ padrões de código: nenhuma violação\033[0m\n";
    }

    exit(0);
}

$total = array_sum(array_map('count', $violations));

echo "\n\033[31m✗ padrões de código: {$total} violação(ões)\033[0m\n";

foreach ($violations as $rule => $items) {
    echo "\n  \033[1m{$rule}\033[0m (".count($items).")\n";

    foreach ($items as $item) {
        echo "    · {$item}\n";
    }
}

echo "\n  Regras em CONVENTIONS.md\n\n";

exit(1);
