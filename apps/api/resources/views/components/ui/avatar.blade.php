{{-- Wrapper de <x-avatar> (TallStackUI). Ver components/form/input.blade.php. --}}
<x-avatar {{ $attributes }}>
    {{ $slot ?? '' }}
</x-avatar>
