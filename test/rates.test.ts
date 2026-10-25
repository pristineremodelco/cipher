import assert from 'node:assert/strict'
import { after, describe, test } from 'node:test'
import { RATES_CURRENT_MS, fetchRates, ratesAreCurrent, type Rates } from '../src/lib/rates.ts'

const KEY = 'calculator.rates.v1'

function memoryStorage() {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
    },
  })
  return store
}

function sample(fetchedAt: number): Rates {
  return { base: 'USD', rates: { USD: 1, EUR: 0.9 }, date: '2026-10-23', fetchedAt }
}

const body = JSON.stringify({ base: 'USD', date: '2026-10-23', rates: { EUR: 0.89 } })

function ok(): Response {
  return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } })
}

describe('exchange rates', { concurrency: false }, () => {
  const store = memoryStorage()
  const realFetch = globalThis.fetch

  after(() => {
    globalThis.fetch = realFetch
  })

  test('a set is current for twelve hours and then asked for again', () => {
    const now = Date.parse('2026-10-23T18:00:00Z')
    assert.equal(ratesAreCurrent(null, now), false)
    assert.equal(ratesAreCurrent(sample(0), now), false)
    assert.equal(ratesAreCurrent(sample(now + 1000), now), false)
    assert.equal(ratesAreCurrent(sample(now - 60_000), now), true)
    assert.equal(ratesAreCurrent(sample(now - (RATES_CURRENT_MS - 1)), now), true)
    assert.equal(ratesAreCurrent(sample(now - RATES_CURRENT_MS), now), false)
    // The screen test keeps a set from thirty hours ago and expects a new ask.
    assert.equal(ratesAreCurrent(sample(now - 30 * 60 * 60 * 1000), now), false)
  })

  test('one request serves every caller, and a current set is not fetched again', async () => {
    store.clear()
    const modes: (string | undefined)[] = []
    let release: (response: Response) => void = () => {}
    const pending = new Promise<Response>((resolve) => {
      release = resolve
    })
    let calls = 0
    globalThis.fetch = ((_url: string, init?: RequestInit) => {
      calls += 1
      modes.push(init?.cache)
      return pending
    }) as typeof fetch

    const stop = new AbortController()
    const left = fetchRates(stop.signal)
    const stayed = fetchRates()
    assert.equal(calls, 1)
    stop.abort()
    await assert.rejects(left, (error: unknown) => error instanceof Error && error.name === 'AbortError')
    release(ok())
    const rates = await stayed
    assert.equal(rates.rates.EUR, 0.89)
    assert.equal(calls, 1)
    assert.equal(modes[0], 'default')
    assert.ok(store.get(KEY)?.includes('"EUR":0.89'))

    const again = await fetchRates()
    assert.equal(calls, 1)
    assert.equal(again.rates.EUR, 0.89)

    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      calls += 1
      modes.push(init?.cache)
      return ok()
    }) as typeof fetch
    await fetchRates(undefined, true)
    assert.equal(calls, 2)
    assert.equal(modes.at(-1), 'reload')
  })
})
