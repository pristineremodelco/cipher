import { BOARD } from './board.ts'
import { CARDS } from './cards.ts'
import { DICE } from './dice.ts'
import { ANY, COLLECTIBLE, OUTDOOR, PARTY, YARD } from './more.ts'
import type { Game, GameCategory } from './types.ts'

export const GAMES: Game[] = [...ANY, ...BOARD, ...CARDS, ...DICE, ...PARTY, ...COLLECTIBLE, ...OUTDOOR, ...YARD]

export const CATEGORY_NAMES: Record<GameCategory, string> = {
  any: 'Any game',
  board: 'Board games',
  card: 'Card games',
  dice: 'Dice games',
  word: 'Word games',
  tiles: 'Tiles and dominoes',
  party: 'Party games',
  collectible: 'Collectible card games',
  outdoor: 'Yard, bar and sports',
}

/** The order the categories are listed in. */
export const CATEGORY_ORDER: GameCategory[] = ['any', 'board', 'card', 'dice', 'word', 'tiles', 'party', 'collectible', 'outdoor']

/** A few to tap straight away before anything is typed. */
export const POPULAR = ['scrabble', 'yahtzee', 'uno', 'phase10', 'poker', 'cribbage', 'hearts', 'spades', 'catan', 'monopoly', 'cornhole', 'minigolf']

export function gameOf(id: string): Game | undefined {
  return GAMES.find((game) => game.id === id)
}

function plain(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Games matching what was typed, best first: a name that starts with it, then
 * a word in the name that does, then another name it goes by, then anywhere.
 * Punctuation and accents are ignored, so "ticket to ride" finds "Ticket to
 * Ride: Europe" and "pokemon" finds "Pokémon TCG".
 */
export function findGames(query: string): Game[] {
  const q = plain(query)
  if (!q) return []
  const squeezed = q.replace(/ /g, '')
  const scored: { game: Game; rank: number }[] = []
  for (const game of GAMES) {
    const name = plain(game.name)
    const names = [name, ...(game.aka ?? []).map(plain)]
    let rank = -1
    if (name.startsWith(q)) rank = 0
    else if (name.split(' ').some((word) => word.startsWith(q))) rank = 1
    else if (names.some((n) => n.startsWith(q) || n.split(' ').some((word) => word.startsWith(q)))) rank = 2
    else if (names.some((n) => n.includes(q) || n.replace(/ /g, '').includes(squeezed))) rank = 3
    if (rank >= 0) scored.push({ game, rank })
  }
  return scored.sort((a, b) => a.rank - b.rank || a.game.name.localeCompare(b.game.name)).map((s) => s.game)
}
