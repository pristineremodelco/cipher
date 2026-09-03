import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calculate, formatNumber, plainNumber } from './lib/calc'
import { backspace, expressionOf, kindOf, press, seed } from './lib/calcinput'
import { MAX_TAPE, loadTape, saveTape, type Tape, type TapeEntry } from './lib/calctape'
import { ROWS, SCIENTIFIC, TYPED, type Key } from './components/keys'
import { Backspace, Clock, Gear, Mark } from './components/Icons'
import { SettingsPanel } from './components/SettingsPanel'
import { Converter } from './components/Converter'
import { Tools } from './components/Tools'
import { useSettings } from './store'

export default function App() {
  const { settings, set } = useSettings()
  const [chunks, setChunks] = useState<string[]>([])
  const [tape, setTape] = useState<Tape>(() => loadTape())
  const [sciOpen, setSciOpen] = useState(false)
  const [tapeOpen, setTapeOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  /**
   * True from an equals until the next press. A digit then starts a new sum,
   * where an operator carries the answer on into the next one, which is what a
   * pocket calculator has always done.
   */
  const [settled, setSettled] = useState(false)
  /**
   * What was keyed in to produce the answer now on the display. Kept so the
   * working stays legible above the result rather than being replaced by it
   * the instant equals is pressed.
   */
  const [worked, setWorked] = useState('')
  const holdTimer = useRef<number | null>(null)
  const cleared = useRef(false)

  useEffect(() => {
    saveTape(tape)
  }, [tape])

  const format = useMemo(
    () => ({ decimals: settings.decimals, grouping: settings.grouping }),
    [settings.decimals, settings.grouping],
  )

  const expression = expressionOf(chunks)
  const result = useMemo(() => calculate(expression, settings.angle), [expression, settings.angle])
  const lastAnswer = tape.entries[0]?.value ?? 0

  const buzz = useCallback(() => {
    if (!settings.haptics) return
    try {
      navigator.vibrate?.(8)
    } catch {
      /* a device with no motor, which is most of them */
    }
  }, [settings.haptics])

  const key = useCallback(
    (pressed: string) => {
      buzz()
      setCopied(false)
      setChunks((current) => {
        // After an answer, a digit or a constant starts again; an operator
        // keeps the answer and works on from it.
        const base = settled && /^[0-9.]$|^00$/.test(pressed) ? [] : current
        const value = pressed === 'ans' ? plainNumber(lastAnswer) : pressed
        return press(base, value)
      })
      setSettled(false)
    },
    [buzz, lastAnswer, settled],
  )

  const clear = useCallback(() => {
    buzz()
    setCopied(false)
    setChunks([])
    setSettled(false)
  }, [buzz])

  const rub = useCallback(() => {
    buzz()
    setCopied(false)
    setChunks((current) => backspace(current))
    setSettled(false)
  }, [buzz])

  const equals = useCallback(() => {
    if (!result.ok) return
    buzz()
    setCopied(false)
    const entry: TapeEntry = {
      id: crypto.randomUUID(),
      expression,
      value: result.value,
      at: Date.now(),
    }
    if (settings.keepHistory) {
      setTape((current) => ({ ...current, entries: [entry, ...current.entries].slice(0, MAX_TAPE) }))
    }
    setChunks(seed(plainNumber(result.value)))
    setWorked(expression)
    setSettled(true)
  }, [buzz, expression, result, settings.keepHistory])

  const memoryAdd = useCallback(
    (direction: 1 | -1) => {
      if (!result.ok) return
      buzz()
      setTape((current) => ({ ...current, memory: current.memory + direction * result.value }))
    },
    [buzz, result],
  )

  /** Anything a keyboard can send, routed through the same rules as the pad. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

      if (event.key === 'Escape') {
        event.preventDefault()
        if (sciOpen) setSciOpen(false)
        else if (tapeOpen) setTapeOpen(false)
        else setSettingsOpen(false)
        return
      }
      // The panels and the converter are ordinary screens with their own
      // controls; the pad should not be taking keys out from under them.
      if (settingsOpen || settings.mode !== 'calculate') return
      if (event.key === 'Enter' || event.key === '=') {
        event.preventDefault()
        equals()
        return
      }
      if (event.key === 'Backspace') {
        event.preventDefault()
        rub()
        return
      }
      if (event.key === 'Delete') {
        event.preventDefault()
        clear()
        return
      }
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault()
        key(event.key)
        return
      }
      const mapped = TYPED[event.key.toLowerCase()]
      if (mapped) {
        event.preventDefault()
        key(mapped)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [clear, equals, key, rub, sciOpen, settings.mode, settingsOpen, tapeOpen])

  /** Holding the rub-out clears the lot, which is the one gesture worth having. */
  function holdStart() {
    cleared.current = false
    holdTimer.current = window.setTimeout(() => {
      cleared.current = true
      clear()
    }, 420)
  }
  function holdEnd(fire: boolean) {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
      if (fire && !cleared.current) rub()
    }
  }

  async function copyAnswer() {
    if (!result.ok) return
    try {
      await navigator.clipboard.writeText(plainNumber(result.value))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      /* no clipboard permission: the number is on screen either way */
    }
  }

  const answer = result.ok ? formatNumber(result.value, format) : ''

  function renderKey(item: Key) {
    const label = item.label
    const send = item.press ?? label
    const onPress = label === 'C' ? clear : label === '=' ? equals : () => key(send)
    return (
      <button
        key={label}
        className="key"
        data-kind={item.kind}
        data-span={settings.zeroKey === 'wide' && label === '0' ? 'two' : undefined}
        aria-label={item.aria ?? label}
        disabled={label === '=' && !result.ok}
        onClick={onPress}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="app">
      <header className="bar">
        <div className="brand">
          <Mark />
          <h1>Cipher</h1>
        </div>
        {/* Two surfaces, one switch, always in the same place. Converting is
            not a thing buried behind a menu here: for plenty of people it is
            the reason the app is installed at all. */}
        <nav className="modes" aria-label="What this is showing">
          <button
            className="mode"
            aria-pressed={settings.mode === 'calculate'}
            data-active={settings.mode === 'calculate'}
            onClick={() => set({ mode: 'calculate' })}
          >
            Calculate
          </button>
          <button
            className="mode"
            aria-pressed={settings.mode === 'convert'}
            data-active={settings.mode === 'convert'}
            onClick={() => set({ mode: 'convert' })}
          >
            Convert
          </button>
          <button
            className="mode"
            aria-pressed={settings.mode === 'tools'}
            data-active={settings.mode === 'tools'}
            onClick={() => set({ mode: 'tools' })}
          >
            Tools
          </button>
        </nav>
        <div className="bar-actions">
          {settings.mode === 'calculate' && settings.keepHistory ? (
            <button
              className="chip"
              aria-pressed={tapeOpen}
              aria-label="History"
              title="History"
              onClick={() => setTapeOpen((open) => !open)}
            >
              <Clock />
            </button>
          ) : null}
          <button className="chip" aria-label="Settings" title="Settings" onClick={() => setSettingsOpen(true)}>
            <Gear />
          </button>
        </div>
      </header>

      <main className="work">
        {settings.mode === 'convert' ? <Converter /> : null}
        {settings.mode === 'tools' ? <Tools /> : null}
        {settings.mode === 'calculate' ? (
        <>
        <section className="display">
          <div className="expression" aria-label="Expression">
            {settled ? (
              <span data-kind="worked">{worked}</span>
            ) : (
              chunks.map((chunk, index) => (
                <span key={`${chunk}-${index}`} data-kind={kindOf(chunk)}>
                  {chunk}
                </span>
              ))
            )}
          </div>
          <button
            className="answer"
            data-settled={settled}
            aria-live="polite"
            aria-label={answer ? `Answer ${answer}. Tap to copy.` : 'No answer yet'}
            title={answer ? 'Copy' : undefined}
            onClick={copyAnswer}
          >
            {copied ? 'Copied' : answer}
          </button>
          {!result.ok && result.error && chunks.length ? (
            <p className="error">{result.error}</p>
          ) : null}
          <div className="utility">
            {/* Degrees or radians sits with the maths rather than in the bar:
                it means nothing until a trig key is pressed, and the key that
                opens those is the one beside it. */}
            <button
              className="util angle"
              aria-pressed={settings.angle === 'rad'}
              title="Degrees or radians"
              onClick={() => set({ angle: settings.angle === 'deg' ? 'rad' : 'deg' })}
            >
              {settings.angle === 'deg' ? 'DEG' : 'RAD'}
            </button>
            <button
              className="util more"
              aria-label="Scientific functions"
              aria-expanded={sciOpen}
              onClick={() => setSciOpen(true)}
            >
              ⋯
            </button>
            <button className="util" aria-label="Power" onClick={() => key('^')}>
              ^
            </button>
            <button
              className="util rub"
              aria-label="Backspace. Hold to clear."
              title="Backspace. Hold to clear."
              onPointerDown={holdStart}
              onPointerUp={() => holdEnd(true)}
              onPointerLeave={() => holdEnd(false)}
            >
              <Backspace />
            </button>
          </div>
        </section>

        {settings.memoryRow ? (
          <div className="memory">
            <span className="memory-value" data-on={tape.memory !== 0}>
              M {formatNumber(tape.memory, format)}
            </span>
            <button className="chip" onClick={() => setTape((c) => ({ ...c, memory: 0 }))}>
              MC
            </button>
            <button className="chip" disabled={!tape.memory} onClick={() => key(plainNumber(tape.memory))}>
              MR
            </button>
            <button className="chip" disabled={!result.ok} onClick={() => memoryAdd(1)}>
              M+
            </button>
            <button className="chip" disabled={!result.ok} onClick={() => memoryAdd(-1)}>
              M−
            </button>
          </div>
        ) : null}

        <div className="pads">
          {/* On a wide screen there is room to leave the scientific set out on
              the desk. Narrower than that it lives behind the ⋯ key, and the
              stylesheet decides which, since the answer is the width and not
              anything worth making a setting of. */}
          <div className="sci-pad" aria-label="Scientific functions">
            {SCIENTIFIC.map((item) => (
              <button
                key={item.label}
                className="key"
                data-kind="action"
                aria-label={item.aria ?? item.label}
                onClick={() => key(item.press)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pad">
            {ROWS.map((row, index) => (
              <div className="row" key={index}>
                {settings.layout === 'left' ? renderKey(row.side) : null}
                {row.main
                  .filter((item) => !(settings.zeroKey === 'wide' && item.label === '00'))
                  .map((item) => renderKey(item))}
                {settings.layout === 'right' ? renderKey(row.side) : null}
              </div>
            ))}
          </div>
        </div>
        </>
        ) : null}
      </main>

      {sciOpen ? (
        <div className="scrim" onClick={() => setSciOpen(false)}>
          <div className="sheet sci-sheet" role="dialog" aria-label="Scientific functions" onClick={(e) => e.stopPropagation()}>
            <div className="sci-grid">
              {SCIENTIFIC.map((item) => (
                <button
                  key={item.label}
                  className="key"
                  data-kind="action"
                  aria-label={item.aria ?? item.label}
                  onClick={() => {
                    key(item.press)
                    setSciOpen(false)
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button className="ghost" onClick={() => setSciOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {tapeOpen ? (
        <div className="scrim" onClick={() => setTapeOpen(false)}>
          <div className="sheet tape-sheet" role="dialog" aria-label="History" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>History</h2>
              <div className="sheet-head-actions">
                <button
                  className="ghost"
                  disabled={!tape.entries.length}
                  onClick={() => setTape((current) => ({ ...current, entries: [] }))}
                >
                  Clear
                </button>
                <button className="ghost" onClick={() => setTapeOpen(false)}>
                  Done
                </button>
              </div>
            </div>
            {tape.entries.length ? (
              <ul className="tape-list">
                {tape.entries.map((entry) => (
                  <li key={entry.id}>
                    <button
                      className="tape-expr"
                      title="Put this back on the display"
                      onClick={() => {
                        // Back as one chunk, the same as a recalled answer, so
                        // a rub-out takes off what was put on.
                        setChunks([entry.expression])
                        setSettled(false)
                        setTapeOpen(false)
                      }}
                    >
                      {entry.expression}
                    </button>
                    <button
                      className="tape-value"
                      title="Use this answer"
                      onClick={() => {
                        setChunks(seed(plainNumber(entry.value)))
                        setWorked(entry.expression)
                        setSettled(true)
                        setTapeOpen(false)
                      }}
                    >
                      {formatNumber(entry.value, format)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint">Nothing worked out yet. Answers land here as you go.</p>
            )}
          </div>
        </div>
      ) : null}

      {settingsOpen ? <SettingsPanel onClose={() => setSettingsOpen(false)} /> : null}
    </div>
  )
}
