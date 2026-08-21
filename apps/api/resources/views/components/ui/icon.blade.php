{{--
    Ícone Font Awesome Solid do sistema (menu, ações, marca).
    Aceita nomes semânticos (ex.: "dashboard", "logout") e traduz para o
    slug real do Font Awesome — assim a tela nunca precisa saber qual
    pacote de ícones o projeto usa por baixo.
--}}
@props(['icon' => null, 'name' => null])

@php
    $key = $icon ?? $name ?? '';

    $map = [
        'menu' => 'bars',
        'dashboard' => 'gauge',
        'users' => 'user-group',
        'tokens' => 'key',
        'bell' => 'bell',
        'search' => 'magnifying-glass',
        'logout' => 'right-from-bracket',
        'edit' => 'pencil',
        'delete' => 'trash',
        'brand' => 'table-cells',
        'more' => 'ellipsis-vertical',
        'add' => 'plus',
        'copy' => 'copy',
        'user' => 'user',
        'chevron-down' => 'chevron-down',
        'camera' => 'camera',
    ];

    $fas = $map[$key] ?? $key;
@endphp

<x-dynamic-component :component="'fas-'.$fas" {{ $attributes }} />
