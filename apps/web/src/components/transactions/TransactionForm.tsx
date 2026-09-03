import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { accountsApi, categoriesApi, goalsApi } from '@/api'
import { CategoryModal } from '@/components/CategoryModal'
import {
  Button,
  DatePickerField,
  ErrorBanner,
  Field,
  MoneyInput,
  SwitchField,
  TextInput,
  TextSelect,
} from '@/components/ui'
import {
  emptyEntry,
  entrySchema,
  type EntryFormValues,
} from '@/components/transactions/schemas'
import { strings } from '@/i18n/pt-BR'
import { cn } from '@/lib/cn'

const t = strings.transactions

type TransactionFormProps = {
  contextId: string
  initialValues?: Partial<EntryFormValues>
  isEdit?: boolean
  showRecurring?: boolean
  showGoal?: boolean
  isPending?: boolean
  error?: string | null
  onSubmit: (values: EntryFormValues) => void
  onCancel: () => void
  /** Layout enxuto para QuickAdd — sem recorrência/meta, botão block. */
  variant?: 'default' | 'quick'
}

export function TransactionForm({
  contextId,
  initialValues,
  isEdit = false,
  showRecurring = !isEdit,
  showGoal = !isEdit,
  isPending = false,
  error,
  onSubmit,
  onCancel,
  variant = 'default',
}: TransactionFormProps) {
  const [categoryOpen, setCategoryOpen] = useState(false)

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: { ...emptyEntry(), ...initialValues },
  })

  const watchedType = form.watch('type')
  const isRecurring = form.watch('is_recurring')

  const showGoalField = showGoal && watchedType === 'income'

  useEffect(() => {
    if (!isEdit) form.setValue('category_id', null)
  }, [watchedType, form, isEdit])

  useEffect(() => {
    if (watchedType !== 'income') form.setValue('goal_id', null)
  }, [watchedType, form])

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId),
    enabled: Boolean(contextId),
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId, watchedType],
    queryFn: () => categoriesApi.listCategories(contextId, { type: watchedType }),
    enabled: Boolean(contextId),
  })

  const goalsQuery = useQuery({
    queryKey: ['goals', contextId],
    queryFn: () => goalsApi.listGoals(contextId),
    enabled: Boolean(contextId) && showGoalField,
  })

  const accounts = accountsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const activeGoals = (goalsQuery.data ?? []).filter((g) => g.status === 'active')
  const isQuick = variant === 'quick'

  return (
    <>
      <form
        className={cn('grid gap-4', !isQuick && 'sm:grid-cols-2')}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {isQuick ? (
          <Field label={t.amount} error={form.formState.errors.amount?.message}>
            <Controller
              name="amount"
              control={form.control}
              render={({ field }) => (
                <MoneyInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  autoFocus
                  aria-invalid={Boolean(form.formState.errors.amount)}
                />
              )}
            />
          </Field>
        ) : null}

        <div className={cn(!isQuick && 'sm:col-span-2')}>
          <Field
            label={t.description}
            error={form.formState.errors.description?.message}
            required
          >
            <TextInput
              maxLength={150}
              autoFocus={!isQuick}
              aria-invalid={Boolean(form.formState.errors.description)}
              {...form.register('description')}
            />
          </Field>
        </div>

        {!isQuick ? (
          <>
            <Field
              label={t.amount}
              error={form.formState.errors.amount?.message}
              required
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
              label={t.date}
              error={form.formState.errors.date?.message}
              required
            >
              <Controller
                name="date"
                control={form.control}
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={Boolean(form.formState.errors.date)}
                  />
                )}
              />
            </Field>

            <Field label={t.type}>
              <TextSelect {...form.register('type')}>
                <option value="expense">{t.types.expense}</option>
                <option value="income">{t.types.income}</option>
              </TextSelect>
            </Field>
          </>
        ) : (
          <Field label={t.date} error={form.formState.errors.date?.message}>
            <Controller
              name="date"
              control={form.control}
              render={({ field }) => (
                <DatePickerField
                  value={field.value}
                  onChange={field.onChange}
                  aria-invalid={Boolean(form.formState.errors.date)}
                />
              )}
            />
          </Field>
        )}

        <Field
          label={t.account}
          error={form.formState.errors.account_id?.message}
          required
        >
          <TextSelect {...form.register('account_id')}>
            <option value="">{strings.common.select}</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </TextSelect>
        </Field>

        <div className={cn(!isQuick && 'sm:col-span-2')}>
          <Field label={t.category}>
            <div className="flex gap-2">
              <TextSelect
                className="min-w-0 flex-1"
                {...form.register('category_id', {
                  setValueAs: (v: string) => (v === '' ? null : v),
                })}
              >
                <option value="">
                  {isQuick ? strings.quickAdd.noCategory : strings.common.select}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parent_id ? `↳ ${cat.name}` : cat.name}
                  </option>
                ))}
              </TextSelect>
              {!isQuick ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCategoryOpen(true)}
                >
                  {strings.categories.quickAdd}
                </Button>
              ) : null}
            </div>
          </Field>
        </div>

        {showGoalField ? (
          <div className="sm:col-span-2">
            <Field label={t.goal}>
              <TextSelect
                {...form.register('goal_id', {
                  setValueAs: (v: string) => (v === '' ? null : v),
                })}
              >
                <option value="">{t.goalNone}</option>
                {activeGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
          </div>
        ) : null}

        {!isEdit ? (
          <div className={cn(!isQuick && 'sm:col-span-2')}>
            <Controller
              name="settled"
              control={form.control}
              render={({ field }) => (
                <SwitchField
                  label={t.settled}
                  description={t.settledHint}
                  checked={!field.value}
                  onChange={(isForecast) => field.onChange(!isForecast)}
                />
              )}
            />
          </div>
        ) : null}

        {showRecurring ? (
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Controller
                name="is_recurring"
                control={form.control}
                render={({ field }) => (
                  <SwitchField
                    label={t.recurring}
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            {isRecurring ? (
              <>
                <Field label={t.recurringInterval}>
                  <TextSelect {...form.register('interval')}>
                    <option value="weekly">
                      {strings.recurring.intervals.weekly}
                    </option>
                    <option value="monthly">
                      {strings.recurring.intervals.monthly}
                    </option>
                    <option value="yearly">
                      {strings.recurring.intervals.yearly}
                    </option>
                  </TextSelect>
                </Field>
                <Field label={t.recurringStart}>
                  <Controller
                    name="start_date"
                    control={form.control}
                    render={({ field }) => (
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </Field>
                <Field label={t.recurringEnd}>
                  <Controller
                    name="end_date"
                    control={form.control}
                    render={({ field }) => (
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </Field>
              </>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className={cn(!isQuick && 'sm:col-span-2')}>
            <ErrorBanner message={error} />
          </div>
        ) : null}

        <div
          className={cn(
            isQuick
              ? 'flex flex-col gap-2 pt-2'
              : 'flex justify-end gap-2 pt-2 sm:col-span-2',
          )}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            block={isQuick}
          >
            {strings.common.cancel}
          </Button>
          <Button
            type="submit"
            loading={isPending}
            disabled={isPending}
            block={isQuick}
          >
            {isQuick ? strings.quickAdd.save : strings.common.save}
          </Button>
        </div>
      </form>

      <CategoryModal
        contextId={contextId}
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        defaultType={watchedType}
        onCreated={(categoryId) => form.setValue('category_id', categoryId)}
      />
    </>
  )
}
