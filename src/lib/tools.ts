/**
 * The sums behind the tools. No React, no formatting, no rounding.
 *
 * Every one of these is a formula somebody will check against their own
 * arithmetic, so they are kept apart from anything that draws and each one
 * returns the whole answer rather than the headline: a loan payment without
 * the total interest beside it is the half of the answer nobody needed.
 */

export type ToolId =
  | 'discount'
  | 'salestax'
  | 'tip'
  | 'unitprice'
  | 'percent'
  | 'loan'
  | 'savings'
  | 'currency'
  | 'date'
  | 'worldtime'
  | 'hex'
  | 'grade'
  | 'fuelcost'
  | 'fuelefficiency'
  | 'body'
  | 'ovulation'

export type ToolGroup = 'money' | 'everyday' | 'vehicle' | 'health'

export type Tool = {
  id: ToolId
  name: string
  hint: string
  group: ToolGroup
  /**
   * Whether this one is worth nothing without a signal. Exactly one tool is,
   * and it says so on its own card rather than failing quietly when it is
   * opened somewhere with no bars.
   */
  needsNetwork?: boolean
}

export const TOOLS: Tool[] = [
  { id: 'discount', name: 'Discount', hint: 'What it comes down to', group: 'money' },
  { id: 'salestax', name: 'Sales Tax', hint: 'Add it or take it back off', group: 'money' },
  { id: 'tip', name: 'Tip', hint: 'And what each person owes', group: 'money' },
  { id: 'unitprice', name: 'Unit Price', hint: 'Which one is actually cheaper', group: 'money' },
  { id: 'loan', name: 'Loan', hint: 'Payment, interest, total', group: 'money' },
  { id: 'savings', name: 'Savings', hint: 'What it grows to', group: 'money' },
  { id: 'currency', name: 'Currencies', hint: 'Live rates', group: 'money', needsNetwork: true },

  { id: 'percent', name: 'Percent', hint: 'All three of the questions', group: 'everyday' },
  { id: 'date', name: 'Date', hint: 'Between two, or days from one', group: 'everyday' },
  { id: 'worldtime', name: 'World Time', hint: 'What time it is elsewhere', group: 'everyday' },
  { id: 'hex', name: 'Hex', hint: 'Base 2, 8, 10 and 16', group: 'everyday' },
  { id: 'grade', name: 'Grade Average', hint: 'Weighted, by credit', group: 'everyday' },

  { id: 'fuelcost', name: 'Fuel Cost', hint: 'What the trip burns', group: 'vehicle' },
  { id: 'fuelefficiency', name: 'Fuel Efficiency', hint: 'From a tank and a trip', group: 'vehicle' },

  { id: 'body', name: 'Body Metrics', hint: 'BMI and daily energy', group: 'health' },
  { id: 'ovulation', name: 'Ovulation', hint: 'Fertile window and due date', group: 'health' },
]

export const GROUPS: { id: ToolGroup; name: string }[] = [
  { id: 'money', name: 'Money' },
  { id: 'everyday', name: 'Everyday' },
  { id: 'vehicle', name: 'Vehicle' },
  { id: 'health', name: 'Health' },
]

export function toolOf(id: string): Tool | undefined {
  return TOOLS.find((tool) => tool.id === id)
}

// ---------------------------------------------------------------- money ----

export function discount(price: number, percent: number) {
  const off = (price * percent) / 100
  return { pay: price - off, saved: off }
}

/**
 * Tax added on, and the same sum run backwards.
 *
 * The backwards one is the half people get wrong: taking 8% off a total that
 * already includes 8% does not give the price before tax, because the eight
 * was a percentage of a smaller number.
 */
export function salesTax(amount: number, rate: number, inclusive: boolean) {
  if (inclusive) {
    const before = amount / (1 + rate / 100)
    return { before, tax: amount - before, total: amount }
  }
  const tax = (amount * rate) / 100
  return { before: amount, tax, total: amount + tax }
}

export function tip(bill: number, percent: number, people: number) {
  const heads = Math.max(1, Math.floor(people) || 1)
  const amount = (bill * percent) / 100
  const total = bill + amount
  return { tip: amount, total, each: total / heads, tipEach: amount / heads }
}

export function unitPrice(price: number, quantity: number) {
  if (!quantity) return NaN
  return price / quantity
}

/** The three questions a percent key cannot answer on its own. */
export function percentOf(percent: number, of: number) {
  return (of * percent) / 100
}
export function percentIs(part: number, whole: number) {
  return whole === 0 ? NaN : (part / whole) * 100
}
export function percentChange(from: number, to: number) {
  return from === 0 ? NaN : ((to - from) / Math.abs(from)) * 100
}

/**
 * A level payment loan. The monthly rate is the annual one over twelve, which
 * is how every lender quotes it, and a zero rate is the one case the formula
 * cannot take because it divides by nothing.
 */
export function loan(principal: number, annualRate: number, years: number) {
  const months = Math.round(years * 12)
  if (!(principal > 0) || !(months > 0)) return { payment: NaN, interest: NaN, total: NaN, months }
  const monthly = annualRate / 100 / 12
  const payment =
    monthly === 0 ? principal / months : (principal * monthly) / (1 - Math.pow(1 + monthly, -months))
  const total = payment * months
  return { payment, interest: total - principal, total, months }
}

/**
 * What is put in, plus what is added each month, plus what the interest does
 * to both. Compounded monthly, which is what a savings account does.
 */
export function savings(start: number, monthly: number, annualRate: number, years: number) {
  const months = Math.round(years * 12)
  const rate = annualRate / 100 / 12
  if (!(months > 0)) return { total: start, paidIn: start, interest: 0, months: 0 }
  const growth = Math.pow(1 + rate, months)
  const total =
    rate === 0 ? start + monthly * months : start * growth + monthly * ((growth - 1) / rate)
  const paidIn = start + monthly * months
  return { total, paidIn, interest: total - paidIn, months }
}

// ------------------------------------------------------------- everyday ----

export const MS_DAY = 86400000

/** Whole days between two calendar dates, ignoring the clock entirely. */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b - a) / MS_DAY)
}

export function addDays(date: Date, days: number): Date {
  const out = new Date(date)
  out.setDate(out.getDate() + days)
  return out
}

/**
 * The same span said the way people say it. Months are counted by the calendar
 * rather than divided out of days, because "three months" is three months
 * whether or not February is in the middle of them.
 */
export function spanOf(from: Date, to: Date) {
  const days = daysBetween(from, to)
  const back = days < 0
  const [early, late] = back ? [to, from] : [from, to]
  let years = late.getFullYear() - early.getFullYear()
  let months = late.getMonth() - early.getMonth()
  let rest = late.getDate() - early.getDate()
  if (rest < 0) {
    months -= 1
    // The length of the month being borrowed from, not a flat thirty.
    rest += new Date(late.getFullYear(), late.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  return { days, weeks: Math.trunc(Math.abs(days) / 7) * (back ? -1 : 1), years, months, rest, back }
}

const BASES = [2, 8, 10, 16] as const
export type Base = (typeof BASES)[number]
export const BASE_NAMES: Record<Base, string> = {
  2: 'Binary',
  8: 'Octal',
  10: 'Decimal',
  16: 'Hexadecimal',
}
export { BASES }

/** Null rather than NaN: a half-typed number is not an error, it is unfinished. */
export function parseBase(text: string, base: Base): number | null {
  const clean = text.trim().replace(/^0[bxo]/i, '')
  if (!clean) return null
  const valid = /^[0-9a-fA-F]+$/.test(clean)
  if (!valid) return null
  const value = parseInt(clean, base)
  if (!Number.isFinite(value)) return null
  // parseInt stops at the first digit the base cannot hold rather than
  // refusing, so "19" in octal quietly becomes 1.
  if (value.toString(base).toLowerCase() !== clean.toLowerCase().replace(/^0+(?=.)/, '')) return null
  return value
}

export type Grade = { id: string; score: string; weight: string }

/**
 * A weighted mean, with anything unfilled left out rather than counted as a
 * zero: a blank row is a row not typed yet, not a nought.
 */
export function gradeAverage(rows: Grade[]) {
  let weighted = 0
  let weight = 0
  let counted = 0
  for (const row of rows) {
    const score = Number(row.score)
    const w = row.weight === '' ? 1 : Number(row.weight)
    if (!Number.isFinite(score) || row.score === '' || !Number.isFinite(w) || w <= 0) continue
    weighted += score * w
    weight += w
    counted += 1
  }
  return { average: weight === 0 ? NaN : weighted / weight, credits: weight, counted }
}

// -------------------------------------------------------------- vehicle ----

/** Miles and gallons, or kilometres and litres. Never a mix of the two. */
export type FuelUnits = 'us' | 'metric'

export function fuelCost(distance: number, efficiency: number, price: number, units: FuelUnits) {
  if (!(efficiency > 0)) return { fuel: NaN, cost: NaN }
  // mpg is distance per unit of fuel; L/100km is fuel per unit of distance.
  const fuel = units === 'us' ? distance / efficiency : (distance / 100) * efficiency
  return { fuel, cost: fuel * price }
}

export function fuelEfficiency(distance: number, fuel: number, units: FuelUnits) {
  if (!(distance > 0) || !(fuel > 0)) return { mpg: NaN, kml: NaN, l100km: NaN }
  // Everything is worked out from one pair and then said four ways, so the
  // four can never disagree with each other.
  const miles = units === 'us' ? distance : distance / 1.609344
  const gallons = units === 'us' ? fuel : fuel / 3.785411784
  const km = units === 'us' ? distance * 1.609344 : distance
  const litres = units === 'us' ? fuel * 3.785411784 : fuel
  return { mpg: miles / gallons, kml: km / litres, l100km: (litres / km) * 100 }
}

// --------------------------------------------------------------- health ----

export type BodyUnits = 'us' | 'metric'
export type Sex = 'male' | 'female'

export function bmi(weight: number, height: number, units: BodyUnits) {
  const kg = units === 'us' ? weight * 0.45359237 : weight
  const metres = units === 'us' ? height * 0.0254 : height / 100
  if (!(metres > 0) || !(kg > 0)) return NaN
  return kg / (metres * metres)
}

export function bmiBand(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value < 18.5) return 'Under'
  if (value < 25) return 'Healthy'
  if (value < 30) return 'Over'
  return 'Obese'
}

/**
 * Mifflin St Jeor, which is the one most dietitians reach for. The answer is
 * energy at rest; the activity multiplier turns it into a day.
 */
export function bmr(weight: number, height: number, age: number, sex: Sex, units: BodyUnits) {
  const kg = units === 'us' ? weight * 0.45359237 : weight
  const cm = units === 'us' ? height * 2.54 : height
  if (!(kg > 0) || !(cm > 0) || !(age > 0)) return NaN
  return 10 * kg + 6.25 * cm - 5 * age + (sex === 'male' ? 5 : -161)
}

export const ACTIVITY: { id: string; name: string; factor: number }[] = [
  { id: 'sedentary', name: 'Sitting most of the day', factor: 1.2 },
  { id: 'light', name: 'Light, a day or three a week', factor: 1.375 },
  { id: 'moderate', name: 'Moderate, most days', factor: 1.55 },
  { id: 'heavy', name: 'Hard, most days', factor: 1.725 },
  { id: 'athlete', name: 'Physical job or twice a day', factor: 1.9 },
]

/**
 * The usual arithmetic, and no more than that: ovulation is taken to be
 * fourteen days before the next period, the fertile window the five days
 * before it and the day after, and the due date Naegele's two hundred and
 * eighty. All of it is an average of other people's cycles, which is why the
 * screen says so rather than presenting a date as a fact.
 */
export function ovulation(lastPeriod: Date, cycle: number) {
  const length = Math.max(20, Math.min(45, Math.round(cycle) || 28))
  const next = addDays(lastPeriod, length)
  const ovulates = addDays(next, -14)
  return {
    next,
    ovulates,
    fertileFrom: addDays(ovulates, -5),
    fertileTo: addDays(ovulates, 1),
    due: addDays(lastPeriod, 280),
    length,
  }
}
