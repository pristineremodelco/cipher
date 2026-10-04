import { useSettings } from '../../store'

/** A date field speaks YYYY-MM-DD; the rest of the app speaks in Dates. */
export function toInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromInput(text: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  const [y, m, d] = text.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}

/** A plain number to so many places at most, grouped only if the settings say so. */
export function useShow() {
  const { settings } = useSettings()
  return (value: number, places = 2): string => {
    if (!Number.isFinite(value)) return ''
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: places,
      useGrouping: settings.grouping,
    }).format(value)
  }
}
