import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Game } from '../../../lib/games/types'
import { useSpell } from '../../../store'

/** "Heading: text" lines, as the catalogue writes them. */
function sections(rules: string): { heading: string; text: string }[] {
  return rules.split('\n').map((line) => {
    const at = line.indexOf(': ')
    return at > 0 ? { heading: line.slice(0, at), text: line.slice(at + 2) } : { heading: '', text: line }
  })
}

/** The rules at a glance, for settling an argument without the box. */
export function Rules({ game, onClose }: { game: Game; onClose: () => void }) {
  const t = useSpell()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  return createPortal(
    <div className="scrim" onClick={onClose}>
      <div className="sheet rules-sheet" role="dialog" aria-label={`${t(game.name)} rules`} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{t(game.name)}</h2>
          <button className="ghost" onClick={onClose}>
            Done
          </button>
        </div>
        <div className="sheet-body">
          <p className="house-rules">
            <strong>House rules may differ.</strong> Ultimately, enjoying the game matters more than getting every rule
            right.
          </p>
          <dl className="rules">
            {sections(game.rules).map((section, i) => (
              <div key={i}>
                {section.heading ? <dt>{t(section.heading)}</dt> : null}
                <dd>{t(section.text)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>,
    document.body,
  )
}
