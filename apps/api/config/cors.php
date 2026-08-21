<?php

declare(strict_types=1);

/**
 * CORS para a API — consumida por apps/web (porta de dev do Vite,
 * variável) e apps/mobile (sem origem de navegador). Autenticação é por
 * token Sanctum no header `Authorization` (não por cookie de sessão), então
 * liberar `*` em `allowed_origins` não expõe cookie de ninguém — é seguro
 * mesmo sem restringir por domínio.
 */
return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
