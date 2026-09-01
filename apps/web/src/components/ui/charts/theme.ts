import type { ApexOptions } from 'apexcharts'
import { useEffect, useMemo, useState } from 'react'

/**
 * Reage à troca de tema: incrementa a cada mudança na classe do <html>
 * (`.dark` liga/desliga, seja pelo toggle ou pelo sistema). Os gráficos
 * ApexCharts precisam de cores resolvidas (hex), não `var(--...)` —
 * ApexCharts manipula cor pra gradiente/opacidade e quebra com `var()`.
 */
function useThemeTick(): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const obs = new MutationObserver(() => setTick((t) => t + 1))
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => obs.disconnect()
  }, [])
  return tick
}

function readVars(names: string[]): Record<string, string> {
  const cs = getComputedStyle(document.documentElement)
  const out: Record<string, string> = {}
  for (const n of names) out[n] = cs.getPropertyValue(n).trim()
  return out
}

export type ChartPalette = {
  brand: string
  positive: string
  negative: string
  accent: string
  cat: string[]
}

/** Cores da marca resolvidas, reativas ao tema. */
export function useChartPalette(): ChartPalette {
  const tick = useThemeTick()
  return useMemo(() => {
    const v = readVars([
      '--color-brand-600',
      '--positive',
      '--negative',
      '--color-accent-600',
      ...Array.from({ length: 12 }, (_, i) => `--color-cat-${i + 1}`),
    ])
    return {
      brand: v['--color-brand-600'],
      positive: v['--positive'],
      negative: v['--negative'],
      accent: v['--color-accent-600'],
      cat: Array.from({ length: 12 }, (_, i) => v[`--color-cat-${i + 1}`]),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])
}

/**
 * Opções base do ApexCharts alinhadas ao design system (grid, fontes,
 * eixos, tooltip, legenda), reativas ao tema. Faça merge com as opções
 * específicas do gráfico.
 */
export function useApexBase(): ApexOptions {
  const tick = useThemeTick()
  return useMemo(() => {
    const v = readVars(['--fg', '--fg-muted', '--fg-subtle', '--line', '--surface'])
    const dark = document.documentElement.classList.contains('dark')
    const label = { colors: v['--fg-muted'], fontFamily: 'inherit' }

    return {
      chart: {
        fontFamily: 'inherit',
        foreColor: v['--fg-muted'],
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { speed: 400 },
        parentHeightOffset: 0,
      },
      theme: { mode: dark ? 'dark' : 'light' },
      grid: {
        borderColor: v['--line'],
        strokeDashArray: 4,
        padding: { left: 4, right: 4, top: 0 },
        xaxis: { lines: { show: false } },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', lineCap: 'round' },
      xaxis: {
        labels: { style: label },
        axisBorder: { show: false },
        axisTicks: { show: false },
        crosshairs: { stroke: { color: v['--line'], dashArray: 4 } },
        tooltip: { enabled: false },
      },
      yaxis: { labels: { style: label } },
      legend: {
        labels: { colors: v['--fg-muted'] },
        markers: { size: 5, strokeWidth: 0 },
        itemMargin: { horizontal: 10 },
        fontSize: '12px',
      },
      tooltip: {
        theme: dark ? 'dark' : 'light',
        style: { fontFamily: 'inherit', fontSize: '12px' },
      },
      states: { hover: { filter: { type: 'lighten' } } },
    } satisfies ApexOptions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])
}
