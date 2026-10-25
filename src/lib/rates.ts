/**
 * Exchange rates, and what to do when there are none.
 *
 * The one thing in this app that needs a signal. Everything else works down a
 * basement; this cannot, because a rate is a live number and inventing one
 * would be worse than saying so.
 *
 * The rates come from the European Central Bank through Frankfurter, which is
 * free, needs no key and answers cross-origin, so the browser asks directly
 * and there is no server in the middle holding anybody's traffic. The ECB
 * publishes once a working day, so a set fetched this morning is the same set
 * anybody else has: caching it is not a compromise, it is the shape of the
 * data. What is cached keeps working offline and says how old it is.
 */

export type Rates = {
  /** Everything is quoted against this one. */
  base: string
  /** How many of each currency one base unit buys. */
  rates: Record<string, number>
  /** The day the rates are for, as the source gives it. */
  date: string
  /** Epoch ms this device fetched them. */
  fetchedAt: number
}

const KEY = 'calculator.rates.v1'
const SOURCE = 'https://api.frankfurter.app/latest?from=USD'

/**
 * Names for the codes the source returns, so a picker reads "Canadian dollar"
 * rather than "CAD". Anything it sends that is not listed still works and
 * simply shows its code.
 */
export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US dollar',
  EUR: 'Euro',
  GBP: 'British pound',
  CAD: 'Canadian dollar',
  MXN: 'Mexican peso',
  AUD: 'Australian dollar',
  NZD: 'New Zealand dollar',
  JPY: 'Japanese yen',
  CNY: 'Chinese yuan',
  INR: 'Indian rupee',
  CHF: 'Swiss franc',
  SEK: 'Swedish krona',
  NOK: 'Norwegian krone',
  DKK: 'Danish krone',
  PLN: 'Polish zloty',
  CZK: 'Czech koruna',
  HUF: 'Hungarian forint',
  RON: 'Romanian leu',
  BGN: 'Bulgarian lev',
  TRY: 'Turkish lira',
  ILS: 'Israeli shekel',
  ZAR: 'South African rand',
  BRL: 'Brazilian real',
  KRW: 'South Korean won',
  SGD: 'Singapore dollar',
  HKD: 'Hong Kong dollar',
  THB: 'Thai baht',
  MYR: 'Malaysian ringgit',
  IDR: 'Indonesian rupiah',
  PHP: 'Philippine peso',
  ISK: 'Icelandic krona',
}

export function currencyName(code: string): string {
  return CURRENCY_NAMES[code] ?? code
}

export function loadRates(): Rates | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Rates>
    if (!parsed || typeof parsed.base !== 'string' || !parsed.rates) return null
    const rates: Record<string, number> = {}
    for (const [code, value] of Object.entries(parsed.rates)) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) rates[code] = value
    }
    if (!Object.keys(rates).length) return null
    return {
      base: parsed.base,
      rates,
      date: typeof parsed.date === 'string' ? parsed.date : '',
      fetchedAt: Number.isFinite(parsed.fetchedAt) ? (parsed.fetchedAt as number) : 0,
    }
  } catch {
    return null
  }
}

function saveRates(rates: Rates) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rates))
  } catch {
    /* quota or private mode: this session still has them in memory */
  }
}

/**
 * How long a fetched set stands in for a new request.
 *
 * The source publishes once a working day and tells the browser the response
 * is good for a day (`Cache-Control: max-age=86400`). Twelve hours is inside
 * that, and short enough that an afternoon publication is not missed until
 * the next morning. Older than this, we ask again.
 */
export const RATES_CURRENT_MS = 12 * 60 * 60 * 1000

/** Whether a saved set is still the one a fresh request would return. */
export function ratesAreCurrent(rates: Rates | null, now = Date.now()): rates is Rates {
  if (!rates?.fetchedAt) return false
  const age = now - rates.fetchedAt
  return age >= 0 && age < RATES_CURRENT_MS
}

// One request in flight, shared by every caller. A screen that goes away
// drops its own interest and leaves the request running, so the next opening
// finds the answer instead of starting the same request over.
let flight: { force: boolean; promise: Promise<Rates> } | null = null
// Bumped when a newer request starts, so a slower older one cannot overwrite
// what the newer one saved.
let ticket = 0

function abortError(): Error {
  const error = new Error('The rate service did not answer.')
  error.name = 'AbortError'
  return error
}

/** The caller's signal rejects them alone. It does not cancel the shared request. */
function relay<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise
  if (signal.aborted) return Promise.reject(abortError())
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort)
      reject(abortError())
    }
    signal.addEventListener('abort', onAbort)
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        if (signal.aborted) reject(abortError())
        else resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort)
        if (signal.aborted) reject(abortError())
        else reject(error)
      },
    )
  })
}

async function request(force: boolean, mine: number): Promise<Rates> {
  const controller = new AbortController()
  // A phone with one bar can leave a request hanging indefinitely, and a
  // spinner that never stops is the worst of the three possible states.
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(SOURCE, {
      signal: controller.signal,
      // A forced refresh has to pass the browser's copy. An ordinary ask uses
      // it: the server marks the body good for a day, and `no-store` was
      // throwing that away on every opening.
      cache: force ? 'reload' : 'default',
    })
    if (!response.ok) throw new Error(`The rate service answered ${response.status}`)
    const body = (await response.json()) as { base?: string; date?: string; rates?: Record<string, number> }
    if (!body.rates || typeof body.rates !== 'object') throw new Error('The rate service sent nothing usable')
    const base = body.base ?? 'USD'
    const rates: Record<string, number> = { [base]: 1 }
    for (const [code, value] of Object.entries(body.rates)) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) rates[code] = value
    }
    const settled: Rates = { base, rates, date: body.date ?? '', fetchedAt: Date.now() }
    if (mine === ticket) saveRates(settled)
    return settled
  } finally {
    clearTimeout(timer)
  }
}

function begin(force: boolean): Promise<Rates> {
  const mine = ++ticket
  const promise = request(force, mine).finally(() => {
    if (flight?.promise === promise) flight = null
  })
  flight = { force, promise }
  return promise
}

/**
 * Asks for a fresh set. Throws rather than returning something empty, so the
 * screen can tell the difference between "no signal" and "nothing to show".
 *
 * A set fetched within the last twelve hours is returned as it stands, unless
 * `force` is set, which is the refresh button.
 */
export async function fetchRates(signal?: AbortSignal, force = false): Promise<Rates> {
  if (!force) {
    const cached = loadRates()
    if (ratesAreCurrent(cached)) return cached
  }
  // A refresh has to start its own request. Anything else can share the one
  // already on its way, including a refresh that is already on its way.
  if (flight && (flight.force || !force)) return relay(flight.promise, signal)
  return relay(begin(force), signal)
}

/** Through the base, the same way every other conversion in the app goes. */
export function convertMoney(amount: number, from: string, to: string, rates: Rates): number {
  const a = rates.rates[from]
  const b = rates.rates[to]
  if (!a || !b) return NaN
  return (amount / a) * b
}

/** How old a cached set is, said the way a person would say it. */
export function ageOf(rates: Rates, now = Date.now()): string {
  if (!rates.fetchedAt) return 'at some point'
  const minutes = Math.round((now - rates.fetchedAt) / 60000)
  if (minutes < 2) return 'just now'
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}
