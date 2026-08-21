<div class="grid gap-5" wire:key="admin-api-tokens">
    <x-ui.card>
        <p class="text-[13px] text-muted-foreground">{{ __('admin.tokens.intro') }}</p>

        @if ($plainTextToken)
            <div class="mt-4 rounded-xl border border-success/30 bg-success-soft px-4 py-3">
                <p class="text-[12.5px] font-semibold text-success">{{ __('admin.tokens.created_title') }}</p>
                <p class="mt-1 text-[13px] break-all text-foreground">{{ $plainTextToken }}</p>
                <p class="mt-1 text-[11.5px] text-muted-foreground">{{ __('admin.tokens.created_hint') }}</p>
            </div>
        @endif

        <form wire:submit="create" class="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <x-form.input wire:model="name" :label="__('admin.tokens.name_label')" :placeholder="__('admin.tokens.name_placeholder')" />
            <x-form.input wire:model="abilities" :label="__('admin.tokens.abilities_label')" :placeholder="__('admin.tokens.abilities_placeholder')" />
            <x-ui.button type="submit" wire:loading.attr="disabled">
                {{ __('admin.tokens.create') }}
            </x-ui.button>
        </form>
    </x-ui.card>

    <x-ui.card class="!p-0">
        <div class="grid grid-cols-[1fr_140px_140px_60px] gap-3 border-b border-border px-5 py-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            <span>{{ __('admin.tokens.col_name') }}</span>
            <span>{{ __('admin.tokens.col_created') }}</span>
            <span>{{ __('admin.tokens.col_last_used') }}</span>
            <span></span>
        </div>

        @forelse ($tokens as $token)
            <div wire:key="token-{{ $token->id }}" class="grid grid-cols-[1fr_140px_140px_60px] items-center gap-3 border-b border-border px-5 py-3 text-[13px] text-body last:border-0">
                <span class="truncate font-medium text-foreground">{{ $token->name }}</span>
                <span class="text-muted-foreground">{{ $token->created_at->format('d/m/Y') }}</span>
                <span class="text-muted-foreground">{{ $token->last_used_at?->format('d/m/Y') ?? __('admin.tokens.never_used') }}</span>
                <div class="flex justify-end">
                    <x-ui.button variant="ghost" size="xs" wire:click="revoke({{ $token->id }})" :aria-label="__('admin.tokens.revoke')">
                        <x-ui.icon icon="delete" class="size-4 text-destructive" />
                    </x-ui.button>
                </div>
            </div>
        @empty
            <div class="px-5 py-10 text-center text-[13px] text-muted-foreground">
                {{ __('admin.tokens.empty') }}
            </div>
        @endforelse
    </x-ui.card>
</div>
