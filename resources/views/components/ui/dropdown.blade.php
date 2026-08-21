{{--
    Wrapper de <x-dropdown> (TallStackUI). Ver components/form/input.blade.php.

    O slot "trigger" vira o slot "action" nativo do TallStackUI (o que é
    clicado para abrir o menu) — nome mais claro pra quem usa este wrapper
    sem precisar saber o vocabulário interno da lib. O slot padrão são os
    itens (<x-ui.dropdown-item>).
--}}
<x-dropdown {{ $attributes }}>
    <x-slot:action>{{ $trigger }}</x-slot:action>

    {{ $slot }}
</x-dropdown>
