import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { categoriesApi } from '@/api'
import { CategoryModal } from '@/components/CategoryModal'
import { CategoryList } from '@/components/categories/CategoryList'
import { groupCategories } from '@/components/categories/categoryDisplay'
import {
  Button,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
} from '@/components/ui'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { Category } from '@/types/models'

const c = strings.categories

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const listQuery = useQuery({
    queryKey: ['categories', listContextId, 'all'],
    queryFn: () => categoriesApi.listCategories(listContextId!),
    enabled: Boolean(listContextId),
  })

  const groups = useMemo(
    () => groupCategories(listQuery.data ?? []),
    [listQuery.data],
  )

  const hasCategories = (listQuery.data?.length ?? 0) > 0

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) =>
      categoriesApi.deleteCategory(contextId!, categoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      toastSuccess(c.deleted)
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
    if (!window.confirm(c.confirmDelete)) return
    deleteMutation.mutate(categoryId)
  }

  const canMutate = Boolean(contextId) && activeScope !== CONSOLIDATED

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={c.listTitle}
        description={c.listHint}
        actions={
          <Button onClick={openCreate} disabled={!canMutate}>
            <Plus size={16} aria-hidden />
            {c.create}
          </Button>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message={c.needContext} />
      ) : null}

      {listQuery.isLoading ? (
        <LoadingBlock label={strings.common.loading} />
      ) : null}
      {listQuery.isError ? (
        <ErrorBanner message={getErrorMessage(listQuery.error)} />
      ) : null}

      {!listQuery.isLoading && listContextId && !hasCategories ? (
        <EmptyState message={c.empty} />
      ) : null}

      <CategoryList
        groups={groups}
        canMutate={canMutate}
        onEdit={openEdit}
        onDelete={handleDelete}
        deletePending={deleteMutation.isPending}
      />

      {contextId ? (
        <CategoryModal
          contextId={contextId}
          open={modalOpen}
          onClose={closeModal}
          defaultType={editing?.type ?? 'expense'}
          editingCategory={editing}
          hideManageList
        />
      ) : null}
    </div>
  )
}
