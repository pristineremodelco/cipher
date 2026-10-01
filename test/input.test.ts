import test from 'node:test'
import assert from 'node:assert/strict'
import { backspace, chunksOf, displayRuns, expressionOf, press } from '../src/lib/calcinput.ts'
import { calculate } from '../src/lib/calc.ts'

/** Runs a sequence of presses, where `<` is the rub-out. */
function keyed(keys: string[]): string {
  let chunks: string[] = []
  for (const key of keys) chunks = key === '<' ? backspace(chunks) : press(chunks, key)
  return expressionOf(chunks)
}

const CASES: [string[], string][] = [
  [['1', '2', '+', '3'], '12+3'],
  // A leading plus is nothing; a leading minus is a negative.
  [['+', '5'], '5'],
  [['−', '5'], '−5'],
  // One operator swapped for another is a correction, not a second operator.
  [['1', '+', '×'], '1×'],
  // Except a minus after a times, which is a sign.
  [['1', '×', '−', '5'], '1×−5'],
  [['.', '5'], '0.5'],
  [['1', '.', '.', '5'], '1.5'],
  [['1', '.', '5', '.', '2'], '1.52'],
  [['00'], '0'],
  [['1', '00'], '100'],
  // One bracket key that works out which bracket is meant.
  [['()'], '('],
  [['2', '()'], '2×('],
  [['2', '+', '()'], '2+('],
  [['(', '2', '()'], '(2)'],
  [['5', '%'], '5%'],
  [['+', '%'], ''],
  [['2', 'sin('], '2×sin('],
  [['sin(', '3', '0', ')'], 'sin(30)'],
  [['2', 'π'], '2×π'],
  // A function rubs out whole rather than a letter at a time.
  [['sin(', '<'], ''],
  [['1', '2', '<'], '1'],
  [['5', '!'], '5!'],
  // The powers are postfix and never take an implied multiplication.
  [['5', '²'], '5²'],
  [['5', '³'], '5³'],
  [['5', '⁻¹'], '5⁻¹'],
  [['²'], ''],
  // mod is written with its spaces, or a tokenizer reads one word.
  [['5', 'mod', '3'], '5 mod 3'],
  [['mod'], ''],
  [['5', 'mod', 'mod'], '5 mod '],
]

for (const [keys, want] of CASES) {
  test(`keying ${JSON.stringify(keys)} gives ${JSON.stringify(want)}`, () => {
    assert.equal(keyed(keys), want)
  })
}

test('a squared key really squares', () => {
  const result = calculate(keyed(['5', '²']), 'deg')
  assert.ok(result.ok && result.value === 25)
})

test('a reciprocal key really reciprocates', () => {
  const result = calculate(keyed(['5', '⁻¹']), 'deg')
  assert.ok(result.ok && result.value === 0.2)
})

/**
 * Nothing the keypad can produce may crash the parser.
 *
 * The keys are the ones a person can actually reach, and the sequences are
 * random because the interesting failures are the orders nobody thinks to try.
 */
test('no sequence of presses can break the parser', () => {
  const keys = ['0', '1', '5', '.', '00', '+', '−', '×', '÷', '^', '()', '%', '!', '²', '³', '⁻¹', 'mod', 'sin(', '√(', 'π', 'φ', 'e', 'log(']
  let checked = 0
  for (let run = 0; run < 4000; run += 1) {
    const sequence: string[] = []
    for (let i = 0; i < 8; i += 1) sequence.push(keys[Math.floor(Math.random() * keys.length)])
    const expression = keyed(sequence)
    assert.doesNotThrow(() => calculate(expression, 'deg'), `sequence ${JSON.stringify(sequence)} -> ${expression}`)
    checked += 1
  }
  assert.equal(checked, 4000)
})

/**
 * What the display draws and what comes back out of the history. The two have
 * to agree with what was typed, or a recalled sum is a different sum.
 */
test('an expression comes back out of the history in the pieces it was typed as', () => {
  for (const typed of [
    ['1', '2', '5', '0', '×', '1', '.', '0', '8'],
    ['s' + 'in(', '3', '0', ')', '+', '√(', '1', '6', ')'],
    ['7', ' mod ', '3'],
    ['5', '⁻¹', '+', '2', '²'],
    ['(', '1', '+', '2', ')', '×', '3', '%'],
    ['log₂(', '1', '0', '2', '4', ')'],
    ['sin⁻¹(', '0', '.', '5', ')'],
  ]) {
    const written = expressionOf(typed)
    assert.deepEqual(chunksOf(written), typed, written)
    // And a single rub-out takes off one piece, not the lot.
    assert.equal(expressionOf(backspace(chunksOf(written))), expressionOf(typed.slice(0, -1)))
  }
})

test('a carried answer with a sign or an exponent stays whole', () => {
  assert.deepEqual(chunksOf('-12.5+3'), ['-12.5', '+', '3'])
  assert.deepEqual(chunksOf('1.5e-7×2'), ['1.5e-7', '×', '2'])
})

test('the display groups thousands in numbers and nowhere else', () => {
  const text = (e: string, g: boolean) => displayRuns(e, g).map((r) => r.text).join('')
  assert.equal(text('1250000×1.08', true), '1,250,000×1.08')
  assert.equal(text('1250000×1.08', false), '1250000×1.08')
  assert.equal(text('1234.5678', true), '1,234.5678')
  assert.equal(text('-1234567', true), '-1,234,567')
  assert.equal(text('1.5e-7', true), '1.5e-7')
  assert.equal(text('7 mod 3', true), '7mod3')
  assert.deepEqual(displayRuns('sin⁻¹(0.5)', true).map((r) => r.kind), ['function', 'digit', 'paren'])
})
