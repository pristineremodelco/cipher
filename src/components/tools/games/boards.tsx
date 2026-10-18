import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ScorePad } from './ScorePad'
import {
  CRICKET_TARGETS,
  bidResult,
  bowling,
  clampCounter,
  counterResult,
  cricket,
  lineValue,
  roundsResult,
  science,
  sheetResult,
  startOf,
  type BidRow,
  type CounterValues,
  type CricketHit,
  type RoundRow,
  type SheetCells,
  type SheetParts,
} from '../../../lib/games/score'
import type {
  BidSheet,
  CategorySheet,
  ChecklistSheet,
  CounterSheet,
  Game,
  Line,
  NotesSheet,
  Player,
  RoundsSheet,
} from '../../../lib/games/types'
import { useSpell } from '../../../store'

type Data = Record<string, unknown>
export type BoardProps<S> = { game: Game; sheet: S; players: Player[]; data: Data; change: (next: Data) => void }

function names(players: Player[], ids: string[]): string {
  const list = players.filter((p) => ids.includes(p.id)).map((p) => p.name || 'Someone')
  if (list.length <= 1) return list[0] ?? ''
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}

/** Who has won, or who is in front, in one line above the sheet. */
function Standing({ players, done, winners, leaders, lost, quiet }: { players: Player[]; done: boolean; winners: string[]; leaders: string[]; lost?: boolean; quiet?: string }) {
  let text = quiet ?? ''
  if (done && lost) text = 'The game won this time'
  else if (done && winners.length) text = `${names(players, winners)} ${winners.length > 1 ? 'win' : 'wins'}`
  else if (done) text = 'Game over'
  else if (leaders.length && leaders.length < players.length) text = `${names(players, leaders)} ${leaders.length > 1 ? 'are' : 'is'} in front`
  if (!text) return null
  return (
    <p className="standing" data-done={done} aria-live="polite">
      {done && !lost ? '🏆 ' : ''}
      {text}
    </p>
  )
}

/** The table every sheet is drawn in: names and totals stay at the top, row names at the side. */
function Table({ players, head, children, foot }: { players: Player[]; head: (p: Player) => ReactNode; children: ReactNode; foot?: ReactNode }) {
  return (
    // Up to four columns fit a phone, and the page scrolls as normal with the
    // names held at the top. Past that the sheet scrolls in its own box, both
    // ways, with the names and the row labels both held in place.
    <div className="score-wrap" data-wide={players.length > 4}>
      <table className="score-table" style={{ ['--cols' as string]: players.length }}>
        <thead>
          <tr>
            <th className="score-corner" />
            {players.map((p) => (
              <th key={p.id} scope="col">
                {head(p)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
        {foot ? <tfoot>{foot}</tfoot> : null}
      </table>
    </div>
  )
}

function HeadCell({ player, total, note, front, out }: { player: Player; total?: ReactNode; note?: ReactNode; front?: boolean; out?: boolean }) {
  return (
    <div className="score-head" data-front={front} data-out={out}>
      <span className="score-name">{player.name || '—'}</span>
      {total !== undefined ? <strong>{total}</strong> : null}
      {note ? <small>{note}</small> : null}
    </div>
  )
}

const show = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))

// ---------------------------------------------------------------- rounds ----

export function RoundsBoard({ sheet, players, data, change }: BoardProps<RoundsSheet>) {
  const t = useSpell()
  const rows = (data.rows as RoundRow[] | undefined) ?? []
  const result = roundsResult(sheet, players, rows)
  const [editing, setEditing] = useState<{ row: number; player: number } | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const count = sheet.rounds !== undefined ? Math.max(sheet.rounds, rows.length) : rows.length + (result.done ? 0 : 1)
  const label = (i: number) => sheet.labels?.[i] ?? `${sheet.round ?? 'Round'} ${i + 1}`

  useEffect(() => {
    if (sheet.rounds !== undefined) return
    const box = wrap.current?.querySelector('.score-wrap')
    box?.scrollTo({ top: box.scrollHeight })
  }, [rows.length, sheet.rounds])

  function set(row: number, edit: (r: RoundRow) => RoundRow) {
    const next = [...rows]
    while (next.length <= row) next.push({ scores: {} })
    next[row] = edit({ scores: { ...next[row].scores }, made: { ...(next[row].made ?? {}) } })
    change({ ...data, rows: next })
  }

  const target = editing ? players[editing.player] : undefined
  /** The phase a player was working on going into a round. */
  const phaseAt = (row: number, id: string) => 1 + rows.slice(0, row).filter((r) => r.made?.[id]).length

  return (
    <div ref={wrap}>
      <Standing players={players} done={result.done} winners={result.winners} leaders={result.leaders} />
      <Table
        players={players}
        head={(p) => (
          <HeadCell
            player={p}
            total={sheet.word ? undefined : result.totals[p.id]}
            front={result.leaders.includes(p.id)}
            out={result.out[p.id]}
            note={
              sheet.word ? (
                <span className="letters" aria-label={`${result.letters[p.id]} letters`}>
                  {sheet.word.split('').map((ch, i) => (
                    <b key={i} data-on={i < result.letters[p.id]}>
                      {ch}
                    </b>
                  ))}
                </span>
              ) : sheet.phases ? (
                result.phase[p.id] > sheet.phases.length ? 'All done' : `Phase ${result.phase[p.id]}`
              ) : result.out[p.id] ? (
                'Out'
              ) : undefined
            }
          />
        )}
      >
        {Array.from({ length: count }, (_, i) => (
          <tr key={i}>
            <th scope="row" className="score-label">
              {t(label(i))}
            </th>
            {players.map((p, k) => {
              const raw = rows[i]?.scores[p.id]
              const counted = result.counted[i]?.[p.id]
              const busted = result.bust.has(`${i}:${p.id}`)
              const made = rows[i]?.made?.[p.id]
              return (
                <td key={p.id}>
                  <button
                    className="score-cell"
                    data-empty={raw === null || raw === undefined}
                    aria-label={`${p.name}, ${t(label(i))}`}
                    onClick={() => {
                      if (sheet.word) set(i, (r) => ({ ...r, scores: { ...r.scores, [p.id]: r.scores[p.id] ? null : 1 } }))
                      else setEditing({ row: i, player: k })
                    }}
                  >
                    {sheet.word ? (raw ? '✕' : '') : busted ? <s title="Bust">{show(raw)}</s> : show(raw)}
                    {sheet.cancel && counted !== null && counted !== undefined && counted !== raw ? <small>+{counted}</small> : null}
                    {made ? <small className="made">✓</small> : null}
                  </button>
                </td>
              )
            })}
          </tr>
        ))}
      </Table>
      {sheet.word ? <p className="hint">Tap a square to give that player a letter.</p> : null}

      {editing && target ? (
        <ScorePad
          key={`${editing.row}:${editing.player}`}
          title={target.name}
          detail={label(editing.row)}
          value={rows[editing.row]?.scores[target.id] ?? null}
          quick={sheet.quick}
          parts={sheet.parts}
          last={editing.player === players.length - 1}
          extra={
            sheet.phases ? (
              <label className="row toggle-row pad-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(rows[editing.row]?.made?.[target.id])}
                  onChange={(e) => set(editing.row, (r) => ({ ...r, made: { ...r.made, [target.id]: e.target.checked } }))}
                />
                Completed phase {phaseAt(editing.row, target.id)}
                {sheet.phases[phaseAt(editing.row, target.id) - 1] ? `: ${t(sheet.phases[phaseAt(editing.row, target.id) - 1])}` : ''}
              </label>
            ) : sheet.moon ? (
              <button
                className="ghost"
                onClick={() => {
                  set(editing.row, (r) => ({ ...r, scores: Object.fromEntries(players.map((p) => [p.id, p.id === target.id ? 0 : sheet.moon!])) }))
                  setEditing(null)
                }}
              >
                🌙 Shot the moon: everyone else takes {sheet.moon}
              </button>
            ) : undefined
          }
          onDone={(value, advance) => {
            set(editing.row, (r) => ({ ...r, scores: { ...r.scores, [target.id]: value } }))
            setEditing(advance && editing.player < players.length - 1 ? { row: editing.row, player: editing.player + 1 } : null)
          }}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  )
}

// ----------------------------------------------------------------- sheet ----

function worthOf(line: Line): ((n: number) => number) | undefined {
  if (line.per === undefined && !line.table && !line.divide && !line.minus) return undefined
  return (n: number) => lineValue(line, n)
}

export function SheetBoard({ sheet, players, data, change }: BoardProps<CategorySheet>) {
  const t = useSpell()
  const cells = (data.cells as SheetCells | undefined) ?? {}
  const parts = (data.parts as SheetParts | undefined) ?? {}
  const result = sheetResult(sheet, players, cells, parts)
  const [editing, setEditing] = useState<{ line: Line; player: Player } | null>(null)

  function set(line: string, id: string, value: number | null) {
    change({ ...data, cells: { ...cells, [line]: { ...(cells[line] ?? {}), [id]: value } } })
  }
  function setParts(line: string, id: string, value: number[] | undefined) {
    const row = { ...(parts[line] ?? {}) }
    if (value) row[id] = value
    else delete row[id]
    change({ ...data, parts: { ...parts, [line]: row } })
  }

  return (
    <div>
      <Standing players={players} done={result.done} winners={result.winners} leaders={result.leaders} quiet={sheet.goal ? `First to ${sheet.goal} wins` : undefined} />
      <Table players={players} head={(p) => <HeadCell player={p} total={result.totals[p.id]} front={result.leaders.includes(p.id)} />}>
        {sheet.lines.map((line) => (
          <SheetRow key={line.id} line={line}>
            {players.map((p) => {
              const raw = cells[line.id]?.[p.id]
              const entered = line.science ? Boolean(parts[line.id]?.[p.id]) : raw !== null && raw !== undefined
              const value = result.values[line.id][p.id]
              return (
                <td key={p.id}>
                  {line.bonus ? (
                    <span className="score-cell" data-bonus="true">
                      {value || ''}
                    </span>
                  ) : (
                    <button
                      className="score-cell"
                      data-empty={!entered}
                      data-scratched={entered && value === 0}
                      aria-label={`${p.name}, ${t(line.label)}`}
                      onClick={() => {
                        if (line.fixed !== undefined) {
                          // Scored, then scratched as nought, then clear again.
                          set(line.id, p.id, raw === line.fixed ? 0 : raw === 0 ? null : line.fixed)
                        } else setEditing({ line, player: p })
                      }}
                    >
                      {entered ? value : ''}
                    </button>
                  )}
                </td>
              )
            })}
          </SheetRow>
        ))}
      </Table>

      {editing && editing.line.science ? (
        <SciencePad
          player={editing.player}
          value={parts[editing.line.id]?.[editing.player.id]}
          onDone={(value) => {
            setParts(editing.line.id, editing.player.id, value)
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      ) : editing ? (
        <ScorePad
          key={`${editing.line.id}:${editing.player.id}`}
          title={editing.player.name}
          detail={editing.line.hint ? `${editing.line.label}: ${editing.line.hint}` : editing.line.label}
          value={cells[editing.line.id]?.[editing.player.id] ?? null}
          choices={editing.line.choices}
          worth={worthOf(editing.line)}
          last
          onDone={(value) => {
            set(editing.line.id, editing.player.id, value)
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  )
}

function SheetRow({ line, children }: { line: Line; children: ReactNode }) {
  const t = useSpell()
  const unit =
    line.fixed !== undefined
      ? `${line.fixed}`
      : line.per !== undefined
        ? `× ${line.per}`
        : line.divide
          ? `÷ ${line.divide}`
          : line.minus
            ? 'minus'
            : ''
  return (
    <>
      {line.section ? (
        <tr className="score-section">
          <th colSpan={99} scope="rowgroup">
            {t(line.section)}
          </th>
        </tr>
      ) : null}
      <tr data-bonus={Boolean(line.bonus)}>
        <th scope="row" className="score-label" title={line.hint ? t(line.hint) : undefined}>
          {t(line.label)}
          {unit ? <small>{unit}</small> : null}
        </th>
        {children}
      </tr>
    </>
  )
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])
  return createPortal(
    <div className="scrim pad-scrim" onClick={onClose}>
      <div className="sheet pad-sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function Stepper({ label, value, onChange, step = 1, min = 0 }: { label: string; value: number; onChange: (n: number) => void; step?: number; min?: number }) {
  const t = useSpell()
  return (
    <div className="pad-part">
      <span>{t(label)}</span>
      <div className="stepper">
        <button aria-label={`Less ${label}`} onClick={() => onChange(Math.max(min, value - step))}>
          −
        </button>
        <strong>{value}</strong>
        <button aria-label={`More ${label}`} onClick={() => onChange(value + step)}>
          +
        </button>
      </div>
    </div>
  )
}

function SciencePad({ player, value, onDone, onClose }: { player: Player; value?: number[]; onDone: (v: number[] | undefined) => void; onClose: () => void }) {
  const [counts, setCounts] = useState(value ?? [0, 0, 0])
  const set = (i: number) => (n: number) => setCounts((all) => all.map((c, k) => (k === i ? n : c)))
  return (
    <Sheet title={`${player.name}: science`} onClose={onClose}>
      <div className="pad-head">
        <div>
          <h2>{player.name}</h2>
          <span>Science</span>
        </div>
        <output className="pad-display">{science(counts)}</output>
      </div>
      <div className="pad-parts">
        <Stepper label="Tablets" value={counts[0]} onChange={set(0)} />
        <Stepper label="Compasses" value={counts[1]} onChange={set(1)} />
        <Stepper label="Gears" value={counts[2]} onChange={set(2)} />
      </div>
      <div className="pad-actions">
        <button className="ghost" onClick={() => onDone(undefined)}>
          Clear
        </button>
        <button className="primary" onClick={() => onDone(counts)}>
          Done
        </button>
      </div>
    </Sheet>
  )
}

// -------------------------------------------------------------- counters ----

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function CountersBoard({ sheet, players, data, change }: BoardProps<CounterSheet>) {
  const t = useSpell()
  const values = (data.values as CounterValues | undefined) ?? {}
  const result = counterResult(sheet, players, values)
  const [editing, setEditing] = useState<{ counter: string; player: Player } | null>(null)
  const valueOf = (id: string, pid: string) => values[id]?.[pid] ?? startOf(sheet.counters.find((c) => c.id === id)!, players.length)

  function bump(id: string, pid: string, by: number) {
    const counter = sheet.counters.find((c) => c.id === id)!
    const next = clampCounter(counter, valueOf(id, pid) + by)
    change({ ...data, values: { ...values, [id]: { ...(values[id] ?? {}), [pid]: next } } })
  }

  const editingCounter = editing ? sheet.counters.find((c) => c.id === editing.counter) : undefined

  return (
    <div>
      <Standing players={players} done={result.done} winners={result.winners} leaders={result.leaders} lost={result.lost} />
      <div className="counter-grid" data-shared={Boolean(sheet.shared)}>
        {players.map((p) => (
          <section key={p.id} className="counter-card" data-out={result.out[p.id]} data-front={result.leaders.includes(p.id) || result.winners.includes(p.id)}>
            {sheet.shared ? null : <h3>{p.name || '—'}</h3>}
            {sheet.counters.map((c) => {
              const v = valueOf(c.id, p.id)
              return (
                <div key={c.id} className="counter">
                  <span className="counter-label">{t(c.label)}</span>
                  <div className="counter-row">
                    <button className="counter-step" aria-label={`${t(c.label)} down one`} onClick={() => bump(c.id, p.id, -1)}>
                      −
                    </button>
                    <button className="counter-value" aria-label={`${t(c.label)}: ${v}. Tap to enter an amount.`} onClick={() => setEditing({ counter: c.id, player: p })}>
                      {c.money ? money.format(v) : v}
                    </button>
                    <button className="counter-step" aria-label={`${t(c.label)} up one`} onClick={() => bump(c.id, p.id, 1)}>
                      +
                    </button>
                  </div>
                  {c.steps?.length ? (
                    <div className="counter-steps">
                      {c.steps.map((step) => (
                        <button key={step} className="chip" onClick={() => bump(c.id, p.id, step)}>
                          {step > 0 ? '+' : '−'}
                          {c.money ? money.format(Math.abs(step)) : Math.abs(step)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
            {sheet.sum ? (
              <p className="counter-sum">
                {t(sheet.sum.label)}{' '}
                <strong>
                  {(() => {
                    const total =
                      sheet.sum.of.reduce((acc, id) => acc + valueOf(id, p.id), 0) - (sheet.sum.less ?? []).reduce((acc, id) => acc + valueOf(id, p.id), 0)
                    const text = sheet.sum.money ? money.format(Math.abs(total)) : String(Math.abs(total))
                    return sheet.sum.less ? `${total > 0 ? '+' : total < 0 ? '−' : ''}${text}` : sheet.sum.money ? money.format(total) : total
                  })()}
                </strong>
              </p>
            ) : null}
          </section>
        ))}
      </div>

      {editing && editingCounter ? (
        <ScorePad
          title={sheet.shared ? t(editingCounter.label) : editing.player.name}
          detail={sheet.shared ? undefined : editingCounter.label}
          value={null}
          onDone={() => setEditing(null)}
          onClose={() => setEditing(null)}
          actions={[
            {
              label: 'Take away',
              run: (n) => {
                if (n) bump(editing.counter, editing.player.id, -Math.abs(n))
                setEditing(null)
              },
            },
            {
              label: 'Add',
              primary: true,
              run: (n) => {
                if (n) bump(editing.counter, editing.player.id, Math.abs(n))
                setEditing(null)
              },
            },
          ]}
        />
      ) : null}
    </div>
  )
}

// ------------------------------------------------------------------ bids ----

export function BidsBoard({ sheet, players, data, change }: BoardProps<BidSheet>) {
  const rows = (data.rows as BidRow[] | undefined) ?? []
  const result = bidResult(sheet, players, rows)
  const [editing, setEditing] = useState<{ row: number; player: number } | null>(null)
  const fixed = sheet.rounds?.(players.length)
  const count = fixed !== undefined ? Math.max(fixed, rows.length) : rows.length + (result.done ? 0 : 1)
  const cardsDealt = sheet.scoring === 'wizard' || sheet.scoring === 'skullking'
  const label = (i: number) => (cardsDealt ? `Round ${i + 1} · ${i + 1} ${i ? 'cards' : 'card'}` : `Hand ${i + 1}`)

  function set(row: number, edit: (r: BidRow) => BidRow) {
    const next = [...rows]
    while (next.length <= row) next.push({ bid: {}, took: {} })
    next[row] = edit({ bid: { ...next[row].bid }, took: { ...next[row].took }, bonus: { ...(next[row].bonus ?? {}) }, nil: { ...(next[row].nil ?? {}) } })
    change({ ...data, rows: next })
  }
  const target = editing ? players[editing.player] : undefined

  return (
    <div>
      <Standing players={players} done={result.done} winners={result.winners} leaders={result.leaders} quiet={sheet.target ? `First to ${sheet.target} wins` : undefined} />
      <Table
        players={players}
        head={(p) => (
          <HeadCell player={p} total={result.totals[p.id]} front={result.leaders.includes(p.id)} note={sheet.scoring === 'spades' ? `${result.bags[p.id] % 10} ${result.bags[p.id] % 10 === 1 ? 'bag' : 'bags'}` : undefined} />
        )}
      >
        {Array.from({ length: count }, (_, i) => (
          <tr key={i}>
            <th scope="row" className="score-label">
              {label(i)}
            </th>
            {players.map((p, k) => {
              const bid = rows[i]?.bid[p.id]
              const took = rows[i]?.took[p.id]
              const score = result.round[i]?.[p.id]
              return (
                <td key={p.id}>
                  <button className="score-cell bid-cell" data-empty={bid === undefined || bid === null} aria-label={`${p.name}, ${label(i)}`} onClick={() => setEditing({ row: i, player: k })}>
                    {bid !== undefined && bid !== null ? (
                      <>
                        <small>
                          {bid}
                          {took !== undefined && took !== null ? ` / ${took}` : ''}
                        </small>
                        {score !== null && score !== undefined ? score : ''}
                      </>
                    ) : (
                      ''
                    )}
                  </button>
                </td>
              )
            })}
          </tr>
        ))}
      </Table>
      <p className="hint">Each square shows the bid, the tricks taken, and the score.</p>

      {editing && target ? (
        <BidPad
          key={`${editing.row}:${editing.player}`}
          sheet={sheet}
          player={target}
          detail={label(editing.row)}
          row={rows[editing.row]}
          cards={cardsDealt ? editing.row + 1 : 13}
          last={editing.player === players.length - 1}
          onDone={(entry, advance) => {
            set(editing.row, (r) => ({
              bid: { ...r.bid, [target.id]: entry.bid },
              took: { ...r.took, [target.id]: entry.took },
              bonus: { ...r.bonus, [target.id]: entry.bonus },
              nil: { ...r.nil, [target.id]: entry.nil },
            }))
            setEditing(advance && editing.player < players.length - 1 ? { row: editing.row, player: editing.player + 1 } : null)
          }}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  )
}

type BidEntry = { bid: number | null; took: number | null; bonus: number | null; nil: 'made' | 'failed' | null }

function BidPad({ sheet, player, detail, row, cards, last, onDone, onClose }: {
  sheet: BidSheet
  player: Player
  detail: string
  row?: BidRow
  cards: number
  last: boolean
  onDone: (entry: BidEntry, advance: boolean) => void
  onClose: () => void
}) {
  const [bid, setBid] = useState(row?.bid[player.id] ?? 0)
  const [took, setTook] = useState<number | null>(row?.took[player.id] ?? null)
  const [bonus, setBonus] = useState(row?.bonus?.[player.id] ?? 0)
  const [nil, setNil] = useState<'made' | 'failed' | null>(row?.nil?.[player.id] ?? null)
  return (
    <Sheet title={player.name} onClose={onClose}>
      <div className="pad-head">
        <div>
          <h2>{player.name}</h2>
          <span>{detail}</span>
        </div>
      </div>
      <div className="pad-parts">
        <Stepper label={sheet.scoring === 'spades' ? 'Bid (the team together)' : 'Bid'} value={bid} onChange={(n) => setBid(Math.min(n, cards))} />
        <Stepper label="Tricks taken" value={took ?? 0} onChange={(n) => setTook(Math.min(n, cards))} />
        {took === null ? <p className="hint">Leave tricks for now and come back after the hand.</p> : null}
        {sheet.scoring === 'skullking' ? <Stepper label="Bonus points" value={bonus} step={10} onChange={setBonus} /> : null}
        {sheet.scoring === 'spades' ? (
          <div className="size-row">
            {(
              [
                [null, 'No nil'],
                ['made', 'Nil made'],
                ['failed', 'Nil missed'],
              ] as const
            ).map(([id, name]) => (
              <button key={name} className="size-btn" data-active={nil === id} onClick={() => setNil(id)}>
                {name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="pad-actions">
        <button className="ghost" onClick={() => onDone({ bid: null, took: null, bonus: null, nil: null }, false)}>
          Clear
        </button>
        <button className="primary" onClick={() => onDone({ bid, took, bonus, nil }, !last)}>
          {last ? 'Done' : 'Next'}
        </button>
      </div>
    </Sheet>
  )
}

// ------------------------------------------------------------- checklist ----

export function ChecklistBoard({ sheet, players, data, change }: BoardProps<ChecklistSheet>) {
  const t = useSpell()
  const done = (data.done as Record<string, Record<string, boolean>> | undefined) ?? {}
  const count = (id: string) => sheet.items.filter((item) => done[item.id]?.[id]).length
  const complete = players.filter((p) => count(p.id) === sheet.items.length).map((p) => p.id)
  const most = Math.max(0, ...players.map((p) => count(p.id)))
  const leaders = most ? players.filter((p) => count(p.id) === most).map((p) => p.id) : []
  return (
    <div>
      <Standing players={players} done={complete.length > 0} winners={complete} leaders={leaders} />
      <Table players={players} head={(p) => <HeadCell player={p} total={`${count(p.id)}/${sheet.items.length}`} front={leaders.includes(p.id)} />}>
        {sheet.items.map((item) => (
          <tr key={item.id}>
            <th scope="row" className="score-label">
              {item.colour ? <i className="swatch-dot" style={{ background: item.colour }} /> : null}
              {t(item.label)}
            </th>
            {players.map((p) => {
              const on = Boolean(done[item.id]?.[p.id])
              return (
                <td key={p.id}>
                  <button
                    className="score-cell check-cell"
                    data-on={on}
                    style={on && item.colour ? { background: item.colour, color: '#fff' } : undefined}
                    aria-pressed={on}
                    aria-label={`${p.name}, ${t(item.label)}`}
                    onClick={() => change({ ...data, done: { ...done, [item.id]: { ...(done[item.id] ?? {}), [p.id]: !on } } })}
                  >
                    {on ? '✓' : ''}
                  </button>
                </td>
              )
            })}
          </tr>
        ))}
      </Table>
    </div>
  )
}

// ----------------------------------------------------------------- notes ----

const MARKS = ['', '✓', '✕', '?']

export function NotesBoard({ sheet, players, data, change }: BoardProps<NotesSheet>) {
  const marks = (data.marks as Record<string, Record<string, string>> | undefined) ?? {}
  return (
    <div>
      <Table players={players} head={(p) => <HeadCell player={p} />}>
        {sheet.groups.map((group) => (
          <GroupRows key={group.label} label={group.label}>
            {group.items.map((item) => (
              <tr key={item}>
                <th scope="row" className="score-label">
                  {item}
                </th>
                {players.map((p) => {
                  const mark = marks[item]?.[p.id] ?? ''
                  return (
                    <td key={p.id}>
                      <button
                        className="score-cell note-cell"
                        data-mark={mark}
                        aria-label={`${item}, ${p.name}: ${mark || 'blank'}`}
                        onClick={() => {
                          const next = MARKS[(MARKS.indexOf(mark) + 1) % MARKS.length]
                          change({ ...data, marks: { ...marks, [item]: { ...(marks[item] ?? {}), [p.id]: next } } })
                        }}
                      >
                        {mark}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </GroupRows>
        ))}
      </Table>
    </div>
  )
}

function GroupRows({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <tr className="score-section">
        <th colSpan={99} scope="rowgroup">
          {label}
        </th>
      </tr>
      {children}
    </>
  )
}

// --------------------------------------------------------------- bowling ----

export function BowlingBoard({ players, data, change }: BoardProps<unknown>) {
  const rolls = (data.rolls as Record<string, number[]> | undefined) ?? {}
  const order = (data.order as string[] | undefined) ?? []
  const games = Object.fromEntries(players.map((p) => [p.id, bowling(rolls[p.id] ?? [])]))
  const unfinished = players.filter((p) => !games[p.id].done)
  const fewest = Math.min(...unfinished.map((p) => games[p.id].frame))
  const up = unfinished.find((p) => games[p.id].frame === fewest)
  const done = unfinished.length === 0
  const totals = Object.fromEntries(players.map((p) => [p.id, games[p.id].total]))
  const top = Math.max(0, ...Object.values(totals))
  const front = players.filter((p) => top > 0 && totals[p.id] === top).map((p) => p.id)

  function roll(pins: number) {
    if (!up) return
    change({ ...data, rolls: { ...rolls, [up.id]: [...(rolls[up.id] ?? []), pins] }, order: [...order, up.id] })
  }
  function undo() {
    const last = order[order.length - 1]
    if (!last) return
    change({ ...data, rolls: { ...rolls, [last]: (rolls[last] ?? []).slice(0, -1) }, order: order.slice(0, -1) })
  }

  const next = up ? games[up.id].next : 0
  const fresh = up ? (() => {
    const g = games[up.id]
    const f = g.frames[g.frame]
    return f.marks.length === 0 || (g.frame === 9 && (f.marks[f.marks.length - 1] === 'X' || f.marks[f.marks.length - 1] === '/'))
  })() : true

  return (
    <div>
      <Standing players={players} done={done} winners={done ? front : []} leaders={front} />
      <div className="bowling">
        {players.map((p) => (
          <div key={p.id} className="bowling-line" data-up={up?.id === p.id}>
            <div className="bowling-name">
              <span>{p.name}</span>
              <strong>{games[p.id].total}</strong>
            </div>
            <div className="frames">
              {games[p.id].frames.map((f, i) => (
                <div key={i} className="frame" data-tenth={i === 9}>
                  <span className="frame-marks">
                    {Array.from({ length: i === 9 ? 3 : 2 }, (_, k) => (
                      <b key={k}>{i < 9 && f.marks[0] === 'X' ? (k === 1 ? 'X' : '') : (f.marks[k] ?? '')}</b>
                    ))}
                  </span>
                  <span className="frame-total">{f.total ?? ''}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {up ? (
        <div className="pins">
          <p className="hint">
            {up.name}, frame {games[up.id].frame + 1}: pins down
          </p>
          <div className="pins-grid">
            {Array.from({ length: next + 1 }, (_, n) => (
              <button key={n} className="key" data-kind={n === next && n > 0 ? 'operator' : 'digit'} onClick={() => roll(n)}>
                {n === next && n > 0 ? (fresh && n === 10 ? 'X' : '/') : n === 0 ? '–' : n}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <button className="ghost" disabled={!order.length} onClick={undo}>
        Undo the last ball
      </button>
    </div>
  )
}

// --------------------------------------------------------------- cricket ----

const markOf = (n: number) => (n >= 3 ? '⊗' : n === 2 ? '✕' : n === 1 ? '/' : '')

export function CricketBoard({ players, data, change }: BoardProps<unknown>) {
  const hits = (data.hits as CricketHit[] | undefined) ?? []
  const result = cricket(players, hits)
  const [times, setTimes] = useState(1)
  return (
    <div>
      <Standing players={players} done={result.done} winners={result.winners} leaders={result.leaders} />
      <div className="size-row cricket-times" role="radiogroup" aria-label="Next hit">
        {[
          [1, 'Single'],
          [2, 'Double'],
          [3, 'Treble'],
        ].map(([n, name]) => (
          <button key={name} className="size-btn" role="radio" aria-checked={times === n} data-active={times === n} onClick={() => setTimes(Number(n))}>
            {name}
          </button>
        ))}
      </div>
      <Table players={players} head={(p) => <HeadCell player={p} total={result.points[p.id]} front={result.leaders.includes(p.id)} />}>
        {CRICKET_TARGETS.map((target) => (
          <tr key={target}>
            <th scope="row" className="score-label">
              {target === 'bull' ? 'Bull' : target}
            </th>
            {players.map((p) => (
              <td key={p.id}>
                <button
                  className="score-cell cricket-cell"
                  data-closed={result.marks[p.id][target] >= 3}
                  aria-label={`${p.name}, ${target}: ${Math.min(3, result.marks[p.id][target])} marks`}
                  onClick={() => {
                    change({ ...data, hits: [...hits, { p: p.id, t: target, n: target === 'bull' ? Math.min(2, times) : times }] })
                    setTimes(1)
                  }}
                >
                  {markOf(result.marks[p.id][target])}
                </button>
              </td>
            ))}
          </tr>
        ))}
      </Table>
      <button className="ghost" disabled={!hits.length} onClick={() => change({ ...data, hits: hits.slice(0, -1) })}>
        Undo the last hit
      </button>
    </div>
  )
}
