/**
 * A number as people type it into a form: 1,000 with its grouping, $25 with
 * its sign, 6.5% with its percent. Number() alone refuses all three, and a
 * price of "1,000" quietly worked out as nothing.
 */
export function readNumber(text: string): number {
  return Number(text.replace(/[\s,$%]/g, ''))
}
