import { useState } from 'react'
import { useUpdate } from '../update'

function Refresh() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Floats over everything when a newer version is ready. One tap swaps it in
 * and reloads; history, settings and games in progress are stored on the
 * phone and come straight back. Later puts it away until the next one.
 */
export function UpdateBanner() {
  const update = useUpdate()
  const [later, setLater] = useState<typeof update>(null)
  const [busy, setBusy] = useState(false)
  if (!update || later === update) return null

  async function refresh() {
    if (!update) return
    setBusy(true)
    await update()
  }

  return (
    <div className="update" role="status">
      <button className="update-go" onClick={refresh} disabled={busy}>
        <Refresh />
        <span>
          <strong>{busy ? 'Updating…' : 'Update ready'}</strong>
          <small>Tap to refresh. Your history and settings stay.</small>
        </span>
      </button>
      {busy ? null : (
        <button className="update-later" onClick={() => setLater(update)}>
          Later
        </button>
      )}
    </div>
  )
}
