import type { BidSheet, CategorySheet, Counter, CounterSheet, Line, Player, RoundsSheet } from './types.ts'

/**
 * The arithmetic behind every score sheet, apart from anything that draws.
 * Scores are kept by player id rather than by column, so adding or removing a
 * player never shifts anyone else's numbers.
 */

export type Scores = Record<string, number | null>
export type Result = {
  totals: Record<string, number>
  /** The game is over by its own rules. */
  done: boolean
  /** Who won, once done; who is in front, before. */
  winners: string[]
  leaders: string[]
}

/** The best by a rule, among the players who have any score at all. */
export function best(values: Record<string, number>, win: 'high' | 'low', among: string[]): string[] {
  if (!among.length) return []
  const pick = win === 'high' ? Math.max : Math.min
  const top = pick(...among.map((id) => values[id] ?? 0))
  return among.filter((id) => (values[id] ?? 0) === top)
}

const has = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n)

// ---------------------------------------------------------------- rounds ----

export type RoundRow = { scores: Scores; made?: Record<string, boolean> }

export type RoundsResult = Result & {
  /** What each cell actually counted for, after cancelling and busts. */
  counted: Record<string, number | null>[]
  /** Cells that went bust when counting down. */
  bust: Set<string>
  letters: Record<string, number>
  out: Record<string, boolean>
  /** Phase 10: the phase each player is on, 1 to 10, or 11 once all ten are done. */
  phase: Record<string, number>
}

export function roundsResult(sheet: RoundsSheet, players: Player[], rows: RoundRow[]): RoundsResult {
  const ids = players.map((p) => p.id)
  const totals: Record<string, number> = {}
  const letters: Record<string, number> = {}
  const out: Record<string, boolean> = {}
  const phase: Record<string, number> = {}
  const bust = new Set<string>()
  const counted: Record<string, number | null>[] = []
  const misses: Record<string, number> = {}
  for (const id of ids) {
    totals[id] = sheet.countdown ?? 0
    letters[id] = 0
    phase[id] = 1
    out[id] = false
    misses[id] = 0
  }
  let scored = new Set<string>()

  rows.forEach((row, index) => {
    const line: Record<string, number | null> = {}
    if (sheet.cancel && ids.length === 2) {
      const [a, b] = ids
      const sa = row.scores[a]
      const sb = row.scores[b]
      if (has(sa) || has(sb)) {
        const diff = (sa ?? 0) - (sb ?? 0)
        line[a] = Math.max(diff, 0)
        line[b] = Math.max(-diff, 0)
      }
    } else {
      for (const id of ids) line[id] = has(row.scores[id]) ? row.scores[id] : null
    }
    for (const id of ids) {
      const value = line[id]
      if (!has(value)) continue
      scored.add(id)
      if (sheet.countdown !== undefined) {
        if (totals[id] - value < 0) {
          bust.add(`${index}:${id}`)
          line[id] = 0
        } else totals[id] -= value
      } else if (sheet.exact && totals[id] + value > sheet.exact.target) {
        bust.add(`${index}:${id}`)
        totals[id] = sheet.exact.over
      } else totals[id] += value
      if (sheet.misses) {
        misses[id] = value === 0 ? misses[id] + 1 : 0
        if (misses[id] >= sheet.misses) out[id] = true
      }
      if (sheet.word) letters[id] += value > 0 ? 1 : 0
    }
    if (sheet.phases) for (const id of ids) if (row.made?.[id]) phase[id] += 1
    counted.push(line)
  })

  let done = false
  let winners: string[] = []
  scored = new Set(ids.filter((id) => scored.has(id)))
  const scoredIds = [...scored]

  if (sheet.word) {
    for (const id of ids) out[id] = letters[id] >= sheet.word.length
    const standing = ids.filter((id) => !out[id])
    done = ids.length > 1 && standing.length <= 1
    winners = done ? standing : []
    return { totals, done, winners, leaders: done ? winners : best(letters, 'low', scoredIds.length ? ids : []), counted, bust, letters, out, phase }
  }
  if (sheet.exact) {
    const home = ids.filter((id) => totals[id] === sheet.exact!.target && !out[id])
    const standing = ids.filter((id) => !out[id])
    done = home.length > 0 || (ids.length > 1 && standing.length === 1 && Object.values(out).some(Boolean))
    winners = home.length ? home : done ? standing : []
    const leaders = done ? winners : best(totals, 'high', scoredIds.filter((id) => !out[id]))
    return { totals, done, winners, leaders, counted, bust, letters, out, phase }
  }
  if (sheet.phases) {
    const finished = ids.filter((id) => phase[id] > sheet.phases!.length)
    done = finished.length > 0
    winners = done ? best(totals, 'low', finished) : []
  } else if (sheet.countdown !== undefined) {
    const home = ids.filter((id) => totals[id] === 0)
    done = home.length > 0
    winners = home
  } else if (sheet.target !== undefined && ids.some((id) => totals[id] >= sheet.target!)) {
    done = true
    winners = best(totals, sheet.win, ids)
  } else if (sheet.rounds !== undefined) {
    const full = rows.slice(0, sheet.rounds)
    done = full.length >= sheet.rounds && full.every((row, i) => ids.every((id) => has(counted[i]?.[id]) || has(row.scores[id])))
    if (done) winners = best(totals, sheet.win, ids)
  }
  const leaders = done
    ? winners
    : sheet.phases
      ? leadersByPhase(phase, totals, scoredIds)
      : best(totals, sheet.countdown !== undefined ? 'low' : sheet.win, scoredIds)
  return { totals, done, winners, leaders, counted, bust, letters, out, phase }
}

function leadersByPhase(phase: Record<string, number>, totals: Record<string, number>, among: string[]): string[] {
  const front = best(phase, 'high', among)
  return best(totals, 'low', front)
}

// ----------------------------------------------------------------- sheet ----

/** 7 Wonders science: each kind scores its count squared, and each set of all three scores 7 more. */
export function science([a, b, c]: number[]): number {
  return a * a + b * b + c * c + 7 * Math.min(a, b, c)
}

export type SheetCells = Record<string, Scores>
export type SheetParts = Record<string, Record<string, number[]>>

/** What one line is worth for one player. */
export function lineValue(line: Line, raw: number | null | undefined, parts?: number[]): number {
  if (line.science) return parts ? science(parts) : 0
  if (!has(raw)) return 0
  if (line.table) return line.table[Math.max(0, Math.min(line.table.length - 1, Math.round(raw)))]
  if (line.divide) return Math.floor(raw / line.divide)
  if (line.per !== undefined) return raw * line.per
  if (line.minus) return -Math.abs(raw)
  return raw
}

export type SheetResult = Result & { values: Record<string, Record<string, number>> }

export function sheetResult(sheet: CategorySheet, players: Player[], cells: SheetCells, parts: SheetParts = {}): SheetResult {
  const ids = players.map((p) => p.id)
  const values: Record<string, Record<string, number>> = {}
  const totals: Record<string, number> = {}
  for (const id of ids) totals[id] = 0
  const anything = new Set<string>()
  for (const line of sheet.lines) {
    values[line.id] = {}
    for (const id of ids) {
      let value: number
      if (line.bonus) {
        const sum = line.bonus.of.reduce((acc, of) => acc + (values[of]?.[id] ?? 0), 0)
        value = sum >= line.bonus.atLeast ? line.bonus.add : 0
      } else {
        value = lineValue(line, cells[line.id]?.[id], parts[line.id]?.[id])
        if (has(cells[line.id]?.[id]) || parts[line.id]?.[id]) anything.add(id)
      }
      values[line.id][id] = value
      totals[id] += value
    }
  }
  const scored = ids.filter((id) => anything.has(id))
  const done = sheet.goal !== undefined && ids.some((id) => totals[id] >= sheet.goal!)
  const winners = done ? best(totals, 'high', ids) : []
  return { totals, done, winners, leaders: done ? winners : best(totals, 'high', scored), values }
}

// -------------------------------------------------------------- counters ----

/** Kept inside the counter's limits. */
export function clampCounter(counter: Counter, value: number): number {
  let out = value
  if (counter.min !== undefined) out = Math.max(counter.min, out)
  if (counter.max !== undefined) out = Math.min(counter.max, out)
  return out
}

export type CounterValues = Record<string, Record<string, number>>
export type CounterResult = { done: boolean; winners: string[]; leaders: string[]; out: Record<string, boolean>; lost: boolean }

const reached = (value: number, mark: number, start: number) => (mark >= start ? value >= mark : value <= mark)

export function counterResult(sheet: CounterSheet, players: Player[], values: CounterValues): CounterResult {
  const ids = players.map((p) => p.id)
  const value = (counter: Counter, id: string) => values[counter.id]?.[id] ?? counter.start
  const out: Record<string, boolean> = {}
  for (const id of ids) {
    out[id] = sheet.counters.some((c) => c.lose !== undefined && reached(value(c, id), c.lose, c.start) && value(c, id) !== c.start)
  }
  let winners: string[] = []
  for (const counter of sheet.counters) {
    if (counter.win === undefined) continue
    const start = counter.start
    for (const id of ids) {
      if (out[id] || !reached(value(counter, id), counter.win, start) || value(counter, id) === start) continue
      // Some games cap a game where winning by two would never end: badminton at 30.
      const capped = counter.max !== undefined && counter.max > counter.win && value(counter, id) === counter.max
      if (counter.winBy && !capped) {
        const others = ids.filter((other) => other !== id).map((other) => value(counter, other))
        const gap = counter.win >= start ? value(counter, id) - Math.max(...others) : Math.min(...others) - value(counter, id)
        if (others.length && gap < counter.winBy) continue
      }
      winners.push(id)
    }
  }
  winners = [...new Set(winners)]
  const standing = ids.filter((id) => !out[id])
  if (sheet.shared) {
    const lost = ids.some((id) => out[id])
    return { done: lost || winners.length > 0, winners: lost ? [] : winners, leaders: [], out, lost }
  }
  if (!winners.length && ids.length > 1 && standing.length === 1 && Object.values(out).some(Boolean)) winners = standing
  const first = sheet.counters[0]
  const firstStart = first.start
  const byCounter = (id: string, c: Counter) => value(c, id)
  const counterOf = (cid: string) => sheet.counters.find((c) => c.id === cid)!
  const ranked = (id: string) =>
    sheet.sum?.leads
      ? sheet.sum.of.reduce((a, cid) => a + byCounter(id, counterOf(cid)), 0) - (sheet.sum.less ?? []).reduce((a, cid) => a + byCounter(id, counterOf(cid)), 0)
      : value(first, id)
  const moved = standing.filter((id) => (sheet.sum?.leads ? sheet.counters.some((c) => value(c, id) !== c.start) : value(first, id) !== firstStart))
  const direction: 'high' | 'low' = !sheet.sum?.leads && first.win !== undefined && first.win < firstStart ? 'low' : 'high'
  const scores = Object.fromEntries(standing.map((id) => [id, ranked(id)]))
  return { done: winners.length > 0, winners, leaders: winners.length ? winners : moved.length ? best(scores, direction, standing) : [], out, lost: false }
}

// ------------------------------------------------------------------ bids ----

export type BidRow = {
  bid: Scores
  took: Scores
  bonus?: Scores
  nil?: Record<string, 'made' | 'failed' | null>
}

/** One player's score for one round, or null until both the bid and the tricks are in. */
export function bidScore(scoring: BidSheet['scoring'], round: number, bid: number | null | undefined, took: number | null | undefined, bonus = 0): number | null {
  if (!has(bid) || !has(took)) return null
  const off = Math.abs(bid - took)
  switch (scoring) {
    case 'ohhell':
      return off === 0 ? 10 + bid : 0
    case 'wizard':
      return off === 0 ? 20 + 10 * took : -10 * off
    case 'skullking':
      if (bid === 0) return took === 0 ? 10 * round : -10 * round
      return off === 0 ? 20 * bid + bonus : -10 * off
    case 'spades':
      return took >= bid ? 10 * bid + (took - bid) : -10 * bid
  }
}

export type BidResult = Result & { round: Record<string, number | null>[]; bags: Record<string, number> }

export function bidResult(sheet: BidSheet, players: Player[], rows: BidRow[]): BidResult {
  const ids = players.map((p) => p.id)
  const totals: Record<string, number> = {}
  const bags: Record<string, number> = {}
  for (const id of ids) {
    totals[id] = 0
    bags[id] = 0
  }
  const round: Record<string, number | null>[] = []
  rows.forEach((row, index) => {
    const line: Record<string, number | null> = {}
    for (const id of ids) {
      let score = bidScore(sheet.scoring, index + 1, row.bid[id], row.took[id], row.bonus?.[id] ?? 0)
      const nil = row.nil?.[id]
      if (sheet.scoring === 'spades' && nil) score = (score ?? 0) + (nil === 'made' ? 100 : -100)
      if (sheet.scoring === 'spades' && score !== null && has(row.bid[id]) && has(row.took[id]) && row.took[id]! > row.bid[id]!) {
        // Every tenth bag costs a hundred, at the moment it is collected.
        const before = bags[id]
        bags[id] += row.took[id]! - row.bid[id]!
        score -= 100 * (Math.floor(bags[id] / 10) - Math.floor(before / 10))
      }
      line[id] = score
      if (score !== null) totals[id] += score
    }
    round.push(line)
  })
  const scored = ids.filter((id) => round.some((line) => line[id] !== null))
  let done = false
  let winners: string[] = []
  if (sheet.target !== undefined && ids.some((id) => totals[id] >= sheet.target!)) done = true
  const count = sheet.rounds?.(ids.length)
  if (count !== undefined && round.length >= count && round.slice(0, count).every((line) => ids.every((id) => line[id] !== null))) done = true
  if (done) winners = best(totals, 'high', ids)
  return { totals, done, winners, leaders: done ? winners : best(totals, 'high', scored), round, bags }
}

// --------------------------------------------------------------- bowling ----

export type Frame = { marks: string[]; total: number | null }
export type BowlingResult = { frames: Frame[]; total: number; done: boolean; next: number; frame: number }

/** Ten frames from the pins each ball knocked down: strikes, spares, the tenth frame's extra balls. */
export function bowling(rolls: number[]): BowlingResult {
  const starts: number[] = []
  const balls: number[][] = []
  let i = 0
  for (let f = 0; f < 10 && i < rolls.length; f += 1) {
    starts.push(i)
    const take = f < 9 ? (rolls[i] === 10 ? 1 : 2) : 3
    balls.push(rolls.slice(i, i + take))
    i += take
  }
  const tenthNeeds = (t: number[]) => (t[0] === 10 || (t.length >= 2 && t[0] + t[1] === 10) ? 3 : 2)
  const complete = (f: number) => {
    const b = balls[f]
    if (!b) return false
    return f < 9 ? b[0] === 10 || b.length === 2 : b.length >= tenthNeeds(b)
  }

  const frames: Frame[] = []
  let running = 0
  let known = true
  for (let f = 0; f < 10; f += 1) {
    const b = balls[f] ?? []
    const s = starts[f]
    let score: number | null = null
    if (complete(f)) {
      if (f === 9) score = b.reduce((x, y) => x + y, 0)
      else if (b[0] === 10) score = rolls[s + 2] === undefined ? null : 10 + rolls[s + 1] + rolls[s + 2]
      else if (b[0] + b[1] === 10) score = rolls[s + 2] === undefined ? null : 10 + rolls[s + 2]
      else score = b[0] + b[1]
    }
    if (score === null) known = false
    else if (known) running += score
    frames.push({ marks: marksOf(b, f === 9), total: known && score !== null ? running : null })
  }

  const done = complete(9)
  const frame = Math.min(9, balls.filter((_, f) => complete(f)).length)
  let next = 10
  const b = balls[frame] ?? []
  if (done) next = 0
  else if (frame < 9) next = b.length === 1 ? 10 - b[0] : 10
  else if (b.length === 1) next = b[0] === 10 ? 10 : 10 - b[0]
  else if (b.length === 2) next = b[0] === 10 && b[1] !== 10 ? 10 - b[1] : 10
  return { frames, total: running, done, next, frame }
}

function marksOf(balls: number[], tenth: boolean): string[] {
  const out: string[] = []
  balls.forEach((pins, k) => {
    const before = out[k - 1]
    const fresh = k === 0 || before === 'X' || before === '/'
    if (pins === 10 && fresh) out.push('X')
    else if (!fresh && balls[k - 1] + pins === 10) out.push('/')
    else out.push(pins === 0 ? '–' : String(pins))
    if (!tenth && out[0] === 'X') return
  })
  return out
}

// ---------------------------------------------------------------- cricket ----

export const CRICKET_TARGETS = ['20', '19', '18', '17', '16', '15', 'bull'] as const
export type CricketHit = { p: string; t: string; n: number }
export type CricketResult = {
  marks: Record<string, Record<string, number>>
  points: Record<string, number>
  done: boolean
  winners: string[]
  leaders: string[]
}

export function cricket(players: Player[], hits: CricketHit[]): CricketResult {
  const ids = players.map((p) => p.id)
  const marks: Record<string, Record<string, number>> = {}
  const points: Record<string, number> = {}
  for (const id of ids) {
    marks[id] = Object.fromEntries(CRICKET_TARGETS.map((t) => [t, 0]))
    points[id] = 0
  }
  for (const hit of hits) {
    if (!marks[hit.p]) continue
    const now = marks[hit.p][hit.t] ?? 0
    const extra = Math.max(0, now + hit.n - 3) - Math.max(0, now - 3)
    marks[hit.p][hit.t] = now + hit.n
    const open = ids.some((other) => other !== hit.p && (marks[other][hit.t] ?? 0) < 3)
    if (extra > 0 && open) points[hit.p] += extra * (hit.t === 'bull' ? 25 : Number(hit.t))
  }
  const closedAll = (id: string) => CRICKET_TARGETS.every((t) => marks[id][t] >= 3)
  const winners = ids.filter((id) => closedAll(id) && ids.every((other) => points[id] >= points[other]))
  const scored = ids.filter((id) => CRICKET_TARGETS.some((t) => marks[id][t] > 0))
  const leaders = winners.length
    ? winners
    : best(
        Object.fromEntries(ids.map((id) => [id, points[id] * 100 + CRICKET_TARGETS.reduce((a, t) => a + Math.min(3, marks[id][t]), 0)])),
        'high',
        scored,
      )
  return { marks, points, done: winners.length > 0, winners, leaders }
}
