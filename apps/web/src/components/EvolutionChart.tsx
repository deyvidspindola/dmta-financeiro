import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { EvolutionPoint } from '@/types/models'
import { strings } from '@/i18n/pt-BR'
import { formatMoney } from '@/lib/format'

export function EvolutionChart({ series }: { series: EvolutionPoint[] }) {
  if (series.length === 0) return null

  const data = series.map((point) => ({
    month: point.month.slice(5),
    income: point.income,
    expense: point.expense,
    label: point.month,
  }))

  return (
    <div className="evolution-chart" role="img" aria-label={strings.dashboard.evolution}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--ink-soft)' }}
            axisLine={{ stroke: 'var(--line)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--ink-soft)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)
            }
            width={42}
          />
          <Tooltip
            formatter={(value: number) => formatMoney(value)}
            labelFormatter={(_label, payload) => {
              const row = payload?.[0]?.payload as { label?: string } | undefined
              return row?.label ?? ''
            }}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--line)',
              fontSize: 12,
            }}
          />
          <Legend
            formatter={(value) =>
              value === 'income'
                ? strings.dashboard.income
                : strings.dashboard.expense
            }
          />
          <Bar
            dataKey="income"
            name="income"
            fill="var(--positive)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="expense"
            name="expense"
            fill="var(--negative)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
