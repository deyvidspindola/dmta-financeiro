{{--
  Menu do usuário no topbar: avatar (foto ou iniciais) + dropdown com
  link para o perfil e o formulário de logout. Só chrome de navegação —
  não busca dado nenhum além do usuário autenticado.
--}}
@php
    $user = auth()->user();
@endphp

<x-ui.dropdown position="bottom-end" width="sm">
    <x-slot:trigger>
        {{--
          O slot "action"/"trigger" do <x-dropdown> só imprime o HTML — ao
          contrário das props "text"/"icon" dele, não adiciona o clique de
          abrir sozinho. x-on:click abaixo é o que de fato abre o menu.
        --}}
        <button
            type="button"
            x-on:click="show = !show; $refs.dropdown.dispatchEvent(new CustomEvent('open', {detail: {status: show}}))"
            aria-controls="dropdown-menu"
            class="flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 transition hover:bg-surface"
            aria-label="{{ __('admin.user.menu') }}"
        >
            <x-ui.avatar :image="$user?->avatarUrl()" :text="$user?->initial()" sm />
            <span class="hidden text-left leading-tight sm:block">
                <span class="block text-[12.5px] font-semibold text-foreground">{{ $user?->name }}</span>
                <span class="block text-[10.5px] text-muted-foreground">{{ $user?->email }}</span>
            </span>
            <x-ui.icon
                icon="chevron-down"
                class="hidden size-3 text-muted-foreground transition-transform duration-150 sm:block"
                x-bind:class="{ 'rotate-180': show }"
            />
        </button>
    </x-slot:trigger>

    <x-ui.dropdown-item :href="route('admin.profile')" navigate>
        <span class="flex items-center gap-2">
            <x-ui.icon icon="user" class="size-4 text-muted-foreground" />
            {{ __('admin.user.profile') }}
        </span>
    </x-ui.dropdown-item>

    <form method="POST" action="{{ route('logout') }}">
        @csrf
        <x-ui.dropdown-item type="submit" separator class="w-full">
            <span class="flex items-center gap-2">
                <x-ui.icon icon="logout" class="size-4 text-muted-foreground" />
                {{ __('admin.user.logout') }}
            </span>
        </x-ui.dropdown-item>
    </form>
</x-ui.dropdown>
