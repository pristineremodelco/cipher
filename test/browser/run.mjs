/**
 * Every browser suite, one after another, against a running dev server.
 *
 *   npm run dev
 *   npm run test:browser
 *
 * They run in series rather than at once: they each drive a browser, and four
 * browsers competing for one machine turns a timing test into a coin toss.
 */
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASE, playwright } from './harness.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const SUITES = ['keys.mjs', 'behaviour.mjs', 'looks.mjs', 'settings.mjs', 'tools.mjs', 'layout.mjs']

await playwright()

try {
  const response = await fetch(BASE, { signal: AbortSignal.timeout(4000) })
  if (!response.ok) throw new Error(String(response.status))
} catch {
  console.log(`Nothing is answering at ${BASE}. Start the app with \`npm run dev\` first.`)
  process.exit(1)
}

let failed = 0
for (const suite of SUITES) {
  const code = await new Promise((resolve) => {
    spawn(process.execPath, [join(here, suite)], { stdio: 'inherit' }).on('close', resolve)
  })
  if (code !== 0) failed += 1
}

if (failed) {
  console.log(`\n${failed} of ${SUITES.length} suites had problems.`)
  process.exit(1)
}
console.log(`\nAll ${SUITES.length} browser suites passed.`)
