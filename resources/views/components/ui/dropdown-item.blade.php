{{-- Wrapper de <x-dropdown.items> (TallStackUI). Ver components/form/input.blade.php. --}}
<x-dropdown.items {{ $attributes }}>
    {{ $slot ?? '' }}
</x-dropdown.items>
