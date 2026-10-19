import { createContext, useCallback, useContext } from 'react'
import { spell } from './lib/spelling'
import type { Settings } from './types'

/**
 * The settings, read anywhere below SettingsProvider.
 *
 * Kept apart from the provider itself so the file that draws it exports only
 * a component, which is what lets a change to it hot-reload in place.
 */
export type SettingsValue = {
  settings: Settings
  /** A patch, not a whole record, so a screen only names what it changed. */
  set: (patch: Partial<Settings>) => void
  /** Which palette is on right now, once the device has had its say. */
  palette: string
}

export const SettingsContext = createContext<SettingsValue | null>(null)

/** The setting's spelling, as a function to pass text through on its way to the screen. */
export function useSpell(): (text: string) => string {
  const { settings } = useSettings()
  return useCallback((text: string) => spell(text, settings.spelling), [settings.spelling])
}

/** A short tap of the motor under a key, when the setting asks for one. */
export function useBuzz(): () => void {
  const { settings } = useSettings()
  return useCallback(() => {
    if (!settings.haptics) return
    try {
      navigator.vibrate?.(8)
    } catch {
      /* a device with no motor, which is most of them */
    }
  }, [settings.haptics])
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('useSettings must be used inside SettingsProvider')
  return value
}
