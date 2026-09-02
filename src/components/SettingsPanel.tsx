import { useState } from 'react'
import {
  FONTS,
  KEY_SHAPES,
  KEY_STYLES,
  PALETTES,
  TEXT_SCALES,
  TEXT_SIZES,
  TEXT_SIZE_LABELS,
  parseHex,
} from '../lib/theme'
import { defaultSettings } from '../lib/storage'
import { useSettings } from '../store'
import { formatNumber } from '../lib/calc'
import type { Settings } from '../types'

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

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, set } = useSettings()
  const [tab, setTab] = useState<TabId>('look')
  const fresh = defaultSettings()
  const changed = (Object.keys(fresh) as (keyof Settings)[]).some((key) => settings[key] !== fresh[key])

  const sample = formatNumber(1234.5678, { decimals: settings.decimals, grouping: settings.grouping })

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
            <button className="ghost" onClick={() => set(defaultSettings())}>
              Put everything back
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

type TabProps = { settings: Settings; set: (patch: Partial<Settings>) => void }

function LookTab({ settings, set }: TabProps) {
  const light = PALETTES.filter((palette) => palette.scheme === 'light')
  const dark = PALETTES.filter((palette) => palette.scheme === 'dark')

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
      <p className="hint">
        On, this wears the first palette by day and the second when the device turns
        dark. Off, the first one stands whatever the device says.
      </p>

      <Swatches
        label={settings.followDevice ? 'By day' : 'Palette'}
        palettes={settings.followDevice ? light : PALETTES}
        chosen={settings.palette}
        onPick={(id) => set({ palette: id })}
      />

      {settings.followDevice ? (
        <Swatches label="After dark" palettes={dark} chosen={settings.nightPalette} onPick={(id) => set({ nightPalette: id })} />
      ) : null}

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
        <p className="hint">Every one of these is already on the device, so nothing is fetched.</p>
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
}: {
  label: string
  palettes: typeof PALETTES
  chosen: string
  onPick: (id: string) => void
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
          <button className="size-btn" data-active={settings.layout === 'right'} onClick={() => set({ layout: 'right' })}>
            Right
          </button>
          <button className="size-btn" data-active={settings.layout === 'left'} onClick={() => set({ layout: 'left' })}>
            Left
          </button>
        </div>
        <p className="hint">Left puts the operators under a left thumb. The digits stay put.</p>
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

      <label className="row toggle-row">
        <input type="checkbox" checked={settings.grouping} onChange={(e) => set({ grouping: e.target.checked })} />
        Group thousands in the answer
      </label>

      <label className="row toggle-row">
        <input type="checkbox" checked={settings.keepHistory} onChange={(e) => set({ keepHistory: e.target.checked })} />
        Keep a history of what was worked out
      </label>

      <p className="hint">
        Percent reads its neighbour: 200+10% is 220, because the ten means ten percent
        of the two hundred beside it. Beside a times or a divide it is a plain
        hundredth, so 200×10% is 20.
      </p>
      <p className="hint">
        Everything stays in this browser. There is no account, and nothing is sent
        anywhere.
      </p>
    </>
  )
}
