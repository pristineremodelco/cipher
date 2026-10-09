import { useEffect, useRef, useState } from 'react'
import { derivePalette, onAccent, parseHex, schemeOf } from '../lib/theme'
import type { CustomPalette } from '../types'
import { useSpell } from '../store'
import { ColourWheel, Pinwheel, Pipette } from './ColourWheel'
import { eyeDropper, pickOffScreen } from '../lib/eyedropper'

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
  const [wheel, setWheel] = useState(false)
  const dropper = eyeDropper()

  function take(colour: string) {
    setText(colour)
    onChange(colour)
  }

  return (
    <div className="colour-field">
      <div className="colour-label">
        <strong>{label}</strong>
        <span>{hint}</span>
      </div>
      <div className="colour-controls">
        <span className="colour-swatch" style={{ background: value }} aria-hidden="true" />
        <button className="ghost wheel-button icon-only" aria-label={t(`Change the ${label.toLowerCase()} colour`)} onClick={() => setWheel(true)}>
          <Pinwheel />
        </button>
        <input
          className="hex"
          aria-label={`${label} hex code`}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            const parsed = parseHex(e.target.value)
            if (parsed) onChange(parsed)
          }}
          onBlur={() => setText(value)}
        />
        {dropper ? (
          <button
            className="ghost pipette"
            aria-label={`Pick ${label} off the screen`}
            title={t('Pick a colour off the screen')}
            onClick={async () => {
              const picked = await pickOffScreen()
              if (picked) take(picked)
            }}
          >
            <Pipette />
          </button>
        ) : null}
      </div>
      {wheel ? (
        <ColourWheel
          title={label}
          value={value}
          onDone={(colour) => {
            take(colour)
            setWheel(false)
          }}
          onClose={() => setWheel(false)}
        />
      ) : null}
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
  const scheme = schemeOf(draft.ground)
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
        label="Background"
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
          style={{ background: draft.accent, color: onAccent(draft.accent) }}
          disabled={!draft.name.trim()}
          onClick={onSave}
        >
          Save palette
        </button>
      </div>
    </div>
  )
}
