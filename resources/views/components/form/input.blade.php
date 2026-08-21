{{--
    Wrapper de <x-input> (TallStackUI). Existe para que nenhuma tela de
    negócio importe o componente da biblioteca direto — se um dia trocarmos
    o TallStackUI por outra lib de UI, só este arquivo muda.
--}}
<x-input {{ $attributes }}>
    {{ $slot ?? '' }}
</x-input>
