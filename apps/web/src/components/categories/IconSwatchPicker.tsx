import { CATEGORY_ICON_NAMES, categoryIconComponent } from '@/lib/categoryIcons'
import { strings } from '@/i18n/pt-BR'
import { cn } from '@/lib/cn'

/** Seletor de ícone da categoria — mesmo conjunto de nomes do `apps/app`. */
export function IconSwatchPicker({
  value,
  tint,
  onChange,
}: {
  value: string
  tint: string
  onChange: (icon: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-fg">
        {strings.categories.icon}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_ICON_NAMES.map((name) => {
          const Icon = categoryIconComponent(name)
          const selected = value === name
          return (
            <button
              key={name}
              type="button"
              aria-label={name}
              aria-pressed={selected}
              onClick={() => onChange(name)}
              style={selected ? { backgroundColor: `${tint}26`, color: tint } : undefined}
              className={cn(
                'flex size-9 items-center justify-center rounded-full border transition focus:outline-none focus:ring-4 focus:ring-brand-500/25',
                selected ? 'border-transparent' : 'border-line bg-surface text-fg-muted',
              )}
            >
              <Icon size={16} aria-hidden />
            </button>
          )
        })}
      </div>
    </div>
  )
}
