import { useSpell } from '../store'
import { KEYBOARD } from './keys'

/** What each keyboard key does, for the ? sheet and the Keys tab in Settings. */
export function KeyList() {
  const t = useSpell()
  return (
    <dl className="key-list">
      {KEYBOARD.map((row) => (
        <div key={row.keys}>
          <dt>
            <kbd>{row.keys}</kbd>
          </dt>
          <dd>{t(row.does)}</dd>
        </div>
      ))}
    </dl>
  )
}
