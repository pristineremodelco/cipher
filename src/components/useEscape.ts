import { useEffect } from 'react'

/**
 * Escape closes the sheet on top and only that one: caught on the way down,
 * before the app's own handler would close whatever is underneath as well.
 */
export function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopImmediatePropagation()
      event.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])
}
