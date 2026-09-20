import type { CustomPalette, FontId, KeyShape, KeyStyle, Settings, TextSize } from '../types'

/**
 * A palette is the whole surface: ground, keys, type and the one accent that
 * picks out the operators and equals. Each declares whether it is a light or a
 * dark one, which is what lets the device's own setting choose between a pair.
 *
 * The values themselves live in the stylesheet, keyed on `data-palette`. Only
 * what the settings screen needs to name and preview one is here.
 */
export type Palette = {
  id: string
  name: string
  hint: string
  scheme: 'light' | 'dark'
  /**
   * Ground, key face, type and accent, for the settings swatch. Type is in
   * there because the light palettes differ mostly in their ground, and a
   * strip of three pale bands tells nobody anything: a numeral drawn in the
   * type colour on the key colour is the thing being chosen between.
   */
  swatch: [string, string, string, string]
}

export const PALETTES: Palette[] = [
  { id: 'paper', name: 'Paper', hint: 'Warm stock, espresso ink', scheme: 'light', swatch: ['#EDE4D0', '#FBF6EA', '#241C13', '#8C3B26'] },
  { id: 'snow', name: 'Snow', hint: 'Plain white, graphite type', scheme: 'light', swatch: ['#EEF0F3', '#FFFFFF', '#16181C', '#2F6FEB'] },
  { id: 'linen', name: 'Linen', hint: 'Grey-green stone', scheme: 'light', swatch: ['#D2DAD6', '#E9EFEC', '#172220', '#356B60'] },
  { id: 'espresso', name: 'Espresso', hint: "The mark's own ground", scheme: 'dark', swatch: ['#191309', '#2E241A', '#EFE6D0', '#B4502F'] },
  { id: 'graphite', name: 'Graphite', hint: 'Neutral dark', scheme: 'dark', swatch: ['#131416', '#24272B', '#EDEFF2', '#7AA2F7'] },
  { id: 'carbon', name: 'Carbon', hint: 'True black, for OLED', scheme: 'dark', swatch: ['#000000', '#161616', '#F4F4F4', '#FF8A3D'] },
  { id: 'midnight', name: 'Midnight', hint: 'Blue black', scheme: 'dark', swatch: ['#0B1020', '#1A2440', '#E7ECFA', '#5AC8FA'] },
  { id: 'moss', name: 'Moss', hint: 'Deep green', scheme: 'dark', swatch: ['#0E1512', '#1E2B24', '#E6F0E9', '#7FBF6A'] },
  { id: 'plum', name: 'Plum', hint: 'Late harvest', scheme: 'dark', swatch: ['#16101F', '#29203D', '#F0E9F8', '#C77DFF'] },
]

export const PALETTE_IDS = PALETTES.map((palette) => palette.id)

export function paletteOf(id: string): Palette {
  return PALETTES.find((palette) => palette.id === id) ?? PALETTES[0]
}

export function palettesBy(scheme: 'light' | 'dark'): Palette[] {
  return PALETTES.filter((palette) => palette.scheme === scheme)
}

/**
 * Which palette is actually worn. With the device followed, its own light or
 * dark setting picks between the pair; otherwise the day one stands whatever
 * the device says.
 */
export function activePalette(settings: Settings, prefersDark: boolean): string {
  if (settings.followDevice && prefersDark) return settings.nightPalette
  return settings.palette
}

/** Every palette on offer, the nine that ship and any that were made here. */
export function allPalettes(settings: Settings): Palette[] {
  return [...PALETTES, ...settings.customPalettes.map(asPalette)]
}

export function findPalette(settings: Settings, id: string): Palette | undefined {
  return allPalettes(settings).find((palette) => palette.id === id)
}

export const MAX_CUSTOM_PALETTES = 12

/** How light a colour is, 0 to 1, weighted the way an eye weighs it. */
export function luminance(hex: string): number {
  const value = (parseHex(hex) ?? '#808080').replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function channels(hex: string): [number, number, number] {
  const value = (parseHex(hex) ?? '#808080').replace('#', '')
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as [number, number, number]
}

function hex(rgb: [number, number, number]): string {
  return `#${rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')}`
}

/** `amount` of `a` over `b`, straight down the middle of each channel. */
function mix(a: string, b: string, amount: number): string {
  const [ar, ag, ab] = channels(a)
  const [br, bg, bb] = channels(b)
  const t = Math.max(0, Math.min(1, amount))
  return hex([ar * t + br * (1 - t), ag * t + bg * (1 - t), ab * t + bb * (1 - t)])
}

/**
 * The other six colours, worked out from the three that were chosen.
 *
 * Type is the important one: it is picked for contrast against the key face
 * rather than asked for, because a palette whose numbers cannot be read is not
 * a palette anyone meant to make. The rest hang off it.
 */
export function derivePalette(custom: CustomPalette): Record<string, string> {
  const light = luminance(custom.key) > 0.45
  const text = light ? mix('#000000', custom.key, 0.9) : mix('#ffffff', custom.key, 0.92)
  return {
    '--bg': custom.ground,
    '--panel': mix(custom.key, custom.ground, 0.55),
    '--key': custom.key,
    '--text': text,
    '--muted': mix(text, custom.key, 0.58),
    '--line': mix(text, custom.key, 0.16),
    '--accent': custom.accent,
    '--on-accent': contrastText(custom.accent) === '#111' ? '#111111' : '#ffffff',
    '--danger': light ? '#b3261e' : '#ff6b6b',
  }
}

/** Enough of a Palette for the settings list to name and preview one. */
export function asPalette(custom: CustomPalette): Palette {
  const derived = derivePalette(custom)
  return {
    id: custom.id,
    name: custom.name,
    hint: 'Yours',
    scheme: luminance(custom.ground) > 0.45 ? 'light' : 'dark',
    swatch: [custom.ground, custom.key, derived['--text'], custom.accent],
  }
}

/**
 * Every stack is one the system already has. A calculator that waits on a
 * webfont before it can draw a 7 has got its priorities wrong, and this one is
 * meant to work with the network off.
 */
/**
 * Every one but System is a file this app carries, so the choice lands the
 * same on every device. Asking for whatever the device happened to own meant
 * Android answered Roboto six times out of seven; see fonts.css.
 */
export const FONTS: { id: FontId; name: string; hint: string; stack: string }[] = [
  { id: 'system', name: 'System', hint: 'Whatever this device uses', stack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { id: 'grotesk', name: 'Grotesk', hint: 'Neutral and tight', stack: '"Cipher Inter", ui-sans-serif, system-ui, sans-serif' },
  { id: 'humanist', name: 'Humanist', hint: 'Warm and readable', stack: '"Cipher Source Sans", ui-sans-serif, system-ui, sans-serif' },
  { id: 'rounded', name: 'Rounded', hint: 'Soft and friendly', stack: '"Cipher Nunito", ui-rounded, system-ui, sans-serif' },
  { id: 'serif', name: 'Serif', hint: 'Editorial', stack: '"Cipher Lora", ui-serif, Georgia, serif' },
  { id: 'mono', name: 'Mono', hint: 'Columns line up', stack: '"Cipher JetBrains Mono", ui-monospace, SFMono-Regular, monospace' },
  { id: 'legible', name: 'Hyperlegible', hint: 'Maximum clarity', stack: '"Cipher Atkinson", Verdana, Tahoma, sans-serif' },
]

export const FONT_IDS: FontId[] = FONTS.map((font) => font.id)

export function fontStack(id: FontId): string {
  return (FONTS.find((font) => font.id === id) ?? FONTS[0]).stack
}

export const TEXT_SIZES: TextSize[] = ['sm', 'md', 'lg', 'xl']
export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  sm: 'Compact',
  md: 'Default',
  lg: 'Large',
  xl: 'Extra large',
}
export const TEXT_SCALES: Record<TextSize, number> = { sm: 0.92, md: 1, lg: 1.12, xl: 1.26 }

export const KEY_STYLES: { id: KeyStyle; name: string; hint: string }[] = [
  { id: 'raised', name: 'Raised', hint: 'Keys lifted off the page' },
  { id: 'flat', name: 'Flat', hint: 'No edge, no shadow' },
  { id: 'outline', name: 'Outline', hint: 'Drawn, not filled' },
  { id: 'contrast', name: 'Contrast', hint: 'Heavier, for bright light' },
]

export const KEY_SHAPES: { id: KeyShape; name: string }[] = [
  { id: 'sharp', name: 'Sharp' },
  { id: 'soft', name: 'Soft' },
  { id: 'round', name: 'Round' },
  { id: 'circle', name: 'Circle' },
]

export function contrastText(hex: string): '#111' | '#fff' {
  const value = (parseHex(hex) ?? '#757575').replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#111' : '#fff'
}

/** Accepts `abc`, `#abc`, `aabbcc`. Returns a full `#rrggbb`, or null if unusable. */
export function parseHex(input: string): string | null {
  const value = input.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value[0]}${value[0]}${value[1]}${value[1]}${value[2]}${value[2]}`.toLowerCase()
  }
  if (/^[0-9a-fA-F]{6}$/.test(value)) return `#${value.toLowerCase()}`
  return null
}
