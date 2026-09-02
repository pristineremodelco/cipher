/**
 * What one unit is in terms of another.
 *
 * Every factor here is the exact defined value where one exists, not a rounded
 * one off a conversion chart: a foot is 0.3048 metres by definition, a pound is
 * 0.45359237 kilograms, a US gallon is 3.785411784 litres. Rounding those at
 * the source is how a conversion comes out right at three digits and wrong at
 * eight, and a person measuring a run of trim deserves the eight.
 *
 * Most units are a plain multiple of their category's base, so a factor is all
 * they need. The three that are not (temperature, which has an offset, and fuel
 * economy, where half the units are the reciprocal of the other half) carry a
 * pair of functions instead.
 */

export type Unit = {
  id: string
  name: string
  symbol: string
  /** How many base units one of these is. Omitted when `to` and `from` are given. */
  factor?: number
  /** For units that are not a plain multiple: this one to the base. */
  to?: (value: number) => number
  /** And back again. */
  from?: (base: number) => number
}

export type Category = {
  id: string
  name: string
  units: Unit[]
}

const FOOT = 0.3048
const INCH = 0.0254
const POUND = 0.45359237
const US_GALLON = 3.785411784
const UK_GALLON = 4.54609
const US_FL_OZ = US_GALLON / 128
const MILE = 1609.344
/** Standard gravity, which is what turns a pound of force into newtons. */
const GRAVITY = 9.80665
/** A foot pound of energy, from its definition rather than from a chart. */
const FOOT_POUND = FOOT * POUND * GRAVITY

export const CATEGORIES: Category[] = [
  {
    id: 'length',
    name: 'Length',
    units: [
      { id: 'mm', name: 'Millimetre', symbol: 'mm', factor: 0.001 },
      { id: 'cm', name: 'Centimetre', symbol: 'cm', factor: 0.01 },
      { id: 'm', name: 'Metre', symbol: 'm', factor: 1 },
      { id: 'km', name: 'Kilometre', symbol: 'km', factor: 1000 },
      { id: 'in', name: 'Inch', symbol: 'in', factor: INCH },
      { id: 'ft', name: 'Foot', symbol: 'ft', factor: FOOT },
      { id: 'yd', name: 'Yard', symbol: 'yd', factor: 0.9144 },
      { id: 'mi', name: 'Mile', symbol: 'mi', factor: MILE },
      { id: 'nmi', name: 'Nautical mile', symbol: 'nmi', factor: 1852 },
      { id: 'um', name: 'Micrometre', symbol: 'µm', factor: 1e-6 },
      { id: 'nm', name: 'Nanometre', symbol: 'nm', factor: 1e-9 },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    units: [
      { id: 'mm2', name: 'Square millimetre', symbol: 'mm²', factor: 1e-6 },
      { id: 'cm2', name: 'Square centimetre', symbol: 'cm²', factor: 1e-4 },
      { id: 'm2', name: 'Square metre', symbol: 'm²', factor: 1 },
      { id: 'km2', name: 'Square kilometre', symbol: 'km²', factor: 1e6 },
      { id: 'in2', name: 'Square inch', symbol: 'in²', factor: INCH ** 2 },
      { id: 'ft2', name: 'Square foot', symbol: 'ft²', factor: FOOT ** 2 },
      { id: 'yd2', name: 'Square yard', symbol: 'yd²', factor: 0.9144 ** 2 },
      { id: 'acre', name: 'Acre', symbol: 'ac', factor: 4046.8564224 },
      { id: 'ha', name: 'Hectare', symbol: 'ha', factor: 10000 },
      { id: 'mi2', name: 'Square mile', symbol: 'mi²', factor: MILE ** 2 },
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    units: [
      { id: 'ml', name: 'Millilitre', symbol: 'mL', factor: 0.001 },
      { id: 'l', name: 'Litre', symbol: 'L', factor: 1 },
      { id: 'm3', name: 'Cubic metre', symbol: 'm³', factor: 1000 },
      { id: 'cm3', name: 'Cubic centimetre', symbol: 'cm³', factor: 0.001 },
      { id: 'in3', name: 'Cubic inch', symbol: 'in³', factor: INCH ** 3 * 1000 },
      { id: 'ft3', name: 'Cubic foot', symbol: 'ft³', factor: FOOT ** 3 * 1000 },
      { id: 'yd3', name: 'Cubic yard', symbol: 'yd³', factor: 0.9144 ** 3 * 1000 },
      { id: 'tsp', name: 'Teaspoon (US)', symbol: 'tsp', factor: US_FL_OZ / 6 },
      { id: 'tbsp', name: 'Tablespoon (US)', symbol: 'tbsp', factor: US_FL_OZ / 2 },
      { id: 'floz', name: 'Fluid ounce (US)', symbol: 'fl oz', factor: US_FL_OZ },
      { id: 'cup', name: 'Cup (US)', symbol: 'cup', factor: US_GALLON / 16 },
      { id: 'pt', name: 'Pint (US)', symbol: 'pt', factor: US_GALLON / 8 },
      { id: 'qt', name: 'Quart (US)', symbol: 'qt', factor: US_GALLON / 4 },
      { id: 'gal', name: 'Gallon (US)', symbol: 'gal', factor: US_GALLON },
      { id: 'ukfloz', name: 'Fluid ounce (UK)', symbol: 'fl oz UK', factor: UK_GALLON / 160 },
      { id: 'ukpt', name: 'Pint (UK)', symbol: 'pt UK', factor: UK_GALLON / 8 },
      { id: 'ukgal', name: 'Gallon (UK)', symbol: 'gal UK', factor: UK_GALLON },
    ],
  },
  {
    id: 'mass',
    name: 'Mass',
    units: [
      { id: 'mg', name: 'Milligram', symbol: 'mg', factor: 1e-6 },
      { id: 'g', name: 'Gram', symbol: 'g', factor: 0.001 },
      { id: 'kg', name: 'Kilogram', symbol: 'kg', factor: 1 },
      { id: 't', name: 'Tonne', symbol: 't', factor: 1000 },
      { id: 'oz', name: 'Ounce', symbol: 'oz', factor: POUND / 16 },
      { id: 'lb', name: 'Pound', symbol: 'lb', factor: POUND },
      { id: 'st', name: 'Stone', symbol: 'st', factor: POUND * 14 },
      { id: 'ton', name: 'Ton (US short)', symbol: 'ton', factor: POUND * 2000 },
      { id: 'longton', name: 'Ton (long)', symbol: 'long ton', factor: POUND * 2240 },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C', to: (v) => v, from: (b) => b },
      { id: 'f', name: 'Fahrenheit', symbol: '°F', to: (v) => ((v - 32) * 5) / 9, from: (b) => (b * 9) / 5 + 32 },
      { id: 'k', name: 'Kelvin', symbol: 'K', to: (v) => v - 273.15, from: (b) => b + 273.15 },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    units: [
      { id: 'ms', name: 'Metres per second', symbol: 'm/s', factor: 1 },
      { id: 'kmh', name: 'Kilometres per hour', symbol: 'km/h', factor: 1 / 3.6 },
      { id: 'mph', name: 'Miles per hour', symbol: 'mph', factor: 0.44704 },
      { id: 'fts', name: 'Feet per second', symbol: 'ft/s', factor: FOOT },
      { id: 'knot', name: 'Knot', symbol: 'kn', factor: 1852 / 3600 },
    ],
  },
  {
    id: 'time',
    name: 'Time',
    units: [
      { id: 'ms', name: 'Millisecond', symbol: 'ms', factor: 0.001 },
      { id: 's', name: 'Second', symbol: 's', factor: 1 },
      { id: 'min', name: 'Minute', symbol: 'min', factor: 60 },
      { id: 'h', name: 'Hour', symbol: 'h', factor: 3600 },
      { id: 'day', name: 'Day', symbol: 'd', factor: 86400 },
      { id: 'week', name: 'Week', symbol: 'wk', factor: 604800 },
      // A month has no fixed length, so the two here are named for what they
      // are rather than offered as if they were exact.
      { id: 'month', name: 'Month (30 days)', symbol: 'mo', factor: 2592000 },
      { id: 'year', name: 'Year (365 days)', symbol: 'yr', factor: 31536000 },
    ],
  },
  {
    id: 'data',
    name: 'Data',
    units: [
      { id: 'bit', name: 'Bit', symbol: 'bit', factor: 0.125 },
      { id: 'b', name: 'Byte', symbol: 'B', factor: 1 },
      { id: 'kb', name: 'Kilobyte', symbol: 'kB', factor: 1e3 },
      { id: 'mb', name: 'Megabyte', symbol: 'MB', factor: 1e6 },
      { id: 'gb', name: 'Gigabyte', symbol: 'GB', factor: 1e9 },
      { id: 'tb', name: 'Terabyte', symbol: 'TB', factor: 1e12 },
      // The powers of two, which is what an operating system usually means
      // when it says GB. Both are here because both are in daily use.
      { id: 'kib', name: 'Kibibyte', symbol: 'KiB', factor: 1024 },
      { id: 'mib', name: 'Mebibyte', symbol: 'MiB', factor: 1024 ** 2 },
      { id: 'gib', name: 'Gibibyte', symbol: 'GiB', factor: 1024 ** 3 },
      { id: 'tib', name: 'Tebibyte', symbol: 'TiB', factor: 1024 ** 4 },
    ],
  },
  {
    id: 'pressure',
    name: 'Pressure',
    units: [
      { id: 'pa', name: 'Pascal', symbol: 'Pa', factor: 1 },
      { id: 'kpa', name: 'Kilopascal', symbol: 'kPa', factor: 1000 },
      { id: 'bar', name: 'Bar', symbol: 'bar', factor: 100000 },
      { id: 'psi', name: 'Pound per square inch', symbol: 'psi', factor: 6894.757293168 },
      { id: 'atm', name: 'Atmosphere', symbol: 'atm', factor: 101325 },
      // The defined millimetre of mercury, which is not quite the torr: a
      // torr is one seven-hundred-and-sixtieth of an atmosphere exactly, so
      // an atmosphere comes to 759.99989 mmHg rather than a round 760. The
      // gap is one part in seven million and the defined value is the right
      // one to hold.
      { id: 'mmhg', name: 'Millimetre of mercury', symbol: 'mmHg', factor: 133.322387415 },
      { id: 'inhg', name: 'Inch of mercury', symbol: 'inHg', factor: 3386.388640341 },
    ],
  },
  {
    id: 'energy',
    name: 'Energy',
    units: [
      { id: 'j', name: 'Joule', symbol: 'J', factor: 1 },
      { id: 'kj', name: 'Kilojoule', symbol: 'kJ', factor: 1000 },
      { id: 'cal', name: 'Calorie', symbol: 'cal', factor: 4.184 },
      { id: 'kcal', name: 'Kilocalorie', symbol: 'kcal', factor: 4184 },
      { id: 'wh', name: 'Watt hour', symbol: 'Wh', factor: 3600 },
      { id: 'kwh', name: 'Kilowatt hour', symbol: 'kWh', factor: 3.6e6 },
      { id: 'btu', name: 'British thermal unit', symbol: 'BTU', factor: 1055.05585262 },
      // Written as the product it is defined by, not as a copied decimal: the
      // decimal has one digit more than a double can hold, so it silently
      // became a different number on the way in.
      { id: 'ftlb', name: 'Foot pound', symbol: 'ft·lb', factor: FOOT_POUND },
    ],
  },
  {
    id: 'power',
    name: 'Power',
    units: [
      { id: 'w', name: 'Watt', symbol: 'W', factor: 1 },
      { id: 'kw', name: 'Kilowatt', symbol: 'kW', factor: 1000 },
      { id: 'mw', name: 'Megawatt', symbol: 'MW', factor: 1e6 },
      // Mechanical horsepower: five hundred and fifty foot pounds a second.
      { id: 'hp', name: 'Horsepower', symbol: 'hp', factor: 550 * FOOT_POUND },
      { id: 'btuh', name: 'BTU per hour', symbol: 'BTU/h', factor: 1055.05585262 / 3600 },
    ],
  },
  {
    id: 'angle',
    name: 'Angle',
    units: [
      { id: 'deg', name: 'Degree', symbol: '°', factor: 1 },
      { id: 'rad', name: 'Radian', symbol: 'rad', factor: 180 / Math.PI },
      { id: 'grad', name: 'Gradian', symbol: 'grad', factor: 0.9 },
      { id: 'turn', name: 'Turn', symbol: 'turn', factor: 360 },
      { id: 'arcmin', name: 'Arcminute', symbol: "'", factor: 1 / 60 },
      { id: 'arcsec', name: 'Arcsecond', symbol: '"', factor: 1 / 3600 },
    ],
  },
  {
    id: 'fuel',
    name: 'Fuel',
    units: [
      // Litres per hundred kilometres is the base, and the others are its
      // reciprocal: more miles to the gallon is fewer litres per hundred, so
      // these cannot be a factor apart however convenient that would be.
      { id: 'l100km', name: 'Litres per 100 km', symbol: 'L/100km', to: (v) => v, from: (b) => b },
      { id: 'kml', name: 'Kilometres per litre', symbol: 'km/L', to: (v) => 100 / v, from: (b) => 100 / b },
      {
        id: 'mpg',
        name: 'Miles per gallon (US)',
        symbol: 'mpg',
        to: (v) => (100 * US_GALLON) / ((MILE / 1000) * v),
        from: (b) => (100 * US_GALLON) / ((MILE / 1000) * b),
      },
      {
        id: 'mpguk',
        name: 'Miles per gallon (UK)',
        symbol: 'mpg UK',
        to: (v) => (100 * UK_GALLON) / ((MILE / 1000) * v),
        from: (b) => (100 * UK_GALLON) / ((MILE / 1000) * b),
      },
    ],
  },
]

export function categoryOf(id: string): Category {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[0]
}

export function unitOf(category: Category, id: string): Unit {
  return category.units.find((unit) => unit.id === id) ?? category.units[0]
}

/**
 * Through the base and out the other side. Going through a base rather than
 * holding a table of every pair means a category of seventeen units needs
 * seventeen numbers rather than two hundred and seventy two.
 */
export function convert(value: number, from: Unit, to: Unit): number {
  if (!Number.isFinite(value)) return NaN
  const base = from.to ? from.to(value) : value * (from.factor ?? 1)
  if (!Number.isFinite(base)) return NaN
  return to.from ? to.from(base) : base / (to.factor ?? 1)
}

/** The pair a category opens on when nothing has been chosen in it yet. */
export function defaultPair(category: Category): [string, string] {
  const preferred: Record<string, [string, string]> = {
    length: ['ft', 'in'],
    area: ['ft2', 'm2'],
    volume: ['gal', 'l'],
    mass: ['lb', 'kg'],
    temperature: ['f', 'c'],
    speed: ['mph', 'kmh'],
    fuel: ['mpg', 'l100km'],
  }
  const pair = preferred[category.id]
  if (pair && pair.every((id) => category.units.some((unit) => unit.id === id))) return pair
  return [category.units[0].id, category.units[1]?.id ?? category.units[0].id]
}
