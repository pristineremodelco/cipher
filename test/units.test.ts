import test from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORIES, categoryOf, convert, unitOf } from '../src/lib/units.ts'

function to(category: string, from: string, into: string, value: number): number {
  const group = categoryOf(category)
  return convert(value, unitOf(group, from), unitOf(group, into))
}

function near(got: number, want: number, tolerance = 1e-9) {
  const relative = Math.abs(got - want) / Math.max(1, Math.abs(want))
  assert.ok(relative <= tolerance, `got ${got}, wanted ${want}`)
}

/**
 * Conversions with a known exact answer, which is what makes them worth
 * testing: a foot is twelve inches by definition, not by measurement.
 */
const KNOWN: [string, string, string, number, number][] = [
  ['length', 'ft', 'in', 1, 12],
  ['length', 'mi', 'ft', 1, 5280],
  ['length', 'in', 'cm', 1, 2.54],
  ['length', 'yd', 'ft', 1, 3],
  ['length', 'nmi', 'm', 1, 1852],
  ['area', 'ft2', 'in2', 1, 144],
  ['area', 'acre', 'ft2', 1, 43560],
  ['area', 'mi2', 'acre', 1, 640],
  ['area', 'yd2', 'ft2', 1, 9],
  ['volume', 'gal', 'qt', 1, 4],
  ['volume', 'gal', 'floz', 1, 128],
  ['volume', 'gal', 'l', 1, 3.785411784],
  ['volume', 'ukgal', 'l', 1, 4.54609],
  ['volume', 'yd3', 'ft3', 1, 27],
  ['volume', 'tbsp', 'tsp', 1, 3],
  ['volume', 'cup', 'floz', 1, 8],
  ['mass', 'lb', 'oz', 1, 16],
  ['mass', 'lb', 'kg', 1, 0.45359237],
  ['mass', 'st', 'lb', 1, 14],
  ['mass', 'ton', 'lb', 1, 2000],
  ['mass', 'longton', 'lb', 1, 2240],
  ['temperature', 'f', 'c', 32, 0],
  ['temperature', 'f', 'c', 212, 100],
  // The one temperature where the two scales meet.
  ['temperature', 'f', 'c', -40, -40],
  ['temperature', 'c', 'k', 0, 273.15],
  ['speed', 'mph', 'kmh', 60, 96.56064],
  ['speed', 'knot', 'kmh', 1, 1.852],
  ['time', 'day', 'h', 1, 24],
  ['time', 'week', 'day', 1, 7],
  ['data', 'b', 'bit', 1, 8],
  ['data', 'gib', 'mib', 1, 1024],
  ['data', 'gb', 'b', 1, 1e9],
  ['pressure', 'bar', 'kpa', 1, 100],
  ['energy', 'kwh', 'j', 1, 3.6e6],
  ['energy', 'kcal', 'cal', 1, 1000],
  ['power', 'kw', 'w', 1, 1000],
  ['angle', 'deg', 'rad', 180, Math.PI],
  ['angle', 'turn', 'deg', 1, 360],
  ['angle', 'deg', 'arcmin', 1, 60],
  // Fuel economy is the reciprocal one, so it cannot be a factor apart.
  ['fuel', 'mpg', 'l100km', 30, 7.840486111111112],
  ['fuel', 'l100km', 'mpg', 7.840486111111112, 30],
  ['fuel', 'kml', 'l100km', 10, 10],
]

for (const [category, from, into, value, want] of KNOWN) {
  test(`${value} ${from} is ${want} ${into}`, () => near(to(category, from, into, value), want))
}

test('an atmosphere is not quite 760 mmHg', () => {
  // A torr is one seven-hundred-and-sixtieth of an atmosphere exactly; the
  // defined millimetre of mercury is a hair off it. The defined one is held.
  near(to('pressure', 'atm', 'mmhg', 1), 759.9998917256112)
})

test('every unit round trips through every other one in its category', () => {
  let pairs = 0
  for (const category of CATEGORIES) {
    for (const a of category.units) {
      for (const b of category.units) {
        const there = convert(7.25, a, b)
        const back = convert(there, b, a)
        assert.ok(Number.isFinite(there), `${category.id}: ${a.id} to ${b.id} is not a number`)
        assert.ok(Math.abs(back - 7.25) < 1e-9, `${category.id}: ${a.id} to ${b.id} and back gave ${back}`)
        pairs += 1
      }
    }
  }
  assert.ok(pairs > 900, `only ${pairs} pairs checked`)
})

test('no category has two units that look the same', () => {
  for (const category of CATEGORIES) {
    const ids = new Set<string>()
    const symbols = new Set<string>()
    for (const unit of category.units) {
      assert.ok(!ids.has(unit.id), `${category.id} has two units called ${unit.id}`)
      assert.ok(!symbols.has(unit.symbol), `${category.id} shows ${unit.symbol} twice`)
      ids.add(unit.id)
      symbols.add(unit.symbol)
    }
  }
})
