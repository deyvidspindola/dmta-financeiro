import type { Props as ApexProps } from 'react-apexcharts'
import { Suspense, lazy } from 'react'
import { Skeleton } from '@/components/ui/feedback'

/*
 * ApexCharts (~155 kB gzip) sai do bundle principal: só é baixado quando
 * um gráfico entra em tela (dashboard, relatórios, simulador). Enquanto
 * carrega, mostra um skeleton com a altura do gráfico.
 */
const ApexChart = lazy(() => import('./ApexChart'))

export function LazyApex(props: ApexProps & { height?: number | string }) {
  const h =
    typeof props.height === 'number'
      ? `${props.height}px`
      : (props.height ?? '260px')
  return (
    <Suspense fallback={<Skeleton className="w-full" style={{ height: h }} />}>
      <ApexChart {...props} />
    </Suspense>
  )
}
