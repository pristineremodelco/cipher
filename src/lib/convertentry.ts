/**
 * Typing into the converter, kept apart from the screen so it can be tested.
 */

/**
 * A number being typed, held as text rather than as a number.
 *
 * "1.50" and "1.5" are the same number and different things to type, and a
 * field that renders back what it parsed cannot let anyone key the first one
 * at all: the trailing zero would vanish under their thumb.
 */
export function typed(current: string, key: string): string {
  if (key === 'back') return current.slice(0, -1)
  if (key === 'clear') return ''
  if (key === 'sign') {
    if (!current) return '-'
    return current.startsWith('-') ? current.slice(1) : `-${current}`
  }
  if (key === '.') {
    if (current.includes('.')) return current
    return current === '' || current === '-' ? `${current}0.` : `${current}.`
  }
  // Nothing but a sign or a nought yet, and a double nought would only be more
  // noughts in front of a number that has not started.
  if (key === '00') return /^-?0?$/.test(current) ? current : `${current}00`
  if (current === '0') return key
  if (current === '-0') return `-${key}`
  return current + key
}

/**
 * A result taken up as the number being typed. Twelve figures, which is more
 * than the readings show and few enough to drop floating point's noise, and
 * never with an exponent: a reading of 1e-12 in the typing row is not a number
 * anyone would type, and the next digit pressed would land on the exponent.
 */
export function asEntry(value: number): string {
  return Number(value.toPrecision(12)).toLocaleString('en-US', { useGrouping: false, maximumSignificantDigits: 12 })
}

/**
 * The number in the typing row, and whether it was put there rather than typed.
 *
 * The opening 1, and a reading taken up after a swap or a change of row, are
 * there to be typed over: the first digit replaces them, the way a fresh
 * calculator's nought is replaced, rather than landing on the end of them and
 * turning 1 into 15 when 5 was meant.
 */
export type Entry = { text: string; placed: boolean; signed: boolean }

export function placed(text: string): Entry {
  return { text, placed: true, signed: false }
}

export function pressEntry(current: Entry, key: string): Entry {
  // A sign pressed first is kept for what is typed next, so ± then 4 is -4
  // and not the -14 it would be if the sign landed on the 1.
  if (current.placed && key === 'sign') return { text: typed(current.text, key), placed: true, signed: true }
  const over = current.placed && /^(?:[0-9.]|00)$/.test(key)
  const start = current.signed && current.text.startsWith('-') ? '-' : ''
  return { text: typed(over ? start : current.text, key), placed: false, signed: false }
}
