<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Usuário administrador inicial (produção)
    |--------------------------------------------------------------------------
    |
    | Usado só pelo ProductionAdminSeeder, pra criar/atualizar o primeiro
    | usuário real em produção sem precisar de SSH interativo — o
    | workflow seed-admin.yml passa ADMIN_EMAIL/ADMIN_PASSWORD como
    | variável de ambiente da própria chamada SSH, nunca grava no .env
    | do servidor. Nunca preencha estes valores fixos aqui.
    |
    */

    'name' => env('ADMIN_NAME', 'Administrador'),
    'email' => env('ADMIN_EMAIL'),
    'password' => env('ADMIN_PASSWORD'),

];
