// Rasterises the three source marks into every size the platforms actually
// ask for. Run it only when the mark changes; the output is committed.
//
//   npm i --no-save sharp png-to-ico && node icons/generate.mjs
//
// sharp is deliberately not a dependency of the app. It is a build-once tool,
// and adding a native module to the install for something that runs twice a
// year is a cost with no return.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'public')

const rounded = readFileSync(join(here, 'mark.svg'))
const square = readFileSync(join(here, 'mark-square.svg'))
const maskable = readFileSync(join(here, 'mark-maskable.svg'))

// Rounded ground: anywhere the icon is drawn as-is, against the browser's own
// background. Square ground: iOS, which rounds its own corners but does not
// crop. Maskable: Android, which does crop, and needs the mark held back from
// the edge to survive it.
const JOBS = [
  ['favicon-16.png', rounded, 16],
  ['favicon-32.png', rounded, 32],
  ['favicon-48.png', rounded, 48],
  ['pwa-64.png', rounded, 64],
  ['pwa-192.png', rounded, 192],
  ['pwa-512.png', rounded, 512],
  ['apple-touch-icon.png', square, 180],
  ['maskable-192.png', maskable, 192],
  ['maskable-512.png', maskable, 512],
]

const written = []
for (const [name, source, size] of JOBS) {
  await sharp(source, { density: 2400 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(out, name))
  written.push(name)
}

// One .ico holding three sizes. Still requested by crawlers and by anything
// that predates SVG favicons, and it costs a couple of kilobytes.
writeFileSync(
  join(out, 'favicon.ico'),
  await pngToIco([16, 32, 48].map((n) => join(out, `favicon-${n}.png`))),
)
written.push('favicon.ico')

console.log(written.join('\n'))
