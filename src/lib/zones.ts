/**
 * World time, worked out on the device.
 *
 * This one looks as though it should need a signal and does not: every browser
 * ships the whole IANA time zone database, so what time it is in Tokyo is a
 * question the device can already answer with the aeroplane mode on. The only
 * thing a network would add is a more accurate idea of what time it is here,
 * which the device's own clock already has.
 */

export type Zone = { id: string; city: string; region: string }

/** A starting list. Any zone the browser knows can be added to it. */
export const ZONES: Zone[] = [
  { id: 'America/Los_Angeles', city: 'Los Angeles', region: 'Pacific' },
  { id: 'America/Denver', city: 'Denver', region: 'Mountain' },
  { id: 'America/Chicago', city: 'Chicago', region: 'Central' },
  { id: 'America/New_York', city: 'New York', region: 'Eastern' },
  { id: 'America/Phoenix', city: 'Phoenix', region: 'Arizona' },
  { id: 'America/Anchorage', city: 'Anchorage', region: 'Alaska' },
  { id: 'Pacific/Honolulu', city: 'Honolulu', region: 'Hawaii' },
  { id: 'America/Toronto', city: 'Toronto', region: 'Canada' },
  { id: 'America/Mexico_City', city: 'Mexico City', region: 'Mexico' },
  { id: 'America/Sao_Paulo', city: 'Sao Paulo', region: 'Brazil' },
  { id: 'Europe/London', city: 'London', region: 'United Kingdom' },
  { id: 'Europe/Dublin', city: 'Dublin', region: 'Ireland' },
  { id: 'Europe/Paris', city: 'Paris', region: 'France' },
  { id: 'Europe/Berlin', city: 'Berlin', region: 'Germany' },
  { id: 'Europe/Madrid', city: 'Madrid', region: 'Spain' },
  { id: 'Europe/Rome', city: 'Rome', region: 'Italy' },
  { id: 'Europe/Moscow', city: 'Moscow', region: 'Russia' },
  { id: 'Africa/Lagos', city: 'Lagos', region: 'Nigeria' },
  { id: 'Africa/Johannesburg', city: 'Johannesburg', region: 'South Africa' },
  { id: 'Africa/Cairo', city: 'Cairo', region: 'Egypt' },
  { id: 'Asia/Dubai', city: 'Dubai', region: 'UAE' },
  { id: 'Asia/Karachi', city: 'Karachi', region: 'Pakistan' },
  { id: 'Asia/Kolkata', city: 'Mumbai', region: 'India' },
  { id: 'Asia/Bangkok', city: 'Bangkok', region: 'Thailand' },
  { id: 'Asia/Singapore', city: 'Singapore', region: 'Singapore' },
  { id: 'Asia/Shanghai', city: 'Shanghai', region: 'China' },
  { id: 'Asia/Hong_Kong', city: 'Hong Kong', region: 'Hong Kong' },
  { id: 'Asia/Tokyo', city: 'Tokyo', region: 'Japan' },
  { id: 'Asia/Seoul', city: 'Seoul', region: 'South Korea' },
  { id: 'Australia/Perth', city: 'Perth', region: 'Australia' },
  { id: 'Australia/Sydney', city: 'Sydney', region: 'Australia' },
  { id: 'Pacific/Auckland', city: 'Auckland', region: 'New Zealand' },
]

/** Whether the browser will accept this as a zone at all. */
export function isValidZone(id: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: id })
    return true
  } catch {
    return false
  }
}

export function deviceZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function zoneOf(id: string): Zone {
  return ZONES.find((zone) => zone.id === id) ?? { id, city: id.split('/').pop()?.replace(/_/g, ' ') ?? id, region: '' }
}

export function timeIn(zone: string, at: Date, hour12: boolean): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour: 'numeric',
      minute: '2-digit',
      hour12,
    }).format(at)
  } catch {
    return ''
  }
}

export function dayIn(zone: string, at: Date): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(at)
  } catch {
    return ''
  }
}

/**
 * How far ahead or behind somewhere is, in hours, worked out by formatting one
 * instant in both zones and comparing. Doing it this way rather than by
 * tabulating offsets means daylight saving is already handled: the browser
 * knows which side of the changeover a date falls on and this does not have to.
 */
export function offsetHours(zone: string, from: string, at: Date): number {
  const read = (id: string) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: id,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(at)
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)
    // Hour 24 is how some engines write midnight in this format.
    return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'))
  }
  try {
    return (read(zone) - read(from)) / 3600000
  } catch {
    return 0
  }
}

export function offsetLabel(hours: number): string {
  if (hours === 0) return 'Same time'
  const sign = hours > 0 ? '+' : '−'
  const size = Math.abs(hours)
  const whole = Math.floor(size)
  const minutes = Math.round((size - whole) * 60)
  return `${sign}${whole}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''} h`
}
