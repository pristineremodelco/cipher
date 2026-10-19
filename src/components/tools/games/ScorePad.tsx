import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Backspace } from '../../Icons'
import type { Part } from '../../../lib/games/types'
import { useSpell } from '../../../store'
import { useEscape } from '../../useEscape'

const KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['sign', '0', 'back'],
]

function typeInto(text: string, key: string): string {
  if (key === 'back') return text.slice(0, -1)
  if (key === 'sign') return text.startsWith('-') ? text.slice(1) : `-${text}`
  const digits = text.replace(/[^0-9]/g, '')
  if (digits.length >= 7) return text
  if (text === '0' || text === '-0') return text.replace('0', key)
  return text + key
}

const asNumber = (text: string): number | null => (text === '' || text === '-' ? null : Number(text))
const asText = (value: number | null | undefined): string => (value === null || value === undefined ? '' : String(value))

/**
 * Entering one score, in the app's own keys rather than the phone's keyboard,
 * which on many phones has no minus sign. Next moves on to the next player in
 * the same round, so a whole round goes in without leaving the pad.
 */
export function ScorePad({
  title,
  detail,
  value,
  quick,
  parts,
  choices,
  worth,
  extra,
  actions,
  last,
  onDone,
  onClose,
}: {
  title: string
  detail?: string
  value: number | null
  quick?: number[]
  /** The round worked out from its parts. */
  parts?: Part[]
  /** One of these, chosen with a tap. */
  choices?: number[]
  /** What the number comes to in points, where that differs from the number: cities at 2 each. */
  worth?: (n: number) => number
  extra?: ReactNode
  /** In place of Clear and Next: a counter's Take away and Add. */
  actions?: { label: string; run: (value: number | null) => void; primary?: boolean }[]
  /** No one left after this player: Next reads Done. */
  last?: boolean
  onDone: (value: number | null, advance: boolean) => void
  onClose: () => void
}) {
  const t = useSpell()
  const [text, setText] = useState(asText(value))
  const [counts, setCounts] = useState<number[]>(() => (parts ?? []).map(() => 0))
  const [typed, setTyped] = useState<string[]>(() => (parts ?? []).map(() => ''))
  const firstTyped = parts ? parts.findIndex((p) => p.typed) : -1
  const [active, setActive] = useState(firstTyped)
  // With parts, starting from a number already entered keeps it rather than zeroing it.
  const [fromParts, setFromParts] = useState(!(parts && value !== null))

  useEscape(onClose)

  const partsTotal = parts
    ? parts.reduce((sum, part, i) => sum + (part.typed ? (asNumber(typed[i]) ?? 0) : counts[i] * (part.per ?? 1)), 0)
    : 0
  const result = parts && fromParts ? partsTotal : asNumber(text)
  const touchedParts = counts.some(Boolean) || typed.some((v) => v !== '')

  function press(key: string) {
    if (parts && fromParts) {
      if (active < 0) return
      setTyped((all) => all.map((v, i) => (i === active ? typeInto(v, key) : v)))
      return
    }
    setText((current) => typeInto(current, key))
  }

  function commit(advance: boolean) {
    // Parts opened and left untouched keep whatever was there before.
    if (parts && fromParts && !touchedParts) onDone(value, advance)
    else onDone(result, advance)
  }

  return createPortal(
    <div className="scrim pad-scrim" onClick={onClose}>
      <div className="sheet pad-sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="pad-head">
          <div>
            <h2>{title}</h2>
            {detail ? <span>{t(detail)}</span> : null}
          </div>
          <output className="pad-display" aria-live="polite">
            {result === null ? '–' : result}
            {worth && result !== null && worth(result) !== result ? <small>= {worth(result)} points</small> : null}
          </output>
        </div>

        {choices ? (
          <div className="pad-choices">
            {choices.map((choice) => (
              <button key={choice} className="key" data-active={value === choice} onClick={() => onDone(choice, true)}>
                {choice}
              </button>
            ))}
          </div>
        ) : (
          <>
            {parts && fromParts ? (
              <div className="pad-parts">
                {parts.map((part, i) =>
                  part.typed ? (
                    <button key={part.label} className="pad-part" data-active={active === i} onClick={() => setActive(i)}>
                      <span>{t(part.label)}</span>
                      <strong>{typed[i] || '0'}</strong>
                    </button>
                  ) : (
                    <div key={part.label} className="pad-part">
                      <span>
                        {t(part.label)}
                        <small> × {part.per}</small>
                      </span>
                      <div className="stepper">
                        <button aria-label={`One fewer ${part.label}`} onClick={() => setCounts((all) => all.map((c, k) => (k === i ? Math.max(0, c - 1) : c)))}>
                          −
                        </button>
                        <strong>{counts[i]}</strong>
                        <button aria-label={`One more ${part.label}`} onClick={() => setCounts((all) => all.map((c, k) => (k === i ? c + 1 : c)))}>
                          +
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : null}
            {parts && !fromParts ? (
              <button className="ghost" onClick={() => setFromParts(true)}>
                Work it out from its parts
              </button>
            ) : null}
            {quick?.length && !(parts && fromParts) ? (
              <div className="pad-quick">
                {quick.map((q) => (
                  <button key={q} className="chip" onClick={() => setText((current) => String((asNumber(current) ?? 0) + q))}>
                    +{q}
                  </button>
                ))}
              </div>
            ) : null}
            {!(parts && fromParts && active < 0) ? (
              <div className="pad score-keys">
                {KEYS.map((row, i) => (
                  <div className="row" key={i}>
                    {row.map((key) => (
                      <button
                        key={key}
                        className="key"
                        data-kind={key === 'sign' || key === 'back' ? 'action' : 'digit'}
                        aria-label={key === 'sign' ? 'Negative' : key === 'back' ? 'Backspace' : undefined}
                        onClick={() => press(key)}
                      >
                        {key === 'sign' ? '±' : key === 'back' ? <Backspace /> : key}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}

        {extra}

        <div className="pad-actions">
          {actions ? (
            actions.map((action) => (
              <button key={action.label} className={action.primary ? 'primary' : 'ghost'} onClick={() => action.run(result)}>
                {action.label}
              </button>
            ))
          ) : (
            <>
              <button className="ghost" onClick={() => onDone(null, false)}>
                Clear
              </button>
              {!choices ? (
                <button className="primary" onClick={() => commit(!last)}>
                  {last ? 'Done' : 'Next'}
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
