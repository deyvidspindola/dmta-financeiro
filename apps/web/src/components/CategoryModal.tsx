import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { categoriesApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { toastSuccess } from '@/store/toastStore'
import {
  Button,
  ErrorBanner,
  Field,
  Modal,
  TextInput,
  TextSelect,
} from '@/components/ui'
import type { MoneyDirection } from '@/types/models'

const schema = z.object({
  name: z.string().min(1, strings.common.required),
  type: z.enum(['income', 'expense']),
  parent_id: z.string().nullable(),
})

type FormValues = z.infer<typeof schema>

interface CategoryModalProps {
  contextId: string
  open: boolean
  onClose: () => void
  onCreated?: (categoryId: string) => void
  /** Inherited from the form that opened the modal (locked in the UI). */
  defaultType?: MoneyDirection
}

export function CategoryModal({
  contextId,
  open,
  onClose,
  onCreated,
  defaultType = 'expense',
}: CategoryModalProps) {
  const queryClient = useQueryClient()
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', contextId, defaultType],
    queryFn: () =>
      categoriesApi.listCategories(contextId, { type: defaultType }),
    enabled: open && Boolean(contextId),
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: defaultType,
      parent_id: null,
    },
  })

  const selectedType = watch('type')

  useEffect(() => {
    if (open) {
      reset({ name: '', type: defaultType, parent_id: null })
    }
  }, [open, defaultType, reset])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      categoriesApi.createCategory(contextId, {
        name: values.name,
        type: values.type,
        parent_id: values.parent_id || null,
      }),
    onSuccess: (category) => {
      void queryClient.invalidateQueries({ queryKey: ['categories', contextId] })
      toastSuccess(strings.categories.created)
      onCreated?.(category.id)
      onClose()
    },
  })

  if (!open) return null

  const roots = categories.filter(
    (c) => c.parent_id === null && c.type === selectedType,
  )

  return (
    <Modal title={strings.categories.create} onClose={onClose}>
      <form
        className="form-grid"
        onSubmit={handleSubmit((values) => mutation.mutateAsync(values))}
      >
        <Field label={strings.categories.name} error={errors.name?.message}>
          <TextInput {...register('name')} autoFocus />
        </Field>
        <Field label={strings.categories.type}>
          <input type="hidden" {...register('type')} />
          <p className="muted small">
            {strings.categories.types[defaultType]}
            {' — '}
            herdado do formulário atual
          </p>
        </Field>
        <Field label={strings.categories.parent}>
          <TextSelect
            {...register('parent_id', {
              setValueAs: (v: string) => (v === '' ? null : v),
            })}
          >
            <option value="">{strings.categories.parentNone}</option>
            {roots.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        {mutation.isError ? (
          <ErrorBanner message={getErrorMessage(mutation.error)} />
        ) : null}
        <div className="form-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {strings.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
