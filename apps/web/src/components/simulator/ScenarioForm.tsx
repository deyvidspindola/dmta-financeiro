import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { simulationsApi } from '@/api'
import { SimulationResultView } from '@/components/simulator/SimulationResult'
import {
  emptySimulatorValues,
  simulatorSchema,
  type SimulatorFormValues,
} from '@/components/simulator/schemas'
import {
  Button,
  ErrorBanner,
  Field,
  MoneyInput,
  Panel,
  TextInput,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'

const t = strings.simulator

type ScenarioFormProps = {
  title: string
  contextId: string
}

export function ScenarioForm({ title, contextId }: ScenarioFormProps) {
  const form = useForm<SimulatorFormValues>({
    resolver: zodResolver(simulatorSchema),
    defaultValues: emptySimulatorValues,
  })

  const mutation = useMutation({
    mutationFn: (values: SimulatorFormValues) =>
      simulationsApi.simulateInstallmentPurchase(contextId, {
        amount: values.amount,
        installments: values.installments,
        cash_price: values.cash_price || null,
      }),
  })

  const installments = form.watch('installments') || 12

  return (
    <Panel>
      <h2 className="mb-4 font-display text-base font-semibold text-fg">
        {title}
      </h2>
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <Field
          label={t.amount}
          error={form.formState.errors.amount?.message}
        >
          <Controller
            name="amount"
            control={form.control}
            render={({ field }) => (
              <MoneyInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                aria-invalid={Boolean(form.formState.errors.amount)}
              />
            )}
          />
        </Field>
        <Field
          label={t.installments}
          error={form.formState.errors.installments?.message}
        >
          <TextInput type="number" {...form.register('installments')} />
        </Field>
        <Field label={t.cashPrice}>
          <Controller
            name="cash_price"
            control={form.control}
            render={({ field }) => (
              <MoneyInput
                value={field.value ?? 0}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
              />
            )}
          />
        </Field>
        {mutation.isError ? (
          <ErrorBanner message={getErrorMessage(mutation.error)} />
        ) : null}
        <Button type="submit" disabled={mutation.isPending}>
          {t.simulate}
        </Button>
      </form>
      {mutation.data ? (
        <SimulationResultView
          result={mutation.data}
          installments={installments}
        />
      ) : null}
    </Panel>
  )
}
