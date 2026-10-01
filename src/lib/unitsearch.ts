import { CATEGORIES, type Category, type Unit } from './units.ts'

/**
 * Finding a unit by typing it, across every category at once.
 *
 * People type units the way they say them: plural, American, abbreviated,
 * misspelt. "lbs", "liters", "feet", "kph" and "celcius" all have to land, so
 * what is typed and what a unit is called are both worn down to a common form
 * before they are compared, and a short list of the usual alternatives covers
 * what spelling rules cannot.
 */

export type Found = { category: Category; unit: Unit }

/** Category and unit together, since several ids repeat across categories. */
export function keyOf(found: Found): string {
  return `${found.category.id}:${found.unit.id}`
}

export function fromKey(key: string): Found | undefined {
  const [categoryId, unitId] = key.split(':')
  const category = CATEGORIES.find((item) => item.id === categoryId)
  const unit = category?.units.find((item) => item.id === unitId)
  return category && unit ? { category, unit } : undefined
}

/** What else a unit gets called, beyond its name, symbol and plural. */
const ALSO: Record<string, string[]> = {
  'length:ft': ['feet'],
  'length:um': ['micron'],
  'mass:kg': ['kilo'],
  'mass:t': ['metric ton'],
  'mass:ton': ['tons', 'short ton'],
  'volume:cm3': ['cc'],
  'volume:l': ['ltr'],
  'temperature:c': ['centigrade', 'celcius'],
  'temperature:f': ['farenheit', 'fahrenheight'],
  'speed:kmh': ['kph', 'kmph'],
  'speed:ms': ['mps'],
  'speed:knot': ['kt'],
  'time:h': ['hr', 'hrs'],
  'time:s': ['sec', 'secs'],
  'time:min': ['mins'],
  'time:year': ['yrs'],
  'resistance:ohm': ['ohms'],
  'resistance:kohm': ['kiloohm'],
  'resistance:megohm': ['megaohm'],
  'fuel:l100km': ['l/100km'],
}

/** Lower case, American spelling, plain symbols. */
export function plain(text: string): string {
  return text
    .toLowerCase()
    .replace(/µ/g, 'u')
    .replace(/°/g, '')
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .replace(/metre/g, 'meter')
    .replace(/litre/g, 'liter')
    .replace(/\bsq\.? /g, 'square ')
    .replace(/\bcu\.? /g, 'cubic ')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

type Entry = Found & { symbol: string; terms: string[]; name: string; words: string[] }

const ENTRIES: Entry[] = CATEGORIES.flatMap((category) =>
  category.units.map((unit) => {
    const name = plain(unit.name)
    return {
      category,
      unit,
      symbol: unit.symbol,
      name,
      words: name.split(' '),
      terms: [plain(unit.symbol), unit.id, ...(ALSO[`${category.id}:${unit.id}`] ?? []).map(plain)],
    }
  }),
)

/** How well one form of the query names one unit; nothing below 30 counts. */
function score(entry: Entry, query: string, raw: string): number {
  if (raw === entry.symbol) return 120
  if (entry.terms.includes(query)) return 100
  if (entry.name === query) return 95
  if (entry.name.startsWith(query)) return 80
  if (entry.words.some((word) => word.startsWith(query))) return 70
  if (entry.terms.some((term) => term.length > 1 && term.startsWith(query))) return 65
  if (plain(entry.category.name).startsWith(query)) return 40
  if (query.length > 2 && entry.name.includes(query)) return 30
  return 0
}

/** The query as typed, and as it would be without a plural on the end. */
function forms(query: string): [string, number][] {
  const out: [string, number][] = [[query, 0]]
  // "sq ft" and "square ft" are a name half written as a symbol: ft².
  const power = /^(square|cubic) (.+)$/.exec(query)
  if (power) out.push([`${power[2]}${power[1] === 'square' ? 2 : 3}`, 0])
  if (query.length > 2 && query.endsWith('es')) out.push([query.slice(0, -2), 2])
  if (query.length > 1 && query.endsWith('s')) out.push([query.slice(0, -1), 2])
  return out
}

/**
 * Every unit the query could mean, best first. An empty query is not a search
 * and answers with nothing; the caller lists everything itself.
 */
export function findUnits(query: string, within?: Category): (Found & { score: number })[] {
  const raw = query.trim()
  const wanted = plain(raw)
  if (!wanted) return []
  const found: (Found & { score: number; order: number })[] = []
  ENTRIES.forEach((entry, order) => {
    if (within && entry.category.id !== within.id) return
    let best = 0
    for (const [form, cost] of forms(wanted)) best = Math.max(best, score(entry, form, raw) - cost)
    if (best >= 30) found.push({ category: entry.category, unit: entry.unit, score: best, order })
  })
  return found.sort((a, b) => b.score - a.score || a.order - b.order).map(({ order: _order, ...rest }) => rest)
}

export type Pair = { from: Found; to: Found; value?: number }

/**
 * "5 grams to lbs", "g to lb", "ft in m", "c -> f": both sides at once, and
 * the amount if one leads. The two sides have to be the same kind of thing, so
 * of everything each side could mean, the best pair that agrees is taken:
 * "m to ft" is metres, not minutes or miles per hour.
 */
export function parsePair(query: string): Pair | null {
  const text = query.trim()
  let sides = text.split(/\s+to\s+|\s*(?:→|->|=>)\s*/i)
  if (sides.length !== 2) {
    // "in" is also an inch, so only the last one is read as the word.
    const at = text.toLowerCase().lastIndexOf(' in ')
    sides = at > 0 ? [text.slice(0, at), text.slice(at + 4)] : []
  }
  if (sides.length !== 2) return null
  let [left, right] = sides.map((side) => side.trim())
  let value: number | undefined
  const amount = /^(-?(?:\d[\d,]*\.?\d*|\.\d+))\s*/.exec(left)
  if (amount) {
    value = Number(amount[1].replace(/,/g, ''))
    left = left.slice(amount[0].length)
  }
  if (!left || !right) return null
  const lefts = findUnits(left).slice(0, 12)
  const rights = findUnits(right).slice(0, 12)
  let best: Pair | null = null
  let bestScore = 0
  for (const a of lefts) {
    for (const b of rights) {
      if (a.category.id !== b.category.id || a.unit.id === b.unit.id) continue
      if (a.score + b.score > bestScore) {
        bestScore = a.score + b.score
        best = { from: a, to: b, value: Number.isFinite(value) ? value : undefined }
      }
    }
  }
  return best
}
