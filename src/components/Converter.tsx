import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, categoryOf, convert, defaultPair, unitOf, type Category, type Unit } from '../lib/units'
import { findUnits, fromKey, keyOf, parsePair, type Found, type Pair } from '../lib/unitsearch'
import { formatMeasure } from '../lib/calc'
import { Backspace } from './Icons'
import { useSettings, useSpell } from '../store'

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

/**
 * A result taken up as the number being typed. Twelve figures, which is more
 * than the readings show and few enough to drop floating point's noise, and
 * never with an exponent: a reading of 1e-12 in the typing row is not a number
 * anyone would type, and the next digit pressed would land on the exponent.
 */
function asEntry(value: number): string {
  return Number(value.toPrecision(12)).toLocaleString('en-US', { useGrouping: false, maximumSignificantDigits: 12 })
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

/** Two layouts of the same converter, chosen in settings. */
export function Converter() {
  const { settings } = useSettings()
  return settings.convertStyle === 'simple' ? <SimpleConverter /> : <CategoryConverter />
}

function useBuzz() {
  const { settings } = useSettings()
  return () => {
    if (!settings.haptics) return
    try {
      navigator.vibrate?.(8)
    } catch {
      /* a device with no motor, which is most of them */
    }
  }
}

/** The number pad both layouts type with. */
function ConvertPad({ onKey, onSwap }: { onKey: (key: string) => void; onSwap: () => void }) {
  return (
    <div className="pad convert-pad">
      {PAD.map((digits, index) => (
        <div className="row" key={index}>
          {digits.map((digit) => (
            <button key={digit} className="key" data-kind="digit" onClick={() => onKey(digit)}>
              {digit}
            </button>
          ))}
          {index === 0 ? (
            <button className="key convert-rub" data-kind="action" aria-label="Backspace" onClick={() => onKey('back')}>
              <Backspace />
            </button>
          ) : null}
          {index === 1 ? (
            <button className="key" data-kind="action" aria-label="Clear" onClick={() => onKey('clear')}>
              C
            </button>
          ) : null}
          {index === 2 ? (
            <button className="key" data-kind="action" aria-label="Negative" onClick={() => onKey('sign')}>
              ±
            </button>
          ) : null}
          {index === 3 ? (
            <button className="key" data-kind="action" aria-label="Swap the two units" onClick={onSwap}>
              <Swap />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function CategoryConverter() {
  const t = useSpell()
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

  const buzz = useBuzz()

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
    setEntry(Number.isFinite(result) ? asEntry(result) : entry)
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
          aria-label={`${active ? 'Typing' : 'Result'} in ${t(unit.name)}. Tap to type in this one.`}
          onClick={() => {
            if (active) return
            buzz()
            // Typing moves to this row and starts from what it was showing, so
            // the conversion simply runs the other way.
            setEntry(Number.isFinite(result) ? asEntry(result) : '')
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
                {t(option.name)} ({option.symbol})
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
                <span className="convert-other-value" data-long={show(other).length > 11}>
                  {show(other)}
                </span>
                <span className="convert-other-unit">{unit.symbol}</span>
              </button>
            )
          })}
      </div>

      <ConvertPad onKey={key} onSwap={swap} />
    </div>
  )
}

/**
 * The converter with the categories taken away: two units, found by typing.
 *
 * The top unit can be anything. Once it is chosen the bottom one can only be
 * something it converts to, and when that is not yet decided the list it opens
 * on shows what the number comes to in each, which answers "volts to what?"
 * by showing rather than asking.
 */
function SimpleConverter() {
  const t = useSpell()
  const { settings, set } = useSettings()
  const buzz = useBuzz()
  const from = fromKey(settings.simpleFrom)
  const to = fromKey(settings.simpleTo)

  const [entry, setEntry] = useState('1')
  const [side, setSide] = useState<'from' | 'to'>('from')
  const [picking, setPicking] = useState<'from' | 'to' | null>(null)

  const value = Number(entry === '' || entry === '-' ? 0 : entry)
  const source = side === 'from' ? from : to
  const target = side === 'from' ? to : from
  const result = source && target ? convert(value, source.unit, target.unit) : NaN
  const show = (n: number) => (Number.isFinite(n) ? formatMeasure(n, settings.grouping) : '')

  function choose(which: 'from' | 'to', found: Found) {
    buzz()
    setPicking(null)
    if (which === 'to') {
      set({ simpleTo: keyOf(found) })
      return
    }
    const keeps = to && to.category.id === found.category.id && to.unit.id !== found.unit.id
    set({ simpleFrom: keyOf(found), simpleTo: keeps ? settings.simpleTo : '' })
    // A new kind of thing on top leaves nothing below that it converts to, so
    // the list of what it does convert to opens straight away, and typing
    // comes back to the top row, the only one with a unit left in it.
    if (!keeps) {
      setSide('from')
      setPicking('to')
    }
  }

  function choosePair(pair: Pair) {
    buzz()
    setPicking(null)
    set({ simpleFrom: keyOf(pair.from), simpleTo: keyOf(pair.to) })
    setSide('from')
    if (pair.value !== undefined) setEntry(String(pair.value))
  }

  function swap() {
    buzz()
    set({ simpleFrom: settings.simpleTo, simpleTo: settings.simpleFrom })
    if (Number.isFinite(result)) setEntry(asEntry(result))
  }

  function reading(which: 'from' | 'to'): string {
    if (which === side) return entry || '0'
    return show(result) || '—'
  }

  function row(which: 'from' | 'to', found: Found | undefined) {
    const active = which === side
    return (
      <div className="convert-row" data-active={active}>
        <button
          className="convert-reading"
          aria-label={`${active ? 'Typing' : 'Result'}${found ? ` in ${t(found.unit.name)}` : ''}. Tap to type in this one.`}
          onClick={() => {
            if (active) return
            buzz()
            setEntry(Number.isFinite(result) ? asEntry(result) : '')
            setSide(which)
          }}
        >
          {reading(which)}
        </button>
        <button
          className="unit-pick"
          data-empty={!found}
          aria-label={found ? `${which === 'from' ? 'From' : 'To'} ${t(found.unit.name)}. Change it.` : `Choose the unit to convert ${which}`}
          onClick={() => setPicking(which)}
        >
          {found ? (
            <>
              <strong>{found.unit.symbol}</strong>
              <span>{t(found.unit.name)}</span>
            </>
          ) : (
            <span>Choose a unit</span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="convert simple">
      <div className="convert-pair">
        {row('from', from)}
        <button className="swap" aria-label="Swap the two units" title="Swap" onClick={swap} disabled={!from || !to}>
          <Swap />
        </button>
        {row('to', to)}
      </div>

      {from && to ? (
        // What one of the top unit comes to, which neither row says once a
        // number other than one is in it.
        <p className="simple-sentence">
          1 {from.unit.symbol} = {show(convert(1, from.unit, to.unit))} {to.unit.symbol}
        </p>
      ) : (
        <p className="simple-sentence" data-muted="true">
          {from ? 'Now choose what to convert it to.' : 'Choose a unit, or type something like 5 g to lb.'}
        </p>
      )}

      <ConvertPad onKey={(pressed) => { buzz(); setEntry((current) => typed(current, pressed)) }} onSwap={swap} />

      {picking ? (
        <UnitPicker
          // A fresh picker each time, so the bottom one does not open on the
          // search that was typed into the top one a moment before.
          key={picking}
          which={picking}
          skip={picking === 'to' ? from : undefined}
          // The bottom list keeps to what the top converts to; the top one is
          // free, which is how a different kind of thing gets chosen at all.
          within={picking === 'to' && from ? from.category : undefined}
          chosen={picking === 'from' ? from : to}
          amount={picking === 'to' && from ? { value: side === 'from' ? value : convert(value, to?.unit ?? from.unit, from.unit), unit: from.unit } : undefined}
          show={show}
          onPick={(found) => choose(picking, found)}
          onPair={choosePair}
          onClose={() => setPicking(null)}
        />
      ) : null}
    </div>
  )
}

/**
 * A searchable list of units. Opened from the top it holds everything, by
 * category; opened from the bottom it holds only what the top converts to,
 * each with what the number comes to in it.
 */
function UnitPicker({
  which,
  skip,
  within,
  chosen,
  amount,
  show,
  onPick,
  onPair,
  onClose,
}: {
  which: 'from' | 'to'
  /** The unit on the other side, which there is no sense converting to itself. */
  skip?: Found
  within?: Category
  chosen?: Found
  amount?: { value: number; unit: Unit }
  show: (n: number) => string
  onPick: (found: Found) => void
  onPair: (pair: Pair) => void
  onClose: () => void
}) {
  const t = useSpell()
  const [query, setQuery] = useState('')
  const field = useRef<HTMLInputElement>(null)

  useEffect(() => {
    field.current?.focus({ preventScroll: true })
  }, [])

  const pair = which === 'from' ? parsePair(query) : null
  const others = (item: Found) => !skip || keyOf(item) !== keyOf(skip)
  const found = query.trim() ? findUnits(query, within).filter(others) : null
  const groups: Category[] = within ? [within] : CATEGORIES

  function rowFor(item: Found, labelled: boolean) {
    const isChosen = chosen && keyOf(chosen) === keyOf(item)
    const worth = amount ? show(convert(amount.value, amount.unit, item.unit)) : ''
    return (
      <li key={keyOf(item)}>
        <button className="pick-row" data-chosen={isChosen} onClick={() => onPick(item)}>
          <span className="pick-name">
            {t(item.unit.name)}
            {labelled ? <em>{item.category.name}</em> : null}
          </span>
          {worth ? <span className="pick-worth">{worth}</span> : null}
          <span className="pick-symbol">{item.unit.symbol}</span>
        </button>
      </li>
    )
  }

  return (
    <div className="scrim picker-scrim" onClick={onClose}>
      <div className="sheet picker-sheet" role="dialog" aria-label={which === 'from' ? 'Convert from' : 'Convert to'} onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <div className="picker-field">
            <input
              ref={field}
              className="picker-search"
              type="search"
              enterKeyHint="go"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={within ? `Search ${within.name.toLowerCase()}` : 'Search, or 5 g to lb'}
              aria-label="Search units"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                if (pair) onPair(pair)
                else if (found?.[0]) onPick(found[0])
              }}
            />
            {query ? (
              <button
                className="picker-clear"
                aria-label="Clear the search"
                onClick={() => {
                  setQuery('')
                  field.current?.focus()
                }}
              >
                ×
              </button>
            ) : null}
          </div>
          <button className="ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
        <div className="sheet-body picker-body">
          {pair ? (
            <button className="pick-pair" onClick={() => onPair(pair)}>
              <strong>
                {pair.value !== undefined ? `${pair.value} ` : ''}
                {pair.from.unit.symbol} → {pair.to.unit.symbol}
              </strong>
              <span>
                {t(pair.from.unit.name)} to {t(pair.to.unit.name)}
              </span>
            </button>
          ) : null}
          {found ? (
            found.length ? (
              <ul className="pick-list">{found.map((item) => rowFor(item, !within))}</ul>
            ) : pair ? null : (
              <p className="hint">Nothing by that name{within ? ` in ${within.name.toLowerCase()}` : ''}.</p>
            )
          ) : (
            groups.map((category) => (
              <section key={category.id} className="pick-group">
                {within ? null : <h3>{category.name}</h3>}
                <ul className="pick-list">
                  {category.units.map((unit) => ({ category, unit })).filter(others).map((item) => rowFor(item, false))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
