/**
 * What a game's score sheet is made of.
 *
 * Every game in the catalogue is one of a handful of sheet shapes, set up for
 * that game: Hearts is a sheet of hands where low wins and a hundred ends it,
 * Five Crowns is eleven named rounds, Yahtzee is a column of boxes with the
 * upper bonus worked out. The shapes are the code; the games are data.
 */

export type GameCategory = 'board' | 'card' | 'dice' | 'word' | 'party' | 'tiles' | 'collectible' | 'outdoor' | 'any'

/** One part of a round's score, added up for you: so many of a thing at so many points each, or a number typed in. */
export type Part = { label: string; per?: number; typed?: true }

/** Rounds, hands or turns down the page, a column per player. */
export type RoundsSheet = {
  kind: 'rounds'
  win: 'high' | 'low'
  /** Ends when a total reaches this. With low winning, whoever reaches it loses and the lowest wins. */
  target?: number
  /** A fixed number of rounds. */
  rounds?: number
  /** A name for each round, where they differ: Five Crowns' wild card, Mexican Train's double. */
  labels?: string[]
  /** What a row is called: Round, Hand, Turn, Hole. */
  round?: string
  /** Counting down from here, as darts does from 501. A turn that would go below zero scores nothing. */
  countdown?: number
  /** Buttons that add to the number being typed: Scrabble's 50 for all seven tiles. */
  quick?: number[]
  /** The round worked out from its parts rather than typed as one number. */
  parts?: Part[]
  /** Two sides, and only the difference counts: cornhole, horseshoes. */
  cancel?: true
  /** A letter for each round lost; spell it and you are out. */
  word?: string
  /** Phase 10's phases: a row also records who completed theirs. */
  phases?: string[]
  /** Hearts: a button for shooting the moon, which gives everyone else this many. */
  moon?: number
  /** Mölkky: reach exactly this; going over drops you back to the second number. */
  exact?: { target: number; over: number }
  /** Out after this many scoreless turns in a row. */
  misses?: number
}

/** One line of a category sheet. */
export type Line = {
  id: string
  label: string
  hint?: string
  /** Starts a new block of lines under this heading. */
  section?: string
  /** A count at so many points each: cities at 2. Without it, the number typed is the points. */
  per?: number
  /** Scored or not: Yahtzee's full house is 25 or nothing. */
  fixed?: number
  /** One of a short list: Yahtzee's aces are 0 to 5. */
  choices?: number[]
  /** A count looked up in a table: Qwixx's crosses. */
  table?: number[]
  /** Points lost rather than won: a failed ticket. */
  minus?: true
  /** Divided and rounded down: 7 Wonders' coins, one point per three. */
  divide?: number
  /** Worked out, not entered: Yahtzee's upper bonus. */
  bonus?: { of: string[]; atLeast: number; add: number }
  /** 7 Wonders' science: three counts and the formula that turns them into points. */
  science?: true
}

export type CategorySheet = {
  kind: 'sheet'
  lines: Line[]
  /** First to this many wins: Catan's ten. */
  goal?: number
}

export type Counter = {
  id: string
  label: string
  /** Where it starts; 'players' starts it at the number of players. */
  start: number | 'players'
  min?: number
  max?: number
  /** Reaching this wins. */
  win?: number
  /** And by this many clear of everyone else, for games won by two. */
  winBy?: number
  /** Reaching this loses. */
  lose?: number
  /** Buttons beside it besides one either way: Monopoly's 200 for passing Go. */
  steps?: number[]
  /** Written as money. */
  money?: true
}

/** Numbers that go up and down during play rather than being added up at the end. */
export type CounterSheet = {
  kind: 'counters'
  counters: Counter[]
  /** One column for the whole table, for games played together against the game. */
  shared?: true
  /**
   * A total worked out from counters: Munchkin's level plus gear, or poker's
   * chips at the end less what was bought in. With leads, it decides who is in front.
   */
  sum?: { label: string; of: string[]; less?: string[]; leads?: true; money?: true }
}

/** Bid so many tricks, take so many. */
export type BidSheet = {
  kind: 'bids'
  scoring: 'ohhell' | 'wizard' | 'spades' | 'skullking'
  target?: number
  /** How many rounds, from the number of players. */
  rounds?: (players: number) => number
}

/** Things each player collects, in any order: Trivial Pursuit's wedges. */
export type ChecklistSheet = { kind: 'checklist'; items: { id: string; label: string; colour?: string }[] }

/** A detective's notepad: Clue. */
export type NotesSheet = { kind: 'notes'; groups: { label: string; items: string[] }[] }

export type BowlingSheet = { kind: 'bowling' }
export type CricketSheet = { kind: 'cricket' }

export type Sheet =
  | RoundsSheet
  | CategorySheet
  | CounterSheet
  | BidSheet
  | ChecklistSheet
  | NotesSheet
  | BowlingSheet
  | CricketSheet

export type Game = {
  id: string
  name: string
  /** Other names it goes by, and the misspellings people search with. */
  aka?: string[]
  category: GameCategory
  /** Fewest and most players, or teams when teams is set. */
  players: [number, number]
  teams?: true
  sheet: Sheet
  /**
   * A short reminder of how it is played, a line per heading, written as
   * "Heading: text". Enough to settle "you can't do that", not the rulebook.
   */
  rules: string
}

export type Player = { id: string; name: string }
