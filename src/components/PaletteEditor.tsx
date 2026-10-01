import { useEffect, useRef, useState } from 'react'
import { contrastText, derivePalette, luminance, parseHex } from '../lib/theme'
import type { CustomPalette } from '../types'
import { useSpell } from '../store'

/**
 * Whether this browser will hand back the colour under a pointer.
 *
 * Chromium has it, and on a phone that means Chrome on Android. Safari and
 * Firefox do not, so the button is simply absent there rather than present and
 * broken: an eyedropper that does nothing is worse than none at all.
 */
type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> }
function eyeDropper(): EyeDropperCtor | null {
  const ctor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper
  return typeof ctor === 'function' ? ctor : null
}

function Pipette() {
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

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: string
  onChange: (colour: string) => void
}) {
  const t = useSpell()
  const [text, setText] = useState(value)
  const dropper = eyeDropper()

  function commit(next: string) {
    const parsed = parseHex(next)
    if (parsed) onChange(parsed)
  }

  async function pick() {
    const Ctor = eyeDropper()
    if (!Ctor) return
    try {
      const { sRGBHex } = await new Ctor().open()
      const parsed = parseHex(sRGBHex)
      if (parsed) {
        setText(parsed)
        onChange(parsed)
      }
    } catch {
      /* dismissed with Escape, which is not an error */
    }
  }

  return (
    <div className="colour-field">
      <div className="colour-label">
        <strong>{label}</strong>
        <span>{hint}</span>
      </div>
      <div className="colour-controls">
        <input
          type="color"
          aria-label={t(`${label} colour`)}
          value={value}
          onChange={(e) => {
            setText(e.target.value)
            commit(e.target.value)
          }}
        />
        <input
          className="hex"
          aria-label={`${label} hex code`}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            commit(e.target.value)
          }}
          onBlur={() => setText(value)}
        />
        {dropper ? (
          <button className="ghost pipette" aria-label={`Pick ${label} off the screen`} title={t('Pick a colour off the screen')} onClick={pick}>
            <Pipette />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function PaletteEditor({
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  draft: CustomPalette
  onChange: (next: CustomPalette) => void
  onSave: () => void
  onCancel: () => void
}) {
  const derived = derivePalette(draft)
  const scheme = luminance(draft.ground) > 0.45 ? 'light' : 'dark'
  const root = useRef<HTMLDivElement>(null)

  // The list it was opened from may have been scrolled well down; the editor
  // starts at its own top, where the name is.
  useEffect(() => {
    root.current?.closest('.sheet-body')?.scrollTo({ top: 0 })
  }, [])

  return (
    <div className="palette-editor" ref={root}>
      {/* The tab's own contents are replaced while this is open, so it says
          what it is: without a heading the panel simply looks different. */}
      <div className="editor-head">
        <h3>{draft.name.trim() || 'A new palette'}</h3>
        <span>{scheme === 'dark' ? 'Reads dark' : 'Reads light'}</span>
      </div>

      <label className="field">
        <span>Name</span>
        <input
          className="text-input"
          value={draft.name}
          maxLength={30}
          placeholder="Site blue"
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
        />
      </label>

      <Field
        label="Ground"
        hint="Behind everything"
        value={draft.ground}
        onChange={(ground) => onChange({ ...draft, ground })}
      />
      <Field
        label="Keys"
        hint="The face of a key"
        value={draft.key}
        onChange={(key) => onChange({ ...draft, key })}
      />
      <Field
        label="Accent"
        hint="Operators and equals"
        value={draft.accent}
        onChange={(accent) => onChange({ ...draft, accent })}
      />

      {/* Type, lines and the muted shade are worked out rather than asked for,
          so this shows what they came to before anything is saved. */}
      <div
        className="palette-proof"
        style={{ background: derived['--bg'], color: derived['--text'], borderColor: derived['--line'] }}
      >
        <div className="palette-proof-keys">
          <span style={{ background: derived['--key'], color: derived['--text'] }}>7</span>
          <span style={{ background: derived['--key'], color: derived['--accent-ink'] }}>×</span>
          <span style={{ background: derived['--accent'], color: derived['--on-accent'] }}>=</span>
        </div>
        <p style={{ color: derived['--muted'] }}>
          Reads as a {scheme} palette.
        </p>
      </div>

      <div className="editor-actions">
        <button className="ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="primary"
          style={{ background: draft.accent, color: contrastText(draft.accent) === '#111' ? '#111' : '#fff' }}
          disabled={!draft.name.trim()}
          onClick={onSave}
        >
          Save palette
        </button>
      </div>
    </div>
  )
}
