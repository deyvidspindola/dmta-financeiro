import {
  useEffect,
  useId,
  useRef,
  type InputHTMLAttributes,
} from 'react'
import { CONTROL } from '@/components/ui/form'
import { formatIsoDatePtBr, toIsoDate } from '@/lib/datesIso'
import { cn } from '@/lib/cn'
import { strings } from '@/i18n/pt-BR'
// Garante lodash global + HSDatepicker mesmo fora do AppLayout (ex.: /kit).
import '@/lib/preline'

type HSDatepickerInstance = {
  on: (
    evt: 'change',
    cb: (payload: { selectedDates: string[]; selectedTime: string }) => void,
  ) => void
  destroy: () => void
}

type HSDatepickerCtor = {
  new (el: HTMLElement, options?: Record<string, unknown>): HSDatepickerInstance
  getInstance: (
    target: HTMLElement | string,
    isInstance?: boolean,
  ) => { element: HSDatepickerInstance } | HTMLElement | null
  autoInit: () => void
}

function getHSDatepicker(): HSDatepickerCtor | undefined {
  return (window as Window & { HSDatepicker?: HSDatepickerCtor }).HSDatepicker
}

function destroyDatepicker(el: HTMLElement): void {
  const HSDatepicker = getHSDatepicker()
  if (!HSDatepicker) return
  const instance = HSDatepicker.getInstance(el, true)
  if (instance && typeof instance === 'object' && 'element' in instance) {
    instance.element.destroy()
  }
}

type DatePickerOptions = {
  selectedDates?: string[]
  selectionDatesMode?: 'single' | 'multiple' | 'multiple-ranged'
  dateFormat?: string
  dateLocale?: string
  applyUtilityClasses?: boolean
  mode?: 'default' | 'custom-select'
}

function buildOptions(
  selected: string[],
  mode: DatePickerOptions['selectionDatesMode'] = 'single',
): DatePickerOptions {
  return {
    selectedDates: selected.filter(Boolean),
    selectionDatesMode: mode,
    dateFormat: 'DD/MM/YYYY',
    dateLocale: 'pt-BR',
    applyUtilityClasses: true,
    mode: 'default',
  }
}

type DatePickerFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'readOnly'
> & {
  /** ISO `YYYY-MM-DD`. */
  value: string
  onChange: (iso: string) => void
}

/**
 * Data única via Preline Advanced Datepicker (Vanilla Calendar Pro).
 * Valor externo sempre ISO `YYYY-MM-DD`. Remonte com `key` ao trocar o
 * registro editado (o calendário inicializa com `selectedDates` no mount).
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
  const onChangeRef = useRef(onChange)
  const initialIso = useRef(value)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const el = inputRef.current
    if (!el || disabled) return

    const HSDatepicker = getHSDatepicker()
    if (!HSDatepicker) return

    destroyDatepicker(el)
    el.setAttribute(
      'data-hs-datepicker',
      JSON.stringify(buildOptions(initialIso.current ? [initialIso.current] : [])),
    )
    el.value = formatIsoDatePtBr(initialIso.current)

    const instance = new HSDatepicker(el)
    instance.on('change', ({ selectedDates }) => {
      const iso = toIsoDate(selectedDates[0] ?? '')
      onChangeRef.current(iso)
    })

    return () => destroyDatepicker(el)
  }, [disabled])

  // Sync display when value muda de fora (sem recriar o calendário).
  useEffect(() => {
    const el = inputRef.current
    if (!el || document.activeElement === el) return
    const display = formatIsoDatePtBr(value)
    if (el.value !== display) el.value = display
  }, [value])

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      readOnly
      disabled={disabled}
      placeholder={placeholder ?? strings.common.datePlaceholder}
      className={cn(CONTROL, 'hs-datepicker h-10', className)}
      {...props}
    />
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
 * Range De/Até com o datepicker Preline em modo `multiple-ranged`.
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
  const onChangeRef = useRef(onChange)
  const initial = useRef(value)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const el = inputRef.current
    if (!el || disabled) return

    const HSDatepicker = getHSDatepicker()
    if (!HSDatepicker) return

    destroyDatepicker(el)
    const selected = [initial.current.from, initial.current.to].filter(Boolean)
    el.setAttribute(
      'data-hs-datepicker',
      JSON.stringify(buildOptions(selected, 'multiple-ranged')),
    )
    el.value = selected.map(formatIsoDatePtBr).filter(Boolean).join(' — ')

    const instance = new HSDatepicker(el)
    instance.on('change', ({ selectedDates }) => {
      const isos = selectedDates.map(toIsoDate).filter(Boolean)
      const from = isos[0] ?? ''
      const to = isos.length > 1 ? isos[isos.length - 1]! : ''
      onChangeRef.current({ from, to })
    })

    return () => destroyDatepicker(el)
  }, [disabled])

  useEffect(() => {
    const el = inputRef.current
    if (!el || document.activeElement === el) return
    const display = [value.from, value.to]
      .filter(Boolean)
      .map(formatIsoDatePtBr)
      .join(' — ')
    if (el.value !== display) el.value = display
  }, [value.from, value.to])

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
          aria-labelledby={`${fromId ?? autoFrom} ${toId ?? autoTo}`}
          placeholder={strings.common.dateRangePlaceholder}
          className={cn(CONTROL, 'hs-datepicker h-10')}
        />
      </div>
    </div>
  )
}
