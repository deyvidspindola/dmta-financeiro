import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { categoriesApi } from '@/api'
import { CategoryModal } from '@/components/CategoryModal'
import {
  Button,
  DataTable,
  EmptyState,
  ErrorBanner,
  Field,
  IconButton,
  LoadingBlock,
  PageHeader,
  TextSelect,
} from '@/components/ui-legacy'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { Category, MoneyDirection } from '@/types/models'

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope
  const [typeFilter, setTypeFilter] = useState<MoneyDirection>('expense')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['categories', listContextId, typeFilter],
    queryFn: () =>
      categoriesApi.listCategories(listContextId!, { type: typeFilter }),
    enabled: Boolean(listContextId),
  })

  const byId = useMemo(() => {
    const map = new Map<string, Category>()
    for (const cat of data) map.set(cat.id, cat)
    return map
  }, [data])

  const sorted = useMemo(() => {
    const roots = data
      .filter((c) => c.parent_id === null)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    const rows: Category[] = []
    for (const root of roots) {
      rows.push(root)
      const children = data
        .filter((c) => c.parent_id === root.id)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      rows.push(...children)
    }
    const orphanChildren = data.filter(
      (c) =>
        c.parent_id !== null && !roots.some((r) => r.id === c.parent_id),
    )
    rows.push(
      ...orphanChildren.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    )
    return rows
  }, [data])

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) =>
      categoriesApi.deleteCategory(contextId!, categoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      toastSuccess(strings.categories.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  function handleDelete(categoryId: string) {
    if (!window.confirm(strings.categories.confirmDelete)) return
    deleteMutation.mutate(categoryId)
  }

  return (
    <div className="stack">
      <PageHeader
        title={strings.categories.listTitle}
        description={strings.categories.listHint}
        actions={
          <Button
            onClick={openCreate}
            disabled={!contextId || activeScope === CONSOLIDATED}
          >
            {strings.categories.create}
          </Button>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message="Selecione um contexto para listar categorias." />
      ) : null}

      {listContextId ? (
        <div className="filter-bar">
          <Field label={strings.categories.type}>
            <TextSelect
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as MoneyDirection)
              }
            >
              <option value="expense">{strings.categories.types.expense}</option>
              <option value="income">{strings.categories.types.income}</option>
            </TextSelect>
          </Field>
        </div>
      ) : null}

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? (
        <ErrorBanner message={getErrorMessage(error)} />
      ) : null}

      {!isLoading && listContextId && sorted.length === 0 ? (
        <EmptyState message={strings.categories.empty} />
      ) : null}

      {sorted.length > 0 ? (
        <DataTable
          headers={[
            strings.categories.name,
            strings.categories.parent,
            strings.categories.type,
            strings.common.actions,
          ]}
        >
          {sorted.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.parent_id ? `↳ ${cat.name}` : cat.name}</td>
              <td>
                {cat.parent_id
                  ? (byId.get(cat.parent_id)?.name ?? '—')
                  : strings.categories.parentNone}
              </td>
              <td>{strings.categories.types[cat.type]}</td>
              <td className="actions-cell">
                <IconButton
                  label={strings.common.edit}
                  icon={Pencil}
                  onClick={() => openEdit(cat)}
                  disabled={!contextId}
                />
                <IconButton
                  label={strings.common.delete}
                  icon={Trash2}
                  variant="danger"
                  onClick={() => handleDelete(cat.id)}
                  disabled={deleteMutation.isPending || !contextId}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {contextId ? (
        <CategoryModal
          contextId={contextId}
          open={modalOpen}
          onClose={closeModal}
          defaultType={typeFilter}
          editingCategory={editing}
          hideManageList
        />
      ) : null}
    </div>
  )
}
