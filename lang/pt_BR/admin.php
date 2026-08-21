<?php

declare(strict_types=1);

return [

    'app_name' => 'Laravel Base — Admin',
    'brand' => 'Laravel Base',

    'nav' => [
        'dashboard' => 'Painel',
        'users' => 'Usuários',
        'tokens' => 'Tokens de API',
    ],

    'topbar' => [
        'search' => 'Buscar usuários...',
        'open_menu' => 'Abrir menu',
        'toggle_theme' => 'Alternar tema claro/escuro',
    ],

    'user' => [
        'demo_name' => 'Usuário',
        'menu' => 'Menu do usuário',
        'profile' => 'Meu perfil',
        'logout' => 'Sair',
    ],

    'dashboard' => [
        'heading' => 'Painel',
        'users_card' => 'Usuários cadastrados',
        'environment_card' => 'Ambiente',
        'laravel_card' => 'Versão do Laravel',
        'php_card' => 'Versão do PHP',
        'next_steps_title' => 'Este é um painel de exemplo',
        'next_steps_body' => 'Troque estes cards por métricas reais do seu projeto assim que sair do template. Veja App\Livewire\Admin\Dashboard.',
    ],

    'tokens' => [
        'heading' => 'Tokens de API',
        'intro' => 'Gere tokens pessoais (Sanctum) para autenticar aplicações externas — mobile, integrações, scripts — via cabeçalho Authorization: Bearer. Veja a rota de exemplo GET /api/user.',
        'name_label' => 'Nome do token',
        'name_placeholder' => 'Ex.: app mobile',
        'abilities_label' => 'Escopos (opcional, separados por vírgula)',
        'abilities_placeholder' => 'Ex.: read,write',
        'create' => 'Gerar token',
        'created_title' => 'Token gerado',
        'created_hint' => 'Copie agora — ele não será exibido novamente.',
        'col_name' => 'Nome',
        'col_created' => 'Criado em',
        'col_last_used' => 'Último uso',
        'never_used' => 'Nunca usado',
        'revoke' => 'Revogar',
        'empty' => 'Nenhum token gerado ainda.',
    ],

];
