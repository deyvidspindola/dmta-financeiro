<div class="grid gap-5 lg:grid-cols-3" wire:key="admin-profile">
    {{-- Foto de perfil --}}
    <x-ui.card class="lg:col-span-1">
        <div class="flex flex-col items-center gap-4 text-center">
            <x-ui.avatar :image="$user->avatarUrl()" :text="$user->initial()" lg />

            <div class="grid justify-items-center gap-2">
                <x-form.file wire:model="avatar" accept="image/*">
                    <x-ui.icon icon="camera" class="size-4" />
                    {{ __('profile.avatar.change') }}
                </x-form.file>

                @if ($user->avatar_path)
                    <x-ui.button type="button" variant="ghost" size="xs" wire:click="confirmRemoveAvatar">
                        {{ __('profile.avatar.remove') }}
                    </x-ui.button>
                @endif
            </div>

            <div wire:loading wire:target="avatar" class="text-[11.5px] text-muted-foreground">
                {{ __('profile.avatar.uploading') }}
            </div>

            @error('avatar')
                <p class="text-[11.5px] text-destructive">{{ $message }}</p>
            @enderror

            <p class="text-[11px] text-muted-foreground">{{ __('profile.avatar.hint') }}</p>
        </div>
    </x-ui.card>

    <div class="grid gap-5 lg:col-span-2">
        {{-- Dados de acesso --}}
        <x-ui.card>
            <h2 class="mb-4 text-[14px] font-semibold text-foreground">{{ __('profile.form.heading') }}</h2>

            <form wire:submit="saveProfile" class="grid gap-5 sm:grid-cols-2">
                <x-form.input wire:model="name" :label="__('profile.form.name')" />
                <x-form.input wire:model="email" type="email" :label="__('profile.form.email')" />

                <div class="flex justify-end sm:col-span-2">
                    <x-ui.button type="submit" wire:loading.attr="disabled" wire:target="saveProfile">
                        {{ __('ui.crud.form.save') }}
                    </x-ui.button>
                </div>
            </form>
        </x-ui.card>

        {{-- Senha --}}
        <x-ui.card>
            <h2 class="mb-4 text-[14px] font-semibold text-foreground">{{ __('profile.password.heading') }}</h2>

            <form wire:submit="savePassword" class="grid gap-5 sm:grid-cols-2">
                <x-form.password wire:model="current_password" :label="__('profile.password.current')" class="sm:col-span-2" />
                <x-form.password wire:model="password" :label="__('profile.password.new')" />
                <x-form.password wire:model="password_confirmation" :label="__('profile.password.confirmation')" />

                <div class="flex justify-end sm:col-span-2">
                    <x-ui.button type="submit" wire:loading.attr="disabled" wire:target="savePassword">
                        {{ __('profile.password.save') }}
                    </x-ui.button>
                </div>
            </form>
        </x-ui.card>
    </div>
</div>
