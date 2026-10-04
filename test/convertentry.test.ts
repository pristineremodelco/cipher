import test from 'node:test'
import assert from 'node:assert/strict'
import { asEntry, placed, pressEntry, typed, type Entry } from '../src/lib/convertentry.ts'

const keys = (start: Entry, ...pressed: string[]) => pressed.reduce(pressEntry, start).text
const typing = (start: string, ...pressed: string[]) => pressed.reduce(typed, start)

test('a point after a lone sign is a nought and a point', () => {
  assert.equal(typing('', 'sign', '.'), '-0.')
  assert.equal(typing('', '.'), '0.')
  assert.equal(typing('', 'sign', '.', '5'), '-0.5')
})

test('a double nought does nothing before a number has started', () => {
  assert.equal(typing('', '00'), '')
  assert.equal(typing('', 'sign', '00'), '-')
  assert.equal(typing('0', '00'), '0')
  assert.equal(typing('', 'sign', '0', '00'), '-0')
  assert.equal(typing('', '5', '00'), '500')
  assert.equal(typing('', '0', '.', '00'), '0.00')
})

test('the opening number is typed over, not onto', () => {
  assert.equal(keys(placed('1'), '5'), '5')
  assert.equal(keys(placed('1'), '5', '0'), '50')
  assert.equal(keys(placed('1'), '.', '5'), '0.5')
  assert.equal(keys(placed('1'), '00'), '')
  // Taken up from a reading, the same.
  assert.equal(keys(placed('0.45359237'), '2'), '2')
  assert.equal(keys(placed('-17.7777777778'), '4'), '4')
})

test('editing keys work on the placed number rather than replacing it', () => {
  assert.equal(keys(placed('12.5'), 'back'), '12.')
  assert.equal(keys(placed('12.5'), 'back', '7'), '12.7')
  assert.equal(keys(placed('12.5'), 'clear'), '')
})

test('a sign pressed first carries over to what is typed next', () => {
  assert.equal(keys(placed('1'), 'sign'), '-1')
  assert.equal(keys(placed('1'), 'sign', '4', '0'), '-40')
  assert.equal(keys(placed('1'), 'sign', 'sign', '4'), '4')
  // A negative reading taken up is typed over whole, sign and all.
  assert.equal(keys(placed('-3'), '4'), '4')
  assert.equal(keys(placed('-3'), 'sign', 'sign', '4'), '-4')
})

test('a reading taken up never carries an exponent', () => {
  assert.equal(asEntry(1e-12), '0.000000000001')
  assert.equal(asEntry(1e21), '1000000000000000000000')
  assert.equal(asEntry(0.1 + 0.2), '0.3')
})
