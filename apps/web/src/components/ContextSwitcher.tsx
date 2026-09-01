import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { strings } from '@/i18n/pt-BR'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'

/** Troca de contexto PF/PJ + Consolidado — menu compacto (não um select solto). */
export function ContextSwitcher() {
  const { contexts, activeScope, setActiveScope } = useAuthStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const ordered = [...contexts].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name, 'pt-BR')
    return a.type === 'pf' ? -1 : 1
  })

  const currentLabel =
    activeScope === CONSOLIDATED
      ? strings.nav.consolidated
      : (ordered.find((c) => c.id === activeScope)?.name ?? strings.nav.context)

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
    <div className="ctx-switch" ref={ref}>
      <button
        type="button"
        className="ctx-switch__trigger"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{currentLabel}</span>
        <ChevronsUpDown size={15} />
      </button>
      {open ? (
        <div className="ctx-switch__menu" role="menu">
          <button
            type="button"
            className="ctx-switch__item"
            onClick={() => pick(CONSOLIDATED)}
          >
            <span>{strings.nav.consolidated}</span>
            {activeScope === CONSOLIDATED ? <Check size={15} /> : null}
          </button>
          <div className="ctx-switch__sep" />
          {ordered.map((ctx) => (
            <button
              key={ctx.id}
              type="button"
              className="ctx-switch__item"
              onClick={() => pick(ctx.id)}
            >
              <span>
                {ctx.name}
                <span className="ctx-switch__tag">
                  {ctx.type === 'pf' ? 'PF' : 'PJ'}
                </span>
              </span>
              {activeScope === ctx.id ? <Check size={15} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
