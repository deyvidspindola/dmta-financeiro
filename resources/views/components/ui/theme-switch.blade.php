{{--
    Wrapper de <x-theme-switch simple only-icons> (TallStackUI). Ver
    components/form/input.blade.php.

    Fixado em "simple only-icons" (sol/lua, sem rótulo e sem a opção
    "sistema") — de propósito: o projeto define o padrão claro em
    layouts/admin.blade.php (tallstackui_darkTheme), então só faz
    sentido alternar entre claro e escuro, não "seguir o sistema".
--}}
<x-theme-switch simple only-icons {{ $attributes }} />
