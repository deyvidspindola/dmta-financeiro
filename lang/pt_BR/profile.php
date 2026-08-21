<?php

declare(strict_types=1);

/**
 * Textos da tela "Meu perfil" (App\Livewire\Admin\Profile).
 *
 * Cobre os três formulários da tela: dados de acesso, senha e foto.
 */
return [

    'heading' => 'Meu perfil',

    'form' => [
        'heading' => 'Dados de acesso',
        'name' => 'Nome',
        'email' => 'E-mail',
        'updated' => 'Dados atualizados com sucesso.',
    ],

    'password' => [
        'heading' => 'Alterar senha',
        'current' => 'Senha atual',
        'new' => 'Nova senha',
        'confirmation' => 'Confirmar nova senha',
        'save' => 'Alterar senha',
        'updated' => 'Senha alterada com sucesso.',
    ],

    'avatar' => [
        'change' => 'Trocar foto',
        'remove' => 'Remover foto',
        'remove_title' => 'Remover foto de perfil?',
        'remove_message' => 'Volta a exibir as iniciais do seu nome no lugar da foto.',
        'remove_confirm' => 'Remover',
        'remove_cancel' => 'Cancelar',
        'removed' => 'Foto removida.',
        'uploading' => 'Enviando...',
        'updated' => 'Foto atualizada com sucesso.',
        'hint' => 'JPG, PNG ou WEBP, até 2MB.',
    ],

];
