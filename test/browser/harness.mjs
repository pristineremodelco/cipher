/**
 * The bits every browser suite needs.
 *
 * Playwright is deliberately not a dependency of the app, the same way sharp
 * is not: it is a check-once tool, and adding a browser download to the
 * install for something that runs before a release is a cost with no return.
 * The suites say how to get it, and skip cleanly when it is absent.
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const BASE = process.env.CALC_URL ?? 'http://localhost:5174/'
export const KEY = 'calculator.v1'

/** Loads playwright if it is installed, and explains itself if it is not. */
export async function playwright() {
  try {
    const loaded = await import(require.resolve('playwright'))
    // Playwright ships CommonJS, so an import of it may arrive wrapped.
    return loaded.chromium ? loaded : loaded.default
  } catch {
    console.log(
      'Playwright is not installed. These suites need a browser:\n' +
        '  npm i --no-save playwright && npx playwright install chromium\n' +
        'Then start the app with `npm run dev` and run them again.',
    )
    process.exit(0)
  }
}

export async function browser() {
  const { chromium } = await playwright()
  // Wherever the sandbox put it, or wherever playwright did.
  const executablePath = process.env.CHROMIUM_PATH
  return chromium.launch(executablePath ? { executablePath } : {})
}

/**
 * A page with the settings already written, so a suite starts from a known
 * state rather than from whatever the last run left behind.
 */
export async function open(browser, { settings = {}, viewport = { width: 393, height: 852 }, dark = true, extra = {} } = {}) {
  const phone = viewport.width < 700 || viewport.height < 500
  const context = await browser.newContext({
    viewport,
    isMobile: phone,
    hasTouch: phone,
    colorScheme: dark ? 'dark' : 'light',
    ...extra,
  })
  const page = await context.newPage()
  const noise = []
  page.on('pageerror', (error) => noise.push(String(error)))
  page.on('console', (message) => {
    // A blocked rate request is the point of one of the suites, not a fault.
    if (message.type() === 'error' && !/rate|frankfurter|fetch|ERR_/i.test(message.text())) {
      noise.push(message.text())
    }
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(([key, settings]) => localStorage.setItem(key, JSON.stringify(settings)), [KEY, settings])
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(250)
  return { context, page, noise }
}

/** A tally that reads the same in every suite. */
export function tally(name) {
  const failures = []
  let checks = 0
  return {
    is(what, got, want) {
      checks += 1
      if (String(got) !== String(want)) failures.push(`${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
    },
    ok(what, condition) {
      checks += 1
      if (!condition) failures.push(what)
    },
    note(problem) {
      failures.push(problem)
    },
    done(noise = []) {
      for (const problem of [...new Set(noise)]) failures.push(`console: ${problem}`)
      if (failures.length) {
        console.log(`${name}: ${failures.length} problems`)
        for (const failure of failures) console.log(`  ${failure}`)
        process.exitCode = 1
      } else {
        console.log(`${name}: all ${checks} checks passed`)
      }
    },
  }
}
