{{--
  Sidebar da área /admin: 270px, canvas, sombra lateral.
  Desktop: coluna estática. Celular: drawer controlado por sidebarOpen
  (definido em x-data no <body> de layouts/admin.blade.php).
--}}
@php
    $user = auth()->user();
    $name = $user?->name ?? __('admin.user.demo_name');

    $items = [
        ['label' => __('admin.nav.dashboard'), 'route' => 'admin.dashboard', 'match' => ['admin.dashboard'], 'icon' => 'dashboard'],
        ['label' => __('admin.nav.users'), 'route' => 'admin.users.index', 'match' => ['admin.users.*'], 'icon' => 'users'],
        ['label' => __('admin.nav.tokens'), 'route' => 'admin.tokens', 'match' => ['admin.tokens'], 'icon' => 'tokens'],
    ];
@endphp

<aside
    id="sidebar"
    class="fixed inset-y-0 left-0 z-50 flex w-[270px] shrink-0 flex-col bg-canvas shadow-[6px_0_28px_-22px_rgba(15,23,41,.25)] transition-transform duration-200 lg:static lg:translate-x-0"
    x-bind:class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    aria-label="{{ __('admin.app_name') }}"
>
    <div class="flex h-20 shrink-0 items-center gap-2.5 px-6">
        <a
            href="{{ route('admin.dashboard') }}"
            class="brand-mark inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-surface"
            aria-label="{{ __('admin.brand') }}"
        >
            <x-ui.icon icon="brand" class="size-[18px]" />
        </a>
        <div class="leading-none">
            <p class="text-[15px] font-bold text-foreground">{{ __('admin.brand') }}</p>
            <p class="mt-0.5 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{{ __('admin.app_name') }}</p>
        </div>
    </div>

    <nav class="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="{{ __('admin.app_name') }}">
        @foreach ($items as $item)
            @php $active = request()->routeIs(...$item['match']); @endphp
            <a
                href="{{ route($item['route']) }}"
                @class([
                    'flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] transition',
                    'bg-primary-soft font-semibold text-primary-strong' => $active,
                    'font-medium text-body hover:bg-surface' => ! $active,
                ])
                @if ($active) aria-current="page" @endif
                x-on:click="sidebarOpen = false"
            >
                <x-ui.icon
                    :icon="$item['icon']"
                    @class(['size-[17px] shrink-0', 'text-primary' => $active, 'text-muted-foreground' => ! $active])
                />
                <span class="truncate">{{ $item['label'] }}</span>
            </a>
        @endforeach
    </nav>

    <div class="shrink-0 p-3">
        <div class="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5">
            <a href="{{ route('admin.profile') }}" wire:navigate class="flex min-w-0 flex-1 items-center gap-2.5">
                <x-ui.avatar :image="$user?->avatarUrl()" :text="$user?->initial()" sm />
                <span class="min-w-0 flex-1 leading-tight">
                    <span class="block truncate text-[12.5px] font-semibold text-foreground">{{ $name }}</span>
                    <span class="block truncate text-[10.5px] text-muted-foreground">{{ $user?->email }}</span>
                </span>
            </a>
            <form method="POST" action="{{ route('logout') }}" class="ms-auto shrink-0">
                @csrf
                <button
                    type="submit"
                    class="inline-flex text-muted-foreground transition hover:text-foreground"
                    title="{{ __('admin.user.logout') }}"
                    aria-label="{{ __('admin.user.logout') }}"
                >
                    <x-ui.icon icon="logout" class="size-4" />
                </button>
            </form>
        </div>
    </div>
</aside>
