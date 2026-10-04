/**
 * An id for a palette, a history entry or a grade row.
 *
 * crypto.randomUUID exists only on a secure page in a recent browser, so the
 * app opened over plain http on a home network, or on an older phone, would
 * fail at the first equals. Ids here only have to differ from one another.
 */
export function uid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  } catch {
    /* not a secure page */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}
