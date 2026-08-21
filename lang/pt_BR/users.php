<?php

declare(strict_types=1);

/**
 * Textos da tela de CRUD de usuários (App\Livewire\Admin\User\*).
 *
 * Exemplo de arquivo de tradução dedicado a UMA tela — nenhum texto
 * visível fica solto dentro do Blade ou do PHP (ver CONVENTIONS.md).
 */
return [

    'index' => [
        'heading' => 'Usuários',
        'search' => 'Buscar por nome ou e-mail',
        'col_name' => 'Nome',
        'col_email' => 'E-mail',
        'col_last_login' => 'Último acesso',
        'col_actions' => 'Ações',
        'edit' => 'Editar',
        'delete' => 'Excluir',
        'new' => 'Novo usuário',
        'never_logged_in' => 'Nunca acessou',
        'empty_message' => 'Nenhum usuário cadastrado ainda.',
        'filtered_empty' => 'Nenhum usuário encontrado para esta busca.',
        'delete_title' => 'Excluir usuário?',
        'delete_message' => 'Esta ação não pode ser desfeita.',
        'delete_confirm' => 'Excluir',
        'delete_cancel' => 'Cancelar',
        'deleted' => 'Usuário excluído.',
    ],

    'form' => [
        'create_heading' => 'Novo usuário',
        'edit_heading' => 'Editar usuário',
        'name' => 'Nome',
        'email' => 'E-mail',
        'password' => 'Senha',
        'password_confirmation' => 'Confirmar senha',
        'password_hint_optional' => 'Deixe em branco para manter a senha atual.',
        'created' => 'Usuário criado com sucesso.',
        'updated' => 'Usuário atualizado com sucesso.',
    ],

];
