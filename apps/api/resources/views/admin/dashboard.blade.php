<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" wire:key="admin-dashboard">
    <x-ui.card>
        <p class="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
            {{ __('admin.dashboard.users_card') }}
        </p>
        <p class="mt-2 text-3xl font-bold text-foreground">{{ $usersCount }}</p>
    </x-ui.card>

    <x-ui.card>
        <p class="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
            {{ __('admin.dashboard.environment_card') }}
        </p>
        <p class="mt-2 text-3xl font-bold text-foreground">{{ $environment }}</p>
    </x-ui.card>

    <x-ui.card>
        <p class="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
            {{ __('admin.dashboard.laravel_card') }}
        </p>
        <p class="mt-2 text-3xl font-bold text-foreground">{{ $laravelVersion }}</p>
    </x-ui.card>

    <x-ui.card>
        <p class="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
            {{ __('admin.dashboard.php_card') }}
        </p>
        <p class="mt-2 text-3xl font-bold text-foreground">{{ $phpVersion }}</p>
    </x-ui.card>

    <div class="sm:col-span-2 lg:col-span-4">
        <x-ui.card>
            <p class="text-[15px] font-semibold text-foreground">{{ __('admin.dashboard.next_steps_title') }}</p>
            <p class="mt-1 text-[13px] text-muted-foreground">{{ __('admin.dashboard.next_steps_body') }}</p>
        </x-ui.card>
    </div>
</div>
