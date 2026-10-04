import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addDays, bmi, bmiBand, bmr, daysBetween, discount, fuelCost, fuelEfficiency,
  gradeAverage, loan, ovulation, parseBase, percentChange, percentIs, percentOf,
  salesTax, savings, spanOf, tip, unitPrice,
} from '../src/lib/tools.ts'

function near(got: number, want: number, tolerance = 1e-6) {
  assert.ok(Math.abs(got - want) <= tolerance, `got ${got}, wanted ${want}`)
}

test('a discount takes the percentage off and says what was saved', () => {
  near(discount(100, 20).pay, 80)
  near(discount(59.99, 15).saved, 8.9985)
})

test('sales tax adds on', () => {
  near(salesTax(100, 8.25, false).total, 108.25)
  near(salesTax(100, 8.25, false).tax, 8.25)
})

test('and comes back off correctly, which is the half people get wrong', () => {
  near(salesTax(108.25, 8.25, true).before, 100)
  near(salesTax(108.25, 8.25, true).tax, 8.25)
  // Taking the rate off the total is a different, wrong sum. Prove it is not
  // what happens here.
  const naive = 108.25 - 108.25 * 0.0825
  assert.ok(Math.abs(salesTax(108.25, 8.25, true).before - naive) > 0.5)
})

test('a tip splits between people', () => {
  near(tip(84.5, 20, 1).tip, 16.9)
  near(tip(84.5, 20, 1).total, 101.4)
  near(tip(84.5, 20, 4).each, 25.35)
  // Nought people is one person, not a division by zero.
  near(tip(100, 10, 0).each, 110)
})

test('unit price', () => {
  near(unitPrice(4.5, 12), 0.375)
  assert.ok(Number.isNaN(unitPrice(4.5, 0)))
})

test('all three percent questions', () => {
  near(percentOf(15, 80), 12)
  near(percentIs(12, 80), 15)
  near(percentChange(80, 100), 25)
  near(percentChange(100, 80), -20)
  assert.ok(Number.isNaN(percentChange(0, 5)))
})

test('a loan amortises the way a lender quotes it', () => {
  // 200,000 at 6.5% over 30 years is a figure that can be checked anywhere.
  const result = loan(200000, 6.5, 30)
  near(result.payment, 1264.136, 0.01)
  assert.equal(result.months, 360)
  near(result.interest, 255088.98, 1)
})

test('a loan at no interest is the amount divided by the payments', () => {
  near(loan(12000, 0, 1).payment, 1000)
  assert.ok(Number.isNaN(loan(0, 5, 10).payment))
})

test('savings compound monthly on top of what is paid in', () => {
  const result = savings(1000, 100, 5, 10)
  near(result.total, 17175.2, 0.05)
  near(result.paidIn, 13000)
  near(savings(1000, 100, 0, 10).total, 13000)
})

test('days between two dates ignore the clock', () => {
  assert.equal(daysBetween(new Date(2026, 0, 1), new Date(2026, 11, 31)), 364)
  assert.equal(daysBetween(new Date(2028, 1, 1), new Date(2028, 2, 1)), 29)
  assert.equal(daysBetween(new Date(2026, 11, 31), new Date(2026, 0, 1)), -364)
  assert.equal(addDays(new Date(2026, 0, 30), 3).getDate(), 2)
})

test('a span borrows from the real length of the month, not a flat thirty', () => {
  const span = spanOf(new Date(2020, 2, 15), new Date(2026, 8, 2))
  assert.equal(span.years, 6)
  assert.equal(span.months, 5)
  assert.equal(span.rest, 18)
})

test('a span never comes out with negative days', () => {
  const calendar = (a: Date, b: Date) => {
    const span = spanOf(a, b)
    return [span.years, span.months, span.rest]
  }
  assert.deepEqual(calendar(new Date(2025, 0, 31), new Date(2025, 2, 1)), [0, 1, 1])
  assert.deepEqual(calendar(new Date(2025, 0, 30), new Date(2025, 2, 1)), [0, 1, 1])
  assert.deepEqual(calendar(new Date(2024, 0, 31), new Date(2024, 2, 1)), [0, 1, 1])
  assert.deepEqual(calendar(new Date(2024, 1, 29), new Date(2025, 1, 28)), [1, 0, 0])
  assert.deepEqual(calendar(new Date(2026, 4, 10), new Date(2026, 4, 10)), [0, 0, 0])
  // Backwards reads the same span, flagged.
  const back = spanOf(new Date(2025, 2, 1), new Date(2025, 0, 31))
  assert.deepEqual([back.years, back.months, back.rest, back.back], [0, 1, 1, true])
  // Every pair across two years: rest is never negative and never a month or more.
  for (let a = 0; a < 730; a += 3) {
    for (let b = a; b < a + 400; b += 7) {
      const from = new Date(2024, 0, 1 + a)
      const to = new Date(2024, 0, 1 + b)
      const span = spanOf(from, to)
      assert.ok(span.rest >= 0 && span.rest < 31, `${from.toDateString()} → ${to.toDateString()}`)
      assert.ok(span.months >= 0 && span.months < 12)
    }
  }
})

test('a date far enough out is not a date', () => {
  assert.ok(Number.isNaN(addDays(new Date(2026, 0, 1), 1e12).getTime()))
})

test('a base reads only the digits that base can hold', () => {
  const read = (text: string, base: 2 | 8 | 10 | 16) => {
    const reading = parseBase(text, base)
    return reading === null ? null : 'value' in reading ? reading.value : reading.problem
  }
  assert.equal(read('ff', 16), 255n)
  assert.equal(read('1011', 2), 11n)
  assert.equal(read('777', 8), 511n)
  assert.equal(read('0xFF', 16), 255n)
  assert.equal(read('00ff', 16), 255n)
  assert.equal(read('1111 0000', 2), 240n)
  // parseInt would silently read this as 1. Refusing is the honest answer.
  assert.equal(read('19', 8), 'digit')
  assert.equal(read('1f', 10), 'digit')
  assert.equal(read('', 16), null)
  // Only the prefix that belongs to the base is taken off.
  assert.equal(read('0b12', 16), 0xb12n)
  assert.equal(read('0b101', 2), 5n)
  assert.equal(read('0x10', 10), 'digit')
  assert.equal(read('0x', 16), null)
  // Exact past what a float can hold, and refused past 64 bits for the right reason.
  assert.equal(read('FFFFFFFFFFFFFFFF', 16), 2n ** 64n - 1n)
  assert.equal(read('10000000000000000', 16), 'size')
  assert.equal(read('9007199254740993', 10), 9007199254740993n)
})

test('a blank grade row is not a zero', () => {
  const result = gradeAverage([
    { id: '1', score: '90', weight: '3' },
    { id: '2', score: '80', weight: '1' },
    { id: '3', score: '', weight: '4' },
  ])
  near(result.average, 87.5)
  assert.equal(result.credits, 4)
  assert.equal(result.counted, 2)
})

test('fuel cost, in either system', () => {
  near(fuelCost(300, 25, 3.5, 'us').fuel, 12)
  near(fuelCost(300, 25, 3.5, 'us').cost, 42)
  near(fuelCost(500, 8, 1.85, 'metric').fuel, 40)
})

test('fuel efficiency says the same trip four ways without disagreeing', () => {
  const result = fuelEfficiency(300, 12, 'us')
  near(result.mpg, 25)
  near(result.l100km, 9.4084, 0.001)
  // The two are reciprocal through a known constant, which cross-checks both.
  near(result.mpg * result.l100km, 235.2146, 0.001)
  near(fuelEfficiency(500, 40, 'metric').l100km, 8)
})

test('body metrics', () => {
  near(bmi(70, 175, 'metric'), 22.857, 0.001)
  near(bmi(180, 71, 'us'), 25.1, 0.05)
  assert.equal(bmiBand(bmi(70, 175, 'metric')), 'Healthy')
  assert.equal(bmiBand(26), 'Over')
  near(bmr(70, 175, 30, 'male', 'metric'), 1648.75, 0.01)
  near(bmr(60, 165, 30, 'female', 'metric'), 1320.25, 0.01)
})

test('an ovulation window is the usual arithmetic', () => {
  const cycle = ovulation(new Date(2026, 0, 1), 28)
  assert.equal(cycle.next.toDateString(), new Date(2026, 0, 29).toDateString())
  assert.equal(cycle.ovulates.toDateString(), new Date(2026, 0, 15).toDateString())
  assert.equal(cycle.fertileFrom.toDateString(), new Date(2026, 0, 10).toDateString())
  assert.equal(cycle.fertileTo.toDateString(), new Date(2026, 0, 16).toDateString())
  assert.equal(cycle.due.toDateString(), new Date(2026, 9, 8).toDateString())
  // A length nobody has is clamped rather than taken at face value.
  assert.equal(ovulation(new Date(2026, 0, 1), 3).length, 20)
})
