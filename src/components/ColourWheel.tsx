import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { hexToHsv, hsvToHex, pointOnWheel, wheelPoint, type Hsv } from '../lib/colour'
import { onAccent, parseHex } from '../lib/theme'
import { useSpell } from '../store'
import { eyeDropper, pickOffScreen } from '../lib/eyedropper'

export function Pipette() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M15.5 3.2a2.4 2.4 0 0 1 3.4 0l1.9 1.9a2.4 2.4 0 0 1 0 3.4l-2 2 1 1-1.7 1.7-6.4-6.4L13.4 5l1 1z"
        fill="currentColor"
      />
      <path
        d="M11.3 8.6 4.6 15.3a2 2 0 0 0-.55 1.02l-.5 2.6a1 1 0 0 0 1.17 1.17l2.6-.5a2 2 0 0 0 1.02-.55l6.7-6.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** The little wheel on the button that opens the big one. */
export function Pinwheel() {
  return <span className="pinwheel" aria-hidden="true" />
}

/**
 * A colour chosen on a wheel: hue round the rim, how strong out from the
 * centre, and brightness on the slider under it, with the colour it was and
 * the colour it is becoming side by side above. Nothing changes until Done.
 *
 * Drawn over everything rather than inside the sheet that opened it, so a
 * sheet's own slide-in cannot shift it or clip it.
 */
export function ColourWheel({
  title,
  value,
  onDone,
  onClose,
}: {
  title: string
  value: string
  onDone: (hex: string) => void
  onClose: () => void
}) {
  const t = useSpell()
  // Held as hue, strength and brightness rather than as a hex code, so taking
  // the brightness right down and back up again does not lose the hue.
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(parseHex(value) ?? '#808080'))
  const now = hsvToHex(hsv)
  const [text, setText] = useState(now)
  const wheel = useRef<HTMLDivElement>(null)
  const dropper = eyeDropper()

  function update(next: Hsv) {
    setHsv(next)
    setText(hsvToHex(next))
  }

  function fromPointer(event: PointerEvent<HTMLDivElement>) {
    const box = wheel.current?.getBoundingClientRect()
    if (!box) return
    const radius = box.width / 2
    const { h, s } = pointOnWheel(event.clientX - box.left - radius, event.clientY - box.top - radius, radius)
    // Choosing on the wheel with the brightness all the way down would change
    // nothing that can be seen, so it comes back up enough to show.
    update({ h, s, v: hsv.v < 0.15 ? 1 : hsv.v })
  }

  function nudge(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 2
    const moves: Record<string, Partial<Hsv>> = {
      ArrowLeft: { h: (hsv.h - step + 360) % 360 },
      ArrowRight: { h: (hsv.h + step) % 360 },
      ArrowUp: { s: Math.min(1, hsv.s + step / 100) },
      ArrowDown: { s: Math.max(0, hsv.s - step / 100) },
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    update({ ...hsv, ...move })
  }

  // Escape closes this, not the settings underneath it.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopImmediatePropagation()
      event.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const thumb = wheelPoint(hsv.h, hsv.s)
  const full = hsvToHex({ ...hsv, v: 1 })

  return createPortal(
    <div className="scrim colour-scrim" onClick={onClose}>
      <div className="sheet colour-sheet" role="dialog" aria-label={t(title)} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{t(title)}</h2>
          <div className="sheet-head-actions">
            <button className="ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" style={{ background: now, color: onAccent(now) }} onClick={() => onDone(now)}>
              Done
            </button>
          </div>
        </div>

        <div className="sheet-body colour-body">
          <div className="colour-compare">
            <span style={{ background: parseHex(value) ?? value, color: onAccent(value) }}>Was</span>
            <span className="colour-now" style={{ background: now, color: onAccent(now) }}>
              Now
            </span>
          </div>

          <div
            className="wheel"
            ref={wheel}
            role="slider"
            tabIndex={0}
            aria-label={t('Colour wheel')}
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsv.h)}
            aria-valuetext={now}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              fromPointer(event)
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event)
            }}
            onKeyDown={nudge}
          >
            <span className="wheel-shade" style={{ opacity: 1 - hsv.v }} />
            <span className="wheel-thumb" style={{ left: `${thumb.x * 100}%`, top: `${thumb.y * 100}%`, background: now }} />
          </div>

          <label className="field">
            <span>Brightness</span>
            <input
              className="brightness"
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(hsv.v * 100)}
              style={{ background: `linear-gradient(to right, #000, ${full})` }}
              onChange={(e) => update({ ...hsv, v: Number(e.target.value) / 100 })}
            />
          </label>

          <div className="colour-entry">
            <input
              className="hex"
              aria-label={t('Hex code')}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                const parsed = parseHex(e.target.value)
                if (parsed) setHsv(hexToHsv(parsed))
              }}
              onBlur={() => setText(now)}
            />
            {dropper ? (
              <button
                className="ghost pipette"
                aria-label={t('Pick a colour off the screen')}
                title={t('Pick a colour off the screen')}
                onClick={async () => {
                  const picked = await pickOffScreen()
                  if (picked) update(hexToHsv(picked))
                }}
              >
                <Pipette />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
