/**
 * The update banner, end to end, with a real service worker: build the app,
 * serve it, put out a newer version, and check the open app notices, offers it,
 * and comes back as the new one when the banner is tapped.
 *
 * Unlike the other suites this one builds and serves the app itself, because
 * the dev server has no service worker.
 */
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import { browser as launch, tally } from './harness.mjs'

const root = new URL('../../', import.meta.url).pathname
const out = mkdtempSync(join(tmpdir(), 'cipher-update-'))
const built = spawnSync(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', out, '--emptyOutDir', '--logLevel', 'error'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, BASE_PATH: '/' },
})
if (built.status !== 0) process.exit(1)

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json',
}
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (path.endsWith('/')) path += 'index.html'
  const file = join(out, path)
  if (!file.startsWith(out) || !existsSync(file)) {
    res.writeHead(404)
    res.end()
    return
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' })
  res.end(readFileSync(file))
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const url = `http://127.0.0.1:${server.address().port}/`

const browser = await launch()
const context = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true })
const page = await context.newPage()
const t = tally('update')

await page.goto(url, { waitUntil: 'networkidle' })
await page.evaluate(() => navigator.serviceWorker.ready)
await page.reload({ waitUntil: 'networkidle' })
t.ok('the app is running under its service worker', await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
t.is('no banner while it is up to date', await page.$('.update'), null)

// Type something, so it is clear nothing reloads under it.
await page.click('.pad .key[aria-label="7"]')

// A new version goes out: a changed page, and the service worker that lists it.
writeFileSync(join(out, 'index.html'), readFileSync(join(out, 'index.html'), 'utf8').replace('</head>', '<meta name="cipher-build" content="two"></head>'))
const sw = readFileSync(join(out, 'sw.js'), 'utf8')
writeFileSync(join(out, 'sw.js'), sw.replace(/(url:"index\.html",revision:")[^"]+/, '$1newer'))

// Coming back to the screen is when it looks.
await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
await page.waitForSelector('.update', { timeout: 20000 })
const banner = await page.textContent('.update')
t.ok('the banner says an update is available', banner.includes('Update available'))
t.ok('and offers Refresh', (await page.textContent('.update-go')).includes('Refresh'))
t.is('and nothing reloaded under the sum being typed', (await page.textContent('.expression')).trim(), '7')

await page.click('.update-later')
t.is('Later puts it away', await page.$('.update'), null)

// Next time it comes round it can be taken.
await page.reload({ waitUntil: 'networkidle' })
t.ok('a plain reopen is already the new version', Boolean(await page.$('meta[name="cipher-build"]')))

// And from the banner itself: another version, then the tap.
writeFileSync(join(out, 'index.html'), readFileSync(join(out, 'index.html'), 'utf8').replace('content="two"', 'content="three"'))
writeFileSync(join(out, 'sw.js'), sw.replace(/(url:"index\.html",revision:")[^"]+/, '$1newest'))
// The app looks at most once a minute; asked directly here rather than waiting it out.
await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r?.update()))
await page.waitForSelector('.update', { timeout: 20000 })
await page.screenshot({ path: process.env.UPDATE_SHOT ?? join(out, 'banner.png') })
await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle' }), page.click('.update-go')])
t.is('tapping the banner brings up the new version', await page.getAttribute('meta[name="cipher-build"]', 'content'), 'three')
t.is('with the banner gone', await page.$('.update'), null)

t.done()
await context.close()
await browser.close()
server.close()
rmSync(out, { recursive: true, force: true })
