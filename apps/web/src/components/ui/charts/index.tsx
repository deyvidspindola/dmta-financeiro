import type { ApexOptions } from 'apexcharts'
import { LazyApex } from './LazyApex'
import { formatMoney } from '@/lib/format'
import { mergeDeep } from '@/lib/mergeDeep'
import { useApexBase, useChartPalette } from './theme'

/*
 * Wrappers finos do ApexCharts com o tema do design system (D-17 / DT-11).
 * Cada um aceita dados tipados simples + `options` opcional pra ajustes.
 * Reagem à troca de tema (claro/escuro) via `useApexBase`.
 */

type Serie = { name: string; data: number[]; color?: string }

/** Eixo compacto: 0 · 1,2k · 12k · 1,3M — sem "R$" pra não poluir. */
function moneyAxis() {
  return (value: number): string => {
    const abs = Math.abs(value)
    if (abs < 1) return '0'
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (abs >= 1000) {
      const k = value / 1000
      return `${Number.isInteger(k) ? k : k.toFixed(1)}k`
    }
    return String(Math.round(value))
  }
}

/** Área/linha ao longo do tempo — evolução receita × despesa, saldo. */
export function AreaChart({
  categories,
  series,
  height = 260,
  type = 'area',
  options,
}: {
  categories: string[]
  series: Serie[]
  height?: number
  type?: 'area' | 'line'
  options?: ApexOptions
}) {
  const base = useApexBase()
  const opts = mergeDeep(base as Record<string, unknown>, {
    chart: { type },
    colors: series.map((s) => s.color).filter(Boolean),
    fill:
      type === 'area'
        ? {
            type: 'gradient',
            gradient: { opacityFrom: 0.28, opacityTo: 0.02, stops: [0, 100] },
          }
        : { type: 'solid', opacity: 1 },
    stroke: { width: 2.5 },
    xaxis: { categories },
    yaxis: { labels: { formatter: moneyAxis() } },
    tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
    ...(options as Record<string, unknown>),
  }) as ApexOptions

  return (
    <LazyApex
      type={type}
      height={height}
      series={series.map(({ name, data }) => ({ name, data }))}
      options={opts}
    />
  )
}

/** Barras agrupadas ou empilhadas — comparativo de meses, orçado × gasto. */
export function BarChart({
  categories,
  series,
  height = 260,
  stacked = false,
  horizontal = false,
  options,
}: {
  categories: string[]
  series: Serie[]
  height?: number
  stacked?: boolean
  horizontal?: boolean
  options?: ApexOptions
}) {
  const base = useApexBase()
  const opts = mergeDeep(base as Record<string, unknown>, {
    chart: { type: 'bar', stacked },
    colors: series.map((s) => s.color).filter(Boolean),
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 5,
        borderRadiusApplication: 'end',
        columnWidth: '55%',
      },
    },
    stroke: { width: 0 },
    xaxis: { categories },
    yaxis: { labels: { formatter: moneyAxis() } },
    tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
    ...(options as Record<string, unknown>),
  }) as ApexOptions

  return (
    <LazyApex
      type="bar"
      height={height}
      series={series.map(({ name, data }) => ({ name, data }))}
      options={opts}
    />
  )
}

/** Rosca — gastos por categoria, com total no centro. */
export function DonutChart({
  labels,
  values,
  colors,
  height = 260,
  centerLabel,
  options,
}: {
  labels: string[]
  values: number[]
  colors?: string[]
  height?: number
  centerLabel?: string
  options?: ApexOptions
}) {
  const base = useApexBase()
  const total = values.reduce((a, b) => a + b, 0)
  const opts = mergeDeep(base as Record<string, unknown>, {
    chart: { type: 'donut' },
    labels,
    colors,
    stroke: { width: 2, colors: ['var(--surface)'] },
    legend: { position: 'bottom' },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: centerLabel ?? 'Total',
              formatter: () => formatMoney(total),
            },
            value: { formatter: (v: string) => formatMoney(Number(v)) },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
    ...(options as Record<string, unknown>),
  }) as ApexOptions

  return (
    <LazyApex type="donut" height={height} series={values} options={opts} />
  )
}

/** Mini gráfico inline pra cartão de KPI — sem eixos, sem grid. */
export function Sparkline({
  data,
  tone = 'brand',
  height = 40,
  type = 'area',
}: {
  data: number[]
  tone?: 'brand' | 'positive' | 'negative'
  height?: number
  type?: 'area' | 'line' | 'bar'
}) {
  const palette = useChartPalette()
  const color = palette[tone]
  const opts: ApexOptions = {
    chart: {
      type,
      sparkline: { enabled: true },
      animations: { enabled: false },
      fontFamily: 'inherit',
    },
    colors: [color],
    stroke: { width: type === 'bar' ? 0 : 2, curve: 'smooth' },
    fill:
      type === 'area'
        ? { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } }
        : { opacity: 1 },
    tooltip: { enabled: false },
    plotOptions: { bar: { columnWidth: '60%', borderRadius: 2 } },
  }
  return (
    <LazyApex
      type={type}
      height={height}
      series={[{ data }]}
      options={opts}
    />
  )
}
