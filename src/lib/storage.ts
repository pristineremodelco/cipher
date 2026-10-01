import { FONT_IDS, MAX_CUSTOM_PALETTES, PALETTE_IDS, TEXT_SIZES, parseHex } from './theme'
import { CATEGORIES, categoryOf } from './units'
import { TOOLS } from './tools'
import { fromKey } from './unitsearch'
import { isValidZone } from './zones'
import type { CustomPalette, Settings } from '../types'

const KEY = 'calculator.v1'

/**
 * Paper and Espresso, with the device choosing between them. Both are the
 * mark's own colours, so whichever one the phone asks for still looks like the
 * icon that was tapped.
 */
export function defaultSettings(): Settings {
  return {
    customPalettes: [],
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
    padDecimals: false,
    editInSum: true,
    spelling: 'us',
    haptics: true,
    keepHistory: true,
    memoryRow: false,

    mode: 'calculate',
    tool: '',
    worldZones: [],
    timeFormat: '12',
    currencyFrom: 'USD',
    currencyTo: 'EUR',
    convertCategory: 'length',
    convertPairs: {},
    convertStyle: 'simple',
    convertInput: 'top',
    simpleFrom: '',
    simpleTo: '',
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

  merged.customPalettes = Array.isArray(merged.customPalettes)
    ? merged.customPalettes
        .filter((p): p is CustomPalette => Boolean(p) && typeof p.name === 'string')
        .slice(0, MAX_CUSTOM_PALETTES)
        .map((p) => ({
          id: typeof p.id === 'string' && p.id ? p.id : crypto.randomUUID(),
          name: p.name.slice(0, 30) || 'Untitled',
          ground: parseHex(String(p.ground)) ?? '#efefef',
          key: parseHex(String(p.key)) ?? '#ffffff',
          accent: parseHex(String(p.accent)) ?? '#2f6feb',
        }))
    : []
  // A palette that was deleted leaves whatever chose it pointing at nothing,
  // so both slots fall back rather than rendering an app with no colours.
  const known = [...PALETTE_IDS, ...merged.customPalettes.map((p) => p.id)]
  if (!known.includes(merged.palette)) merged.palette = base.palette
  if (!known.includes(merged.nightPalette)) merged.nightPalette = base.nightPalette
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

  if (!['calculate', 'convert', 'tools'].includes(merged.mode)) merged.mode = base.mode
  merged.tool = typeof merged.tool === 'string' && TOOLS.some((t) => t.id === merged.tool) ? merged.tool : ''
  merged.worldZones = Array.isArray(merged.worldZones)
    ? [...new Set(merged.worldZones.filter((id): id is string => typeof id === 'string' && isValidZone(id)))].slice(0, 12)
    : []
  merged.timeFormat = merged.timeFormat === '24' ? '24' : '12'
  merged.currencyFrom = /^[A-Z]{3}$/.test(String(merged.currencyFrom)) ? merged.currencyFrom : base.currencyFrom
  merged.currencyTo = /^[A-Z]{3}$/.test(String(merged.currencyTo)) ? merged.currencyTo : base.currencyTo
  if (!CATEGORIES.some((c) => c.id === merged.convertCategory)) {
    merged.convertCategory = base.convertCategory
  }
  // A pair naming a unit that no longer exists would silently convert the
  // wrong thing, so each one is checked against its category rather than
  // trusted because it parsed.
  merged.convertPairs =
    merged.convertPairs && typeof merged.convertPairs === 'object'
      ? Object.fromEntries(
          Object.entries(merged.convertPairs).filter(([id, pair]) => {
            if (!CATEGORIES.some((c) => c.id === id) || typeof pair !== 'string') return false
            const [from, to] = pair.split('>')
            const units = categoryOf(id).units
            return units.some((u) => u.id === from) && units.some((u) => u.id === to)
          }),
        )
      : {}

  if (merged.convertStyle !== 'simple' && merged.convertStyle !== 'categories') merged.convertStyle = base.convertStyle
  if (merged.convertInput !== 'either') merged.convertInput = 'top'
  merged.editInSum = merged.editInSum !== false
  if (merged.spelling !== 'uk') merged.spelling = 'us'
  // A unit that no longer exists is no unit chosen, and two that are not the
  // same kind of thing cannot both stand.
  const simpleFrom = typeof merged.simpleFrom === 'string' ? fromKey(merged.simpleFrom) : undefined
  const simpleTo = typeof merged.simpleTo === 'string' ? fromKey(merged.simpleTo) : undefined
  merged.simpleFrom = simpleFrom ? merged.simpleFrom : ''
  merged.simpleTo = simpleTo && (!simpleFrom || simpleFrom.category.id === simpleTo.category.id) ? merged.simpleTo : ''

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
