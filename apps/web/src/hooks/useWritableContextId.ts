import { useAuthStore } from '@/store/authStore'

/** Resolves the active context id for write/list operations (never consolidated). */
export function useWritableContextId(): string | null {
  const { activeScope, contexts } = useAuthStore()
  if (activeScope === 'consolidated') {
    return contexts[0]?.id ?? null
  }
  return activeScope
}
