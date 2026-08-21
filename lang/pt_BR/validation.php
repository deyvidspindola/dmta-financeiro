<?php

declare(strict_types=1);

/**
 * Mensagens de validação em português.
 *
 * Stub mínimo para o template não nascer sem tradução das regras mais
 * comuns. Para a tradução completa dos textos padrão do Laravel, baixe
 * de https://github.com/lucascudo/laravel-pt-BR-localization e substitua
 * este arquivo.
 */
return [
    'required' => 'O campo :attribute é obrigatório.',
    'email' => 'Informe um e-mail válido.',
    'unique' => 'Este :attribute já está cadastrado.',
    'confirmed' => 'A confirmação de :attribute não corresponde.',
    'min' => [
        'string' => 'O campo :attribute deve ter pelo menos :min caracteres.',
    ],
    'max' => [
        'string' => 'O campo :attribute não pode ter mais que :max caracteres.',
    ],

    'attributes' => [
        'name' => 'nome',
        'email' => 'e-mail',
        'password' => 'senha',
    ],
];
