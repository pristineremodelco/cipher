/**
 * The tape and the memory register.
 *
 * Kept apart from the settings, under their own key, because they change on
 * every press where the settings change twice a year. Writing the whole of one
 * every time the other moves is how a storage key ends up rewritten a hundred
 * times a minute.
 */

export type TapeEntry = {
  id: string
  /** As it was keyed in, so it can be put back on the display and edited. */
  expression: string
  value: number
  at: number
}

export type Tape = {
  entries: TapeEntry[]
  memory: number
}

/** Enough to scroll back through a session's work without the key growing teeth. */
export const MAX_TAPE = 200

const KEY = 'calculator.tape.v1'

export function emptyTape(): Tape {
  return { entries: [], memory: 0 }
}

export function loadTape(): Tape {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyTape()
    const parsed = JSON.parse(raw) as Partial<Tape>
    return {
      entries: Array.isArray(parsed.entries)
        ? parsed.entries
            .filter(
              (entry): entry is TapeEntry =>
                Boolean(entry) &&
                typeof entry.expression === 'string' &&
                Number.isFinite(entry.value),
            )
            .slice(0, MAX_TAPE)
            .map((entry) => ({
              id: typeof entry.id === 'string' ? entry.id : crypto.randomUUID(),
              expression: entry.expression,
              value: entry.value,
              at: Number.isFinite(entry.at) ? entry.at : Date.now(),
            }))
        : [],
      memory: Number.isFinite(parsed.memory) ? (parsed.memory as number) : 0,
    }
  } catch {
    return emptyTape()
  }
}

export function saveTape(tape: Tape) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...tape, entries: tape.entries.slice(0, MAX_TAPE) }))
  } catch {
    /* quota or private mode: the session keeps working, it just is not written down */
  }
}
