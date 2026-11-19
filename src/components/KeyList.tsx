import { KEYBOARD } from './keys'

/** What each keyboard key does, for the ? sheet and the Keys tab in Settings. */
export function KeyList() {
  return (
    <dl className="key-list">
      {KEYBOARD.map((row) => (
        <div key={row.keys}>
          <dt>
            <kbd>{row.keys}</kbd>
          </dt>
          <dd>{row.does}</dd>
        </div>
      ))}
    </dl>
  )
}
