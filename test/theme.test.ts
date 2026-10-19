import test from 'node:test'
import assert from 'node:assert/strict'
import { contrast, readableInk } from '../src/lib/theme.ts'

const worst = (ink: string, surfaces: string[]) => Math.min(...surfaces.map((s) => contrast(ink, s)))

test('operator ink reaches the target where it can', () => {
  const surfaces = ['#2e241a', '#241c13', '#191309']
  assert.ok(worst(readableInk('#7a3020', surfaces), surfaces) >= 5.5)
})

test('where no colour can, the ink is never worse than the accent it started from', () => {
  const surfaces = ['#ffffff', '#000000']
  assert.ok(worst(readableInk('#e02020', surfaces), surfaces) >= worst('#e02020', surfaces))
})
