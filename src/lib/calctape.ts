import { uid } from './uid.ts'

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
  /** Saved entries are kept apart from the rolling two hundred and survive Clear. */
  saved?: boolean
  /** A short label, such as what the sum was for. */
  note?: string
}

export type Tape = {
  entries: TapeEntry[]
  memory: number
}

/** Enough to scroll back through a session's work without the key growing teeth. */
export const MAX_TAPE = 200
/**
 * Saved entries have their own allowance, so a busy week of sums cannot push
 * one off, and so saving cannot grow the key without limit either.
 */
export const MAX_SAVED = 100
/** Long enough for "Kitchen backsplash, both walls", short enough for one line. */
export const MAX_NOTE = 60

const KEY = 'calculator.tape.v1'

export function emptyTape(): Tape {
  return { entries: [], memory: 0 }
}

export function loadTape(): Tape {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyTape()
    const parsed = JSON.parse(raw) as Partial<Tape>
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries
          .filter(
            (entry): entry is TapeEntry =>
              Boolean(entry) && typeof entry.expression === 'string' && Number.isFinite(entry.value),
          )
          .map((entry) => tidy(entry))
      : []
    return {
      entries: capEntries(entries),
      memory: Number.isFinite(parsed.memory) ? (parsed.memory as number) : 0,
    }
  } catch {
    return emptyTape()
  }
}

export function saveTape(tape: Tape) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...tape, entries: capEntries(tape.entries) }))
  } catch {
    /* quota or private mode: the session keeps working, it just is not written down */
  }
}

/** One stored entry, made safe to draw: anything missing or the wrong shape is filled in or dropped. */
function tidy(entry: TapeEntry): TapeEntry {
  const out: TapeEntry = {
    id: typeof entry.id === 'string' ? entry.id : uid(),
    expression: entry.expression,
    value: entry.value,
    at: Number.isFinite(entry.at) ? entry.at : Date.now(),
  }
  if (entry.saved === true) out.saved = true
  const note = typeof entry.note === 'string' ? cleanNote(entry.note) : ''
  if (note) out.note = note
  return out
}

/** A note on one line, trimmed, and no longer than MAX_NOTE. */
export function cleanNote(note: string): string {
  return note.replace(/\s+/g, ' ').trim().slice(0, MAX_NOTE)
}

/**
 * Newest first, at most MAX_TAPE unsaved and MAX_SAVED saved. The oldest of
 * each kind is the one that goes; saving one never pushes an unsaved one off.
 */
export function capEntries(entries: TapeEntry[]): TapeEntry[] {
  let loose = 0
  let saved = 0
  return entries.filter((entry) => (entry.saved ? saved++ < MAX_SAVED : loose++ < MAX_TAPE))
}

/** A new answer at the top. */
export function addEntry(tape: Tape, entry: TapeEntry): Tape {
  return { ...tape, entries: capEntries([entry, ...tape.entries]) }
}

export function removeEntry(tape: Tape, id: string): Tape {
  return { ...tape, entries: tape.entries.filter((entry) => entry.id !== id) }
}

/** Saved or not. Unsaving one past the unsaved allowance lets the oldest unsaved one go. */
export function toggleSaved(tape: Tape, id: string): Tape {
  const entries = tape.entries.map((entry) => {
    if (entry.id !== id) return entry
    if (entry.saved) {
      const rest = { ...entry }
      delete rest.saved
      return rest
    }
    return { ...entry, saved: true }
  })
  return { ...tape, entries: capEntries(entries) }
}

/** Sets or clears the note on one entry. */
export function setNote(tape: Tape, id: string, note: string): Tape {
  const clean = cleanNote(note)
  return {
    ...tape,
    entries: tape.entries.map((entry) => {
      if (entry.id !== id) return entry
      const rest = { ...entry }
      delete rest.note
      return clean ? { ...rest, note: clean } : rest
    }),
  }
}

/** Clear takes the unsaved ones and leaves the saved ones. */
export function clearUnsaved(tape: Tape): Tape {
  return { ...tape, entries: tape.entries.filter((entry) => entry.saved) }
}

/**
 * Entries whose working, answer or note holds what was typed. The answer is
 * matched as shown and as a plain number, so 1,200 and 1200 both find it.
 * Spaces, and the difference between typed and drawn operators, are ignored.
 */
export function searchEntries(entries: TapeEntry[], query: string, shown: (value: number) => string): TapeEntry[] {
  const want = squash(query)
  if (!want) return entries
  return entries.filter((entry) =>
    [entry.expression, shown(entry.value), String(entry.value), entry.note ?? ''].some((text) => squash(text).includes(want)),
  )
}

function squash(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, '−')
}

/** Midnight at the start of the day `at` falls in, on this device's clock. */
export function startOfDay(at: number): number {
  const day = new Date(at)
  day.setHours(0, 0, 0, 0)
  return day.getTime()
}

export type TapeDay = { day: number; entries: TapeEntry[] }

/** Newest first, split by the day each was worked out on. */
export function groupByDay(entries: TapeEntry[]): TapeDay[] {
  const days: TapeDay[] = []
  for (const entry of entries) {
    const day = startOfDay(entry.at)
    const last = days[days.length - 1]
    if (last && last.day === day) last.entries.push(entry)
    else days.push({ day, entries: [entry] })
  }
  return days
}

/** Today, Yesterday, or the date, with the year only when it is not this one. */
export function dayLabel(day: number, now: number, locale: string): string {
  const today = startOfDay(now)
  if (day === today) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (day === yesterday.getTime()) return 'Yesterday'
  const date = new Date(day)
  const sameYear = date.getFullYear() === new Date(now).getFullYear()
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** The time of day an entry was worked out, on a 12 or 24 hour clock. */
export function timeLabel(at: number, clock: '12' | '24', locale: string): string {
  return new Date(at).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: clock === '12' })
}
