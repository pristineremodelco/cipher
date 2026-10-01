import test from 'node:test'
import assert from 'node:assert/strict'
import { findUnits, fromKey, keyOf, parsePair } from '../src/lib/unitsearch.ts'

/** What a person types, and the unit they meant by it. */
const TYPED: [string, string][] = [
  ['grams', 'mass:g'],
  ['g', 'mass:g'],
  ['lbs', 'mass:lb'],
  ['pounds', 'mass:lb'],
  ['kilos', 'mass:kg'],
  ['feet', 'length:ft'],
  ['ft', 'length:ft'],
  ['inches', 'length:in'],
  ['meters', 'length:m'],
  ['metres', 'length:m'],
  ['liters', 'volume:l'],
  ['litres', 'volume:l'],
  ['gallons', 'volume:gal'],
  ['fluid ounce', 'volume:floz'],
  ['cc', 'volume:cm3'],
  ['sq ft', 'area:ft2'],
  ['cu yd', 'volume:yd3'],
  ['celsius', 'temperature:c'],
  ['celcius', 'temperature:c'],
  ['fahrenheit', 'temperature:f'],
  ['kph', 'speed:kmh'],
  ['mph', 'speed:mph'],
  ['volts', 'voltage:v'],
  ['amps', 'current:a'],
  ['ohms', 'resistance:ohm'],
  ['psi', 'pressure:psi'],
  ['hours', 'time:h'],
  ['rpm', 'frequency:rpm'],
  ['newtons', 'force:n'],
  // Case is what tells a millivolt from a megavolt, when it is given.
  ['mV', 'voltage:mv'],
  ['MV', 'voltage:megav'],
]

for (const [typed, meant] of TYPED) {
  test(`"${typed}" finds ${meant} first`, () => {
    const [first] = findUnits(typed)
    assert.ok(first, 'nothing found')
    assert.equal(keyOf(first), meant)
  })
}

test('a category name lists everything in it', () => {
  const found = findUnits('voltage').map(keyOf)
  for (const id of ['voltage:v', 'voltage:mv', 'voltage:uv', 'voltage:kv', 'voltage:megav']) assert.ok(found.includes(id), id)
})

test('searching within a category keeps to it', () => {
  const [first] = findUnits('m', fromKey('length:ft')!.category)
  assert.equal(keyOf(first), 'length:m')
  assert.ok(findUnits('mph', fromKey('length:ft')!.category).length === 0)
})

test('an empty search is not a search', () => {
  assert.deepEqual(findUnits('   '), [])
})

test('keys survive the units that share an id', () => {
  assert.equal(fromKey('speed:ms')!.unit.name, 'Metres per second')
  assert.equal(fromKey('time:ms')!.unit.name, 'Millisecond')
  assert.equal(fromKey('nowhere:x'), undefined)
})

const PAIRS: [string, string, string, number | undefined][] = [
  ['grams to lbs', 'mass:g', 'mass:lb', undefined],
  ['5 g to lb', 'mass:g', 'mass:lb', 5],
  ['5g to lb', 'mass:g', 'mass:lb', 5],
  ['1,250 ft to m', 'length:ft', 'length:m', 1250],
  ['c -> f', 'temperature:c', 'temperature:f', undefined],
  ['volts → millivolts', 'voltage:v', 'voltage:mv', undefined],
  // "in" read as the word only where it is the last one.
  ['ft in m', 'length:ft', 'length:m', undefined],
  ['in to cm', 'length:in', 'length:cm', undefined],
  ['12 in in cm', 'length:in', 'length:cm', 12],
  // Both sides have to agree: metres, not minutes or metres per second.
  ['m to ft', 'length:m', 'length:ft', undefined],
  ['mph to kph', 'speed:mph', 'speed:kmh', undefined],
]

for (const [typed, from, to, value] of PAIRS) {
  test(`"${typed}" reads as ${from} to ${to}`, () => {
    const pair = parsePair(typed)
    assert.ok(pair, 'not read as a pair')
    assert.equal(keyOf(pair.from), from)
    assert.equal(keyOf(pair.to), to)
    assert.equal(pair.value, value)
  })
}

test('two things that do not convert are not a pair', () => {
  assert.equal(parsePair('volts to grams'), null)
  assert.equal(parsePair('grams'), null)
  assert.equal(parsePair('to lb'), null)
})
