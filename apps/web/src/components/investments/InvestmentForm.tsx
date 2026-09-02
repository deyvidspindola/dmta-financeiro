import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  emptyInvestmentValues,
  investmentSchema,
  type InvestmentFormValues,
} from '@/components/investments/investmentUtils'
import {
  Button,
  ErrorBanner,
  Field,
  TextInput,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import type { Investment } from '@/types/models'

const t = strings.investments

type InvestmentFormProps = {
  editing?: Investment | null
  isPending?: boolean
  error?: string | null
  onSubmit: (values: InvestmentFormValues) => void
  onCancel: () => void
}

export function InvestmentForm({
  editing,
  isPending,
  error,
  onSubmit,
  onCancel,
}: InvestmentFormProps) {
  const isEdit = editing !== null && editing !== undefined
  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    defaultValues: editing
      ? {
          name: editing.name,
          type: editing.type,
          institution: editing.institution ?? '',
          invested_amount: editing.invested_amount,
          current_position: editing.current_position,
        }
      : emptyInvestmentValues,
  })

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <Field label={t.name} error={form.formState.errors.name?.message}>
        <TextInput {...form.register('name')} />
      </Field>
      <Field label={t.type} error={form.formState.errors.type?.message}>
        <TextInput {...form.register('type')} />
      </Field>
      <Field label={t.institution}>
        <TextInput {...form.register('institution')} />
      </Field>
      {!isEdit ? (
        <Field
          label={t.investedAmount}
          hint={t.contributionHint}
          error={form.formState.errors.invested_amount?.message}
        >
          <TextInput
            type="number"
            step="0.01"
            {...form.register('invested_amount')}
          />
        </Field>
      ) : null}
      <Field
        label={isEdit ? t.currentPosition : t.currentPosition}
        error={form.formState.errors.current_position?.message}
      >
        <TextInput
          type="number"
          step="0.01"
          {...form.register('current_position')}
        />
      </Field>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {strings.common.cancel}
        </Button>
        <Button type="submit" disabled={isPending}>
          {strings.common.save}
        </Button>
      </div>
    </form>
  )
}
