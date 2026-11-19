import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { displayRuns } from '../lib/calcinput'
import { formatNumber, type NumberFormat } from '../lib/calc'
import {
  MAX_NOTE,
  dayLabel,
  groupByDay,
  removeEntry,
  searchEntries,
  setNote,
  timeLabel,
  toggleSaved,
  type Tape,
  type TapeEntry,
} from '../lib/calctape'
import { Confirm } from './Confirm'
import { useSettings, useSpell } from '../store'

/**
 * The history list: a search, the saved entries, then everything else by day.
 *
 * Drawn the same wherever it is shown, so the sheet on a phone and the panel
 * beside the keypad on a wide screen cannot drift apart. What a tap on a row
 * does to the display belongs to the calculator, so it comes in as two
 * callbacks rather than being reached for from in here.
 */
export function HistoryList({
  tape,
  setTape,
  format,
  onWorking,
  onAnswer,
}: {
  tape: Tape
  setTape: Dispatch<SetStateAction<Tape>>
  format: NumberFormat
  /** Put the working back on the display, to be edited. */
  onWorking: (entry: TapeEntry) => void
  /** Carry the answer into the next sum. */
  onAnswer: (entry: TapeEntry) => void
}) {
  const { settings } = useSettings()
  const t = useSpell()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const locale = settings.spelling === 'uk' ? 'en-GB' : 'en-US'
  // Read once when the list opens rather than per row, so Today does not
  // tick over half way down the list at midnight.
  const [now] = useState(() => Date.now())

  const shown = useMemo(
    () => searchEntries(tape.entries, query, (value) => formatNumber(value, format)),
    [tape.entries, query, format],
  )
  const saved = shown.filter((entry) => entry.saved)
  const days = groupByDay(shown.filter((entry) => !entry.saved))

  function row(entry: TapeEntry) {
    return (
      <li key={entry.id} data-saved={entry.saved ? 'true' : undefined}>
        <div className="tape-main">
          <button className="tape-expr" title="Put this back on the display" onClick={() => onWorking(entry)}>
            {displayRuns(entry.expression, settings.grouping).map((run, index) => (
              <span key={index} data-kind={run.kind}>
                {run.text}
              </span>
            ))}
          </button>
          <button className="tape-value" title="Use this answer" onClick={() => onAnswer(entry)}>
            {formatNumber(entry.value, format)}
          </button>
        </div>
        {editing === entry.id ? (
          <NoteField
            initial={entry.note ?? ''}
            onDone={(note) => {
              setTape((current) => setNote(current, entry.id, note))
              setEditing(null)
            }}
          />
        ) : entry.note ? (
          <button className="tape-note" title="Edit note" onClick={() => setEditing(entry.id)}>
            {entry.note}
          </button>
        ) : null}
        <div className="tape-meta">
          <span className="tape-time">{timeLabel(entry.at, settings.timeFormat, locale)}</span>
          {!entry.note && editing !== entry.id ? (
            <button className="tape-act" onClick={() => setEditing(entry.id)}>
              Note
            </button>
          ) : null}
          <button
            className="tape-act"
            aria-pressed={Boolean(entry.saved)}
            onClick={() => setTape((current) => toggleSaved(current, entry.id))}
          >
            {entry.saved ? 'Saved' : 'Save'}
          </button>
          {entry.saved ? (
            <Confirm className="tape-act" ask="Delete?" onConfirm={() => setTape((current) => removeEntry(current, entry.id))}>
              Delete
            </Confirm>
          ) : (
            <button className="tape-act" onClick={() => setTape((current) => removeEntry(current, entry.id))}>
              Delete
            </button>
          )}
        </div>
      </li>
    )
  }

  if (!tape.entries.length) return <p className="hint">Nothing worked out yet. Answers land here as you go.</p>

  return (
    <div className="tape-body">
      <input
        className="tape-search"
        type="search"
        placeholder={t('Search')}
        aria-label="Search history"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        enterKeyHint="search"
      />
      <div className="tape-scroll">
        {saved.length ? (
          <section className="tape-day" aria-label="Saved">
            <h3>Saved</h3>
            <ul className="tape-list">{saved.map(row)}</ul>
          </section>
        ) : null}
        {days.map((day) => {
          const label = dayLabel(day.day, now, locale)
          return (
            <section className="tape-day" key={day.day} aria-label={label}>
              <h3>{label}</h3>
              <ul className="tape-list">{day.entries.map(row)}</ul>
            </section>
          )
        })}
        {!shown.length ? <p className="hint">No matches.</p> : null}
      </div>
    </div>
  )
}

/** A one line note, saved on Enter or when it loses focus, and left as it was on Escape. */
function NoteField({ initial, onDone }: { initial: string; onDone: (note: string) => void }) {
  const [text, setText] = useState(initial)
  const cancelled = useRef(false)
  return (
    <input
      className="tape-note-input"
      // Opened by a tap on Note, so the typing goes straight into it.
      autoFocus
      aria-label="Note"
      placeholder="Note"
      maxLength={MAX_NOTE}
      enterKeyHint="done"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => onDone(cancelled.current ? initial : text)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          event.currentTarget.blur()
        }
        if (event.key === 'Escape') {
          // Only this field closes; the history stays open around it.
          event.stopPropagation()
          event.nativeEvent.stopImmediatePropagation()
          cancelled.current = true
          event.currentTarget.blur()
        }
      }}
    />
  )
}
