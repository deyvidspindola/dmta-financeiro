import { ApiError } from '@/api/http'
import { strings } from '@/i18n/pt-BR'

/** Prefer API business-rule messages (422 `{ message }`) over a generic fallback. */
export function getErrorMessage(
  error: unknown,
  fallback: string = strings.common.error,
): string {
  if (error instanceof ApiError && error.message.trim()) {
    return error.message
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}
