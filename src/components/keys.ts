/**
 * What is on the keypad, and nothing about how it is drawn.
 *
 * Each row is three keys plus the one that belongs to the operator column, so
 * the column can be sent to either edge without the digits turning round with
 * it. A left handed layout that also read "9 8 7" would be a bug, not a
 * setting.
 */
export type Key = {
  /** What is written on the key. */
  label: string
  /** What pressing it feeds to the input rules. Defaults to the label. */
  press?: string
  kind: 'digit' | 'operator' | 'action' | 'equals'
  aria?: string
}

export const ROWS: { main: Key[]; side: Key }[] = [
  {
    main: [
      { label: 'C', kind: 'action', aria: 'Clear' },
      { label: '( )', press: '()', kind: 'action', aria: 'Brackets' },
      { label: '%', kind: 'action' },
    ],
    side: { label: '÷', kind: 'operator', aria: 'Divide' },
  },
  {
    main: [
      { label: '7', kind: 'digit' },
      { label: '8', kind: 'digit' },
      { label: '9', kind: 'digit' },
    ],
    side: { label: '×', kind: 'operator', aria: 'Multiply' },
  },
  {
    main: [
      { label: '4', kind: 'digit' },
      { label: '5', kind: 'digit' },
      { label: '6', kind: 'digit' },
    ],
    side: { label: '−', kind: 'operator', aria: 'Minus' },
  },
  {
    main: [
      { label: '1', kind: 'digit' },
      { label: '2', kind: 'digit' },
      { label: '3', kind: 'digit' },
    ],
    side: { label: '+', kind: 'operator', aria: 'Plus' },
  },
  {
    main: [
      { label: '0', kind: 'digit' },
      { label: '00', kind: 'digit' },
      { label: '.', kind: 'digit', aria: 'Point' },
    ],
    side: { label: '=', kind: 'equals', aria: 'Equals' },
  },
]

/**
 * The scientific set, three to a row so a thumb can reach any of them on a
 * phone, and nine rows exactly, so no row is left half full. Grouped the way
 * they are learned: constants, logs, roots, the powers, then the trig families
 * in order.
 */
export const SCIENTIFIC: { label: string; press: string; aria?: string }[] = [
  { label: 'π', press: 'π', aria: 'Pi' },
  { label: 'e', press: 'e', aria: "Euler's number" },
  { label: 'φ', press: 'φ', aria: 'Golden ratio' },
  { label: 'log', press: 'log(' },
  { label: 'ln', press: 'ln(' },
  { label: 'log₂', press: 'log₂(' },
  { label: '√', press: '√(', aria: 'Square root' },
  { label: '∛', press: '∛(', aria: 'Cube root' },
  { label: '|x|', press: 'abs(', aria: 'Absolute value' },
  // Written as the glyph rather than as ^2, so the display reads 5² and a
  // single rub-out takes the whole thing off again.
  { label: 'x²', press: '²', aria: 'Squared' },
  { label: 'x³', press: '³', aria: 'Cubed' },
  { label: 'x⁻¹', press: '⁻¹', aria: 'Reciprocal' },
  { label: 'x!', press: '!', aria: 'Factorial' },
  { label: 'mod', press: 'mod', aria: 'Remainder' },
  { label: 'Ans', press: 'ans', aria: 'The last answer' },
  { label: 'sin', press: 'sin(' },
  { label: 'cos', press: 'cos(' },
  { label: 'tan', press: 'tan(' },
  { label: 'sin⁻¹', press: 'sin⁻¹(', aria: 'Inverse sine' },
  { label: 'cos⁻¹', press: 'cos⁻¹(', aria: 'Inverse cosine' },
  { label: 'tan⁻¹', press: 'tan⁻¹(', aria: 'Inverse tangent' },
  { label: 'sinh', press: 'sinh(' },
  { label: 'cosh', press: 'cosh(' },
  { label: 'tanh', press: 'tanh(' },
  { label: 'sinh⁻¹', press: 'sinh⁻¹(', aria: 'Inverse hyperbolic sine' },
  { label: 'cosh⁻¹', press: 'cosh⁻¹(', aria: 'Inverse hyperbolic cosine' },
  { label: 'tanh⁻¹', press: 'tanh⁻¹(', aria: 'Inverse hyperbolic tangent' },
]

/**
 * Physical keys that mean the same as a key on the pad.
 *
 * Letters are deliberately not among them. Binding s to sine and n to natural
 * log reads well in a list and is unusable in practice: anyone typing the word
 * "sin" gets a sine, then nothing, then a log. The named functions are one tap
 * away, which is honest about this being a keypad and not a text field.
 */
export const TYPED: Record<string, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  x: '×',
  '/': '÷',
  '^': '^',
  '(': '(',
  ')': ')',
  '.': '.',
  ',': '.',
  '%': '%',
  '!': '!',
}
