import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * A button that asks once before it does something that cannot be undone.
 *
 * The first tap only arms it and says what the second will do; the second does
 * it. Left alone it disarms itself after a few seconds, so an armed button is
 * never found waiting later. A dialog would be heavier than the mistake it
 * guards against, and a single tap was too light for clearing two hundred
 * answers sitting one button away from Done.
 */
export function Confirm({
  children,
  ask,
  onConfirm,
  disabled,
  className = 'ghost',
}: {
  children: ReactNode
  /** What the button says while armed, as a question. */
  ask: string
  onConfirm: () => void
  disabled?: boolean
  className?: string
}) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function disarm() {
    window.clearTimeout(timer.current)
    setArmed(false)
  }

  return (
    <button
      className={className}
      data-armed={armed}
      disabled={disabled}
      aria-live="polite"
      onBlur={disarm}
      onClick={() => {
        if (armed) {
          disarm()
          onConfirm()
          return
        }
        setArmed(true)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setArmed(false), 3500)
      }}
    >
      {armed ? ask : children}
    </button>
  )
}
