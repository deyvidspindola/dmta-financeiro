<!DOCTYPE html>
<html lang="pt-BR" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? __('auth.app_name') }}</title>

    <script>
        (function () {
            var t = localStorage.getItem('theme');
            if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            }
        })();
    </script>

    @tallStackUiSetup
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="h-full font-sans text-body antialiased">

    <div class="flex min-h-full">
        {{-- Formulário — metade esquerda no desktop --}}
        <div class="relative flex w-full flex-col justify-center bg-background px-6 py-10 sm:px-10 lg:w-1/2 lg:px-16 xl:px-24">
            <div class="mb-8 lg:hidden">
                <p class="text-lg font-semibold text-foreground">{{ __('auth.brand') }}</p>
            </div>

            <div class="mx-auto w-full max-w-md">
                {{ $slot }}
            </div>
        </div>

        {{-- Marca — metade direita (desktop) --}}
        <div class="auth-brand-panel relative hidden w-1/2 flex-col items-center justify-center px-12 lg:flex">
            <div class="flex max-w-sm flex-col items-center text-center">
                <span
                    class="brand-mark mb-5 inline-flex size-14 items-center justify-center rounded-2xl text-background"
                    aria-hidden="true"
                >
                    <x-ui.icon icon="brand" class="size-7" />
                </span>
                <p class="text-3xl font-semibold tracking-tight text-primary-50">{{ __('auth.brand') }}</p>
                <p class="mt-3 text-sm leading-relaxed text-primary-200">{{ __('auth.brand_tagline') }}</p>
            </div>
        </div>
    </div>

@persist('toasts')
    <x-toast />
@endpersist
</body>
</html>
