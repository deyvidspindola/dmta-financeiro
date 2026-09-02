import { Pencil, Trash2 } from 'lucide-react'
import {
  categoryColorIndex,
  type CategoryGroup,
} from '@/components/categories/categoryDisplay'
import {
  CategoryChip,
  IconButton,
  Panel,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import type { Category } from '@/types/models'

const c = strings.categories

type CategoryListProps = {
  groups: CategoryGroup[]
  canMutate?: boolean
  onEdit?: (category: Category) => void
  onDelete?: (categoryId: string) => void
  deletePending?: boolean
}

function CategoryRow({
  category,
  indent = false,
  canMutate,
  onEdit,
  onDelete,
  deletePending,
}: {
  category: Category
  indent?: boolean
  canMutate?: boolean
  onEdit?: (category: Category) => void
  onDelete?: (categoryId: string) => void
  deletePending?: boolean
}) {
  const colorIndex = categoryColorIndex(category.id)

  return (
    <li
      className={`flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0 ${
        indent ? 'bg-surface-2/30 pl-8' : ''
      }`}
    >
      <CategoryChip name={category.name} colorIndex={colorIndex} />
      <div className="flex items-center gap-1">
        {onEdit ? (
          <IconButton
            label={strings.common.edit}
            icon={Pencil}
            onClick={() => onEdit(category)}
            disabled={!canMutate}
          />
        ) : null}
        {onDelete ? (
          <IconButton
            label={strings.common.delete}
            icon={Trash2}
            variant="danger"
            onClick={() => onDelete(category.id)}
            disabled={deletePending || !canMutate}
          />
        ) : null}
      </div>
    </li>
  )
}

export function CategoryList({
  groups,
  canMutate = false,
  onEdit,
  onDelete,
  deletePending,
}: CategoryListProps) {
  const nonEmpty = groups.filter((g) => g.roots.length > 0)
  if (nonEmpty.length === 0) return null

  return (
    <div className="space-y-6">
      {nonEmpty.map((group) => (
        <section key={group.type}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-fg-subtle">
            {group.type === 'income' ? c.groupIncome : c.groupExpense}
          </h2>
          <Panel className="overflow-hidden p-0">
            <ul>
              {group.roots.map((root) => (
                <div key={root.id}>
                  <CategoryRow
                    category={root}
                    canMutate={canMutate}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deletePending={deletePending}
                  />
                  {(group.childrenByParent.get(root.id) ?? []).map((child) => (
                    <CategoryRow
                      key={child.id}
                      category={child}
                      indent
                      canMutate={canMutate}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      deletePending={deletePending}
                    />
                  ))}
                </div>
              ))}
            </ul>
          </Panel>
        </section>
      ))}
    </div>
  )
}
