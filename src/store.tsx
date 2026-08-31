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
import { activePalette, contrastText, fontStack, paletteOf } from './lib/theme'
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
    root.dataset.palette = palette
    root.dataset.keystyle = settings.keyStyle
    root.dataset.keyshape = settings.keyShape
    root.dataset.textsize = settings.textSize
    root.dataset.layout = settings.layout
    root.dataset.zero = settings.zeroKey
    root.dataset.bold = String(settings.boldText)
    root.style.setProperty('--font-stack', fontStack(settings.fontId))
    root.style.setProperty('--display-scale', String(settings.displayScale))

    // A chosen accent rides on top of the palette rather than replacing it, so
    // clearing it cleanly hands control back.
    if (settings.accent) {
      root.style.setProperty('--accent', settings.accent)
      root.style.setProperty('--on-accent', contrastText(settings.accent))
    } else {
      root.style.removeProperty('--accent')
      root.style.removeProperty('--on-accent')
    }

    // The status bar takes the ground colour, so a phone in standalone mode
    // does not draw a strip of the wrong palette above the app.
    const ground = getComputedStyle(root).getPropertyValue('--bg').trim()
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta && ground) meta.setAttribute('content', ground)
    root.style.colorScheme = paletteOf(palette).scheme
  }, [palette, settings])

  const value = useMemo(() => ({ settings, set, palette }), [settings, set, palette])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): Value {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('useSettings must be used inside SettingsProvider')
  return value
}
