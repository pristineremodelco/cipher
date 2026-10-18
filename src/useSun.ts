import { useEffect, useState } from 'react'
import { isDark, roughly, type Place } from './lib/sun'

/**
 * Whether the sun is down where the phone is, or null with nowhere to watch
 * it from. Looked at again each minute, and the moment the app comes back to
 * the front, since a phone in a pocket at sunset is the usual case.
 */
export function useSunDark(place: Place | null): boolean | null {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!place) return
    const tick = () => setNow(new Date())
    const id = window.setInterval(tick, 60000)
    const back = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', back)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', back)
    }
  }, [place])
  return place ? isDark(now, place) : null
}

/** What became of the last request for where the phone is. */
export type Locating = 'idle' | 'asking' | 'refused' | 'failed' | 'unsupported'

/** Asks once for where the phone is, roughly. The answer stays on the phone. */
export function locate(onPlace: (place: Place) => void, onTrouble: (why: Locating) => void) {
  if (!('geolocation' in navigator)) {
    onTrouble('unsupported')
    return
  }
  navigator.geolocation.getCurrentPosition(
    (position) => onPlace(roughly(position.coords.latitude, position.coords.longitude)),
    (error) => onTrouble(error.code === error.PERMISSION_DENIED ? 'refused' : 'failed'),
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
