import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_SAVED,
  MAX_TAPE,
  addEntry,
  capEntries,
  cleanNote,
  clearUnsaved,
  dayLabel,
  emptyTape,
  groupByDay,
  removeEntry,
  searchEntries,
  setNote,
  startOfDay,
  timeLabel,
  toggleSaved,
  type TapeEntry,
} from '../src/lib/calctape.ts'

const HOUR = 3600 * 1000
const entry = (id: string, at = 0, extra: Partial<TapeEntry> = {}): TapeEntry => ({ id, expression: '1+1', value: 2, at, ...extra })

test('the unsaved allowance pushes off the oldest unsaved one only', () => {
  let tape = emptyTape()
  tape = addEntry(tape, entry('kept', 0, { saved: true }))
  for (let i = 0; i < MAX_TAPE + 5; i++) tape = addEntry(tape, entry(`n${i}`, i))
  assert.equal(tape.entries.length, MAX_TAPE + 1)
  assert.ok(tape.entries.some((e) => e.id === 'kept'), 'the saved one is still there')
  assert.equal(tape.entries[0].id, `n${MAX_TAPE + 4}`, 'newest first')
  assert.ok(!tape.entries.some((e) => e.id === 'n0'), 'the oldest unsaved one went')
})

test('saved ones have their own cap', () => {
  const many = Array.from({ length: MAX_SAVED + 3 }, (_, i) => entry(`s${i}`, i, { saved: true }))
  assert.equal(capEntries(many).length, MAX_SAVED)
})

test('saving, unsaving, deleting and clearing', () => {
  let tape = { entries: [entry('a'), entry('b'), entry('c')], memory: 5 }
  tape = toggleSaved(tape, 'b')
  assert.equal(tape.entries.find((e) => e.id === 'b')?.saved, true)
  tape = clearUnsaved(tape)
  assert.deepEqual(tape.entries.map((e) => e.id), ['b'])
  assert.equal(tape.memory, 5, 'memory is left alone')
  tape = toggleSaved(tape, 'b')
  assert.equal('saved' in tape.entries[0], false)
  tape = removeEntry(tape, 'b')
  assert.equal(tape.entries.length, 0)
})

test('a note is one trimmed line, and an empty one is no note', () => {
  let tape = { entries: [entry('a')], memory: 0 }
  tape = setNote(tape, 'a', '  Deck   boards\n south side ')
  assert.equal(tape.entries[0].note, 'Deck boards south side')
  tape = setNote(tape, 'a', '   ')
  assert.equal('note' in tape.entries[0], false)
  assert.equal(cleanNote('x'.repeat(200)).length, 60)
})

test('search finds working, answer and note', () => {
  const entries = [
    entry('a', 0, { expression: '12×100', value: 1200 }),
    entry('b', 0, { expression: '7−2', value: 5, note: 'Trim' }),
    entry('c', 0, { expression: '3÷4', value: 0.75 }),
  ]
  const shown = (value: number) => value.toLocaleString('en-US')
  const ids = (query: string) => searchEntries(entries, query, shown).map((e) => e.id)
  assert.deepEqual(ids(''), ['a', 'b', 'c'])
  assert.deepEqual(ids('1,200'), ['a'])
  assert.deepEqual(ids('1200'), ['a'])
  assert.deepEqual(ids('12*100'), ['a'], 'a typed star finds a drawn times')
  assert.deepEqual(ids('7-2'), ['b'], 'a typed hyphen finds a drawn minus')
  assert.deepEqual(ids('trim'), ['b'])
  assert.deepEqual(ids('3 / 4'), ['c'])
  assert.deepEqual(ids('nothing'), [])
})

test('entries split by day, newest first', () => {
  const noon = new Date(2026, 10, 18, 12).getTime()
  const days = groupByDay([entry('a', noon), entry('b', noon - HOUR), entry('c', noon - 24 * HOUR), entry('d', noon - 30 * HOUR)])
  assert.deepEqual(
    days.map((d) => d.entries.map((e) => e.id)),
    [['a', 'b'], ['c', 'd']],
  )
  assert.equal(days[0].day, startOfDay(noon))
})

test('day and time labels', () => {
  const now = new Date(2026, 10, 18, 15, 42).getTime()
  assert.equal(dayLabel(startOfDay(now), now, 'en-US'), 'Today')
  assert.equal(dayLabel(startOfDay(now - 24 * HOUR), now, 'en-US'), 'Yesterday')
  assert.equal(dayLabel(startOfDay(new Date(2026, 10, 3).getTime()), now, 'en-US'), 'Tue, Nov 3')
  assert.match(dayLabel(startOfDay(new Date(2025, 0, 6).getTime()), now, 'en-US'), /2025/)
  assert.match(timeLabel(now, '12', 'en-US'), /^3:42\sPM$/)
  assert.equal(timeLabel(now, '24', 'en-GB'), '15:42')
})
