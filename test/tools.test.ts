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
  assert.equal(spanOf(new Date(2026, 0, 31), new Date(2026, 2, 1)).months, 1)
})

test('a base reads only the digits that base can hold', () => {
  assert.equal(parseBase('ff', 16), 255)
  assert.equal(parseBase('1011', 2), 11)
  assert.equal(parseBase('777', 8), 511)
  assert.equal(parseBase('0xFF', 16), 255)
  assert.equal(parseBase('00ff', 16), 255)
  // parseInt would silently read this as 1. Refusing is the honest answer.
  assert.equal(parseBase('19', 8), null)
  assert.equal(parseBase('1f', 10), null)
  assert.equal(parseBase('', 16), null)
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
