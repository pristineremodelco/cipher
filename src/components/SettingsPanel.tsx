import { useState } from 'react'
import { Confirm } from './Confirm'
import {
  FONTS,
  KEY_SHAPES,
  KEY_STYLES,
  MAX_CUSTOM_PALETTES,
  PALETTES,
  TEXT_SCALES,
  TEXT_SIZES,
  TEXT_SIZE_LABELS,
  asPalette,
  findPalette,
  parseHex,
} from '../lib/theme'
import { PaletteEditor } from './PaletteEditor'
import { defaultSettings } from '../lib/storage'
import { useSettings } from '../store'
import { formatNumber } from '../lib/calc'
import type { CustomPalette, Settings } from '../types'

const TABS = [
  { id: 'look', label: 'Look' },
  { id: 'keys', label: 'Keys' },
  { id: 'maths', label: 'Maths' },
] as const

type TabId = (typeof TABS)[number]['id']

/** Two rows is enough to show a digit, an operator and the equals together. */
const PREVIEW: { label: string; kind: string }[][] = [
  [
    { label: '7', kind: 'digit' },
    { label: '8', kind: 'digit' },
    { label: '9', kind: 'digit' },
    { label: '×', kind: 'operator' },
  ],
  [
    { label: '0', kind: 'digit' },
    { label: '00', kind: 'digit' },
    { label: '.', kind: 'digit' },
    { label: '=', kind: 'equals' },
  ],
]

/**
 * What putting everything back leaves alone.
 *
 * A palette somebody made is theirs, not a setting: forgetting a dozen of them
 * because someone wanted the default corners back would be a trap. The
 * converter's remembered pairs and which surface is showing are not looks
 * either, and resetting the mode would throw you out of the panel you are
 * standing in.
 */
const KEPT: (keyof Settings)[] = ['customPalettes', 'mode', 'convertCategory', 'convertPairs', 'simpleFrom', 'simpleTo']

/** Arrays and objects need reading, not comparing by reference. */
function same(a: unknown, b: unknown): boolean {
  if (typeof a === 'object' && a !== null) return JSON.stringify(a) === JSON.stringify(b)
  return a === b
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, set } = useSettings()
  const [tab, setTab] = useState<TabId>('look')
  const fresh = defaultSettings()
  const resettable = (Object.keys(fresh) as (keyof Settings)[]).filter((key) => !KEPT.includes(key))
  const changed = resettable.some((key) => !same(settings[key], fresh[key]))

  const sample = formatNumber(1234.5678, {
    decimals: settings.decimals,
    grouping: settings.grouping,
    padDecimals: settings.padDecimals,
  })

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet settings-sheet" role="dialog" aria-label="Settings" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Settings</h2>
          <button className="ghost" onClick={onClose}>
            Done
          </button>
        </div>

        <div className="tabs">
          {TABS.map((item) => (
            <button key={item.id} className="tab" data-active={tab === item.id} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        {/* The preview stays put above the tabs' contents, so every setting
            below it can be seen landing without scrolling back up. */}
        <div className="preview" aria-hidden="true">
          <div className="preview-display">
            <em>1234.5678</em>
            <strong style={{ fontSize: `${20 * settings.displayScale}px` }}>{sample}</strong>
          </div>
          <div className="pad">
            {PREVIEW.map((row, index) => (
              <div className="row" key={index}>
                {settings.layout === 'left' ? (
                  <span className="key" data-kind={row[3].kind}>
                    {row[3].label}
                  </span>
                ) : null}
                {row
                  .slice(0, 3)
                  .filter((cell) => !(settings.zeroKey === 'wide' && cell.label === '00'))
                  .map((cell) => (
                    <span
                      className="key"
                      key={cell.label}
                      data-kind={cell.kind}
                      data-span={settings.zeroKey === 'wide' && cell.label === '0' ? 'two' : undefined}
                    >
                      {cell.label}
                    </span>
                  ))}
                {settings.layout === 'right' ? (
                  <span className="key" data-kind={row[3].kind}>
                    {row[3].label}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="sheet-body">
          {tab === 'look' ? <LookTab settings={settings} set={set} /> : null}
          {tab === 'keys' ? <KeysTab settings={settings} set={set} /> : null}
          {tab === 'maths' ? <MathsTab settings={settings} set={set} /> : null}
        </div>

        {/* Only here once something has been changed: a button that undoes
            nothing still has to be read and dismissed every time. */}
        {changed ? (
          <div className="sheet-foot">
            <Confirm
              ask="Put every setting back?"
              onConfirm={() =>
                set(Object.fromEntries(resettable.map((key) => [key, fresh[key]])) as Partial<Settings>)
              }
            >
              Put everything back
            </Confirm>
          </div>
        ) : null}
      </div>
    </div>
  )
}

type TabProps = { settings: Settings; set: (patch: Partial<Settings>) => void }

/**
 * A new palette starts as a copy of the one it is being made from, not as a
 * stranger. Most palettes made here are a palette that is nearly right, Plum
 * with a brighter accent say, and starting from fixed blues meant building it
 * back up from nothing to change one colour. The name says where it came from
 * and can be written over.
 */
function seededFrom(source: { name: string; swatch: string[] } | undefined, own: boolean): CustomPalette {
  const [ground, key, , accent] = (source?.swatch ?? ['#101418', '#1B2026', '', '#4DA3FF']).map((c) => c.toLowerCase())
  const name = !source ? '' : own ? `${source.name} 2` : `My ${source.name}`
  return { id: crypto.randomUUID(), name: name.slice(0, 30), ground, key, accent }
}

/** Which of the two the editor was opened from, or neither. */
type Slot = 'day' | 'night' | 'either'

function LookTab({ settings, set }: TabProps) {
  const { palette: showing } = useSettings()
  const [draft, setDraft] = useState<CustomPalette | null>(null)
  // Which slot a new one is being made for, so it lands there rather than
  // wherever its own lightness would have filed it.
  const [slot, setSlot] = useState<Slot>('either')
  const own = settings.customPalettes.map(asPalette)
  const everything = [...PALETTES, ...own]
  /**
   * A slot lists the palettes on its own side of the line, plus whatever it is
   * currently wearing. That last part matters: a dark palette can be chosen
   * for the day slot on purpose, and filtering strictly by lightness would
   * drop it out of the list it is selected in, which reads as it vanishing.
   */
  const forSlot = (scheme: 'light' | 'dark', chosen: string) =>
    everything.filter((palette) => palette.scheme === scheme || palette.id === chosen)
  const light = forSlot('light', settings.palette)
  const dark = forSlot('dark', settings.nightPalette)
  const all = everything

  function start(next: Slot) {
    // The palette in the slot being made for, or for neither, the one on show.
    const id = next === 'day' ? settings.palette : next === 'night' ? settings.nightPalette : showing
    setSlot(next)
    setDraft(seededFrom(findPalette(settings, id), settings.customPalettes.some((p) => p.id === id)))
  }

  function save() {
    if (!draft) return
    const name = draft.name.trim()
    if (!name) return
    const exists = settings.customPalettes.some((p) => p.id === draft.id)
    const customPalettes = exists
      ? settings.customPalettes.map((p) => (p.id === draft.id ? { ...draft, name } : p))
      : [...settings.customPalettes, { ...draft, name }].slice(0, MAX_CUSTOM_PALETTES)
    /**
     * A new one goes straight on, into whichever slot its own lightness fits.
     * Making a dark palette and having nothing happen because the phone is in
     * light mode is the sort of thing that reads as a bug rather than as a
     * setting, and the two slots are explained right above this.
     */
    const wear = exists
      ? {}
      : slot === 'day'
        ? { palette: draft.id }
        : slot === 'night' && settings.followDevice
          ? { nightPalette: draft.id }
          : settings.followDevice && asPalette({ ...draft, name }).scheme === 'dark'
            ? { nightPalette: draft.id }
            : { palette: draft.id }
    set({ customPalettes, ...wear })
    setDraft(null)
    setSlot('either')
  }

  function forget(id: string) {
    set({ customPalettes: settings.customPalettes.filter((p) => p.id !== id) })
  }

  if (draft) {
    return (
      <PaletteEditor
        draft={draft}
        onChange={setDraft}
        onSave={save}
        onCancel={() => {
          setDraft(null)
          setSlot('either')
        }}
      />
    )
  }

  return (
    <>
      <label className="row toggle-row">
        <input
          type="checkbox"
          checked={settings.followDevice}
          onChange={(e) => set({ followDevice: e.target.checked })}
        />
        Follow the device between light and dark
      </label>
      <Swatches
        label={settings.followDevice ? 'By day' : 'Palette'}
        palettes={settings.followDevice ? light : all}
        chosen={settings.palette}
        onPick={(id) => set({ palette: id })}
        onMake={settings.customPalettes.length >= MAX_CUSTOM_PALETTES ? undefined : () => start('day')}
      />

      {settings.followDevice ? (
        <Swatches
          label="After dark"
          palettes={dark}
          chosen={settings.nightPalette}
          onPick={(id) => set({ nightPalette: id })}
          onMake={settings.customPalettes.length >= MAX_CUSTOM_PALETTES ? undefined : () => start('night')}
        />
      ) : null}

      <div className="field">
        <span>Your palettes</span>
        <p className="hint" style={{ marginTop: 0 }}>
          The ground, a key face and the accent. The rest is worked out from those.
        </p>
        {settings.customPalettes.length ? (
          <div className="own-list">
            {settings.customPalettes.map((palette) => (
              <div className="own-row" key={palette.id}>
                <span className="palette-swatch" aria-hidden="true">
                  <i style={{ background: palette.ground }} />
                  <i style={{ background: palette.key, color: asPalette(palette).swatch[2] }}>12</i>
                  <i style={{ background: palette.accent }} />
                </span>
                <strong>{palette.name}</strong>
                <button className="ghost tiny" onClick={() => setDraft({ ...palette })}>
                  Edit
                </button>
                <button className="ghost tiny" aria-label={`Delete ${palette.name}`} onClick={() => forget(palette.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <button
          className="ghost"
          disabled={settings.customPalettes.length >= MAX_CUSTOM_PALETTES}
          onClick={() => start('either')}
        >
          {settings.customPalettes.length >= MAX_CUSTOM_PALETTES
            ? `That is all ${MAX_CUSTOM_PALETTES} of them`
            : 'Make a palette'}
        </button>
      </div>

      <div className="field">
        <span>Accent</span>
        <p className="hint" style={{ marginTop: 0 }}>
          Operators, brackets and the equals key. Left alone it follows the palette.
        </p>
        <div className="accent-row">
          <span className="accent-preview" style={{ background: settings.accent || 'var(--accent)' }} />
          <input
            type="color"
            aria-label="Accent"
            value={settings.accent || '#b4502f'}
            onChange={(e) => set({ accent: parseHex(e.target.value) ?? '' })}
          />
          {settings.accent ? (
            <button className="ghost" onClick={() => set({ accent: '' })}>
              Use the palette
            </button>
          ) : null}
        </div>
      </div>

      <div className="field">
        <span>Typeface</span>
        <div className="font-grid">
          {FONTS.map((font) => (
            <button
              key={font.id}
              className="font-card"
              data-active={settings.fontId === font.id}
              style={{ fontFamily: font.stack }}
              onClick={() => set({ fontId: font.id })}
            >
              <strong>{font.name}</strong>
              <span>{font.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>Text size</span>
        <div className="size-row">
          {TEXT_SIZES.map((size) => (
            <button
              key={size}
              className="size-btn"
              data-active={settings.textSize === size}
              style={{ fontSize: `${14 * TEXT_SCALES[size]}px` }}
              onClick={() => set({ textSize: size })}
            >
              Aa
              <small>{TEXT_SIZE_LABELS[size]}</small>
            </button>
          ))}
        </div>
        {/* Four buttons marked Aa say how big the letters on the buttons are
            and nothing about how big the app will be. This line is drawn at
            the sizes the app actually uses, so the choice can be read rather
            than guessed at, and it stays up while the screen is open. */}
        <div className="size-sample" aria-hidden="true">
          <strong>Answer 1,234.57</strong>
          <span>Labels, tool names and the history read at this size.</span>
          <small>Notes and hints read at this one.</small>
        </div>
      </div>

      <label className="row toggle-row">
        <input type="checkbox" checked={settings.boldText} onChange={(e) => set({ boldText: e.target.checked })} />
        Heavier text weight
      </label>

      <div className="field">
        <span>Answer size</span>
        <div className="span-row">
          <input
            type="range"
            min={0.8}
            max={1.8}
            step={0.1}
            aria-label="Answer size"
            value={settings.displayScale}
            onChange={(e) => set({ displayScale: Number(e.target.value) })}
          />
          <output>{Math.round(settings.displayScale * 100)}%</output>
        </div>
      </div>
    </>
  )
}

function Swatches({
  label,
  palettes,
  chosen,
  onPick,
  onMake,
}: {
  label: string
  palettes: typeof PALETTES
  chosen: string
  onPick: (id: string) => void
  /** Absent when there is no room left for another one. */
  onMake?: () => void
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="palette-grid">
        {palettes.map((palette) => (
          <button
            key={palette.id}
            className="palette-card"
            data-active={chosen === palette.id}
            onClick={() => onPick(palette.id)}
          >
            <span className="palette-swatch" aria-hidden="true">
              <i style={{ background: palette.swatch[0] }} />
              {/* A numeral in the type colour on the key colour, which is what
                  the whole palette is for. */}
              <i style={{ background: palette.swatch[1], color: palette.swatch[2] }}>12</i>
              <i style={{ background: palette.swatch[3] }} />
            </span>
            <strong>{palette.name}</strong>
            <span className="palette-hint">{palette.hint}</span>
          </button>
        ))}
        {/* Sitting in the grid rather than under it, because this is one more
            thing the slot can be, and the colour wheel and the eyedropper are
            on the other side of it. */}
        {onMake ? (
          <button className="palette-card palette-make" onClick={onMake}>
            <span className="palette-swatch" aria-hidden="true">
              <i className="palette-make-mark">+</i>
            </span>
            <strong>Make one</strong>
            <span className="palette-hint">Your own colours</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}

function KeysTab({ settings, set }: TabProps) {
  return (
    <>
      <div className="field">
        <span>Key style</span>
        <div className="style-grid">
          {KEY_STYLES.map((item) => (
            <button
              key={item.id}
              className="style-card"
              data-active={settings.keyStyle === item.id}
              onClick={() => set({ keyStyle: item.id })}
            >
              <strong>{item.name}</strong>
              <span>{item.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>Key corners</span>
        <div className="size-row">
          {KEY_SHAPES.map((item) => (
            <button
              key={item.id}
              className="size-btn"
              data-active={settings.keyShape === item.id}
              onClick={() => set({ keyShape: item.id })}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>Operator column</span>
        <div className="size-row">
          <button className="size-btn" data-active={settings.layout === 'left'} onClick={() => set({ layout: 'left' })}>
            Left
          </button>
          <button className="size-btn" data-active={settings.layout === 'right'} onClick={() => set({ layout: 'right' })}>
            Right
          </button>
        </div>
      </div>

      <div className="field">
        <span>Bottom row</span>
        <div className="size-row">
          <button className="size-btn" data-active={settings.zeroKey === 'double'} onClick={() => set({ zeroKey: 'double' })}>
            0 and 00
          </button>
          <button className="size-btn" data-active={settings.zeroKey === 'wide'} onClick={() => set({ zeroKey: 'wide' })}>
            One wide 0
          </button>
        </div>
      </div>

      <label className="row toggle-row">
        <input type="checkbox" checked={settings.memoryRow} onChange={(e) => set({ memoryRow: e.target.checked })} />
        Show the memory row
      </label>

      <label className="row toggle-row">
        <input type="checkbox" checked={settings.haptics} onChange={(e) => set({ haptics: e.target.checked })} />
        A short buzz under each key
      </label>
    </>
  )
}

function MathsTab({ settings, set }: TabProps) {
  // A whole number is the only one that shows what padding does, so the switch
  // carries one worked the way the switch would work it.
  const whole = formatNumber(100, {
    decimals: settings.decimals,
    grouping: settings.grouping,
    padDecimals: settings.padDecimals,
  })
  return (
    <>
      <label className="field">
        <span>Angles</span>
        <select value={settings.angle} onChange={(e) => set({ angle: e.target.value as Settings['angle'] })}>
          <option value="deg">Degrees</option>
          <option value="rad">Radians</option>
        </select>
      </label>

      <label className="field">
        <span>Decimal places</span>
        <select value={settings.decimals} onChange={(e) => set({ decimals: Number(e.target.value) })}>
          <option value={-1}>However many the answer has</option>
          {Array.from({ length: 11 }, (_, i) => (
            <option key={i} value={i}>
              {i === 0 ? 'None' : `${i} place${i === 1 ? '' : 's'}`}
            </option>
          ))}
        </select>
      </label>

      {settings.decimals > 0 ? (
        <label className="row toggle-row">
          <input
            type="checkbox"
            checked={settings.padDecimals}
            onChange={(e) => set({ padDecimals: e.target.checked })}
          />
          Keep the places on a whole answer ({whole})
        </label>
      ) : null}

      <label className="row toggle-row">
        <input type="checkbox" checked={settings.grouping} onChange={(e) => set({ grouping: e.target.checked })} />
        Group thousands in the answer
      </label>

      <label className="row toggle-row">
        <input type="checkbox" checked={settings.keepHistory} onChange={(e) => set({ keepHistory: e.target.checked })} />
        Keep a history of what was worked out
      </label>

      <div className="field">
        <span>Converter</span>
        <div className="size-row">
          <button
            className="size-btn"
            data-active={settings.convertStyle === 'categories'}
            onClick={() => set({ convertStyle: 'categories' })}
          >
            By category
          </button>
          <button
            className="size-btn"
            data-active={settings.convertStyle === 'simple'}
            onClick={() => set({ convertStyle: 'simple' })}
          >
            Simple
          </button>
        </div>
        <p className="hint">Simple picks both units by typing, as in 5 g to lb.</p>
      </div>

    </>
  )
}
