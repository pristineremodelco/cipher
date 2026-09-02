import { useMemo, useRef, useState } from 'react'
import { CATEGORIES, categoryOf, convert, defaultPair, unitOf, type Unit } from '../lib/units'
import { formatMeasure } from '../lib/calc'
import { Backspace } from './Icons'
import { useSettings } from '../store'

/**
 * A number being typed, held as text rather than as a number.
 *
 * "1.50" and "1.5" are the same number and different things to type, and a
 * field that renders back what it parsed cannot let anyone key the first one
 * at all: the trailing zero would vanish under their thumb.
 */
function typed(current: string, key: string): string {
  if (key === 'back') return current.slice(0, -1)
  if (key === 'clear') return ''
  if (key === 'sign') {
    if (!current) return '-'
    return current.startsWith('-') ? current.slice(1) : `-${current}`
  }
  if (key === '.') {
    if (current.includes('.')) return current
    return current ? `${current}.` : '0.'
  }
  if (key === '00') return current && current !== '0' ? `${current}00` : current
  if (current === '0') return key
  if (current === '-0') return `-${key}`
  return current + key
}

function Swap() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M8 4v14m0 0l-3.2-3.4M8 18l3.2-3.4M16 20V6m0 0l3.2 3.4M16 6l-3.2 3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const PAD: string[][] = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['0', '00', '.'],
]

export function Converter() {
  const { settings, set } = useSettings()
  const category = categoryOf(settings.convertCategory)
  const saved = settings.convertPairs[category.id]
  const fallback = defaultPair(category)
  const [savedFrom, savedTo] = saved ? saved.split('>') : fallback
  const from = unitOf(category, savedFrom)
  const to = unitOf(category, savedTo)

  const [entry, setEntry] = useState('1')
  /** Which of the two rows the keypad is typing into. */
  const [side, setSide] = useState<'from' | 'to'>('from')
  const strip = useRef<HTMLDivElement>(null)

  const value = Number(entry === '' || entry === '-' ? 0 : entry)
  const source = side === 'from' ? from : to
  const target = side === 'from' ? to : from
  const result = convert(value, source, target)

  /**
   * Significant figures, not decimal places. The calculator's own setting for
   * places is about answers to sums and would read as either eleven threes or
   * a rounded-off measurement here, neither of which is wanted.
   */
  const show = useMemo(
    () => (value: number) => (Number.isFinite(value) ? formatMeasure(value, settings.grouping) : ''),
    [settings.grouping],
  )

  function buzz() {
    if (!settings.haptics) return
    try {
      navigator.vibrate?.(8)
    } catch {
      /* a device with no motor, which is most of them */
    }
  }

  function key(pressed: string) {
    buzz()
    setEntry((current) => typed(current, pressed))
  }

  function pickCategory(id: string) {
    buzz()
    set({ convertCategory: id })
    setSide('from')
    setEntry('1')
    strip.current?.scrollTo({ left: 0, behavior: 'smooth' })
  }

  function pickUnit(which: 'from' | 'to', id: string) {
    const next = which === 'from' ? `${id}>${to.id}` : `${from.id}>${id}`
    set({ convertPairs: { ...settings.convertPairs, [category.id]: next } })
  }

  function swap() {
    buzz()
    set({ convertPairs: { ...settings.convertPairs, [category.id]: `${to.id}>${from.id}` } })
    // The number stays where the eye is: after a swap the row being typed into
    // is the one that was showing the answer, so the reading does not jump.
    setEntry(Number.isFinite(result) ? String(Number(result.toPrecision(12))) : entry)
  }

  /** What the row shows: what is being typed, or what it comes to. */
  function reading(which: 'from' | 'to'): string {
    if (which === side) return entry || '0'
    return show(result)
  }

  function row(which: 'from' | 'to', unit: Unit) {
    const active = which === side
    return (
      <div className="convert-row" data-active={active}>
        <button
          className="convert-reading"
          aria-label={`${active ? 'Typing' : 'Result'} in ${unit.name}. Tap to type in this one.`}
          onClick={() => {
            if (active) return
            buzz()
            // Typing moves to this row and starts from what it was showing, so
            // the conversion simply runs the other way.
            setEntry(Number.isFinite(result) ? String(Number(result.toPrecision(12))) : '')
            setSide(which)
          }}
        >
          {reading(which)}
        </button>
        <label className="convert-unit">
          <span className="visually-hidden">{which === 'from' ? 'Convert from' : 'Convert to'}</span>
          <select value={unit.id} onChange={(e) => pickUnit(which, e.target.value)}>
            {category.units.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} ({option.symbol})
              </option>
            ))}
          </select>
          <em aria-hidden="true">{unit.symbol}</em>
        </label>
      </div>
    )
  }

  return (
    <div className="convert">
      <div className="categories" ref={strip} role="tablist" aria-label="What to convert">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            className="category"
            role="tab"
            aria-selected={item.id === category.id}
            data-active={item.id === category.id}
            onClick={() => pickCategory(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="convert-pair">
        {row('from', from)}
        <button className="swap" aria-label="Swap the two units" title="Swap" onClick={swap}>
          <Swap />
        </button>
        {row('to', to)}
      </div>

      {/* The same quantity in everything else the category holds. Tapping one
          makes it the unit being converted to, which is faster than opening a
          picker to find out what you already just read. */}
      <div className="convert-all">
        {category.units
          .filter((unit) => unit.id !== source.id)
          .map((unit) => {
            const other = convert(value, source, unit)
            return (
              <button
                key={unit.id}
                className="convert-other"
                data-active={unit.id === target.id}
                onClick={() => {
                  buzz()
                  pickUnit(side === 'from' ? 'to' : 'from', unit.id)
                }}
              >
                <span className="convert-other-value">{show(other)}</span>
                <span className="convert-other-unit">{unit.symbol}</span>
              </button>
            )
          })}
      </div>

      <div className="pad convert-pad">
        {PAD.map((digits, index) => (
          <div className="row" key={index}>
            {digits.map((digit) => (
              <button key={digit} className="key" data-kind="digit" onClick={() => key(digit)}>
                {digit}
              </button>
            ))}
            {index === 0 ? (
              <button
                className="key convert-rub"
                data-kind="action"
                aria-label="Backspace"
                onClick={() => key('back')}
              >
                <Backspace />
              </button>
            ) : null}
            {index === 1 ? (
              <button className="key" data-kind="action" aria-label="Clear" onClick={() => key('clear')}>
                C
              </button>
            ) : null}
            {index === 2 ? (
              <button className="key" data-kind="action" aria-label="Negative" onClick={() => key('sign')}>
                ±
              </button>
            ) : null}
            {index === 3 ? (
              <button className="key" data-kind="action" aria-label="Swap the two units" onClick={swap}>
                <Swap />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
