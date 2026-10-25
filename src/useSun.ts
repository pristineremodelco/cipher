import { useEffect, useRef, useState } from 'react'
import { isDark, nextChange, roughly, type Place } from './lib/sun'

/**
 * Whether the sun is down where the phone is, or null with nowhere to watch
 * it from. Drawn again at the next sunrise or sunset, and when the app comes
 * back to the front, since a phone in a pocket at sunset is the usual case.
 * Nothing is scheduled while it is hidden: coming back reads the time then.
 */
export function useSunDark(place: Place | null): boolean | null {
  // Only a nudge to draw again, and only when day and night have actually
  // swapped. The time itself is read fresh on every draw, so the first
  // decision after a place arrives is about now, not about whenever the app
  // was opened. A minute-by-minute wake redrew the whole app 1,440 times a
  // day for a palette that changes twice.
  const shown = useRef<boolean | null>(null)
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!place) return
    let timer = 0
    const arm = () => {
      window.clearTimeout(timer)
      if (document.visibilityState !== 'visible') return
      const at = nextChange(new Date(), place)
      if (!at) return
      // A wake that lands a hair early would otherwise reschedule for the
      // same instant and spin. One second is far inside the formula's own
      // minute of slack.
      const delay = Math.max(1000, at.getTime() - Date.now())
      timer = window.setTimeout(wake, delay)
    }
    const wake = () => {
      if (document.visibilityState !== 'visible') return
      const next = isDark(new Date(), place)
      if (shown.current !== next) {
        shown.current = next
        setTick((n) => n + 1)
      }
      arm()
    }
    shown.current = isDark(new Date(), place)
    const back = () => {
      if (document.visibilityState === 'visible') wake()
      else window.clearTimeout(timer)
    }
    arm()
    document.addEventListener('visibilitychange', back)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', back)
    }
  }, [place])
  return place ? isDark(new Date(), place) : null
}

/** What became of the last request for where the phone is. */
export type Locating = 'idle' | 'asking' | 'refused' | 'failed' | 'unsupported'

let asking = 0

/** Calls off any answer still on its way, so a late one cannot undo a change of mind. */
export function stopLocating() {
  asking += 1
}

/** Asks once for where the phone is, roughly. The answer stays on the phone. */
export function locate(onPlace: (place: Place) => void, onTrouble: (why: Locating) => void) {
  if (!('geolocation' in navigator)) {
    onTrouble('unsupported')
    return
  }
  const ticket = ++asking
  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (ticket === asking) onPlace(roughly(position.coords.latitude, position.coords.longitude))
    },
    (error) => {
      if (ticket === asking) onTrouble(error.code === error.PERMISSION_DENIED ? 'refused' : 'failed')
    },
    // A town is plenty for sunset, so no GPS fix is waited for, and an answer
    // from the last few hours will do.
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 6 * 3600000 },
  )
}

/**
 * Keeps the place current for someone who travels, without ever asking: only
 * if location was already allowed is it read again when the app opens.
 */
export function useRefreshPlace(active: boolean, current: Place | null, onPlace: (place: Place) => void) {
  useEffect(() => {
    if (!active || !navigator.permissions?.query) return
    let cancelled = false
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (cancelled || status.state !== 'granted') return
        locate(
          (place) => {
            if (cancelled) return
            if (!current || Math.abs(place.lat - current.lat) > 0.05 || Math.abs(place.lon - current.lon) > 0.05) onPlace(place)
          },
          () => {},
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // Once per opening, not every time the place it sets comes back round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
