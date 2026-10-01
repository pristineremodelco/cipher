/**
 * American or British, for every word the app spells.
 *
 * The words are written British once, in the source, and turned American on
 * the way to the screen when that is the setting, rather than keeping two
 * copies of every label that would drift apart. The list is short because the
 * words that differ are few: the metric units, colour, grey, and the name of
 * the subject itself.
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
]

export function spell(text: string, spelling: Spelling): string {
  if (spelling === 'uk') return text
  let out = text
  for (const [british, american] of AMERICAN) out = out.replace(british, american)
  return out
}
