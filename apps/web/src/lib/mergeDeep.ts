type Obj = Record<string, unknown>

function isPlainObject(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Merge recursivo (arrays são substituídos, não concatenados). */
export function mergeDeep<T extends Obj>(base: T, override: Obj): T {
  const out: Obj = { ...base }
  for (const key of Object.keys(override)) {
    const b = out[key]
    const o = override[key]
    out[key] = isPlainObject(b) && isPlainObject(o) ? mergeDeep(b, o) : o
  }
  return out as T
}
