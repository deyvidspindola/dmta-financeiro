import type { CSSProperties } from 'react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

/** Altura máxima da lista aberta (busca + opções). */
const PANEL_MAX_H = 360
/** Abaixo disso de espaço livre, a lista abre para cima. */
const PANEL_MIN_H = 300
const GAP = 4

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * Ordena em árvore: cada categoria pai (A→Z) seguida das suas
 * subcategorias (A→Z). Subcategoria cujo pai não está na lista (ex.:
 * pai de outro tipo) vai para o fim, como antes.
 */
function sortAsTree(categories: Category[]): Category[] {
  const byName = (a: Category, b: Category) => a.name.localeCompare(b.name, 'pt-BR')
  const ids = new Set(categories.map((c) => c.id))
  const children = new Map<string, Category[]>()
  const roots: Category[] = []
  const orphans: Category[] = []

  for (const cat of categories) {
    if (!cat.parent_id) roots.push(cat)
    else if (ids.has(cat.parent_id)) {
      const list = children.get(cat.parent_id) ?? []
      list.push(cat)
      children.set(cat.parent_id, list)
    } else orphans.push(cat)
  }

  return [
    ...roots.sort(byName).flatMap((root) => [root, ...(children.get(root.id) ?? []).sort(byName)]),
    ...orphans.sort(byName),
  ]
}

/**
 * Seletor de categoria com busca. A lista abre num portal (`position:
 * fixed` no body) — dentro de modal ela não fica cortada pelo scroll do
 * corpo do modal — e vira para cima quando falta espaço embaixo.
 */
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
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const ordered = useMemo(() => sortAsTree(categories), [categories])

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return ordered
    const normalized = normalizeText(search.trim())
    return ordered.filter((cat) => normalizeText(cat.name).includes(normalized))
  }, [ordered, search])

  const selected = categories.find((c) => c.id === value)

  function close() {
    setOpen(false)
    setSearch('')
  }

  function pick(id: string | null) {
    onChange(id)
    close()
  }

  useLayoutEffect(() => {
    if (!open) return

    function place() {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - GAP * 2
      const spaceAbove = rect.top - GAP * 2
      const above = spaceBelow < PANEL_MIN_H && spaceAbove > spaceBelow
      setPanelStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        top: above ? undefined : rect.bottom + GAP,
        bottom: above ? window.innerHeight - rect.top + GAP : undefined,
        maxHeight: Math.min(PANEL_MAX_H, above ? spaceAbove : spaceBelow),
        zIndex: 100,
      })
    }

    place()
    // Acompanha o scroll do modal/página e o resize enquanto aberta.
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      close()
    }
    // Captura: o Esc fecha só a lista, não o modal em volta.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopImmediatePropagation()
      close()
      triggerRef.current?.focus()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  return (
    <Field label={label} error={error}>
      <div className="flex gap-2">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          aria-haspopup="listbox"
          aria-expanded={open}
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
            className={cn('size-4 shrink-0 text-fg-muted transition', open && 'rotate-180')}
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

      {open
        ? createPortal(
            <div
              ref={panelRef}
              style={panelStyle}
              className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface text-fg shadow-pop"
            >
              <div className="shrink-0 border-b border-line p-2">
                <TextInput
                  type="text"
                  placeholder={strings.common.categorySearchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="h-9 text-sm"
                />
              </div>
              <div role="listbox" className="min-h-0 overflow-y-auto overscroll-contain py-1">
                <button
                  type="button"
                  onClick={() => pick(null)}
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
                      role="option"
                      aria-selected={cat.id === value}
                      onClick={() => pick(cat.id)}
                      className={cn(
                        'block w-full py-2 pr-3 text-left text-sm transition hover:bg-surface-2',
                        cat.parent_id ? 'pl-8 text-fg-muted' : 'pl-3 font-medium',
                        cat.id === value && 'font-semibold text-brand-600',
                      )}
                    >
                      {cat.parent_id ? `↳ ${cat.name}` : cat.name}
                    </button>
                  ))
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </Field>
  )
}
