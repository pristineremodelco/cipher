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

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('useSettings must be used inside SettingsProvider')
  return value
}
