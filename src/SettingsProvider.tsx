import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { loadSettings, saveSettings } from './lib/storage'
import { activePalette, derivePalette, fontStack, mix, onAccent, paletteOf, readableInk, schemeOf } from './lib/theme'
import { SettingsContext } from './store'
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
  '--accent-ink',
  '--on-accent',
  '--danger',
]

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

  const { customPalettes, keyStyle, keyShape, textSize, layout, zeroKey, mode, boldText, fontId, displayScale, accent } =
    settings

  /**
   * Laid out before the first paint rather than after it, so the app never
   * shows a frame in the stylesheet's default palette before switching to the
   * chosen one. Re-run only for what it reads: a converter pair or a tool
   * being picked is a settings change too, and used to redo all of this.
   */
  useLayoutEffect(() => {
    const root = document.documentElement
    const own = customPalettes.find((item) => item.id === palette)
    const scheme = own ? schemeOf(own.ground) : paletteOf(palette).scheme

    // A palette that ships is a rule in the stylesheet, keyed on this. One made
    // here has no rule to key, so its nine variables are set on the element
    // instead, which wins over any rule. The name still stands in for a light
    // or a dark one, because the shadow scale is the one thing not set here
    // and a soft shadow on a dark ground reads as fog.
    root.dataset.palette = own ? (scheme === 'dark' ? 'graphite' : 'winter') : palette
    root.dataset.keystyle = keyStyle
    root.dataset.keyshape = keyShape
    root.dataset.textsize = textSize
    root.dataset.layout = layout
    root.dataset.zero = zeroKey
    root.dataset.mode = mode
    root.dataset.bold = String(boldText)
    root.style.setProperty('--font-stack', fontStack(fontId))
    root.style.setProperty('--display-scale', String(displayScale))

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
    if (accent) {
      colours['--accent'] = accent
      colours['--on-accent'] = onAccent(accent)
    }
    for (const name of PALETTE_VARS) root.style.removeProperty(name)
    for (const [name, value] of Object.entries(colours)) root.style.setProperty(name, value)

    // The operators' colour comes last, from whatever the three sources above
    // settled on between them, so a shipped palette, one made here and a
    // chosen accent all get the same guarantee by the same route. It has to
    // read on everything an operator can sit on: the key, the display panel,
    // the bare ground under an outlined key, and under the contrast style a
    // key tinted with the accent itself, which is the hardest of the four.
    const computed = getComputedStyle(root)
    const read = (name: string) => computed.getPropertyValue(name).trim()
    const worn = read('--accent')
    const surfaces = [read('--key'), read('--panel'), read('--bg')]
    if (keyStyle === 'contrast') surfaces.push(mix(worn, read('--panel'), 0.2))
    root.style.setProperty('--accent-ink', readableInk(worn, surfaces))

    // The status bar takes the ground colour, so a phone in standalone mode
    // does not draw a strip of the wrong palette above the app.
    const ground = getComputedStyle(root).getPropertyValue('--bg').trim()
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta && ground) meta.setAttribute('content', ground)
    root.style.colorScheme = scheme
  }, [palette, customPalettes, keyStyle, keyShape, textSize, layout, zeroKey, mode, boldText, fontId, displayScale, accent])

  const value = useMemo(() => ({ settings, set, palette }), [settings, set, palette])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
