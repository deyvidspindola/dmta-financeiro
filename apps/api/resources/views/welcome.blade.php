<!DOCTYPE html>
<html lang="pt-BR" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ __('admin.app_name') }} — template</title>
    @tallStackUiSetup
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-full bg-surface font-sans text-body antialiased">

    <div class="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-16">
        <div class="mb-8 flex items-center gap-3">
            <span class="brand-mark inline-flex size-11 items-center justify-center rounded-2xl text-background">
                <x-ui.icon icon="brand" class="size-5" />
            </span>
            <div>
                {{-- Troque este nome pelo do projeto real ao usar este template. --}}
                <p class="text-lg font-bold text-foreground">Laravel Base — DMTA</p>
                <p class="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Template · troque este texto</p>
            </div>
        </div>

        <x-ui.card>
            <h1 class="text-2xl font-semibold tracking-tight text-foreground">
                Isto é um template, não um produto.
            </h1>
            <p class="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                Base reutilizável para novos projetos Laravel da DMTA: autenticação por
                sessão, CRUD de usuários, tokens de API pessoais (Sanctum), Docker e
                CI/CD já prontos. Clone este repositório para começar um projeto novo —
                não edite esta tela como se fosse a vitrine final; troque o conteúdo
                pelo do produto real assim que começar.
            </p>
        </x-ui.card>

        <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <x-ui.card>
                <p class="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">Stack</p>
                <ul class="mt-2 space-y-1 text-[13px] text-body">
                    <li>Laravel 13 · PHP 8.3+</li>
                    <li>Livewire 4 + TallStackUI 3</li>
                    <li>Tailwind CSS 4</li>
                    <li>MySQL 8 · Docker</li>
                </ul>
            </x-ui.card>

            <x-ui.card>
                <p class="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">Primeiros passos</p>
                <ol class="mt-2 space-y-1.5 text-[13px] text-body">
                    <li>1. <code class="rounded bg-field px-1.5 py-0.5 text-[12px]">make setup</code> — sobe tudo</li>
                    <li>2. Acesse <a href="{{ route('login') }}" class="font-medium text-primary hover:text-primary-strong">{{ url('/entrar') }}</a></li>
                    <li>3. Leia <span class="font-medium text-foreground">README.md</span> e <span class="font-medium text-foreground">CONVENTIONS.md</span></li>
                </ol>
            </x-ui.card>
        </div>

        <div class="mt-6 flex gap-3">
            <x-ui.button :href="route('login')">Ir para /admin</x-ui.button>
            <x-ui.button variant="outline" href="https://github.com/deyvidspindola/laravel-base">Ver no GitHub</x-ui.button>
        </div>
    </div>

</body>
</html>
