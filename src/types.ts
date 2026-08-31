/** Whether trig works in degrees or in radians. */
export type AngleUnit = 'deg' | 'rad'

/** All system stacks. Nothing is fetched, so the app looks right offline. */
export type FontId = 'system' | 'grotesk' | 'humanist' | 'rounded' | 'serif' | 'mono' | 'legible'

/** How a key sits on the surface. Colour is the palette's business, not this. */
export type KeyStyle = 'raised' | 'flat' | 'outline' | 'contrast'
export type KeyShape = 'sharp' | 'soft' | 'round' | 'circle'
export type TextSize = 'sm' | 'md' | 'lg' | 'xl'
/** Which side the operator column sits on, for whichever thumb is holding it. */
export type Layout = 'right' | 'left'
/** The bottom row: a zero and a double zero, or one wide zero. */
export type ZeroKey = 'double' | 'wide'

export type Settings = {
  /** The palette worn by day, or at all times when the device is not followed. */
  palette: string
  /** The one worn when the device says it is dark and followDevice is on. */
  nightPalette: string
  /**
   * Whether the device's own light or dark setting picks between the two.
   * A calculator gets opened at three in the morning more than most things do.
   */
  followDevice: boolean
  /** Overrides the palette's accent. Empty string keeps the palette's own. */
  accent: string
  fontId: FontId
  textSize: TextSize
  boldText: boolean
  keyStyle: KeyStyle
  keyShape: KeyShape
  /** How large the answer is drawn, 0.8 to 1.8 of the usual. */
  displayScale: number
  layout: Layout
  zeroKey: ZeroKey

  angle: AngleUnit
  /** Places to show, or -1 to show whatever the answer has. */
  decimals: number
  /** Thousands separators in the answer. Never in the expression. */
  grouping: boolean
  /** A short buzz under each key, where the device can do one. */
  haptics: boolean
  /** Whether working is kept as a tape. Off means nothing is written down. */
  keepHistory: boolean
  /** The memory row: MC, MR, M+, M-. */
  memoryRow: boolean
}
