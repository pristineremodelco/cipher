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

/**
 * A palette somebody made. Three colours are asked for and the rest are worked
 * out: nobody wants to be handed nine colour pickers, and the six that are not
 * asked for are the ones with a right answer given the three that are.
 */
export type CustomPalette = {
  id: string
  name: string
  /** Behind everything. */
  ground: string
  /** The face of a key. */
  key: string
  /** Operators, brackets and the equals key. */
  accent: string
}

export type Settings = {
  /** Looks made here, offered alongside the nine that ship. */
  customPalettes: CustomPalette[]
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

  /** Which surface is showing. */
  mode: 'calculate' | 'convert' | 'tools'
  /** The tool last opened, so it reopens on that one. Empty means the grid. */
  tool: string
  /** Places kept in World Time, in the order they are shown. */
  worldZones: string[]
  /** Twelve or twenty four hour clocks, in World Time. */
  timeFormat: '12' | '24'
  /** The currency pair last used, remembered the way the converter's is. */
  currencyFrom: string
  currencyTo: string
  /** The converter's last category, so it reopens where it was left. */
  convertCategory: string
  /**
   * The pair last used in each category, as "from>to". A person who converts
   * feet to inches wants feet to inches again next time, not whatever the
   * first two units in the list happen to be.
   */
  convertPairs: Record<string, string>
}
