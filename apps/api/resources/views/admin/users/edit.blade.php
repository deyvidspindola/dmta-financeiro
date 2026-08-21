<form wire:submit="confirmSave" class="grid gap-6" wire:key="users-edit">
    @php $passwordHint = __('users.form.password_hint_optional'); @endphp
    @include('admin.users.form-fields')

    <div class="flex justify-end gap-3">
        <x-ui.button variant="outline" :href="$cancelHref" type="button">
            {{ __('ui.crud.form.cancel') }}
        </x-ui.button>
        <x-ui.button type="submit" wire:loading.attr="disabled">
            {{ __('ui.crud.form.save') }}
        </x-ui.button>
    </div>
</form>
