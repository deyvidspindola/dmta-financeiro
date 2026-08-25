<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Caixa IMAP de captura de boletos (F1, D-06)
    |--------------------------------------------------------------------------
    |
    | Desligada por padrão (mesmo padrão do agregador Pluggy, DT-05) — sem
    | BOLETO_MAILBOX_ENABLED=true no .env, PollBoletoMailbox nem tenta
    | conectar. Nunca use credencial de conta pessoal aqui: é uma caixa
    | dedicada só pra receber boleto encaminhado.
    */
    'boleto_mailbox' => [
        'enabled' => (bool) env('BOLETO_MAILBOX_ENABLED', false),
        'host' => env('BOLETO_MAILBOX_HOST'),
        'port' => (int) env('BOLETO_MAILBOX_PORT', 993),
        'encryption' => env('BOLETO_MAILBOX_ENCRYPTION', 'ssl'),
        'username' => env('BOLETO_MAILBOX_USERNAME'),
        'password' => env('BOLETO_MAILBOX_PASSWORD'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Bot do Telegram — lançamento rápido (F1, D-06, capítulo 6.4)
    |--------------------------------------------------------------------------
    |
    | Desligado por padrão (mesmo padrão do agregador Pluggy, DT-05, e da
    | caixa de boletos acima) — sem TELEGRAM_BOT_TOKEN no .env, o webhook
    | aceita a chamada (responde 200, Telegram não reencaminha em loop) mas
    | não processa nada. Uso pessoal (D-11): só o chat_id configurado é
    | atendido — qualquer outro é ignorado em silêncio, sem criar conta ou
    | vínculo novo.
    */
    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN'),
        'webhook_secret' => env('TELEGRAM_WEBHOOK_SECRET'),
        'allowed_chat_id' => env('TELEGRAM_ALLOWED_CHAT_ID'),
        'user_email' => env('TELEGRAM_USER_EMAIL'),
    ],

];
