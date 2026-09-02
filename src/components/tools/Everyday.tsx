import { useEffect, useMemo, useState } from 'react'
import { Choice, DateField, Field, Readout, Segment, Tool } from '../Form'
import { BASES, BASE_NAMES, addDays, daysBetween, gradeAverage, parseBase, spanOf, type Base, type Grade } from '../../lib/tools'
import { ZONES, dayIn, deviceZone, offsetHours, offsetLabel, timeIn, zoneOf } from '../../lib/zones'
import { useSettings } from '../../store'

/** A date field speaks YYYY-MM-DD; the rest of the app speaks in Dates. */
function toInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
function fromInput(text: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  const [y, m, d] = text.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}
function longDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export function DateTool() {
  const [mode, setMode] = useState<'between' | 'add'>('between')
  const [from, setFrom] = useState(toInput(new Date()))
  const [to, setTo] = useState(toInput(addDays(new Date(), 30)))
  const [days, setDays] = useState('30')
  const [direction, setDirection] = useState<'after' | 'before'>('after')

  const start = fromInput(from)
  const end = fromInput(to)

  if (mode === 'between') {
    const span = start && end ? spanOf(start, end) : null
    return (
      <Tool>
        <Segment
          value={mode}
          onChange={setMode}
          options={[
            { id: 'between', name: 'Between two dates' },
            { id: 'add', name: 'So many days on' },
          ]}
        />
        <DateField label="From" value={from} onChange={setFrom} />
        <DateField label="To" value={to} onChange={setTo} />
        <Readout
          rows={[
            { label: 'Days', value: span ? String(Math.abs(span.days)) : '', lead: true },
            { label: 'Weeks and days', value: span ? `${Math.trunc(Math.abs(span.days) / 7)} weeks, ${Math.abs(span.days) % 7} days` : '' },
            {
              label: 'On the calendar',
              value: span
                ? [span.years ? `${span.years} yr` : '', span.months ? `${span.months} mo` : '', `${span.rest} d`]
                    .filter(Boolean)
                    .join(', ')
                : '',
            },
          ]}
          note={span && span.back ? 'The second date is the earlier one.' : undefined}
        />
      </Tool>
    )
  }

  const shift = Number(days) * (direction === 'before' ? -1 : 1)
  const landed = start && Number.isFinite(shift) ? addDays(start, Math.round(shift)) : null
  return (
    <Tool>
      <Segment
        value={mode}
        onChange={setMode}
        options={[
          { id: 'between', name: 'Between two dates' },
          { id: 'add', name: 'So many days on' },
        ]}
      />
      <DateField label="From" value={from} onChange={setFrom} />
      <div className="tool-pair">
        <Field label="Days" value={days} onChange={setDays} />
        <Choice
          label="Direction"
          value={direction}
          onChange={setDirection}
          options={[
            { id: 'after', name: 'After' },
            { id: 'before', name: 'Before' },
          ]}
        />
      </div>
      <Readout
        rows={[
          { label: 'Lands on', value: landed ? longDate(landed) : '', lead: true },
          { label: 'Which is', value: landed && start ? `${Math.abs(daysBetween(start, landed))} days away` : '' },
        ]}
      />
    </Tool>
  )
}

export function WorldTime() {
  const { settings, set } = useSettings()
  const [now, setNow] = useState(() => new Date())
  const here = deviceZone()

  // The minute is the only thing that changes, so the clock is nudged on the
  // minute rather than every second: nothing on screen shows seconds.
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = window.setInterval(tick, 15000)
    return () => window.clearInterval(id)
  }, [])

  // Memoised, or the list below is rebuilt on every tick of the clock.
  const chosen = useMemo(
    () => (settings.worldZones.length ? settings.worldZones : [here]),
    [settings.worldZones, here],
  )
  const rows = useMemo(
    () =>
      chosen.map((id) => ({
        id,
        zone: zoneOf(id),
        time: timeIn(id, now, settings.timeFormat === '12'),
        day: dayIn(id, now),
        offset: offsetHours(id, here, now),
      })),
    [chosen, here, now, settings.timeFormat],
  )

  const available = ZONES.filter((zone) => !chosen.includes(zone.id))

  return (
    <Tool note="Worked out on this device from the time zone database the browser already ships, so it needs no signal. Daylight saving is the browser's to know, not this app's.">
      <Segment
        label="Clock"
        value={settings.timeFormat}
        onChange={(timeFormat) => set({ timeFormat })}
        options={[
          { id: '12' as const, name: '12 hour' },
          { id: '24' as const, name: '24 hour' },
        ]}
      />
      <div className="clocks">
        {rows.map((row) => (
          <div className="clock" key={row.id} data-here={row.id === here}>
            <div className="clock-where">
              <strong>{row.zone.city}</strong>
              <span>{row.id === here ? 'Here' : offsetLabel(row.offset)}</span>
            </div>
            <div className="clock-when">
              <strong>{row.time}</strong>
              <span>{row.day}</span>
            </div>
            {chosen.length > 1 ? (
              <button
                className="ghost tiny"
                aria-label={`Remove ${row.zone.city}`}
                onClick={() => set({ worldZones: chosen.filter((id) => id !== row.id) })}
              >
                ✕
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {available.length ? (
        <label className="tool-field">
          <span className="tool-label">Add a place</span>
          <span className="tool-input">
            <select
              value=""
              onChange={(e) => {
                if (!e.target.value) return
                set({ worldZones: [...chosen, e.target.value].slice(0, 12) })
              }}
            >
              <option value="">Choose one</option>
              {available.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.city} ({zone.region})
                </option>
              ))}
            </select>
          </span>
        </label>
      ) : null}
    </Tool>
  )
}

export function Hex() {
  const [text, setText] = useState('255')
  const [base, setBase] = useState<Base>(10)
  const value = parseBase(text, base)

  return (
    <Tool note="Anything the chosen base cannot hold is refused rather than quietly truncated: 19 is not an octal number, and a calculator that reads it as 1 has told you something false.">
      <Segment
        label="Reading it as"
        value={String(base)}
        onChange={(next) => setBase(Number(next) as Base)}
        options={BASES.map((b) => ({ id: String(b), name: BASE_NAMES[b] }))}
      />
      <Field label="Value" value={text} onChange={setText} hint={value === null && text.trim() ? `Not a ${BASE_NAMES[base].toLowerCase()} number` : undefined} />
      <Readout
        rows={BASES.map((b) => ({
          label: BASE_NAMES[b],
          value: value === null ? '' : b === 16 ? value.toString(16).toUpperCase() : value.toString(b),
          lead: b === base,
        }))}
      />
    </Tool>
  )
}

export function GradeAverage() {
  const [rows, setRows] = useState<Grade[]>([
    { id: crypto.randomUUID(), score: '', weight: '3' },
    { id: crypto.randomUUID(), score: '', weight: '3' },
  ])
  const result = gradeAverage(rows)

  function update(id: string, patch: Partial<Grade>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  return (
    <Tool note="Weighted by whatever is in the second column, which is usually credits or hours. A row left blank is a row not filled in yet, not a zero.">
      <div className="grade-rows">
        {rows.map((row, index) => (
          <div className="grade-row" key={row.id}>
            <Field label={`Grade ${index + 1}`} value={row.score} onChange={(score) => update(row.id, { score })} />
            <Field label="Weight" value={row.weight} onChange={(weight) => update(row.id, { weight })} />
            {rows.length > 1 ? (
              <button
                className="ghost tiny"
                aria-label={`Remove grade ${index + 1}`}
                onClick={() => setRows((current) => current.filter((other) => other.id !== row.id))}
              >
                ✕
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <button
        className="ghost"
        disabled={rows.length >= 20}
        onClick={() => setRows((current) => [...current, { id: crypto.randomUUID(), score: '', weight: '3' }])}
      >
        Add another
      </button>
      <Readout
        rows={[
          {
            label: 'Average',
            value: Number.isFinite(result.average) ? result.average.toFixed(2) : '',
            lead: true,
          },
          { label: 'Counted', value: result.counted ? `${result.counted} of ${rows.length}` : '' },
          { label: 'Total weight', value: result.credits ? String(result.credits) : '' },
        ]}
      />
    </Tool>
  )
}
