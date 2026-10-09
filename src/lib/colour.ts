/**
 * Hue, saturation and brightness, for the colour wheel.
 *
 * The wheel is hue round the rim and saturation out from the centre, with
 * brightness on a slider beside it, which is the one arrangement where every
 * point of the wheel as drawn is exactly the colour it gives: a CSS conic
 * gradient of the six primaries and secondaries, washed to white at the
 * centre and shaded towards black, is the same sums in the same order.
 */
export type Hsv = { h: number; s: number; v: number }

/** From `#rrggbb`. Anything else comes back as black. */
export function hexToHsv(hex: string): Hsv {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return { h: 0, s: 0, v: 0 }
  const n = parseInt(match[1], 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const range = max - min
  let h = 0
  if (range > 0) {
    if (max === r) h = ((g - b) / range) % 6
    else if (max === g) h = (b - r) / range + 2
    else h = (r - g) / range + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : range / max, v: max }
}

/** To `#rrggbb`, lower case, the way the rest of the app writes colours. */
export function hsvToHex({ h, s, v }: Hsv): string {
  const hue = (((h % 360) + 360) % 360) / 60
  const sat = Math.max(0, Math.min(1, s))
  const val = Math.max(0, Math.min(1, v))
  const chroma = val * sat
  const x = chroma * (1 - Math.abs((hue % 2) - 1))
  const [r, g, b] =
    hue < 1 ? [chroma, x, 0]
    : hue < 2 ? [x, chroma, 0]
    : hue < 3 ? [0, chroma, x]
    : hue < 4 ? [0, x, chroma]
    : hue < 5 ? [x, 0, chroma]
    : [chroma, 0, x]
  const m = val - chroma
  const byte = (c: number) => Math.round((c + m) * 255).toString(16).padStart(2, '0')
  return `#${byte(r)}${byte(g)}${byte(b)}`
}

/**
 * Where on the wheel a point is, as hue and saturation. The rim starts at the
 * top and runs clockwise, which is where a CSS conic gradient starts and runs;
 * outside the rim is the rim.
 */
export function pointOnWheel(dx: number, dy: number, radius: number): { h: number; s: number } {
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI
  return { h: (angle + 360) % 360, s: Math.min(1, Math.hypot(dx, dy) / radius) }
}

/** The other way: where a hue and saturation sit, as a fraction of the wheel's width from its top left. */
export function wheelPoint(h: number, s: number): { x: number; y: number } {
  const angle = (h * Math.PI) / 180
  return { x: 0.5 + (s * Math.sin(angle)) / 2, y: 0.5 - (s * Math.cos(angle)) / 2 }
}
