import type { Game, Player } from './types.ts'

/**
 * Games in progress, kept on the phone so a score sheet survives the app being
 * closed halfway through a game. Each game keeps its own sheet; the names last
 * typed are offered to the next game, since it is usually the same people.
 */
const KEY = 'cipher.games.v1'
const RECENT = 6

export type Board = { players: Player[]; data: Record<string, unknown>; at: number }
export type Saved = { last: string; recent: string[]; names: string[]; boards: Record<string, Board> }

function empty(): Saved {
  return { last: '', recent: [], names: [], boards: {} }
}

const isPlayer = (p: unknown): p is Player =>
  Boolean(p) && typeof (p as Player).id === 'string' && typeof (p as Player).name === 'string'

export function loadSaved(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null
    if (!raw || typeof raw !== 'object') return empty()
    const boards: Record<string, Board> = {}
    for (const [id, board] of Object.entries(raw.boards ?? {})) {
      if (!board || !Array.isArray(board.players) || !board.players.every(isPlayer)) continue
      boards[id] = { players: board.players, data: board.data && typeof board.data === 'object' ? board.data : {}, at: Number(board.at) || 0 }
    }
    return {
      last: typeof raw.last === 'string' ? raw.last : '',
      recent: Array.isArray(raw.recent) ? raw.recent.filter((r): r is string => typeof r === 'string').slice(0, RECENT) : [],
      names: Array.isArray(raw.names) ? raw.names.filter((n): n is string => typeof n === 'string').slice(0, 12) : [],
      boards,
    }
  } catch {
    return empty()
  }
}

export function saveSaved(saved: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved))
  } catch {
    /* full or private: the game still runs, it is just not kept */
  }
}

export function opened(saved: Saved, id: string): Saved {
  return { ...saved, last: id, recent: [id, ...saved.recent.filter((r) => r !== id)].slice(0, RECENT) }
}

let next = 0
export function playerId(): string {
  next += 1
  return `p${Date.now().toString(36)}${next}`
}

/** Who sits down to a new sheet: the names from last time if they fit the game, otherwise numbered places. */
export function seatPlayers(game: Game, names: string[]): Player[] {
  if (game.sheet.kind === 'counters' && game.sheet.shared) return [{ id: 'table', name: 'Table' }]
  const [min, max] = game.players
  if (game.teams) return Array.from({ length: min }, (_, i) => ({ id: playerId(), name: `Team ${i + 1}` }))
  if (names.length >= min && names.length <= max) return names.map((name) => ({ id: playerId(), name }))
  const count = Math.max(min, Math.min(max, names.length || 2))
  return Array.from({ length: count }, (_, i) => ({ id: playerId(), name: names[i] ?? `Player ${i + 1}` }))
}
