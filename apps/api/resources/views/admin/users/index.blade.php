<div class="grid gap-5" wire:key="users-index">
    <x-form.input
        type="search"
        wire:model.live.debounce.300ms="search"
        :placeholder="__('users.index.search')"
        class="max-w-sm"
    />

    <x-ui.card class="!p-0">
        <div class="grid grid-cols-[1fr_1fr_140px_88px] gap-3 border-b border-border px-5 py-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            <span>{{ __('users.index.col_name') }}</span>
            <span>{{ __('users.index.col_email') }}</span>
            <span>{{ __('users.index.col_last_login') }}</span>
            <span class="text-right">{{ __('users.index.col_actions') }}</span>
        </div>

        @forelse ($rows as $row)
            <div wire:key="user-{{ $row->id }}" class="grid grid-cols-[1fr_1fr_140px_88px] items-center gap-3 border-b border-border px-5 py-3 text-[13px] text-body last:border-0">
                <span class="truncate font-medium text-foreground">{{ $row->name }}</span>
                <span class="truncate text-muted-foreground">{{ $row->email }}</span>
                <span class="text-muted-foreground">{{ $row->last_login_at?->format('d/m/Y H:i') ?? __('users.index.never_logged_in') }}</span>
                <div class="flex justify-end gap-1.5">
                    <x-ui.button variant="ghost" size="xs" :href="route('admin.users.edit', $row)" :aria-label="__('users.index.edit')">
                        <x-ui.icon icon="edit" class="size-4" />
                    </x-ui.button>
                    @can('delete', $row)
                        <x-ui.button variant="ghost" size="xs" wire:click="confirmDelete({{ $row->id }})" :aria-label="__('users.index.delete')">
                            <x-ui.icon icon="delete" class="size-4 text-destructive" />
                        </x-ui.button>
                    @endcan
                </div>
            </div>
        @empty
            <div class="px-5 py-10 text-center text-[13px] text-muted-foreground">
                {{ $filtered ? __('users.index.filtered_empty') : __('users.index.empty_message') }}
            </div>
        @endforelse
    </x-ui.card>

    {{ $rows->links() }}
</div>
