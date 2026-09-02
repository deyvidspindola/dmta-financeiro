import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { simulationsApi } from '@/api'
import { ScenarioForm } from '@/components/simulator/ScenarioForm'
import {
  Button,
  ErrorBanner,
  LoadingBlock,
  Money,
  PageHeader,
  Panel,
  Stat,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatMoney } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'

const t = strings.simulator

export function SimulatorPage() {
  const activeScope = useAuthStore((s) => s.activeScope)
  const [compare, setCompare] = useState(true)
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope

  const cashFlowQuery = useQuery({
    queryKey: ['cash-flow', listContextId],
    queryFn: () => simulationsApi.getCashFlow(listContextId!),
    enabled: Boolean(listContextId),
  })

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader title={t.title} description={t.hint} />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message={t.needContext} />
      ) : null}

      {listContextId ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <ScenarioForm title={t.scenarioA} contextId={listContextId} />
          {compare ? (
            <ScenarioForm title={t.scenarioB} contextId={listContextId} />
          ) : (
            <div className="flex items-start">
              <Button variant="ghost" onClick={() => setCompare(true)}>
                {t.addScenarioB}
              </Button>
            </div>
          )}
        </div>
      ) : null}

      <Panel title={t.cashFlow}>
        <p className="mb-4 text-sm text-fg-muted">{t.cashFlowHint}</p>
        {cashFlowQuery.isLoading ? (
          <LoadingBlock label={strings.common.loading} />
        ) : null}
        {cashFlowQuery.isError ? (
          <ErrorBanner message={getErrorMessage(cashFlowQuery.error)} />
        ) : null}
        {cashFlowQuery.data ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {cashFlowQuery.data.horizons.map((horizon) => (
              <Stat
                key={horizon.days}
                label={t.plusDays(horizon.days)}
                value={
                  <Money amount={horizon.projected_balance} size="lg" />
                }
                hint={`${t.income}: ${formatMoney(horizon.income)} · ${t.expense}: ${formatMoney(horizon.expense)}`}
              />
            ))}
          </div>
        ) : null}
      </Panel>
    </div>
  )
}
