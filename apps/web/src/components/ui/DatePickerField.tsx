import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { Calendar } from 'vanilla-calendar-pro'
import { CONTROL } from '@/components/ui/form'
import { formatIsoDatePtBr, toIsoDate } from '@/lib/datesIso'
import { cn } from '@/lib/cn'
import { strings } from '@/i18n/pt-BR'
import 'vanilla-calendar-pro/styles/index.css'
import 'vanilla-calendar-pro/styles/themes/light.css'
import 'vanilla-calendar-pro/styles/themes/dark.css'

type DatePickerFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'readOnly'
> & {
  /** ISO `YYYY-MM-DD`. */
  value: string
  onChange: (iso: string) => void
}

function isDarkTheme(): boolean {
  return document.documentElement.classList.contains('dark')
}

function formatRangeDisplay(from: string, to: string): string {
  return [from, to]
    .filter(Boolean)
    .map(formatIsoDatePtBr)
    .join(' — ')
}

/**
 * Data única via vanilla-calendar-pro (mesma lib do Preline datepicker).
 * Valor externo sempre ISO `YYYY-MM-DD`. Input `readonly` — só abre o
 * calendário ao clicar. Portal no `body` pra não ficar cortado em modal.
 */
export function DatePickerField({
  value,
  onChange,
  className,
  disabled,
  id: idProp,
  placeholder,
  ...props
}: DatePickerFieldProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useLayoutEffect(() => {
    if (!open || !inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    const gap = 4
    const calendarH = 340
    const spaceBelow = window.innerHeight - rect.bottom - gap
    const placeAbove = spaceBelow < calendarH && rect.top > spaceBelow
    setPanelStyle({
      position: 'fixed',
      left: Math.min(rect.left, window.innerWidth - 292),
      top: placeAbove ? undefined : rect.bottom + gap,
      bottom: placeAbove ? window.innerHeight - rect.top + gap : undefined,
      zIndex: 100,
    })
  }, [open])

  useEffect(() => {
    if (!open || !panelRef.current) return

    const calendar = new Calendar(panelRef.current, {
      inputMode: false,
      locale: 'pt-BR',
      firstWeekday: 0,
      selectedDates: value ? [value] : [],
      selectedTheme: isDarkTheme() ? 'dark' : 'light',
      enableDateToggle: false,
      onClickDate(self) {
        const iso = toIsoDate(self.context.selectedDates[0] ?? '')
        onChangeRef.current(iso)
        setOpen(false)
      },
    })
    const destroy = calendar.init()

    return () => {
      destroy()
      calendar.destroy()
    }
  }, [open, value])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (inputRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopImmediatePropagation()
      setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        type="text"
        readOnly
        disabled={disabled}
        value={formatIsoDatePtBr(value)}
        placeholder={placeholder ?? strings.common.datePlaceholder}
        className={cn(CONTROL, 'h-10 cursor-pointer', className)}
        onClick={() => {
          if (!disabled) setOpen(true)
        }}
        onFocus={() => {
          if (!disabled) setOpen(true)
        }}
        {...props}
      />
      {open
        ? createPortal(
            <div
              ref={panelRef}
              style={panelStyle}
              className="dmta-datepicker-panel"
              role="dialog"
              aria-label={strings.common.datePlaceholder}
            />,
            document.body,
          )
        : null}
    </>
  )
}

export type DateRangeValue = { from: string; to: string }

type DateRangeFieldProps = {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  disabled?: boolean
  fromLabel?: string
  toLabel?: string
  fromId?: string
  toId?: string
  className?: string
}

/**
 * Range De/Até com vanilla-calendar-pro em modo `multiple-ranged`.
 * `from`/`to` são ISO `YYYY-MM-DD`. Ideal para filtros de período.
 */
export function DateRangeField({
  value,
  onChange,
  disabled,
  fromLabel = strings.common.dateFrom,
  toLabel = strings.common.dateTo,
  fromId,
  toId,
  className,
}: DateRangeFieldProps) {
  const autoFrom = useId()
  const autoTo = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useLayoutEffect(() => {
    if (!open || !inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    const gap = 4
    const calendarH = 340
    const spaceBelow = window.innerHeight - rect.bottom - gap
    const placeAbove = spaceBelow < calendarH && rect.top > spaceBelow
    setPanelStyle({
      position: 'fixed',
      left: Math.min(rect.left, window.innerWidth - 292),
      top: placeAbove ? undefined : rect.bottom + gap,
      bottom: placeAbove ? window.innerHeight - rect.top + gap : undefined,
      zIndex: 100,
    })
  }, [open])

  useEffect(() => {
    if (!open || !panelRef.current) return

    // Semeia a seleção só na abertura. Depois disso o vanilla-calendar
    // controla o próprio estado via `onClickDate` — remontar a cada
    // `onChange` (o 1º clique de um range dispara `onChange({from,to:''})`)
    // recriava o calendário no meio da seleção: piscada + volta pro mês do
    // `from`, forçando o usuário a navegar de novo pro 2º clique.
    const selected = [value.from, value.to].filter(Boolean)
    const calendar = new Calendar(panelRef.current, {
      inputMode: false,
      locale: 'pt-BR',
      firstWeekday: 0,
      selectionDatesMode: 'multiple-ranged',
      selectedDates: selected,
      selectedTheme: isDarkTheme() ? 'dark' : 'light',
      onClickDate(self) {
        const isos = self.context.selectedDates
          .map((d) => toIsoDate(d))
          .filter(Boolean)
        const from = isos[0] ?? ''
        const to = isos.length > 1 ? (isos[isos.length - 1] ?? '') : ''
        onChangeRef.current({ from, to })
        if (from && to) setOpen(false)
      },
    })
    const destroy = calendar.init()

    return () => {
      destroy()
      calendar.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- semeia na abertura; o calendário controla o próprio estado depois
  }, [open])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (inputRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopImmediatePropagation()
      setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <div className="flex gap-4 text-xs text-fg-muted">
          <span id={fromId ?? autoFrom}>
            {fromLabel}:{' '}
            <span className="font-medium text-fg">
              {value.from ? formatIsoDatePtBr(value.from) : '—'}
            </span>
          </span>
          <span id={toId ?? autoTo}>
            {toLabel}:{' '}
            <span className="font-medium text-fg">
              {value.to ? formatIsoDatePtBr(value.to) : '—'}
            </span>
          </span>
        </div>
        <input
          ref={inputRef}
          type="text"
          readOnly
          disabled={disabled}
          value={formatRangeDisplay(value.from, value.to)}
          aria-labelledby={`${fromId ?? autoFrom} ${toId ?? autoTo}`}
          placeholder={strings.common.dateRangePlaceholder}
          className={cn(CONTROL, 'h-10 cursor-pointer')}
          onClick={() => {
            if (!disabled) setOpen(true)
          }}
          onFocus={() => {
            if (!disabled) setOpen(true)
          }}
        />
        {open
          ? createPortal(
              <div
                ref={panelRef}
                style={panelStyle}
                className="dmta-datepicker-panel"
                role="dialog"
                aria-label={strings.common.dateRangePlaceholder}
              />,
              document.body,
            )
          : null}
      </div>
    </div>
  )
}
