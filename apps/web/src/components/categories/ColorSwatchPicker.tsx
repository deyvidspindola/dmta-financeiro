import { Check } from 'lucide-react'
import { CATEGORY_COLORS } from '@/lib/categoryColor'
import { strings } from '@/i18n/pt-BR'

/** Seletor de cor da categoria — mesma paleta e comportamento do `apps/app`. */
export function ColorSwatchPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-fg">
        {strings.categories.color}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={color}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
            style={{ backgroundColor: color }}
            className="flex size-9 items-center justify-center rounded-full transition focus:outline-none focus:ring-4 focus:ring-brand-500/25"
          >
            {value === color ? (
              <Check size={16} strokeWidth={3} color="#fff" aria-hidden />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}
