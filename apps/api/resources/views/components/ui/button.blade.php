{{--
    Wrapper de <x-button> (TallStackUI). "variant" mapeia para as props
    nativas do componente (color/outline/flat) — nenhuma tela de negócio
    precisa conhecer essas props internas.
--}}
@props([
    'variant' => 'primary',
    'size' => 'md',
])

@php
    $color = $variant === 'destructive' ? 'red' : 'primary';
    $outline = $variant === 'outline';
    $flat = $variant === 'ghost';
@endphp

<x-button
    :color="$color"
    :outline="$outline"
    :flat="$flat"
    :xs="$size === 'xs'"
    :sm="$size === 'sm'"
    :lg="$size === 'lg'"
    {{ $attributes }}
>
    {{ $slot }}
</x-button>
