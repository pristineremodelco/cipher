import { useSettings } from '../../store'
import { numberFormat } from '../../lib/calc'

/** A date field speaks YYYY-MM-DD; the rest of the app speaks in Dates. */
export function toInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromInput(text: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  const [y, m, d] = text.split('-').map(Number)
  // Set apart, because the Date constructor reads years 0 to 99 as 1900 to 1999.
  const date = new Date(2000, m - 1, d)
  date.setFullYear(y)
  return Number.isNaN(date.getTime()) ? null : date
}

/** A plain number to so many places at most, grouped only if the settings say so. */
export function useShow() {
  const { settings } = useSettings()
  return (value: number, places = 2): string => {
    if (!Number.isFinite(value)) return ''
    return numberFormat({ maximumFractionDigits: places, useGrouping: settings.grouping }).format(value)
  }
}

const LONG = {
  long: new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  short: new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }),
}

/** A date written out in full; the weekday shortened where two dates share a line. */
export function longDate(date: Date, weekday: 'long' | 'short' = 'long'): string {
  return LONG[weekday].format(date)
}
