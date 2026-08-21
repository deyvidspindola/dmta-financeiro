{{-- Wrapper de <x-card> (TallStackUI). Ver components/form/input.blade.php. --}}
<x-card {{ $attributes }}>
    @isset($header)
        <x-slot:header>{{ $header }}</x-slot:header>
    @endisset

    {{ $slot }}
</x-card>
