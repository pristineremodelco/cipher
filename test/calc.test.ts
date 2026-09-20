import test from 'node:test'
import assert from 'node:assert/strict'
import { calculate, formatMeasure, formatNumber, plainNumber } from '../src/lib/calc.ts'

/** Every expression the parser is expected to get right, and why it is here. */
const SUMS: [string, number][] = [
  ['1+2', 3],
  ['2+3*4', 14],
  ['(2+3)*4', 20],
  ['10/4', 2.5],
  ['2^10', 1024],
  // The exponent reaches back through a sign, and powers are right associative.
  ['2^-3', 0.125],
  ['2^3^2', 512],
  // A leading minus binds looser than the power, which is the convention.
  ['-2^2', -4],
  // Binary floating point cannot hold a tenth; the answer still reads as 0.3.
  ['0.1+0.2', 0.3],
  // Percent reading its neighbour, in all four contexts.
  ['200+10%', 220],
  ['200-10%', 180],
  ['200*10%', 20],
  ['200/10%', 2000],
  ['50%', 0.5],
  ['50%+1', 1.5],
  ['100+50%-10%', 135],
  // Two values side by side multiply.
  ['2π', 6.283185307179586],
  ['3(4+1)', 15],
  ['2sin(30)', 1],
  ['1e', Math.E],
  // A function with no brackets takes the value beside it and no more.
  ['√9', 3],
  ['√9+1', 4],
  ['√9*2', 6],
  ['∛27', 3],
  ['sin(30)', 0.5],
  ['cos(60)', 0.5],
  ['tan(45)', 1],
  ['asin(0.5)', 30],
  ['sinh(1)', Math.sinh(1)],
  ['log(1000)', 3],
  ['ln(e)', 1],
  ['log₂(8)', 3],
  ['abs(-4)', 4],
  ['φ', 1.618033988749895],
  ['e^2', Math.E ** 2],
  ['5!', 120],
  ['0!', 1],
  ['10 mod 3', 1],
  ['3²', 9],
  ['2^0.5', Math.SQRT2],
  // A half typed expression still answers, so the preview line has something.
  ['(2+3', 5],
  // Grouping separators pasted in from somewhere else are ignored.
  ['1,234+1', 1235],
  ['5+ + 3', 8],
  ['5 - -3', 8],
]

for (const [expression, want] of SUMS) {
  test(`works out ${expression}`, () => {
    const result = calculate(expression, 'deg')
    assert.ok(result.ok, `refused with: ${result.ok ? '' : result.error}`)
    assert.ok(Math.abs(result.value - want) < 1e-9, `got ${result.value}, wanted ${want}`)
  })
}

/** Things that must be refused rather than answered with a wrong number. */
const REFUSED = ['1÷0', '1+', 'sin(', '', 'sin⁻¹(5)', '(-1)^0.5']

for (const expression of REFUSED) {
  test(`refuses ${expression || 'an empty expression'}`, () => {
    assert.equal(calculate(expression, 'deg').ok, false)
  })
}

test('radians and degrees are different answers to the same keys', () => {
  const degrees = calculate('sin(30)', 'deg')
  const radians = calculate('sin(30)', 'rad')
  assert.ok(degrees.ok && radians.ok)
  assert.ok(Math.abs(degrees.value - 0.5) < 1e-12)
  assert.ok(Math.abs(radians.value - Math.sin(30)) < 1e-12)
})

test('a factorial past what a double can hold is refused, not rounded', () => {
  assert.equal(calculate('171!', 'deg').ok, false)
  assert.equal(calculate('170!', 'deg').ok, true)
})

test('formats an answer', () => {
  assert.equal(formatNumber(1234567.891, { decimals: -1, grouping: true }), '1,234,567.891')
  assert.equal(formatNumber(1234567.891, { decimals: 2, grouping: true }), '1,234,567.89')
  assert.equal(formatNumber(0.3, { decimals: -1, grouping: false }), '0.3')
  assert.equal(formatNumber(1 / 3, { decimals: 4, grouping: false }), '0.3333')
  assert.equal(formatNumber(1000, { decimals: 0, grouping: true }), '1,000')
})

test('writes the very large and the very small as powers', () => {
  assert.equal(formatNumber(1e20, { decimals: -1, grouping: true }), '1×10²⁰')
  assert.equal(formatNumber(1e-12, { decimals: -1, grouping: true }), '1×10⁻¹²')
})

test('a negative that rounds onto zero reads as zero', () => {
  assert.equal(formatNumber(-0.0004, { decimals: 2, grouping: false }), '0')
  assert.equal(formatNumber(-0.0004, { decimals: 2, grouping: false, padDecimals: true }), '0.00')
})

/**
 * A fixed number of places says how far to round, not how much to write out.
 * Padding the rest with zeros is a separate wish, so it is a separate switch.
 */
test('places are a limit, and padding them out is opt in', () => {
  assert.equal(formatNumber(100, { decimals: 2, grouping: false }), '100')
  assert.equal(formatNumber(100, { decimals: 2, grouping: false, padDecimals: true }), '100.00')
  assert.equal(formatNumber(1.5, { decimals: 2, grouping: false }), '1.5')
  assert.equal(formatNumber(1.5, { decimals: 2, grouping: false, padDecimals: true }), '1.50')
  // Rounding is unaffected either way.
  assert.equal(formatNumber(1 / 3, { decimals: 2, grouping: false }), '0.33')
  assert.equal(formatNumber(1 / 3, { decimals: 2, grouping: false, padDecimals: true }), '0.33')
  // Nothing to pad at all places, and nothing to pad when places are automatic.
  assert.equal(formatNumber(100, { decimals: 0, grouping: false, padDecimals: true }), '100')
  assert.equal(formatNumber(100, { decimals: -1, grouping: false, padDecimals: true }), '100')
})

test('a measurement is significant figures, not decimal places', () => {
  assert.equal(formatMeasure(1344, true), '1,344')
  assert.equal(formatMeasure(37.333333333333336, true), '37.333333')
  assert.equal(formatMeasure(0.021212121212121213, true), '0.021212121')
  assert.equal(formatMeasure(34137600000, true), '34,137,600,000')
  assert.equal(formatMeasure(2.54, true), '2.54')
})

test('the clipboard gets the number and not the presentation', () => {
  assert.equal(plainNumber(1234567.891), '1234567.891')
})

/**
 * An expression that merely ran out is what every expression looks like
 * halfway through being typed, so it is told apart from one that is wrong.
 * The preview line leans on this to stay quiet until equals is pressed.
 */
const UNFINISHED = ['1+', '2*', '3-', '5^', '1+2*', 'sin(', '(1+2)*(', '7÷', 'sqrt']

for (const expression of UNFINISHED) {
  test(`${expression} is unfinished rather than wrong`, () => {
    const result = calculate(expression, 'deg')
    assert.equal(result.ok, false)
    assert.equal(result.ok === false && result.unfinished, true)
  })
}

/** These cannot be put right by typing more, so they are said straight away. */
const WRONG = ['1÷0', 'sin⁻¹(5)', '(-1)^0.5', '171!', '2.5!', '1+2)3', 'wibble(2)']

for (const expression of WRONG) {
  test(`${expression} is wrong rather than unfinished`, () => {
    const result = calculate(expression, 'deg')
    assert.equal(result.ok, false)
    assert.equal(result.ok === false && result.unfinished, undefined)
  })
}

test('an empty expression is neither wrong nor unfinished, it is nothing', () => {
  const result = calculate('', 'deg')
  assert.equal(result.ok, false)
  assert.equal(result.ok === false && result.error, '')
  assert.equal(result.ok === false && result.unfinished, undefined)
})
