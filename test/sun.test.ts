import test from 'node:test'
import assert from 'node:assert/strict'
import { isDark, nextChange, roughly } from '../src/lib/sun.ts'

const NEW_YORK = { lat: 40.71, lon: -74.01 }
const LONDON = { lat: 51.51, lon: -0.13 }
const TROMSO = { lat: 69.65, lon: 18.96 }

/** Within three minutes of the published time. */
function near(got: Date | null, want: string) {
  assert.ok(got, `expected a change near ${want}`)
  const off = Math.abs(got.getTime() - new Date(want).getTime()) / 60000
  assert.ok(off < 3, `${got.toISOString()} is ${off.toFixed(1)} minutes from ${want}`)
}

test('sunrise and sunset in New York on the longest day', () => {
  // 5:25 am and 8:31 pm, daylight time.
  assert.equal(isDark(new Date('2026-06-21T08:00:00Z'), NEW_YORK), true)
  near(nextChange(new Date('2026-06-21T08:00:00Z'), NEW_YORK), '2026-06-21T09:25:00Z')
  assert.equal(isDark(new Date('2026-06-21T16:00:00Z'), NEW_YORK), false)
  near(nextChange(new Date('2026-06-21T16:00:00Z'), NEW_YORK), '2026-06-22T00:31:00Z')
})

test('sunrise and sunset in London on the shortest day', () => {
  // 8:04 am and 3:53 pm.
  near(nextChange(new Date('2026-12-21T03:00:00Z'), LONDON), '2026-12-21T08:04:00Z')
  near(nextChange(new Date('2026-12-21T12:00:00Z'), LONDON), '2026-12-21T15:53:00Z')
})

test('the polar night and the midnight sun have no change to wait for', () => {
  assert.equal(isDark(new Date('2026-12-21T11:00:00Z'), TROMSO), true)
  assert.equal(nextChange(new Date('2026-12-21T11:00:00Z'), TROMSO), null)
  assert.equal(isDark(new Date('2026-06-21T23:00:00Z'), TROMSO), false)
  assert.equal(nextChange(new Date('2026-06-21T23:00:00Z'), TROMSO), null)
})

test('a place is kept to about a kilometre', () => {
  assert.deepEqual(roughly(40.712776, -74.005974), { lat: 40.71, lon: -74.01 })
})
