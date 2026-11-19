import { useEffect, useState, type RefObject } from 'react'

/**
 * A sheet that opens over the app takes the keyboard with it.
 *
 * Focus goes to the sheet itself, not to the first thing in it: on a phone the
 * first thing in the history is its search box, and focusing that would put
 * the keyboard up over the list somebody opened to read. When the sheet
 * closes, focus goes back to whatever opened it, so Tab carries on from there
 * rather than from the top of the page. Everything behind the sheet is made
 * inert by the app while it is open, which keeps Tab inside it.
 */
export function useSheetFocus(sheet: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null
    sheet.current?.focus({ preventScroll: true })
    return () => {
      if (before && before.isConnected) before.focus({ preventScroll: true })
    }
  }, [sheet])
}

/** Whether a media query matches, kept up to date as the window changes size. */
export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    try {
      return window.matchMedia(query).matches
    } catch {
      return false
    }
  })
  useEffect(() => {
    let list: MediaQueryList
    try {
      list = window.matchMedia(query)
    } catch {
      return
    }
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])
  return matches
}
