import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { categoriesApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { toastError, toastSuccess } from '@/store/toastStore'
import {
  Button,
  ErrorBanner,
  Field,
  IconButton,
  Modal,
  TextInput,
  TextSelect,
} from '@/components/ui'
import type { Category, MoneyDirection } from '@/types/models'

const createSchema = z.object({
  name: z.string().min(1, strings.common.required),
  type: z.enum(['income', 'expense']),
  parent_id: z.string().nullable(),
})

const editSchema = z.object({
  name: z.string().min(1, strings.common.required),
})

type CreateValues = z.infer<typeof createSchema>
type EditValues = z.infer<typeof editSchema>

interface CategoryModalProps {
  contextId: string
  open: boolean
  onClose: () => void
  onCreated?: (categoryId: string) => void
  /** Inherited from the form that opened the modal (locked in the UI). */
  defaultType?: MoneyDirection
  /** Open directly in edit mode (name only — type/parent are not PATCH-able). */
  editingCategory?: Category | null
  /** Hide the inline manage list (use when a dedicated categories page exists). */
  hideManageList?: boolean
}

export function CategoryModal({
  contextId,
  open,
  onClose,
  onCreated,
  defaultType = 'expense',
  editingCategory = null,
  hideManageList = false,
}: CategoryModalProps) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Category | null>(null)
  const isEdit = editing !== null
  const openedForExternalEdit = editingCategory !== null

  const listType = editingCategory?.type ?? defaultType

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', contextId, listType],
    queryFn: () =>
      categoriesApi.listCategories(contextId, { type: listType }),
    enabled: open && Boolean(contextId),
  })

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: '',
      type: defaultType,
      parent_id: null,
    },
  })

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: '' },
  })

  const selectedType = createForm.watch('type')

  useEffect(() => {
    if (!open) return
    if (editingCategory) {
      setEditing(editingCategory)
      editForm.reset({ name: editingCategory.name })
      return
    }
    setEditing(null)
    createForm.reset({ name: '', type: defaultType, parent_id: null })
    editForm.reset({ name: '' })
  }, [open, defaultType, editingCategory, createForm, editForm])

  const createMutation = useMutation({
    mutationFn: (values: CreateValues) =>
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

  const updateMutation = useMutation({
    mutationFn: (values: EditValues) =>
      categoriesApi.updateCategory(contextId, editing!.id, {
        name: values.name,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories', contextId] })
      toastSuccess(strings.categories.updated)
      if (openedForExternalEdit) {
        onClose()
        return
      }
      setEditing(null)
      editForm.reset({ name: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) =>
      categoriesApi.deleteCategory(contextId, categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories', contextId] })
      toastSuccess(strings.categories.deleted)
      if (editing) {
        setEditing(null)
        editForm.reset({ name: '' })
      }
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function startEdit(category: Category) {
    setEditing(category)
    editForm.reset({ name: category.name })
  }

  function handleDelete(categoryId: string) {
    if (!window.confirm(strings.categories.confirmDelete)) return
    deleteMutation.mutate(categoryId)
  }

  function handleClose() {
    setEditing(null)
    onClose()
  }

  if (!open) return null

  const roots = categories.filter(
    (c) => c.parent_id === null && c.type === selectedType,
  )

  const activeError =
    (isEdit ? updateMutation.error : createMutation.error) ?? null
  const isPending = isEdit
    ? updateMutation.isPending
    : createMutation.isPending

  return (
    <Modal
      title={isEdit ? strings.categories.edit : strings.categories.create}
      onClose={handleClose}
    >
      {isEdit ? (
        <form
          className="form-grid"
          onSubmit={editForm.handleSubmit((values) =>
            updateMutation.mutateAsync(values),
          )}
        >
          <Field
            label={strings.categories.name}
            error={editForm.formState.errors.name?.message}
          >
            <TextInput {...editForm.register('name')} autoFocus />
          </Field>
          <p className="muted small">
            {strings.categories.types[editing.type]}
            {editing.parent_id
              ? ` — ${categories.find((c) => c.id === editing.parent_id)?.name ?? ''}`
              : ''}
          </p>
          {activeError ? (
            <ErrorBanner message={getErrorMessage(activeError)} />
          ) : null}
          <div className="form-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (openedForExternalEdit) {
                  handleClose()
                  return
                }
                setEditing(null)
                editForm.reset({ name: '' })
              }}
            >
              {strings.common.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {strings.common.save}
            </Button>
          </div>
        </form>
      ) : (
        <form
          className="form-grid"
          onSubmit={createForm.handleSubmit((values) =>
            createMutation.mutateAsync(values),
          )}
        >
          <Field
            label={strings.categories.name}
            error={createForm.formState.errors.name?.message}
          >
            <TextInput {...createForm.register('name')} autoFocus />
          </Field>
          <Field label={strings.categories.type}>
            <input type="hidden" {...createForm.register('type')} />
            <p className="muted small">
              {strings.categories.types[defaultType]}
            </p>
          </Field>
          <Field label={strings.categories.parent}>
            <TextSelect
              {...createForm.register('parent_id', {
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
          {activeError ? (
            <ErrorBanner message={getErrorMessage(activeError)} />
          ) : null}
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={handleClose}>
              {strings.common.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {strings.common.save}
            </Button>
          </div>
        </form>
      )}

      {!isEdit && !hideManageList && categories.length > 0 ? (
        <div className="category-manage">
          <h3 className="section-title">{strings.categories.existing}</h3>
          <ul className="category-manage-list">
            {categories.map((cat) => (
              <li key={cat.id}>
                <span>
                  {cat.parent_id ? `↳ ${cat.name}` : cat.name}
                </span>
                <span className="actions-cell">
                  <IconButton
                    label={strings.common.edit}
                    icon={Pencil}
                    onClick={() => startEdit(cat)}
                  />
                  <IconButton
                    label={strings.common.delete}
                    icon={Trash2}
                    variant="danger"
                    onClick={() => handleDelete(cat.id)}
                    disabled={deleteMutation.isPending}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Modal>
  )
}
