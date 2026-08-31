/**
 * What a key does to what is already on the display.
 *
 * The expression is held as a list of chunks rather than as one string, so a
 * backspace takes off exactly what the last press put on. Typing "sin(" and
 * then rubbing out three letters one at a time is nobody's idea of a working
 * calculator.
 */

const OPERATORS = ['+', '−', '×', '÷', '^']

/** Written by a key, read by the parser. Both spellings mean the same thing. */
export const OPERATOR_KEYS: Record<string, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
  '^': '^',
}

export type ChunkKind = 'digit' | 'operator' | 'paren' | 'function' | 'constant' | 'postfix'

export function isOperator(chunk: string): boolean {
  return OPERATORS.includes(chunk)
}

export function isOpener(chunk: string): boolean {
  return chunk.endsWith('(')
}

/** Whether a chunk finishes a value, which is what an operator may follow. */
export function endsValue(raw: string | undefined): boolean {
  if (!raw) return false
  const chunk = raw.trim()
  if (isOperator(chunk) || chunk === 'mod' || isOpener(chunk)) return false
  return true
}

export function kindOf(raw: string): ChunkKind {
  const chunk = raw.trim()
  if (isOperator(chunk) || chunk === 'mod') return 'operator'
  if (chunk === '(' || chunk === ')') return 'paren'
  if (isOpener(chunk)) return 'function'
  if (chunk === '%' || chunk === '!') return 'postfix'
  if (/^[0-9.]+$/.test(chunk)) return 'digit'
  return 'constant'
}

function openCount(chunks: string[]): number {
  let open = 0
  for (const chunk of chunks) {
    if (isOpener(chunk)) open += 1
    else if (chunk === ')') open -= 1
  }
  return open
}

/** The number being typed right now, so a second decimal point can be refused. */
function trailingNumber(chunks: string[]): string {
  let out = ''
  for (let i = chunks.length - 1; i >= 0; i -= 1) {
    if (!/^[0-9.]+$/.test(chunks[i])) break
    out = chunks[i] + out
  }
  return out
}

export function expressionOf(chunks: string[]): string {
  return chunks.join('')
}

/**
 * One press. Everything a key can do is decided here rather than in the
 * component, so the keypad, the physical keyboard and a pasted string all
 * behave identically.
 */
export function press(chunks: string[], key: string): string[] {
  const last = chunks[chunks.length - 1]

  if (/^[0-9]$/.test(key)) return [...chunks, key]

  if (key === '00') {
    // Leading zeros are noise, so on an empty number this is worth one zero.
    if (!trailingNumber(chunks)) return [...chunks, '0']
    return [...chunks, '0', '0']
  }

  if (key === '.') {
    const number = trailingNumber(chunks)
    if (number.includes('.')) return chunks
    // A point with no digit in front of it means nought point something.
    return number ? [...chunks, '.'] : [...chunks, '0', '.']
  }

  if (isOperator(key)) {
    if (!chunks.length) return key === '−' ? [key] : chunks
    // Swapping one operator for another is a correction, not a second operator.
    if (isOperator(last)) {
      if (key === '−' && (last === '×' || last === '÷' || last === '^')) return [...chunks, key]
      return [...chunks.slice(0, -1), key]
    }
    if (isOpener(last)) return key === '−' ? [...chunks, key] : chunks
    return [...chunks, key]
  }

  // A keyboard sends the two brackets separately; the keypad has one key that
  // works out which is meant.
  if (key === '(') {
    return endsValue(last) ? [...chunks, '×', '('] : [...chunks, '(']
  }

  if (key === ')') {
    if (openCount(chunks) <= 0 || !endsValue(last)) return chunks
    return [...chunks, ')']
  }

  if (key === '()') {
    if (!chunks.length || isOperator(last) || isOpener(last)) return [...chunks, '(']
    if (openCount(chunks) > 0 && endsValue(last)) return [...chunks, ')']
    // A bracket straight after a value means a product, and saying so is
    // clearer than leaning on the parser to infer it.
    return [...chunks, '×', '(']
  }

  // Written with its spaces, because "5mod3" is one word to a tokenizer and
  // "5 mod 3" is three things.
  if (key === 'mod') {
    if (!endsValue(last)) return chunks
    return [...chunks, ' mod ']
  }

  if (key === '%' || key === '!') {
    if (!endsValue(last)) return chunks
    return [...chunks, key]
  }

  // Functions and constants. A constant after a value multiplies, the same way
  // a bracket does.
  if (isOpener(key)) {
    if (endsValue(last)) return [...chunks, '×', key]
    return [...chunks, key]
  }

  if (endsValue(last) && !/^[0-9.]+$/.test(key)) return [...chunks, '×', key]
  return [...chunks, key]
}

export function backspace(chunks: string[]): string[] {
  return chunks.slice(0, -1)
}

/** An answer carried into the next sum arrives as one chunk, so it rubs out whole. */
export function seed(value: string): string[] {
  return [value]
}
