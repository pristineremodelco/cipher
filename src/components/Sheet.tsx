import { useRef, type ReactNode } from 'react'
import { useSheetFocus } from './useSheet'

/**
 * A sheet over the app: the dimmed ground that closes it when tapped, and the
 * sheet itself, which takes focus when it opens and gives it back when it
 * closes.
 */
export function Sheet({
  className,
  label,
  onClose,
  children,
}: {
  className: string
  label: string
  onClose: () => void
  children: ReactNode
}) {
  const sheet = useRef<HTMLDivElement>(null)
  useSheetFocus(sheet)
  return (
    <div className="scrim" onClick={onClose}>
      <div
        ref={sheet}
        className={`sheet ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
