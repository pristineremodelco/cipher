/**
 * American or British English, for every word the app shows.
 *
 * The words are written British once, in the source, and turned American on
 * the way to the screen when that is the setting, rather than keeping two
 * copies of every label that would drift apart. Where one wording reads
 * naturally to both, the source simply uses it, so this list holds only what
 * genuinely differs: spellings, and the handful of words the two choose
 * differently, brackets and parentheses, a sum and an equation.
 */
export type Spelling = 'us' | 'uk'

const AMERICAN: [RegExp, string][] = [
  [/metre/g, 'meter'],
  [/Metre/g, 'Meter'],
  [/litre/g, 'liter'],
  [/Litre/g, 'Liter'],
  [/colour/g, 'color'],
  [/Colour/g, 'Color'],
  [/\bgrey/g, 'gray'],
  [/\bGrey/g, 'Gray'],
  [/centre/g, 'center'],
  [/Centre/g, 'Center'],
  [/\bMaths\b/g, 'Math'],
  [/\bmaths\b/g, 'math'],
  // A tonne is a metric ton to an American, and "ton" alone is the short one.
  [/\bTonne\b/g, 'Metric ton'],
  [/\btonne\b/g, 'metric ton'],
  // Words, not spellings.
  [/\bBrackets\b/g, 'Parentheses'],
  [/\bbrackets\b/g, 'parentheses'],
  [/\bthe sum\b/g, 'the equation'],
  [/\bworking day\b/g, 'business day'],
  [/\bpaid in at each month's end\b/g, 'deposited at the end of each month'],
  [/\bThe vehicle does\b/g, 'Your vehicle gets'],
]

export function spell(text: string, spelling: Spelling): string {
  if (spelling === 'uk') return text
  let out = text
  for (const [british, american] of AMERICAN) out = out.replace(british, american)
  return out
}
