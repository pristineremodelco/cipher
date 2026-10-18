import type { BidSheet, CategorySheet, CounterSheet, Line, RoundsSheet } from './types.ts'

/** Shorthands for the catalogue, so each game reads as what is particular to it. */
export const rounds = (o: Omit<RoundsSheet, 'kind'>): RoundsSheet => ({ kind: 'rounds', ...o })
export const sheet = (lines: Line[], goal?: number): CategorySheet => ({ kind: 'sheet', lines, goal })
export const counters = (o: Omit<CounterSheet, 'kind'>): CounterSheet => ({ kind: 'counters', ...o })
export const bids = (o: Omit<BidSheet, 'kind'>): BidSheet => ({ kind: 'bids', ...o })

/** A tally of games won, for games that are won rather than scored. */
export const gamesWon = (): RoundsSheet => rounds({ win: 'high', round: 'Game', quick: [1] })

/** A line where the number typed is the points. */
export const points = (id: string, label: string, extra: Partial<Line> = {}): Line => ({ id, label, ...extra })
