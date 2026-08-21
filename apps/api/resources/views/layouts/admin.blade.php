<!DOCTYPE html>
<html
    lang="pt-BR"
    class="h-full"
    x-data="tallstackui_darkTheme({ name: 'theme', default: 'light' })"
    x-bind:class="{ dark: darkTheme }"
>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? __('admin.app_name') }}</title>

    {{--
      Tema: precisa aplicar a classe "dark" ANTES da primeira pintura,
      senão a tela pisca (Alpine só inicializa depois do parse do body).
      Mesma chave de localStorage ("theme") e mesma regra de padrão
      (claro, mesmo que o sistema prefira escuro) do x-data acima
      (tallstackui_darkTheme) — se um dia divergirem, volta o flash.
    --}}
    <script>
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.classList.add('dark');
        }
    </script>

    @tallStackUiSetup
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body
    class="flex h-dvh flex-col overflow-hidden bg-surface font-sans text-[13px] text-body antialiased lg:flex-row"
    x-data="{ sidebarOpen: false }"
>
    {{-- Overlay do drawer mobile --}}
    <div
        x-show="sidebarOpen"
        x-cloak
        x-transition.opacity
        class="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
        x-on:click="sidebarOpen = false"
    ></div>

    <x-admin.sidebar />

    <div class="flex min-h-0 min-w-0 flex-1 flex-col lg:h-dvh">
        <x-admin.topbar />

        <div class="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-canvas px-5 py-4 lg:px-6">
            <h1 class="text-[19px] font-semibold tracking-tight text-foreground lg:text-[24px]">{{ $heading ?? $title ?? '' }}</h1>
            @isset($actions)
                <div class="flex flex-wrap items-center gap-2.5">{{ $actions }}</div>
            @endisset
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
            <main class="p-5 lg:p-8" role="main">
                <div class="grid gap-5 lg:gap-6">
                    {{ $slot }}
                </div>
            </main>
        </div>
    </div>

@persist('toasts')
    <x-toast />
@endpersist
@persist('dialogs')
    <x-dialog />
@endpersist
@persist('command-palette')
    {{--
      Busca global (Ctrl+K) — um só exemplar pra área /admin inteira, por
      isso mora no layout, não numa tela. A seleção é tratada no servidor
      (config('tallstackui.components.command-palette.1.actionable'),
      App\UseCases\Search\HandleCommandPaletteSelection), não aqui.
    --}}
    <x-command-palette :request="route('admin.search')" />
@endpersist
</body>
</html>
