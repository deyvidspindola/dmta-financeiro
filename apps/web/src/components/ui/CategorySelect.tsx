import { useMemo, useState } from 'react'
import { Field, TextInput } from '@/components/ui'
import { cn } from '@/lib/cn'
import { strings } from '@/i18n/pt-BR'
import type { Category } from '@/types/models'

type Props = {
  categories: Category[]
  value: string | null
  onChange: (value: string | null) => void
  label: string
  placeholder?: string
  error?: string
  onQuickAdd?: () => void
  quickAddLabel?: string
}

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export function CategorySelect({
  categories,
  value,
  onChange,
  label,
  placeholder = strings.common.categorySelectPlaceholder,
  error,
  onQuickAdd,
  quickAddLabel,
}: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const normalized = normalizeText(search.trim())
    return categories.filter((cat) => normalizeText(cat.name).includes(normalized))
  }, [categories, search])

  const selected = categories.find((c) => c.id === value)

  return (
    <Field label={label} error={error}>
      <div className="relative">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
              'flex h-10 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition',
              'hover:border-line-hover focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20',
              error && 'border-negative',
            )}
          >
            <span className={cn('truncate', !selected && 'text-fg-subtle')}>
              {selected ? (selected.parent_id ? `↳ ${selected.name}` : selected.name) : placeholder}
            </span>
            <svg
              className="size-4 shrink-0 text-fg-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {onQuickAdd ? (
            <button
              type="button"
              onClick={onQuickAdd}
              className="shrink-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg transition hover:border-line-hover hover:bg-surface-2"
            >
              {quickAddLabel}
            </button>
          ) : null}
        </div>

        {open ? (
          <div
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="border-b border-line p-2">
              <TextInput
                type="text"
                placeholder={strings.common.categorySearchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="h-9 text-sm"
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  onChange(null)
                  setOpen(false)
                  setSearch('')
                }}
                className={cn(
                  'block w-full px-3 py-2 text-left text-sm transition hover:bg-surface-2',
                  !value && 'font-semibold text-brand-600',
                )}
              >
                {placeholder}
              </button>
              {filteredCategories.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-fg-muted">{strings.common.categoryNoResults}</div>
              ) : (
                filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onChange(cat.id)
                      setOpen(false)
                      setSearch('')
                    }}
                    className={cn(
                      'block w-full px-3 py-2 text-left text-sm transition hover:bg-surface-2',
                      cat.id === value && 'font-semibold text-brand-600',
                    )}
                  >
                    {cat.parent_id ? `↳ ${cat.name}` : cat.name}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Field>
  )
}
