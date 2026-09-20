/**
 * The calculator's engine. Text in, one number out.
 *
 * Kept well away from anything that draws, so what a key does and what a key
 * looks like can never argue. The parser climbs precedence rather than sorting
 * a shunting yard, because the awkward parts here are exceptions to precedence
 * (a percent that reads its neighbour, a function used without brackets) and
 * an exception is easier to state in a grammar than to patch into a stack.
 */

export type AngleUnit = 'deg' | 'rad'

export type CalcOk = { ok: true; value: number }
/**
 * `unfinished` marks the one failure that is not a mistake: the expression ran
 * out before it meant anything, which is what every expression looks like
 * while it is being typed. A caller showing a preview holds those back; a
 * caller answering a press of equals says them.
 */
export type CalcErr = { ok: false; error: string; unfinished?: true }
export type CalcResult = CalcOk | CalcErr

const PHI = (1 + Math.sqrt(5)) / 2

/**
 * Every name the parser answers to, with the glyph a key writes. Both spellings
 * exist so a typed expression and a tapped one land on the same node: someone
 * on a keyboard writes `sqrt(2)`, the keypad writes `√(2)`.
 */
const FUNCTIONS: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  asinh: Math.asinh,
  acosh: Math.acosh,
  atanh: Math.atanh,
  log: Math.log10,
  lg: Math.log10,
  ln: Math.log,
  log2: Math.log2,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  exp: Math.exp,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  sign: Math.sign,
}

/** Trig reads the angle unit; everything else is unit free. */
const TAKES_ANGLE = new Set(['sin', 'cos', 'tan'])
const RETURNS_ANGLE = new Set(['asin', 'acos', 'atan'])

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  'π': Math.PI,
  e: Math.E,
  'φ': PHI,
  phi: PHI,
}

/** Glyphs a keypad writes, mapped to the name the parser knows. */
const GLYPH_FUNCTIONS: Record<string, string> = {
  '√': 'sqrt',
  '∛': 'cbrt',
  'log₂': 'log2',
  'sin⁻¹': 'asin',
  'cos⁻¹': 'acos',
  'tan⁻¹': 'atan',
  'sinh⁻¹': 'asinh',
  'cosh⁻¹': 'acosh',
  'tanh⁻¹': 'atanh',
}

type Token =
  | { t: 'num'; v: number }
  | { t: 'name'; v: string }
  | { t: 'op'; v: string }

type Node =
  | { k: 'num'; v: number }
  | { k: 'bin'; op: string; a: Node; b: Node }
  | { k: 'neg'; a: Node }
  | { k: 'pct'; a: Node }
  | { k: 'fact'; a: Node }
  | { k: 'fn'; name: string; a: Node }

class CalcError extends Error {
  readonly unfinished: boolean
  constructor(message: string, unfinished = false) {
    super(message)
    this.unfinished = unfinished
  }
}

function fail(message: string): never {
  throw new CalcError(message)
}

/** Failed only because there is no more to read; another key could put it right. */
function unfinished(message: string): never {
  throw new CalcError(message, true)
}

/** One canonical spelling for the several a glyph, a keyboard or a paste can use. */
function canonical(source: string): string {
  let text = source
  for (const [glyph, name] of Object.entries(GLYPH_FUNCTIONS)) {
    // A space follows the name, or the digit beside it joins on: the keypad
    // writes √9 and the tokenizer would otherwise read one word, "sqrt9".
    text = text.split(glyph).join(`${name} `)
  }
  return text
    .split('×').join('*')
    .split('·').join('*')
    .split('÷').join('/')
    .split('\u2212').join('-')
    // A dash pasted in from prose is still a minus. Written as escapes because
    // the project keeps the characters themselves out of its files.
    .split('\u2013').join('-')
    .split('\u2014').join('-')
    .split(',').join('')
    .split('²').join('^2')
    .split('³').join('^3')
    // Runs after the named glyphs above, so sin⁻¹ has already become asin and
    // only a bare reciprocal is left to read.
    .split('⁻¹').join('^-1')
}

function tokenize(source: string): Token[] {
  const text = canonical(source)
  const tokens: Token[] = []
  let i = 0

  while (i < text.length) {
    const ch = text[i]

    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i += 1
      continue
    }

    if (/[0-9.]/.test(ch)) {
      let j = i
      let dots = 0
      while (j < text.length && /[0-9.]/.test(text[j])) {
        if (text[j] === '.') dots += 1
        j += 1
      }
      if (dots > 1) fail('That number has more than one point in it')
      const raw = text.slice(i, j)
      const value = Number(raw)
      if (!Number.isFinite(value)) fail(`"${raw}" is not a number`)
      tokens.push({ t: 'num', v: value })
      i = j
      continue
    }

    if (/[a-zA-Z]/.test(ch)) {
      let j = i
      while (j < text.length && /[a-zA-Z0-9]/.test(text[j])) j += 1
      tokens.push({ t: 'name', v: text.slice(i, j).toLowerCase() })
      i = j
      continue
    }

    if (ch === 'π' || ch === 'φ') {
      tokens.push({ t: 'name', v: ch })
      i += 1
      continue
    }

    if ('+-*/^%!()'.includes(ch)) {
      tokens.push({ t: 'op', v: ch })
      i += 1
      continue
    }

    fail(`"${ch}" is not something this can work out`)
  }

  return tokens
}

/**
 * A cursor over the tokens. Kept as a closure rather than a class so each rule
 * below reads as the grammar line it implements.
 */
function parse(tokens: Token[]): Node {
  let pos = 0

  const peek = (): Token | undefined => tokens[pos]
  const isOp = (v: string) => {
    const token = peek()
    return token !== undefined && token.t === 'op' && token.v === v
  }
  const eat = (v: string) => {
    if (!isOp(v)) return false
    pos += 1
    return true
  }

  /** Whether what comes next could open a value, which is what makes 2π work. */
  const startsValue = (): boolean => {
    const token = peek()
    if (!token) return false
    if (token.t === 'num' || token.t === 'name') return true
    return token.t === 'op' && token.v === '('
  }

  function expression(): Node {
    let node = term()
    for (;;) {
      if (eat('+')) node = { k: 'bin', op: '+', a: node, b: term() }
      else if (eat('-')) node = { k: 'bin', op: '-', a: node, b: term() }
      else return node
    }
  }

  function term(): Node {
    let node = unary()
    for (;;) {
      if (eat('*')) node = { k: 'bin', op: '*', a: node, b: unary() }
      else if (eat('/')) node = { k: 'bin', op: '/', a: node, b: unary() }
      else if (peek()?.t === 'name' && (peek() as { v: string }).v === 'mod') {
        pos += 1
        node = { k: 'bin', op: 'mod', a: node, b: unary() }
      }
      // Two values side by side multiply: 2π, 3(4+1), 2sin(30). Written out
      // rather than inferred at the token level so it cannot fire across an
      // operator that is simply missing its right hand side.
      else if (startsValue()) node = { k: 'bin', op: '*', a: node, b: unary() }
      else return node
    }
  }

  function unary(): Node {
    if (eat('-')) return { k: 'neg', a: unary() }
    if (eat('+')) return unary()
    return power()
  }

  function power(): Node {
    const base = postfix()
    // Right associative, and the exponent reaches back through a sign, so
    // 2^-3 and 2^3^2 both mean what they look like.
    if (eat('^')) return { k: 'bin', op: '^', a: base, b: unary() }
    return base
  }

  function postfix(): Node {
    let node = primary()
    for (;;) {
      if (eat('%')) node = { k: 'pct', a: node }
      else if (eat('!')) node = { k: 'fact', a: node }
      else return node
    }
  }

  function primary(): Node {
    const token = peek()
    if (!token) unfinished('The expression stops early')

    if (token.t === 'num') {
      pos += 1
      return { k: 'num', v: token.v }
    }

    if (token.t === 'name') {
      pos += 1
      const name = token.v
      if (name in CONSTANTS) return { k: 'num', v: CONSTANTS[name] }
      if (name in FUNCTIONS) {
        // A function with no brackets takes the value beside it, so sqrt9+1
        // is 4 rather than the root of 10.
        if (!startsValue() && !isOp('-')) {
          // Nothing at all after it is a half typed name; something that
          // cannot be worked on is a mistake, and the two read differently.
          if (!peek()) unfinished(`${name} has nothing to work on`)
          fail(`${name} has nothing to work on`)
        }
        return { k: 'fn', name, a: unary() }
      }
      fail(`"${name}" is not a name this knows`)
    }

    if (eat('(')) {
      const inner = expression()
      // A missing closer is the ordinary state of a half typed expression, so
      // it is allowed rather than rejected: the preview line needs an answer
      // for what has been keyed in so far.
      eat(')')
      return inner
    }

    fail(`"${token.t === 'op' ? token.v : ''}" cannot start a value`)
  }

  const tree = expression()
  if (pos < tokens.length) {
    const token = tokens[pos]
    fail(`"${token.t === 'num' ? token.v : (token as { v: string }).v}" is left over at the end`)
  }
  return tree
}

const DEG = Math.PI / 180

function factorial(n: number): number {
  if (!Number.isInteger(n)) fail('A factorial wants a whole number')
  if (n < 0) fail('A factorial wants nothing below zero')
  if (n > 170) fail('That factorial is larger than this can hold')
  let total = 1
  for (let i = 2; i <= n; i += 1) total *= i
  return total
}

function evaluate(node: Node, angle: AngleUnit): number {
  switch (node.k) {
    case 'num':
      return node.v

    case 'neg':
      return -evaluate(node.a, angle)

    /** On its own a percent is just a hundredth. Beside a sum it is not; see below. */
    case 'pct':
      return evaluate(node.a, angle) / 100

    case 'fact':
      return factorial(evaluate(node.a, angle))

    case 'fn': {
      const fn = FUNCTIONS[node.name]
      const raw = evaluate(node.a, angle)
      const input = angle === 'deg' && TAKES_ANGLE.has(node.name) ? raw * DEG : raw
      const out = fn(input)
      if (Number.isNaN(out)) fail(`${node.name} has no answer for that`)
      return angle === 'deg' && RETURNS_ANGLE.has(node.name) ? out / DEG : out
    }

    case 'bin': {
      const left = evaluate(node.a, angle)

      /**
       * The percent everyone actually means. "200 + 10%" is 220, not 200.1,
       * because the ten reads as ten percent of the two hundred beside it.
       * Times and divide need no special case: there a percent really is a
       * hundredth, and 200 * 10% is 20 either way.
       */
      if ((node.op === '+' || node.op === '-') && node.b.k === 'pct') {
        const share = (left * evaluate(node.b.a, angle)) / 100
        return node.op === '+' ? left + share : left - share
      }

      const right = evaluate(node.b, angle)
      switch (node.op) {
        case '+':
          return left + right
        case '-':
          return left - right
        case '*':
          return left * right
        case '/':
          if (right === 0) fail('Nothing divides by zero')
          return left / right
        case 'mod':
          if (right === 0) fail('Nothing divides by zero')
          return left % right
        case '^': {
          const out = Math.pow(left, right)
          if (Number.isNaN(out)) fail('That power has no real answer')
          return out
        }
        default:
          return fail(`"${node.op}" is not an operator here`)
      }
    }

    default:
      return fail('That expression cannot be worked out')
  }
}

/**
 * The whole engine in one call. An empty expression is not an error, it is
 * simply nothing yet, so the preview line stays blank instead of scolding.
 */
export function calculate(expression: string, angle: AngleUnit = 'deg'): CalcResult {
  if (!expression.trim()) return { ok: false, error: '' }
  try {
    const value = evaluate(parse(tokenize(expression)), angle)
    if (!Number.isFinite(value)) {
      return { ok: false, error: Number.isNaN(value) ? 'That has no answer' : 'That answer is too large' }
    }
    return { ok: true, value }
  } catch (error) {
    if (error instanceof CalcError) {
      return error.unfinished
        ? { ok: false, error: error.message, unfinished: true }
        : { ok: false, error: error.message }
    }
    return { ok: false, error: 'That expression cannot be worked out' }
  }
}

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '-': '⁻', '+': '',
}

function superscript(value: string): string {
  return value.split('').map((ch) => SUPERSCRIPT[ch] ?? ch).join('')
}

/** Past this a fixed number is a wall of digits, so it is written as a power instead. */
const BIG = 1e15
const SMALL = 1e-9

export type NumberFormat = {
  /** Fixed places, or -1 to keep whatever the answer has. */
  decimals: number
  grouping: boolean
  /**
   * Whether a fixed number of places is padded out when the answer does not
   * need it. Off, two places shows 100 as 100 and 1.5 as 1.50; on, 100 reads
   * 100.00, which is what a ledger wants and what most people do not.
   */
  padDecimals?: boolean
}

/**
 * Binary floating point cannot hold a tenth, so 0.1 + 0.2 lands a hair above
 * 0.3. Rounding to fifteen significant figures throws that hair away without
 * touching any digit a person actually entered.
 */
function settle(value: number): number {
  return Number(value.toPrecision(15))
}

export function formatNumber(value: number, format: NumberFormat): string {
  if (!Number.isFinite(value)) return Number.isNaN(value) ? 'Undefined' : '∞'
  const settled = settle(value)
  const size = Math.abs(settled)

  if (size !== 0 && (size >= BIG || size < SMALL)) {
    const [mantissa, exponent] = settled.toExponential(9).split('e')
    const trimmed = Number(mantissa).toString()
    return `${trimmed}×10${superscript(exponent)}`
  }

  const digits = format.decimals >= 0 ? format.decimals : 12
  const text = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: format.decimals >= 0 && format.padDecimals ? format.decimals : 0,
    maximumFractionDigits: Math.min(20, digits),
    useGrouping: format.grouping,
  }).format(settled)
  // A negative that rounds onto zero should read as zero rather than as minus
  // zero, at whatever number of places is being shown.
  return /^-[0.,]*$/.test(text) ? text.slice(1) : text
}

/**
 * A measurement, rather than an answer.
 *
 * A conversion is a measured quantity, so what matters is significant figures
 * and not decimal places: twelve feet in yards is 3.3333333333 and nobody
 * wants eleven threes, while 34,137,600,000 nanometres wants every digit it
 * has. Eight significant figures gives both, and the count of decimals falls
 * out of how large the number is rather than being fixed in advance.
 */
const MEASURE_DIGITS = 8

export function formatMeasure(value: number, grouping: boolean): string {
  if (!Number.isFinite(value)) return Number.isNaN(value) ? 'Undefined' : '∞'
  const settled = settle(value)
  const size = Math.abs(settled)
  if (size !== 0 && (size >= BIG || size < SMALL)) return formatNumber(settled, { decimals: -1, grouping })

  const integerDigits = size >= 1 ? Math.floor(Math.log10(size)) + 1 : 1 + Math.floor(Math.log10(size || 1))
  const places = Math.max(0, Math.min(20, MEASURE_DIGITS - (size >= 1 ? integerDigits : integerDigits)))
  const text = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: places,
    useGrouping: grouping,
  }).format(settled)
  return /^-[0.,]*$/.test(text) ? text.slice(1) : text
}

/** What the history list and the clipboard get: no grouping, full precision. */
export function plainNumber(value: number): string {
  if (!Number.isFinite(value)) return Number.isNaN(value) ? 'Undefined' : '∞'
  return String(settle(value))
}
