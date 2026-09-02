import type { Category } from '@/types/models'

/** Índice de cor da paleta cat-1..12 derivado do id (API não expõe cor). */
export function categoryColorIndex(categoryId: string): number {
  return Number(categoryId) % 12 || 1
}

export type CategoryGroup = {
  type: 'income' | 'expense'
  roots: Category[]
  childrenByParent: Map<string, Category[]>
}

export function groupCategories(rows: Category[]): CategoryGroup[] {
  const types: Array<'income' | 'expense'> = ['expense', 'income']
  return types.map((type) => {
    const ofType = rows.filter((c) => c.type === type)
    const roots = ofType
      .filter((c) => c.parent_id === null)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    const childrenByParent = new Map<string, Category[]>()
    for (const cat of ofType.filter((c) => c.parent_id !== null)) {
      const parentId = cat.parent_id!
      const list = childrenByParent.get(parentId) ?? []
      list.push(cat)
      childrenByParent.set(parentId, list)
    }
    for (const [, children] of childrenByParent) {
      children.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    }
    return { type, roots, childrenByParent }
  })
}
