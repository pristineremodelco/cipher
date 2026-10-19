import test from 'node:test'
import assert from 'node:assert/strict'
import { GAMES, findGames, gameOf } from '../src/lib/games/catalog.ts'
import { bidResult, bidScore, bowling, counterResult, cricket, roundsResult, science, sheetResult } from '../src/lib/games/score.ts'
import type { CategorySheet, CounterSheet, RoundsSheet } from '../src/lib/games/types.ts'

const two = [{ id: 'a', name: 'Ann' }, { id: 'b', name: 'Ben' }]
const three = [...two, { id: 'c', name: 'Cal' }]
const sheetOf = (id: string) => gameOf(id)!.sheet

test('the catalogue is sound', () => {
  assert.ok(GAMES.length >= 120, `${GAMES.length} games`)
  const ids = new Set<string>()
  for (const game of GAMES) {
    assert.ok(!ids.has(game.id), `${game.id} twice`)
    ids.add(game.id)
    assert.ok(game.players[0] >= 1 && game.players[0] <= game.players[1], `${game.id} players`)
    const lines = game.rules.split('\n')
    assert.ok(lines.length >= 1 && lines.every((line) => /^[A-Z][A-Za-z ,'-]*: \S/.test(line)), `${game.id} rules are "Heading: text" lines`)
    // Words the spelling setting would change mid-sentence where it should not.
    assert.ok(!/\bthe sum\b|\bbrackets\b|\bworking day\b/.test(game.rules), `${game.id} rules avoid words the American spelling rewrites`)
    if (game.sheet.kind === 'sheet') {
      const lineIds = new Set(game.sheet.lines.map((l) => l.id))
      assert.equal(lineIds.size, game.sheet.lines.length, `${game.id} line ids`)
      for (const line of game.sheet.lines) for (const of of line.bonus?.of ?? []) assert.ok(lineIds.has(of), `${game.id} bonus of ${of}`)
    }
    if (game.sheet.kind === 'rounds' && game.sheet.labels) {
      assert.equal(game.sheet.labels.length, game.sheet.rounds, `${game.id} has a label for every round`)
    }
  }
})

test('search finds games by name, other names and misspellings', () => {
  assert.equal(findGames('scrab')[0].id, 'scrabble')
  assert.equal(findGames('yatzy')[0].id, 'yahtzee')
  assert.equal(findGames('10000')[0].id, 'farkle')
  assert.equal(findGames('oh heck')[0].id, 'ohhell')
  assert.equal(findGames('pokemon')[0].id, 'pokemon')
  assert.deepEqual(findGames('ticket to ride').map((g) => g.id).slice(0, 2), ['tickettoride', 'tickettorideeurope'])
  assert.deepEqual(findGames(''), [])
})

test('Hearts: low wins once someone reaches 100', () => {
  const sheet = sheetOf('hearts') as RoundsSheet
  const going = roundsResult(sheet, two, [{ scores: { a: 60, b: 20 } }])
  assert.equal(going.done, false)
  assert.deepEqual(going.leaders, ['b'])
  const over = roundsResult(sheet, two, [{ scores: { a: 60, b: 20 } }, { scores: { a: 45, b: 10 } }])
  assert.equal(over.done, true)
  assert.deepEqual(over.winners, ['b'])
})

test('a fixed number of rounds ends when every one is filled in', () => {
  const sheet = sheetOf('golfcards') as RoundsSheet
  const rows = Array.from({ length: 9 }, () => ({ scores: { a: 3, b: 4 } as Record<string, number | null> }))
  assert.equal(roundsResult(sheet, two, rows.slice(0, 8)).done, false)
  rows[8] = { scores: { a: 3, b: null } }
  assert.equal(roundsResult(sheet, two, rows).done, false)
  rows[8] = { scores: { a: 3, b: 0 } }
  const result = roundsResult(sheet, two, rows)
  assert.equal(result.done, true)
  assert.deepEqual(result.winners, ['a'])
})

test('darts counts down and a turn below zero is a bust', () => {
  const sheet = sheetOf('darts501') as RoundsSheet
  const result = roundsResult(sheet, two, [{ scores: { a: 180, b: 100 } }, { scores: { a: 180, b: 100 } }, { scores: { a: 180, b: null } }])
  assert.equal(result.totals.a, 141)
  assert.ok(result.bust.has('2:a'))
  const finished = roundsResult(sheet, two, [{ scores: { a: 180, b: 100 } }, { scores: { a: 180, b: 100 } }, { scores: { a: 141, b: null } }])
  assert.equal(finished.done, true)
  assert.deepEqual(finished.winners, ['a'])
})

test('cornhole counts only the difference', () => {
  const sheet = sheetOf('cornhole') as RoundsSheet
  const result = roundsResult(sheet, two, [{ scores: { a: 7, b: 4 } }, { scores: { a: 3, b: 3 } }, { scores: { a: 0, b: 6 } }])
  assert.deepEqual(result.totals, { a: 3, b: 6 })
})

test('SPOONS: spell it and you are out; the last one in wins', () => {
  const sheet = sheetOf('spoons') as RoundsSheet
  const rows = Array.from({ length: 6 }, () => ({ scores: { a: 1, b: 0, c: 0 } as Record<string, number | null> }))
  const result = roundsResult(sheet, three, rows)
  assert.equal(result.out.a, true)
  assert.equal(result.done, false)
  const more = [...rows, ...Array.from({ length: 6 }, () => ({ scores: { b: 1 } as Record<string, number | null> }))]
  const end = roundsResult(sheet, three, more)
  assert.equal(end.done, true)
  assert.deepEqual(end.winners, ['c'])
})

test('Phase 10: the first through phase ten wins, the lower score breaking a tie', () => {
  const sheet = sheetOf('phase10') as RoundsSheet
  const rows = Array.from({ length: 10 }, (_, i) => ({ scores: { a: 10, b: 5 }, made: { a: true, b: i < 9 } }))
  const result = roundsResult(sheet, two, rows)
  assert.equal(result.phase.a, 11)
  assert.equal(result.phase.b, 10)
  assert.equal(result.done, true)
  assert.deepEqual(result.winners, ['a'])
})

test('Yahtzee: the upper bonus, fixed boxes and extra Yahtzees', () => {
  const sheet = sheetOf('yahtzee') as CategorySheet
  const cells = {
    aces: { a: 3 }, twos: { a: 6 }, threes: { a: 9 }, fours: { a: 12 }, fives: { a: 15 }, sixes: { a: 18 },
    full: { a: 25 }, yahtzee: { a: 50 }, extra: { a: 2 }, chance: { a: 22 },
  }
  const result = sheetResult(sheet, two, cells)
  assert.equal(result.values.upperbonus.a, 35)
  assert.equal(result.totals.a, 63 + 35 + 25 + 50 + 200 + 22)
  const short = sheetResult(sheet, two, { ...cells, sixes: { a: 12 } })
  assert.equal(short.values.upperbonus.a, 0)
})

test('Catan ends at ten points; Qwixx rows score by a table', () => {
  const catan = sheetOf('catan') as CategorySheet
  const result = sheetResult(catan, two, { settlements: { a: 2, b: 3 }, cities: { a: 3, b: 1 }, road: { a: 2 } })
  assert.equal(result.totals.a, 10)
  assert.equal(result.done, true)
  assert.deepEqual(result.winners, ['a'])
  const qwixx = sheetOf('qwixx') as CategorySheet
  assert.equal(sheetResult(qwixx, two, { red: { a: 5 }, penalties: { a: 1 } }).totals.a, 15 - 5)
})

test('7 Wonders: coins by threes, science by its formula', () => {
  assert.equal(science([3, 2, 1]), 9 + 4 + 1 + 7)
  assert.equal(science([0, 0, 0]), 0)
  const wonders = sheetOf('sevenwonders') as CategorySheet
  const result = sheetResult(wonders, two, { coins: { a: 8 } }, { science: { a: [2, 2, 2] } })
  assert.equal(result.totals.a, 2 + 12 + 14)
})

test('Mölkky: exactly 50 wins, over drops to 25, three misses and out', () => {
  const sheet = sheetOf('molkky') as RoundsSheet
  const over = roundsResult(sheet, two, [{ scores: { a: 12, b: 0 } }, { scores: { a: 12, b: 0 } }, { scores: { a: 12, b: 0 } }, { scores: { a: 12, b: 5 } }, { scores: { a: 5, b: 3 } }])
  assert.equal(over.totals.a, 25)
  assert.equal(over.out.b, true)
  assert.equal(over.done, true)
  assert.deepEqual(over.winners, ['a'])
  const exact = roundsResult(sheet, two, [{ scores: { a: 12, b: 4 } }, { scores: { a: 12, b: 4 } }, { scores: { a: 12, b: 4 } }, { scores: { a: 12, b: 4 } }, { scores: { a: 2, b: 4 } }])
  assert.equal(exact.totals.a, 50)
  assert.deepEqual(exact.winners, ['a'])
})

test('poker: in front is whoever is most up, chips less buy-ins', () => {
  const sheet = sheetOf('poker') as CounterSheet
  const result = counterResult(sheet, two, { buyin: { a: 40, b: 20 }, chips: { a: 50, b: 45 } })
  assert.deepEqual(result.leaders, ['b'])
  assert.equal(result.done, false)
})

test('counters: life to zero loses, a goal wins, and win by two', () => {
  const magic = sheetOf('magic') as CounterSheet
  const out = counterResult(magic, two, { life: { a: 0, b: 7 } })
  assert.equal(out.out.a, true)
  assert.deepEqual(out.winners, ['b'])
  const tt = sheetOf('pingpong') as CounterSheet
  assert.deepEqual(counterResult(tt, two, { points: { a: 11, b: 10 } }).winners, [])
  assert.deepEqual(counterResult(tt, two, { points: { a: 12, b: 10 } }).winners, ['a'])
  const pokemon = sheetOf('pokemon') as CounterSheet
  assert.deepEqual(counterResult(pokemon, two, { prizes: { a: 0, b: 2 } }).winners, ['a'])
  assert.deepEqual(counterResult(pokemon, two, { prizes: { a: 3, b: 2 } }).leaders, ['b'])
  const pandemic = sheetOf('pandemic') as CounterSheet
  const table = [{ id: 't', name: 'Table' }]
  assert.equal(counterResult(pandemic, table, { outbreaks: { t: 8 } }).lost, true)
  assert.deepEqual(counterResult(pandemic, table, { cures: { t: 4 } }).winners, ['t'])
})

test('bids: each game scores a bid its own way', () => {
  assert.equal(bidScore('ohhell', 1, 3, 3), 13)
  assert.equal(bidScore('ohhell', 1, 3, 2), 0)
  assert.equal(bidScore('wizard', 1, 2, 2), 40)
  assert.equal(bidScore('wizard', 1, 2, 4), -20)
  assert.equal(bidScore('skullking', 5, 0, 0), 50)
  assert.equal(bidScore('skullking', 5, 0, 1), -50)
  assert.equal(bidScore('skullking', 5, 2, 2, 30), 70)
  assert.equal(bidScore('skullking', 5, 2, 3, 30), -10)
  assert.equal(bidScore('spades', 1, 4, 6), 42)
  assert.equal(bidScore('spades', 1, 4, 3), -40)
  assert.equal(bidScore('spades', 1, 4, null), null)
})

test('Spades: ten bags cost a hundred, nil adds or takes a hundred', () => {
  const sheet = sheetOf('spades')
  if (sheet.kind !== 'bids') throw new Error('spades is a bid sheet')
  const rows = [
    { bid: { a: 4, b: 5 }, took: { a: 9, b: 4 } },
    { bid: { a: 5, b: 3 }, took: { a: 10, b: 3 }, nil: { b: 'made' as const } },
  ]
  const result = bidResult(sheet, two, rows)
  assert.equal(result.bags.a, 10)
  assert.equal(result.totals.a, 45 + 55 - 100)
  assert.equal(result.totals.b, -50 + 30 + 100)
})

test('bowling: strikes, spares and the tenth frame', () => {
  assert.equal(bowling(Array(12).fill(10)).total, 300)
  assert.equal(bowling(Array(12).fill(10)).done, true)
  assert.equal(bowling(Array(21).fill(5)).total, 150)
  assert.equal(bowling(Array(20).fill(0)).total, 0)
  assert.equal(bowling(Array(20).fill(0)).done, true)
  // A strike waits for its next two balls before it has a total.
  const open = bowling([10, 3])
  assert.equal(open.frames[0].total, null)
  assert.equal(open.next, 7)
  const counted = bowling([10, 3, 4])
  assert.equal(counted.frames[0].total, 17)
  assert.equal(counted.frames[1].total, 24)
  assert.deepEqual(bowling([7, 3, 4]).frames[0].marks, ['7', '/'])
  // The tenth frame's marks and limits.
  const tenth = bowling([...Array(18).fill(0), 10, 7])
  assert.deepEqual(tenth.frames[9].marks, ['X', '7'])
  assert.equal(tenth.next, 3)
  assert.equal(bowling([...Array(18).fill(0), 3, 4]).done, true)
})

test('darts cricket: three marks close a number, then hits score while anyone has it open', () => {
  const hits = [
    { p: 'a', t: '20', n: 3 },
    { p: 'a', t: '20', n: 2 },
    { p: 'b', t: '20', n: 3 },
    { p: 'a', t: '20', n: 1 },
    { p: 'b', t: 'bull', n: 2 },
    { p: 'b', t: 'bull', n: 2 },
  ]
  const result = cricket(two, hits)
  assert.equal(result.points.a, 40)
  assert.equal(result.points.b, 25)
  assert.equal(result.marks.a['20'], 6)
})

test('badminton ends at 30 even when nobody is two clear', () => {
  const sheet = sheetOf('badminton') as CounterSheet
  assert.deepEqual(counterResult(sheet, two, { points: { a: 30, b: 29 } }).winners, ['a'])
  assert.deepEqual(counterResult(sheet, two, { points: { a: 22, b: 21 } }).winners, [])
})
