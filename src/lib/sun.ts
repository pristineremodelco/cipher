/**
 * Whether the sun is up, worked out on the device from where it is and what
 * time it is. No service is asked: the sun's position is arithmetic.
 *
 * The usual low-precision formulas, good to a minute or so of the published
 * times, which is far finer than anyone can tell a palette change by. Day and
 * night split where sunrise and sunset do, with the sun's centre 0.833° below
 * the horizon: its own radius, plus the air bending the last of it into view.
 */
export type Place = { lat: number; lon: number }

const RAD = Math.PI / 180
const HORIZON = -0.833

/** The sun's height above the horizon in degrees, at that moment and place. */
export function sunAltitude(date: Date, { lat, lon }: Place): number {
  const days = date.getTime() / 86400000 - 10957.5 // since noon, 1 January 2000
  const meanLongitude = 280.46 + 0.9856474 * days
  const anomaly = (357.528 + 0.9856003 * days) * RAD
  const longitude = (meanLongitude + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * RAD
  const tilt = (23.439 - 0.0000004 * days) * RAD
  const declination = Math.asin(Math.sin(tilt) * Math.sin(longitude))
  const ascension = Math.atan2(Math.cos(tilt) * Math.sin(longitude), Math.cos(longitude))
  const sidereal = (280.46061837 + 360.98564736629 * days + lon) * RAD
  const hourAngle = sidereal - ascension
  const height = Math.asin(
    Math.sin(lat * RAD) * Math.sin(declination) + Math.cos(lat * RAD) * Math.cos(declination) * Math.cos(hourAngle),
  )
  return height / RAD
}

export function isDark(date: Date, place: Place): boolean {
  return sunAltitude(date, place) < HORIZON
}

/**
 * The next sunrise or sunset after this moment, whichever comes first, or null
 * if there is neither in the next two days: the polar night, or the midnight
 * sun. Found by stepping ten minutes at a time and then halving the step that
 * crossed, rather than by the closed formula, which breaks down near the poles.
 */
export function nextChange(date: Date, place: Place): Date | null {
  const step = 10 * 60000
  const start = isDark(date, place)
  for (let t = date.getTime() + step; t <= date.getTime() + 48 * 3600000; t += step) {
    if (isDark(new Date(t), place) === start) continue
    let before = t - step
    let after = t
    while (after - before > 15000) {
      const middle = (before + after) / 2
      if (isDark(new Date(middle), place) === start) before = middle
      else after = middle
    }
    return new Date(after)
  }
  return null
}

/** Rounded to about a kilometre: plenty for the sun, and no more than that is kept. */
export function roughly(lat: number, lon: number): Place {
  return { lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 }
}
