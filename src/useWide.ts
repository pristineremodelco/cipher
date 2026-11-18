import { useSyncExternalStore } from 'react'

/**
 * Whether the screen is wide and tall enough for the history to sit beside
 * the keypad. The same numbers as the stylesheet's, so the two never
 * disagree about which layout is showing.
 */
export const WIDE = '(min-width: 1100px) and (min-height: 640px)'

function subscribe(onChange: () => void) {
  try {
    const query = window.matchMedia(WIDE)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  } catch {
    return () => {}
  }
}

function read(): boolean {
  try {
    return window.matchMedia(WIDE).matches
  } catch {
    return false
  }
}

export function useWide(): boolean {
  return useSyncExternalStore(subscribe, read, () => false)
}
