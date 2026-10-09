import test from 'node:test'
import assert from 'node:assert/strict'
import { hexToHsv, hsvToHex, pointOnWheel, wheelPoint } from '../src/lib/colour.ts'

test('a colour survives the trip to the wheel and back', () => {
  for (const hex of ['#b4502f', '#f5a8f0', '#000000', '#ffffff', '#808080', '#2f6feb', '#00ff00', '#123456', '#fedcba']) {
    assert.equal(hsvToHex(hexToHsv(hex)), hex)
  }
  // Every 4th step of every channel, for good measure.
  for (let r = 0; r < 256; r += 51) {
    for (let g = 0; g < 256; g += 17) {
      for (let b = 0; b < 256; b += 85) {
        const hex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
        assert.equal(hsvToHex(hexToHsv(hex)), hex)
      }
    }
  }
})

test('the primaries sit where the drawn wheel puts them', () => {
  assert.equal(hsvToHex({ h: 0, s: 1, v: 1 }), '#ff0000')
  assert.equal(hsvToHex({ h: 60, s: 1, v: 1 }), '#ffff00')
  assert.equal(hsvToHex({ h: 120, s: 1, v: 1 }), '#00ff00')
  assert.equal(hsvToHex({ h: 240, s: 1, v: 1 }), '#0000ff')
  assert.equal(hsvToHex({ h: 360, s: 1, v: 1 }), '#ff0000')
  assert.equal(hsvToHex({ h: 200, s: 0, v: 1 }), '#ffffff')
  assert.equal(hsvToHex({ h: 200, s: 1, v: 0 }), '#000000')
})

test('the wheel runs clockwise from the top, and the centre is white', () => {
  assert.deepEqual(pointOnWheel(0, -100, 100), { h: 0, s: 1 })
  assert.deepEqual(pointOnWheel(100, 0, 100), { h: 90, s: 1 })
  assert.deepEqual(pointOnWheel(0, 50, 100), { h: 180, s: 0.5 })
  assert.deepEqual(pointOnWheel(-100, 0, 100), { h: 270, s: 1 })
  assert.equal(pointOnWheel(0, -300, 100).s, 1)
  // And the thumb lands back on the point that was touched.
  for (const [h, s] of [[0, 1], [90, 0.5], [225, 0.8], [300, 0.25]]) {
    const { x, y } = wheelPoint(h, s)
    const back = pointOnWheel((x - 0.5) * 200, (y - 0.5) * 200, 100)
    assert.ok(Math.abs(back.h - h) < 1e-9 && Math.abs(back.s - s) < 1e-9)
  }
})
