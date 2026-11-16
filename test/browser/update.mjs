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

// A release that changes an icon and nothing else. The page stays as it is;
// the precache revision of that file is what tells an open app to look. The
// v query on the link has to be ignored by the worker, or this fetch would
// miss the precache and fail once the network is gone.
const iconHref = await page.getAttribute('link[rel="icon"][sizes="32x32"]', 'href')
const iconName = new URL(iconHref, url).pathname.slice(1)
const iconPath = join(out, iconName)
const originalIcon = readFileSync(iconPath)
const tweaked = Buffer.from(originalIcon)
const flipAt = tweaked.length - 20
tweaked[flipAt] ^= 0x5a
writeFileSync(iconPath, tweaked)
const swNow = readFileSync(join(out, 'sw.js'), 'utf8')
const iconRev = new RegExp(`(url:"${iconName.replace('.', '\\.')}",revision:")[^"]+`)
t.ok('the icon is in the precache', iconRev.test(swNow))
writeFileSync(join(out, 'sw.js'), swNow.replace(iconRev, '$1icon-next'))
const iconByte = (bytes) => `${bytes.length}:${bytes[flipAt]}`
const before = await page.evaluate(async (href) => {
  const bytes = new Uint8Array(await (await fetch(href)).arrayBuffer())
  return `${bytes.length}:${bytes[bytes.length - 20]}`
}, iconHref)
t.is('the open app is still on the previous icon', before, iconByte(originalIcon))
await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()))
await page.waitForSelector('.update', { timeout: 20000 })
t.ok('a changed icon brings the banner back', (await page.textContent('.update')).includes('Update available'))
await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle' }), page.click('.update-go')])
await context.setOffline(true)
const after = await page.evaluate(async (href) => {
  try {
    const res = await fetch(href)
    if (!res.ok) return `status ${res.status}`
    const bytes = new Uint8Array(await res.arrayBuffer())
    return `${bytes.length}:${bytes[bytes.length - 20]}`
  } catch (error) {
    return `error ${error}`
  }
}, iconHref)
await context.setOffline(false)
t.is('offline, the reloaded app has the new icon', after, iconByte(tweaked))
t.is('and the banner is gone again', await page.$('.update'), null)

t.done()
await context.close()
await browser.close()
server.close()
rmSync(out, { recursive: true, force: true })
