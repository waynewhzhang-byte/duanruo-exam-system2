/**
 * Some list endpoints return a plain array; others return paginated
 * `{ content, total, page, size }` after `unwrapApiResult`. Normalize to `T[]`.
 */
export function normalizePaginatedOrArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) {
    return raw as T[]
  }
  if (raw && typeof raw === 'object' && 'content' in raw) {
    const { content } = raw as { content: unknown }
    if (Array.isArray(content)) {
      return content as T[]
    }
  }
  return []
}
