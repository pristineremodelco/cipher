import { useSyncExternalStore } from 'react'

/**
 * A newer version of the app, downloaded and in place, waiting for a reload.
 *
 * The service worker keeps a copy of the app on the phone so it opens offline.
 * A browser only looks for a newer one when the app is opened fresh, and a
 * phone keeps an installed app alive in the background for days, so updates
 * sat unseen until it was reinstalled. Now it looks whenever the app comes
 * back to the screen, and every half hour while it is open, and says when one
 * is ready.
 */
let apply: (() => Promise<void>) | null = null
const listeners = new Set<() => void>()

export function offerUpdate(run: () => Promise<void>) {
  apply = run
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The waiting update, or null when the app is up to date. */
export function useUpdate(): (() => Promise<void>) | null {
  return useSyncExternalStore(subscribe, () => apply, () => null)
}

const HALF_AN_HOUR = 30 * 60 * 1000
const AT_MOST_EVERY = 60 * 1000

export function watchForUpdates(registration: ServiceWorkerRegistration) {
  let last = 0
  const check = () => {
    if (navigator.onLine === false || Date.now() - last < AT_MOST_EVERY) return
    last = Date.now()
    // Nothing to do when it fails: offline, or the host briefly away. The next
    // look is never far off.
    registration.update().catch(() => {})
  }
  window.setInterval(check, HALF_AN_HOUR)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
  })
  window.addEventListener('online', check)
}
