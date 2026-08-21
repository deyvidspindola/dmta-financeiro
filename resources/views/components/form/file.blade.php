{{--
    Input de arquivo estilizado. Diferente dos outros componentes em
    form/, não é wrapper de um componente do TallStackUI — a lib não tem
    um de upload. Existe pelo mesmo motivo dos outros: é o ÚNICO lugar do
    projeto com permissão para <label>/<input type="file"> crus (ver
    bin/check-standards.php, seção 8); toda tela de negócio usa só
    <x-form.file>.
--}}
<label class="cursor-pointer">
    <input type="file" {{ $attributes->merge(['class' => 'sr-only']) }} />
    <span class="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3.5 text-[12.5px] font-semibold text-foreground transition hover:bg-surface">
        {{ $slot }}
    </span>
</label>
