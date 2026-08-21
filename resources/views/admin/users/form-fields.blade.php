{{-- Campos compartilhados do formulário de usuário (criação e edição). --}}
@php $f = 'users.form.'; @endphp

<x-ui.card>
    <div class="grid gap-5 sm:grid-cols-2">
        <x-form.input wire:model="name" :label="__($f.'name')" />
        <x-form.input wire:model="email" type="email" :label="__($f.'email')" />
        <x-form.password wire:model="password" :label="__($f.'password')" :hint="$passwordHint ?? null" />
        <x-form.password wire:model="password_confirmation" :label="__($f.'password_confirmation')" />
    </div>
</x-ui.card>
