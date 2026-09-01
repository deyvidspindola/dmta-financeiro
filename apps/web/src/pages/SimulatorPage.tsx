import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { simulationsApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { formatMoney } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import {
  Button,
  ErrorBanner,
  Field,
  LoadingBlock,
  PageHeader,
  Panel,
  TextInput,
} from '@/components/ui-legacy'
import type { InstallmentPurchaseSimulation } from '@/types/models'

const schema = z.object({
  amount: z.coerce.number().positive(),
  installments: z.coerce.number().int().min(1).max(360),
  cash_price: z.coerce.number().optional(),
})

type FormValues = z.infer<typeof schema>

function SimulationResult({
  result,
}: {
  result: InstallmentPurchaseSimulation
}) {
  return (
    <div className="stack">
      <p>
        <span className={`semaforo semaforo--${result.status}`}>
          {strings.simulator.statuses[result.status]}
        </span>
      </p>
      <p>
        {strings.simulator.installment}:{' '}
        <strong>{formatMoney(result.installment_amount)}</strong>
      </p>
      <p>
        {strings.simulator.freeBudget}: {formatMoney(result.free_budget)}
      </p>
      <p>
        {strings.simulator.commitment}:{' '}
        {result.commitment_percent === null
          ? '—'
          : `${result.commitment_percent}%`}
      </p>
      <p>
        {strings.simulator.fitsNow}:{' '}
        {result.fits_now ? strings.simulator.yes : strings.simulator.no}
      </p>
      <p>
        {strings.simulator.fitsFrom}:{' '}
        {result.fits_from_month ?? strings.simulator.neverFits}
      </p>
      <p>
        {strings.simulator.tightest}: {result.tightest_month.month} ·{' '}
        {formatMoney(result.tightest_month.free_budget)}
        {result.tightest_month.commitment_percent !== null
          ? ` · ${result.tightest_month.commitment_percent}%`
          : ''}
      </p>
      {result.total_cost !== null ? (
        <p>
          {strings.simulator.totalCost}: {formatMoney(result.total_cost)}
        </p>
      ) : null}
      {result.annual_cet !== null ? (
        <p>
          {strings.simulator.cet}: {result.annual_cet}%
        </p>
      ) : null}
    </div>
  )
}

function ScenarioForm({
  title,
  contextId,
}: {
  title: string
  contextId: string
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, installments: 12, cash_price: undefined },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      simulationsApi.simulateInstallmentPurchase(contextId, {
        amount: values.amount,
        installments: values.installments,
        cash_price: values.cash_price || null,
      }),
  })

  return (
    <Panel>
      <h2 className="panel__title">{title}</h2>
      <form
        className="form-grid"
        onSubmit={form.handleSubmit((values) =>
          mutation.mutateAsync(values),
        )}
      >
        <Field
          label={strings.simulator.amount}
          error={form.formState.errors.amount?.message}
        >
          <TextInput type="number" step="0.01" {...form.register('amount')} />
        </Field>
        <Field
          label={strings.simulator.installments}
          error={form.formState.errors.installments?.message}
        >
          <TextInput type="number" {...form.register('installments')} />
        </Field>
        <Field label={strings.simulator.cashPrice}>
          <TextInput
            type="number"
            step="0.01"
            {...form.register('cash_price')}
          />
        </Field>
        {mutation.isError ? (
          <ErrorBanner message={getErrorMessage(mutation.error)} />
        ) : null}
        <Button type="submit" disabled={mutation.isPending}>
          {strings.simulator.simulate}
        </Button>
      </form>
      {mutation.data ? <SimulationResult result={mutation.data} /> : null}
    </Panel>
  )
}

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
    <div className="stack">
      <PageHeader
        title={strings.simulator.title}
        description={strings.simulator.hint}
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message={strings.simulator.needContext} />
      ) : null}

      {listContextId ? (
        <div className="scenario-grid">
          <ScenarioForm
            title={strings.simulator.scenarioA}
            contextId={listContextId}
          />
          {compare ? (
            <ScenarioForm
              title={strings.simulator.scenarioB}
              contextId={listContextId}
            />
          ) : (
            <Button variant="ghost" onClick={() => setCompare(true)}>
              {strings.simulator.scenarioB}
            </Button>
          )}
        </div>
      ) : null}

      <Panel>
        <h2 className="panel__title">{strings.simulator.cashFlow}</h2>
        <p className="muted small">{strings.simulator.cashFlowHint}</p>
        {cashFlowQuery.isLoading ? (
          <LoadingBlock label={strings.common.loading} />
        ) : null}
        {cashFlowQuery.isError ? (
          <ErrorBanner message={getErrorMessage(cashFlowQuery.error)} />
        ) : null}
        {cashFlowQuery.data ? (
          <div className="metric-grid">
            {cashFlowQuery.data.horizons.map((horizon) => (
              <div key={horizon.days}>
                <p className="metric__label">
                  {strings.simulator.plusDays(horizon.days)}
                </p>
                <p className="muted small">
                  {strings.simulator.income}: {formatMoney(horizon.income)}
                </p>
                <p className="muted small">
                  {strings.simulator.expense}: {formatMoney(horizon.expense)}
                </p>
                <p className="metric__value">
                  {formatMoney(horizon.projected_balance)}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>
    </div>
  )
}
