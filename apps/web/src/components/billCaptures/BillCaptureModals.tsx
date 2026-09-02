import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '@/api'
import { CategoryModal } from '@/components/CategoryModal'
import { TransactionOriginBadge } from '@/components/transactions/TransactionOriginBadge'
import { categoryTypeForDirection, senderDomain } from '@/components/billCaptures/captureDisplay'
import {
  confirmCaptureSchema,
  unlockCaptureSchema,
  type ConfirmCaptureValues,
  type UnlockCaptureValues,
} from '@/components/billCaptures/schemas'
import {
  Button,
  DatePickerField,
  ErrorBanner,
  Field,
  Modal,
  MoneyInput,
  TextInput,
  TextSelect,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import type { BillCapture, Context } from '@/types/models'

const t = strings.billCaptures
const b = strings.bills

type BillCaptureConfirmModalProps = {
  capture: BillCapture
  contexts: Context[]
  defaultContextId: string
  isPending?: boolean
  error?: string | null
  onClose: () => void
  onSubmit: (values: ConfirmCaptureValues) => void
}

export function BillCaptureConfirmModal({
  capture,
  contexts,
  defaultContextId,
  isPending,
  error,
  onClose,
  onSubmit,
}: BillCaptureConfirmModalProps) {
  const [categoryOpen, setCategoryOpen] = useState(false)
  const form = useForm<ConfirmCaptureValues>({
    resolver: zodResolver(confirmCaptureSchema),
    defaultValues: {
      context_id: defaultContextId,
      description: capture.beneficiary?.trim() || '',
      amount: capture.amount ?? 0,
      due_date: capture.due_date ?? '',
      direction: 'payable',
      category_id: null,
      beneficiary: capture.beneficiary ?? '',
    },
  })

  const watchedDirection = form.watch('direction')
  const watchedContextId = form.watch('context_id')
  const categoryType = categoryTypeForDirection(watchedDirection)

  const categoriesQuery = useQuery({
    queryKey: ['categories', watchedContextId, categoryType],
    queryFn: () =>
      categoriesApi.listCategories(watchedContextId, { type: categoryType }),
    enabled: Boolean(watchedContextId),
  })
  const categories = categoriesQuery.data ?? []

  useEffect(() => {
    form.setValue('category_id', null)
  }, [watchedDirection, watchedContextId, form])

  return (
    <>
      <Modal title={t.confirmTitle} onClose={onClose}>
      <div className="mb-4 flex flex-col gap-2 rounded-xl bg-surface-2 p-3 text-sm text-fg-muted">
        <TransactionOriginBadge origin={capture.origin} />
        {capture.linha_digitavel ? (
          <span className="font-mono text-xs break-all text-fg">
            {capture.linha_digitavel}
          </span>
        ) : (
          <span>{t.linhaMissing}</span>
        )}
      </div>
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field
          label={strings.nav.context}
          error={form.formState.errors.context_id?.message}
        >
          <TextSelect {...form.register('context_id')}>
            <option value="">{strings.common.select}</option>
            {contexts.map((ctx) => (
              <option key={ctx.id} value={ctx.id}>
                {ctx.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field
          label={b.description}
          error={form.formState.errors.description?.message}
        >
          <TextInput {...form.register('description')} />
        </Field>
        <Field label={b.amount} error={form.formState.errors.amount?.message}>
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
        <Field label={b.dueDate} error={form.formState.errors.due_date?.message}>
          <Controller
            name="due_date"
            control={form.control}
            render={({ field }) => (
              <DatePickerField
                key={capture.id}
                value={field.value}
                onChange={field.onChange}
                aria-invalid={Boolean(form.formState.errors.due_date)}
              />
            )}
          />
        </Field>
        <Field label={b.kind}>
          <TextSelect {...form.register('direction')}>
            <option value="payable">{b.kinds.payable}</option>
            <option value="receivable">{b.kinds.receivable}</option>
          </TextSelect>
        </Field>
        <Field label={b.category}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <TextSelect
              className="min-w-0 flex-1"
              {...form.register('category_id', {
                setValueAs: (v: string) => (v === '' ? null : v),
              })}
            >
              <option value="">{strings.common.select}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parent_id ? `↳ ${cat.name}` : cat.name}
                </option>
              ))}
            </TextSelect>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCategoryOpen(true)}
              disabled={!watchedContextId}
            >
              {strings.categories.quickAdd}
            </Button>
          </div>
        </Field>
        <Field label={t.beneficiary}>
          <TextInput {...form.register('beneficiary')} />
        </Field>
        {error ? <ErrorBanner message={error} /> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button type="submit" disabled={isPending}>
            {t.confirm}
          </Button>
        </div>
      </form>
    </Modal>
    {watchedContextId ? (
      <CategoryModal
        contextId={watchedContextId}
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        defaultType={categoryType}
        onCreated={(categoryId) => form.setValue('category_id', categoryId)}
      />
    ) : null}
    </>
  )
}

type BillCaptureUnlockModalProps = {
  capture: BillCapture
  isPending?: boolean
  error?: string | null
  onClose: () => void
  onSubmit: (password: string) => void
}

export function BillCaptureUnlockModal({
  capture,
  isPending,
  error,
  onClose,
  onSubmit,
}: BillCaptureUnlockModalProps) {
  const form = useForm<UnlockCaptureValues>({
    resolver: zodResolver(unlockCaptureSchema),
    defaultValues: { password: '' },
  })

  return (
    <Modal title={t.unlockTitle} onClose={onClose}>
      <p className="mb-4 text-sm text-fg-muted">
        {t.unlockHint(capture.sender_email)}
      </p>
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit((values) => onSubmit(values.password))}
      >
        <Field
          label={t.password}
          error={form.formState.errors.password?.message}
        >
          <TextInput
            type="password"
            autoComplete="off"
            {...form.register('password')}
          />
        </Field>
        {error ? <ErrorBanner message={error} /> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button type="submit" disabled={isPending}>
            {t.unlockSubmit}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

type BillCaptureSaveRuleModalProps = {
  capture: BillCapture
  label: string
  isPending?: boolean
  error?: string | null
  onLabelChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}

export function BillCaptureSaveRuleModal({
  capture,
  label,
  isPending,
  error,
  onLabelChange,
  onClose,
  onConfirm,
}: BillCaptureSaveRuleModalProps) {
  const domain = senderDomain(capture.sender_email) ?? ''

  return (
    <Modal title={t.saveRuleTitle} onClose={onClose}>
      <p className="mb-4 text-sm text-fg-muted">{t.saveRuleHint(domain)}</p>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          onConfirm()
        }}
      >
        <Field label={t.saveRuleLabel}>
          <TextInput value={label} onChange={(e) => onLabelChange(e.target.value)} />
        </Field>
        {error ? <ErrorBanner message={error} /> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t.saveRuleSkip}
          </Button>
          <Button type="submit" disabled={isPending}>
            {t.saveRuleConfirm}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
