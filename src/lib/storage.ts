import { FONT_IDS, PALETTE_IDS, TEXT_SIZES, parseHex } from './theme'
import type { Settings } from '../types'

const KEY = 'calculator.v1'

/**
 * Paper and Espresso, with the device choosing between them. Both are the
 * mark's own colours, so whichever one the phone asks for still looks like the
 * icon that was tapped.
 */
export function defaultSettings(): Settings {
  return {
    palette: 'paper',
    nightPalette: 'espresso',
    followDevice: true,
    accent: '',
    fontId: 'system',
    textSize: 'md',
    boldText: false,
    keyStyle: 'raised',
    keyShape: 'soft',
    displayScale: 1,
    layout: 'right',
    zeroKey: 'double',

    angle: 'deg',
    decimals: -1,
    grouping: true,
    haptics: true,
    keepHistory: true,
    memoryRow: false,
  }
}

/**
 * Fills in anything added since a save was written, and refuses anything that
 * would not draw. A settings blob is the one thing an app cannot afford to
 * choke on: a bad value here is a calculator that will not open.
 */
export function migrateSettings(raw: unknown): Settings {
  const base = defaultSettings()
  if (!raw || typeof raw !== 'object') return base
  const merged = { ...base, ...(raw as Partial<Settings>) }

  if (!PALETTE_IDS.includes(merged.palette)) merged.palette = base.palette
  if (!PALETTE_IDS.includes(merged.nightPalette)) merged.nightPalette = base.nightPalette
  merged.followDevice = merged.followDevice !== false
  merged.accent = typeof merged.accent === 'string' ? (parseHex(merged.accent) ?? '') : ''
  if (!FONT_IDS.includes(merged.fontId)) merged.fontId = base.fontId
  if (!TEXT_SIZES.includes(merged.textSize)) merged.textSize = base.textSize
  merged.boldText = Boolean(merged.boldText)
  if (!['raised', 'flat', 'outline', 'contrast'].includes(merged.keyStyle)) {
    merged.keyStyle = base.keyStyle
  }
  if (!['sharp', 'soft', 'round', 'circle'].includes(merged.keyShape)) {
    merged.keyShape = base.keyShape
  }
  merged.displayScale = Number.isFinite(merged.displayScale)
    ? Math.max(0.8, Math.min(1.8, Number(merged.displayScale)))
    : base.displayScale
  if (!['right', 'left'].includes(merged.layout)) merged.layout = base.layout
  if (!['double', 'wide'].includes(merged.zeroKey)) merged.zeroKey = base.zeroKey

  if (!['deg', 'rad'].includes(merged.angle)) merged.angle = base.angle
  merged.decimals = Number.isFinite(merged.decimals)
    ? Math.max(-1, Math.min(10, Math.round(merged.decimals)))
    : base.decimals
  merged.grouping = merged.grouping !== false
  merged.haptics = merged.haptics !== false
  merged.keepHistory = merged.keepHistory !== false
  merged.memoryRow = Boolean(merged.memoryRow)

  return merged
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? migrateSettings(JSON.parse(raw)) : defaultSettings()
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    /* quota or private mode: the session keeps working, it just is not written down */
  }
}
