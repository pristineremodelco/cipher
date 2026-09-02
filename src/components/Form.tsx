import type { ReactNode } from 'react'

/**
 * The parts every tool is built from.
 *
 * Sixteen screens that each invented their own field would be sixteen screens
 * that looked like sixteen apps. These are deliberately few and deliberately
 * plain: a label, a value, a unit on the end, and a block of answers.
 */

export function Field({
  label,
  value,
  onChange,
  suffix,
  prefix,
  placeholder,
  hint,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  /** What the number is in, written on the right of the box. */
  suffix?: string
  /** A currency mark, written on the left. */
  prefix?: string
  placeholder?: string
  hint?: string
}) {
  return (
    <label className="tool-field">
      <span className="tool-label">{label}</span>
      <span className="tool-input" data-prefixed={Boolean(prefix)}>
        {prefix ? <em className="affix">{prefix}</em> : null}
        <input
          // The numeric keyboard, without refusing anything a person might
          // paste: type=number swallows what it dislikes rather than saying so.
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix ? <em className="affix">{suffix}</em> : null}
      </span>
      {hint ? <span className="tool-hint">{hint}</span> : null}
    </label>
  )
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <label className="tool-field">
      <span className="tool-label">{label}</span>
      <span className="tool-input">
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
      </span>
    </label>
  )
}

export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; name: string }[]
  onChange: (next: T) => void
}) {
  return (
    <label className="tool-field">
      <span className="tool-label">{label}</span>
      <span className="tool-input">
        <select value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </span>
    </label>
  )
}

/** Two or three mutually exclusive words, where a dropdown would be overkill. */
export function Segment<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string
  value: T
  options: { id: T; name: string }[]
  onChange: (next: T) => void
}) {
  return (
    <div className="tool-field">
      {label ? <span className="tool-label">{label}</span> : null}
      <div className="segment">
        {options.map((option) => (
          <button
            key={option.id}
            className="segment-item"
            data-active={value === option.id}
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
          >
            {option.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export type Row = {
  label: string
  value: string
  /** The one the whole screen was opened for, drawn larger. */
  lead?: boolean
  note?: string
}

/**
 * The answer. Always in the same place, always the same shape, and always
 * present: a blank row reads as "not enough typed in yet" rather than
 * disappearing and taking the layout with it.
 */
export function Readout({ rows, note }: { rows: Row[]; note?: ReactNode }) {
  return (
    <div className="readout">
      {rows.map((row) => (
        <div className="readout-row" key={row.label} data-lead={row.lead}>
          <span className="readout-label">{row.label}</span>
          <span className="readout-value">{row.value || '—'}</span>
          {row.note ? <span className="readout-note">{row.note}</span> : null}
        </div>
      ))}
      {note ? <p className="tool-note">{note}</p> : null}
    </div>
  )
}

/** Every tool's outer shape, so none of them can drift from the others. */
export function Tool({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="tool">
      <div className="tool-fields">{children}</div>
      {note ? <p className="tool-note">{note}</p> : null}
    </div>
  )
}
