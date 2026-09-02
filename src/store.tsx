import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadSettings, saveSettings } from './lib/storage'
import { luminance } from './lib/theme'
import { activePalette, contrastText, derivePalette, fontStack, paletteOf } from './lib/theme'
import type { Settings } from './types'

/**
 * Whether the device is asking for a dark surface. Watched rather than read
 * once, so a phone that switches at sunset switches this with it.
 */
function usePrefersDark(): boolean {
  const [dark, setDark] = useState(() => {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })
  useEffect(() => {
    let query: MediaQueryList
    try {
      query = window.matchMedia('(prefers-color-scheme: dark)')
    } catch {
      return
    }
    const onChange = (event: MediaQueryListEvent) => setDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return dark
}

/** Everything this file may write inline, and therefore everything it clears. */
const PALETTE_VARS = [
  '--bg',
  '--panel',
  '--key',
  '--text',
  '--muted',
  '--line',
  '--accent',
  '--on-accent',
  '--danger',
]

function asPaletteScheme(ground: string): 'light' | 'dark' {
  return luminance(ground) > 0.45 ? 'light' : 'dark'
}

type Value = {
  settings: Settings
  /** A patch, not a whole record, so a screen only names what it changed. */
  set: (patch: Partial<Settings>) => void
  /** Which palette is on right now, once the device has had its say. */
  palette: string
}

const SettingsContext = createContext<Value | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const prefersDark = usePrefersDark()
  const palette = activePalette(settings, prefersDark)

  const set = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }, [])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    const root = document.documentElement
    const own = settings.customPalettes.find((item) => item.id === palette)
    const scheme = own ? asPaletteScheme(own.ground) : paletteOf(palette).scheme

    // A palette that ships is a rule in the stylesheet, keyed on this. One made
    // here has no rule to key, so its nine variables are set on the element
    // instead, which wins over any rule. The name still stands in for a light
    // or a dark one, because the shadow scale is the one thing not set here
    // and a soft shadow on a dark ground reads as fog.
    root.dataset.palette = own ? (scheme === 'dark' ? 'graphite' : 'snow') : palette
    root.dataset.keystyle = settings.keyStyle
    root.dataset.keyshape = settings.keyShape
    root.dataset.textsize = settings.textSize
    root.dataset.layout = settings.layout
    root.dataset.zero = settings.zeroKey
    root.dataset.mode = settings.mode
    root.dataset.bold = String(settings.boldText)
    root.style.setProperty('--font-stack', fontStack(settings.fontId))
    root.style.setProperty('--display-scale', String(settings.displayScale))

    /**
     * Every colour is settled here in one pass and then written once.
     *
     * The order matters and used to be wrong: a chosen accent rides on top of
     * whatever the palette says, and clearing one has to hand control back to
     * the palette rather than to the stylesheet underneath it. Setting them in
     * two passes meant the second pass cleared the first one's accent, so a
     * palette made here lost the one colour it was made for.
     */
    const colours: Record<string, string> = own ? { ...derivePalette(own) } : {}
    if (settings.accent) {
      colours['--accent'] = settings.accent
      colours['--on-accent'] = contrastText(settings.accent) === '#111' ? '#111111' : '#ffffff'
    }
    for (const name of PALETTE_VARS) root.style.removeProperty(name)
    for (const [name, value] of Object.entries(colours)) root.style.setProperty(name, value)

    // The status bar takes the ground colour, so a phone in standalone mode
    // does not draw a strip of the wrong palette above the app.
    const ground = getComputedStyle(root).getPropertyValue('--bg').trim()
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta && ground) meta.setAttribute('content', ground)
    root.style.colorScheme = scheme
  }, [palette, settings])

  const value = useMemo(() => ({ settings, set, palette }), [settings, set, palette])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): Value {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('useSettings must be used inside SettingsProvider')
  return value
}
