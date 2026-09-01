import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMonthStore } from '@/store/monthStore'
import { currentMonthKey, formatMonthLabel } from '@/lib/dates'

/** ‹ Agosto de 2026 › — o navegador de mês global (topo). */
export function MonthNavigator() {
  const { month, shift, reset } = useMonthStore()
  const isCurrent = month === currentMonthKey()

  return (
    <div className="month-nav">
      <button
        type="button"
        className="month-nav__arrow"
        aria-label="Mês anterior"
        onClick={() => shift(-1)}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        className="month-nav__label"
        onClick={reset}
        title={isCurrent ? undefined : 'Voltar para o mês atual'}
      >
        {formatMonthLabel(month)}
        {!isCurrent ? <span className="month-nav__dot" /> : null}
      </button>
      <button
        type="button"
        className="month-nav__arrow"
        aria-label="Próximo mês"
        onClick={() => shift(1)}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
