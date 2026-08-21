<form wire:submit="authenticate" class="space-y-6">
    <div class="space-y-2">
        <h1 class="text-3xl font-semibold tracking-tight text-foreground">
            {{ __('auth.login_title') }}
        </h1>
        <p class="text-sm text-muted-foreground">
            {{ __('auth.login_subtitle') }}
        </p>
    </div>

    <div class="space-y-5">
        <x-form.input
            type="email"
            wire:model="email"
            :label="__('auth.email')"
            :placeholder="__('auth.email_placeholder')"
            required
            autofocus
            autocomplete="username"
        />

        <x-form.password
            wire:model="password"
            :label="__('auth.password')"
            :placeholder="__('auth.password_placeholder')"
            required
            autocomplete="current-password"
        />

        <x-form.checkbox
            wire:model="remember"
            :label="__('auth.remember')"
        />
    </div>

    <x-ui.button type="submit" size="lg" class="w-full" wire:loading.attr="disabled">
        {{ __('auth.submit') }}
    </x-ui.button>
</form>
