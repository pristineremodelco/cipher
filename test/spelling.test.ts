import test from 'node:test'
import assert from 'node:assert/strict'
import { spell } from '../src/lib/spelling.ts'

test('American spelling turns the British words and leaves the rest', () => {
  assert.equal(spell('Millimetre of mercury', 'us'), 'Millimeter of mercury')
  assert.equal(spell('Kilometres per litre', 'us'), 'Kilometers per liter')
  assert.equal(spell('Your own colours', 'us'), 'Your own colors')
  assert.equal(spell('Grey-green stone', 'us'), 'Gray-green stone')
  assert.equal(spell('Maths', 'us'), 'Math')
  assert.equal(spell('Tonne', 'us'), 'Metric ton')
  // Words that only look close are left alone.
  assert.equal(spell('Ton (US short)', 'us'), 'Ton (US short)')
  assert.equal(spell('Parameter', 'us'), 'Parameter')
})

test('British spelling is the source and is left as it is', () => {
  assert.equal(spell('Millimetre of mercury', 'uk'), 'Millimetre of mercury')
  assert.equal(spell('Maths', 'uk'), 'Maths')
})

test('American English also chooses its own words, not only its own spellings', () => {
  assert.equal(spell('Brackets', 'us'), 'Parentheses')
  assert.equal(spell('Tap the sum to edit inside it', 'us'), 'Tap the equation to edit inside it')
  assert.equal(spell('published once a working day', 'us'), 'published once a business day')
  assert.equal(spell("Compounded monthly, paid in at each month's end.", 'us'), 'Compounded monthly, deposited at the end of each month.')
  assert.equal(spell('The vehicle does', 'us'), 'Your vehicle gets')
  // And British keeps its own.
  assert.equal(spell('Brackets', 'uk'), 'Brackets')
  assert.equal(spell('Tap the sum to edit inside it', 'uk'), 'Tap the sum to edit inside it')
})
