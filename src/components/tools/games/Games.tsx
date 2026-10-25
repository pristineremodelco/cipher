import { useEffect, useMemo, useRef, useState } from 'react'
import { Confirm } from '../../Confirm'
import { Rules } from './Rules'
import { BidsBoard, BowlingBoard, ChecklistBoard, CountersBoard, CricketBoard, NotesBoard, RoundsBoard, SheetBoard } from './boards'
import { CATEGORY_NAMES, CATEGORY_ORDER, GAMES, POPULAR, findGames, gameOf } from '../../../lib/games/catalog'
import { loadSaved, opened, playerId, saveSaved, seatPlayers, type Board, type Saved } from '../../../lib/games/saved'
import type { Game, Player } from '../../../lib/games/types'
import { useSpell } from '../../../store'

/** A new game's sheet, if it does not have one yet. */
function withBoard(saved: Saved, id: string): Saved {
  const game = gameOf(id)
  if (!game || saved.boards[id]) return saved
  return { ...saved, boards: { ...saved.boards, [id]: { players: seatPlayers(game, saved.names), data: {}, at: Date.now() } } }
}

/**
 * Score sheets for a hundred and more games, each laid out for its own game,
 * with the rules a tap away. Found by typing; the games played lately are
 * listed first.
 */
export default function Games() {
  const t = useSpell()
  const [saved, setSaved] = useState(() => {
    const loaded = loadSaved()
    return loaded.last ? withBoard(loaded, loaded.last) : loaded
  })
  // A score is several taps, and each one used to rewrite every saved game.
  // The latest is written a moment after the taps stop, and straight away if
  // the app is closed or this screen goes away.
  const savedRef = useRef(saved)
  useEffect(() => {
    savedRef.current = saved
  }, [saved])
  useEffect(() => {
    const flush = () => saveSaved(savedRef.current)
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHide)
      flush()
    }
  }, [])
  useEffect(() => {
    const id = window.setTimeout(() => saveSaved(saved), 400)
    return () => window.clearTimeout(id)
  }, [saved])
  const [rules, setRules] = useState(false)

  const game = gameOf(saved.last)
  const board = game ? saved.boards[game.id] : undefined

  function pick(id: string) {
    setRules(false)
    setSaved((current) => withBoard(opened(current, id), id))
  }

  function update(next: Partial<Board>) {
    if (!game || !board) return
    setSaved((current) => ({ ...current, boards: { ...current.boards, [game.id]: { ...current.boards[game.id], ...next, at: Date.now() } } }))
  }

  function setPlayers(players: Player[]) {
    update({ players })
    // Names carry over to the next game; teams and the table do not.
    if (game && !game.teams && !(game.sheet.kind === 'counters' && game.sheet.shared)) {
      setSaved((current) => ({ ...current, names: players.map((p) => p.name.trim()).filter(Boolean) }))
    }
  }

  return (
    <div className="tool games">
      <GameSearch recent={saved.recent} current={game?.id} onPick={pick} />

      {game && board ? (
        <>
          <div className="game-title">
            <h3>{t(game.name)}</h3>
            <span>
              {t(CATEGORY_NAMES[game.category])}
              {game.category === 'any' ? '' : ` · ${game.players[0] === game.players[1] ? game.players[0] : `${game.players[0]}–${game.players[1]}`} ${game.teams ? 'teams' : 'players'}`}
            </span>
          </div>
          {game.sheet.kind === 'counters' && game.sheet.shared ? null : <Players game={game} players={board.players} onChange={setPlayers} />}
          <Sheet game={game} board={board} change={(data) => update({ data })} />
          <div className="game-actions">
            <Confirm ask="Clear every score?" onConfirm={() => update({ data: {} })}>
              New game
            </Confirm>
            <button className="ghost rules-button" onClick={() => setRules(true)}>
              Rules
            </button>
          </div>
          {rules ? <Rules game={game} onClose={() => setRules(false)} /> : null}
        </>
      ) : (
        <Popular onPick={pick} />
      )}
    </div>
  )
}

function Sheet({ game, board, change }: { game: Game; board: Board; change: (data: Record<string, unknown>) => void }) {
  const props = { game, players: board.players, data: board.data, change }
  const sheet = game.sheet
  switch (sheet.kind) {
    case 'rounds':
      return <RoundsBoard {...props} sheet={sheet} />
    case 'sheet':
      return <SheetBoard {...props} sheet={sheet} />
    case 'counters':
      return <CountersBoard {...props} sheet={sheet} />
    case 'bids':
      return <BidsBoard {...props} sheet={sheet} />
    case 'checklist':
      return <ChecklistBoard {...props} sheet={sheet} />
    case 'notes':
      return <NotesBoard {...props} sheet={sheet} />
    case 'bowling':
      return <BowlingBoard {...props} sheet={sheet} />
    case 'cricket':
      return <CricketBoard {...props} sheet={sheet} />
  }
}

function Players({ game, players, onChange }: { game: Game; players: Player[]; onChange: (players: Player[]) => void }) {
  const [min, max] = game.players
  const kind = game.teams ? 'Team' : 'Player'
  return (
    <div className="players" aria-label={game.teams ? 'Teams' : 'Players'}>
      {players.map((p, i) => (
        <div key={p.id} className="player-chip">
          <input
            className="player-name"
            value={p.name}
            maxLength={20}
            placeholder={`${kind} ${i + 1}`}
            aria-label={`${kind} ${i + 1} name`}
            onChange={(e) => onChange(players.map((other) => (other.id === p.id ? { ...other, name: e.target.value } : other)))}
          />
          {players.length > min ? (
            <Confirm className="ghost tiny player-remove" ask="Remove?" onConfirm={() => onChange(players.filter((other) => other.id !== p.id))}>
              ✕
            </Confirm>
          ) : null}
        </div>
      ))}
      {players.length < max ? (
        <button className="ghost tiny add-player" onClick={() => onChange([...players, { id: playerId(), name: `${kind} ${players.length + 1}` }])}>
          + {kind}
        </button>
      ) : null}
    </div>
  )
}

function Popular({ onPick }: { onPick: (id: string) => void }) {
  const t = useSpell()
  return (
    <div className="popular">
      <p className="hint">Search for any of {GAMES.length} games above, or start with one of these.</p>
      <div className="popular-grid">
        {POPULAR.map((id) => {
          const game = gameOf(id)!
          return (
            <button key={id} className="popular-card" onClick={() => onPick(id)}>
              {t(game.name)}
            </button>
          )
        })}
      </div>
      <button className="ghost" onClick={() => onPick('anyhigh')}>
        Keep score for any other game
      </button>
    </div>
  )
}

type Option = { game: Game; section?: string }

/** A search field with the list dropping down under it as you type. */
function GameSearch({ recent, current, onPick }: { recent: string[]; current?: string; onPick: (id: string) => void }) {
  const t = useSpell()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [lit, setLit] = useState(0)
  const field = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const options: Option[] = useMemo(() => {
    // The full catalogue is a hundred and more rows. Built when the list is
    // open, not on the way in to the screen.
    if (!open) return []
    if (query.trim()) return findGames(query).map((game) => ({ game }))
    const out: Option[] = []
    const lately = recent.map(gameOf).filter((g): g is Game => Boolean(g))
    lately.forEach((game, i) => out.push({ game, section: i === 0 ? 'Played lately' : undefined }))
    for (const category of CATEGORY_ORDER) {
      GAMES.filter((g) => g.category === category)
        .sort((a, b) => (category === 'any' ? 0 : a.name.localeCompare(b.name)))
        .forEach((game, i) => out.push({ game, section: i === 0 ? CATEGORY_NAMES[category] : undefined }))
    }
    return out
  }, [open, query, recent])

  useEffect(() => {
    list.current?.querySelector(`[data-index="${lit}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [lit])

  function choose(game: Game) {
    onPick(game.id)
    setQuery('')
    setOpen(false)
    field.current?.blur()
  }

  return (
    <div className="game-search">
      <input
        ref={field}
        className="picker-search"
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls="game-results"
        aria-autocomplete="list"
        aria-activedescendant={open && options[lit] ? `game-option-${lit}` : undefined}
        placeholder={current ? 'Switch game: Scrabble, Yahtzee…' : 'Search games: Scrabble, Yahtzee…'}
        value={query}
        onFocus={() => {
          setOpen(true)
          setLit(0)
        }}
        // Tapping away lets go of a half-typed search as well as the list.
        onBlur={() => {
          setOpen(false)
          setQuery('')
        }}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setLit(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setLit((i) => Math.min(options.length - 1, i + 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setLit((i) => Math.max(0, i - 1))
          } else if (e.key === 'Enter' && options[lit]) {
            e.preventDefault()
            choose(options[lit].game)
          } else if (e.key === 'Escape') {
            // A search field clears itself on Escape, and that clearing is an
            // input event, which would open the list straight back up.
            e.preventDefault()
            setOpen(false)
            setQuery('')
            field.current?.blur()
          }
        }}
      />
      {open ? (
        <ul className="game-results" id="game-results" role="listbox" ref={list}>
          {options.length ? (
            options.map((option, i) => (
              <li key={`${option.game.id}-${i}`} role="presentation">
                {option.section ? <span className="game-section">{t(option.section)}</span> : null}
                <button
                  id={`game-option-${i}`}
                  role="option"
                  aria-selected={i === lit}
                  data-index={i}
                  data-current={option.game.id === current}
                  className="game-option"
                  // Kept from taking the focus, so the field's blur does not close the list before the tap lands.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(option.game)}
                >
                  <span>{t(option.game.name)}</span>
                  {query.trim() ? <small>{t(CATEGORY_NAMES[option.game.category])}</small> : null}
                </button>
              </li>
            ))
          ) : (
            <li className="game-none" role="presentation">
              <span>Nothing by that name.</span>
              <button className="ghost tiny" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(gameOf('anyhigh')!)}>
                Keep score anyway
              </button>
            </li>
          )}
        </ul>
      ) : null}
    </div>
  )
}
