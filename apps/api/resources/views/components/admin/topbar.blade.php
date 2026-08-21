{{--
  Topbar da área /admin: botão de menu no mobile, marca no mobile, menu
  do usuário no desktop (x-admin.user-menu). Não busca dados próprios —
  só chrome de navegação.
--}}

{{-- Cabeçalho mobile (< lg): botão do drawer + marca --}}
<div class="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-canvas px-4 lg:hidden">
    <button
        type="button"
        class="inline-flex size-9 items-center justify-center rounded-lg text-foreground"
        x-on:click="sidebarOpen = true"
        aria-label="{{ __('admin.topbar.open_menu') }}"
    >
        <x-ui.icon icon="menu" class="size-5" />
    </button>
    <span class="brand-mark inline-flex size-7 items-center justify-center rounded-lg text-surface">
        <x-ui.icon icon="brand" class="size-3.5" />
    </span>
    <p class="text-[14px] font-bold text-foreground">{{ __('admin.brand') }}</p>
</div>

{{-- Topbar desktop --}}
<div class="hidden h-16 shrink-0 items-center gap-4 border-b border-border bg-canvas px-5 lg:flex lg:px-6">
    {{--
      Não é um <input> de verdade: só abre o command palette global (Ctrl+K),
      que tem o campo de busca de verdade dentro dele — dois campos de
      texto editáveis pra uma busca só seria confuso. Ver layouts/admin.
    --}}
    <button
        type="button"
        x-on:click="$tsui.open.commandPalette()"
        class="relative flex h-10 max-w-md flex-1 items-center gap-2.5 rounded-xl border border-transparent bg-field px-3.5 text-left text-[13px] text-muted-foreground transition hover:border-border"
    >
        <x-ui.icon icon="search" class="size-4 shrink-0" />
        <span class="flex-1">{{ __('admin.topbar.search') }}</span>
        <kbd class="hidden shrink-0 rounded-md border border-border bg-canvas px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground sm:inline">
            Ctrl K
        </kbd>
    </button>

    <div class="flex-1"></div>

    <x-ui.theme-switch aria-label="{{ __('admin.topbar.toggle_theme') }}" />
    <x-admin.user-menu />
</div>
