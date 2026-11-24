import test from 'node:test'
import assert from 'node:assert/strict'
import { PALETTES, contrast, readableInk } from '../src/lib/theme.ts'

const worst = (ink: string, surfaces: string[]) => Math.min(...surfaces.map((s) => contrast(ink, s)))

test('operator ink reaches the target where it can', () => {
  const surfaces = ['#2e241a', '#241c13', '#191309']
  assert.ok(worst(readableInk('#7a3020', surfaces), surfaces) >= 5.5)
})

test('where no colour can, the ink is never worse than the accent it started from', () => {
  const surfaces = ['#ffffff', '#000000']
  assert.ok(worst(readableInk('#e02020', surfaces), surfaces) >= worst('#e02020', surfaces))
})

test('the brass pair reads: type on its keys and the accent on its keys', () => {
  for (const id of ['brass', 'roast']) {
    const palette = PALETTES.find((item) => item.id === id)
    assert.ok(palette, `${id} ships`)
    const [ground, key, type, accent] = palette.swatch
    assert.ok(contrast(type, key) >= 7, `${id} type on key`)
    assert.ok(contrast(type, ground) >= 7, `${id} type on ground`)
    assert.ok(contrast(accent, key) >= 4.5, `${id} accent on key`)
    assert.ok(contrast(accent, ground) >= 4.5, `${id} accent on ground`)
  }
})

test('one light and one dark in the brass pair', () => {
  assert.equal(PALETTES.find((item) => item.id === 'brass')?.scheme, 'light')
  assert.equal(PALETTES.find((item) => item.id === 'roast')?.scheme, 'dark')
})
