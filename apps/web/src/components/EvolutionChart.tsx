import type { EvolutionPoint } from '@/types/models'
import { formatMoney } from '@/lib/format'

export function EvolutionChart({ series }: { series: EvolutionPoint[] }) {
  if (series.length === 0) return null

  const width = 640
  const height = 220
  const pad = { top: 16, right: 12, bottom: 32, left: 8 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const maxAbs = Math.max(
    ...series.flatMap((p) => [p.income, p.expense, Math.abs(p.balance), 1]),
  )
  const barW = innerW / series.length / 3.2

  function y(value: number): number {
    return pad.top + innerH - (value / maxAbs) * innerH
  }

  return (
    <svg
      className="evolution-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
    >
      {series.map((point, index) => {
        const x = pad.left + (innerW / series.length) * index + 8
        const incomeH = (point.income / maxAbs) * innerH
        const expenseH = (point.expense / maxAbs) * innerH
        return (
          <g key={point.month}>
            <rect
              x={x}
              y={y(point.income)}
              width={barW}
              height={incomeH}
              fill="#0f6b4c"
            />
            <rect
              x={x + barW + 4}
              y={y(point.expense)}
              width={barW}
              height={expenseH}
              fill="#9b2c2c"
            />
            <text
              x={x + barW}
              y={height - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#3d5349"
            >
              {point.month.slice(5)}
            </text>
            <title>
              {point.month}: {formatMoney(point.income)} /{' '}
              {formatMoney(point.expense)} / {formatMoney(point.balance)}
            </title>
          </g>
        )
      })}
    </svg>
  )
}
