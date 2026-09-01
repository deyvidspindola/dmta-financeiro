import { Check, ChevronsUpDown, Layers } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { cn } from '@/lib/cn'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'

type Props = {
  compact?: boolean
}

/** Troca de contexto PF/PJ + Consolidado — chip de perfil com menu. */
export function ContextSwitcher({ compact = false }: Props) {
  const { contexts, activeScope, setActiveScope } = useAuthStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const ordered = [...contexts].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name, 'pt-BR')
    return a.type === 'pf' ? -1 : 1
  })

  const activeContext =
    activeScope === CONSOLIDATED
      ? null
      : ordered.find((c) => c.id === activeScope)

  const currentLabel =
    activeScope === CONSOLIDATED
      ? strings.nav.consolidated
      : (activeContext?.name ?? strings.nav.context)

  const currentTag =
    activeScope === CONSOLIDATED
      ? null
      : activeContext?.type === 'pf'
        ? strings.nav.pf
        : strings.nav.pj

  const currentTagTone =
    activeContext?.type === 'pf'
      ? 'brand'
      : activeContext?.type === 'pj'
        ? 'accent'
        : 'neutral'

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function pick(scope: string) {
    setActiveScope(scope)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border border-line bg-surface font-medium text-fg shadow-card transition',
          'hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          compact ? 'h-9 max-w-[10.5rem] px-2.5 text-xs' : 'h-10 max-w-xs px-3 text-sm',
        )}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {activeScope === CONSOLIDATED ? (
          <Layers
            size={compact ? 14 : 16}
            className="shrink-0 text-accent-500"
            aria-hidden
          />
        ) : null}
        <span className="min-w-0 truncate">{currentLabel}</span>
        {currentTag ? (
          <Badge tone={currentTagTone} className="shrink-0 px-1.5 py-0 text-[10px]">
            {currentTag}
          </Badge>
        ) : null}
        <ChevronsUpDown
          size={compact ? 14 : 15}
          className="shrink-0 text-fg-subtle"
          aria-hidden
        />
      </button>
      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop"
          role="menu"
        >
          <div className="px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">
              {strings.nav.consolidatedView}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            className={cn(
              'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition',
              'hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none',
              activeScope === CONSOLIDATED && 'bg-brand-500/12 text-brand-700 dark:text-brand-300',
            )}
            onClick={() => pick(CONSOLIDATED)}
          >
            <span className="flex items-center gap-2">
              <Layers size={16} className="text-accent-500" aria-hidden />
              {strings.nav.consolidated}
            </span>
            {activeScope === CONSOLIDATED ? (
              <Check size={15} aria-hidden />
            ) : null}
          </button>
          <div className="my-1 border-t border-line" role="separator" />
          <div className="px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">
              {strings.nav.context}
            </p>
          </div>
          {ordered.map((ctx) => (
            <button
              key={ctx.id}
              type="button"
              role="menuitem"
              className={cn(
                'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition',
                'hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none',
                activeScope === ctx.id && 'bg-brand-500/12 text-brand-700 dark:text-brand-300',
              )}
              onClick={() => pick(ctx.id)}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">{ctx.name}</span>
                <Badge
                  tone={ctx.type === 'pf' ? 'brand' : 'accent'}
                  className="shrink-0 px-1.5 py-0 text-[10px]"
                >
                  {ctx.type === 'pf' ? strings.nav.pf : strings.nav.pj}
                </Badge>
              </span>
              {activeScope === ctx.id ? (
                <Check size={15} className="shrink-0" aria-hidden />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
