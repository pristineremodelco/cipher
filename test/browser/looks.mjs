/**
 * Palettes: the nine that ship, one made here, and what putting the settings
 * back is allowed to touch.
 */
import { browser as launch, open, tally } from './harness.mjs'

const browser = await launch()
const t = tally('looks')

// A palette made from three colours, worn, kept, and let go of.
{
  const { context, page, noise } = await open(browser, { settings: {}, dark: true })
  await page.click('button[aria-label="Settings"]')
  await page.click('button:has-text("Make a palette")')
  await page.waitForSelector('.palette-editor')
  await page.fill('.text-input', 'Pristine')
  await page.fill('.colour-field:has-text("Background") .hex', '#101820')
  // The key colour goes in through the wheel rather than the hex box.
  await page.click('.colour-field:has-text("Keys") .wheel-button')
  await page.fill('.colour-sheet .colour-entry .hex', '#1c2733')
  await page.click('.colour-sheet button:has-text("Done")')
  t.is('a colour chosen on the wheel lands in the field', await page.inputValue('.colour-field:has-text("Keys") .hex'), '#1c2733')
  await page.fill('.colour-field:has-text("Accent") .hex', '#c8a24a')
  await page.click('button:has-text("Save palette")')
  await page.waitForSelector('.own-row')
  t.is('it is saved under its name', (await page.textContent('.own-row strong')).trim(), 'Pristine')

  const listed = await page.$$eval('.palette-card strong', (els) => els.map((el) => el.textContent))
  t.ok('and offered beside the ones that ship', listed.includes('Pristine'))
  await page.waitForTimeout(300)

  const worn = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement)
    return {
      bg: style.getPropertyValue('--bg').trim(),
      key: style.getPropertyValue('--key').trim(),
      accent: style.getPropertyValue('--accent').trim(),
      text: style.getPropertyValue('--text').trim(),
      scheme: document.documentElement.style.colorScheme,
    }
  })
  t.is('the ground is the one chosen', worn.bg, '#101820')
  t.is('the keys too', worn.key, '#1c2733')
  t.is('and the accent, which an override used to eat', worn.accent, '#c8a24a')
  t.ok('the type is worked out light against a dark key', /^#[ef]/.test(worn.text))
  t.is('and it reads as a dark palette', worn.scheme, 'dark')

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  t.is(
    'it survives a reload',
    await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()),
    '#c8a24a',
  )

  await page.click('button[aria-label="Settings"]')
  await page.click('button[aria-label="Delete Pristine"]')
  await page.waitForTimeout(300)
  const after = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim())
  t.ok('deleting it falls back rather than leaving no colours', after !== '#c8a24a' && after.length > 0)

  // The eyedropper is offered exactly where the browser has one.
  const supported = await page.evaluate(() => 'EyeDropper' in window)
  await page.click('button:has-text("Make a palette")')
  t.is('the eyedropper is offered only where it works', Boolean(await page.$('.pipette')), String(supported))
  t.done(noise)
  await context.close()
}

// Putting the settings back leaves what is yours alone.
{
  const { context, page, noise } = await open(browser, { settings: {}, dark: true })
  const r = tally('reset')
  await page.click('button[aria-label="Settings"]')
  r.is('nothing to put back on a fresh install', await page.$('button:has-text("Put everything back")'), null)

  await page.click('button:has-text("Make a palette")')
  await page.fill('.text-input', 'Site')
  await page.fill('.colour-field:has-text("Background") .hex', '#0d1b2a')
  await page.fill('.colour-field:has-text("Keys") .hex', '#1b263b')
  await page.fill('.colour-field:has-text("Accent") .hex', '#e0a458')
  await page.click('button:has-text("Save palette")')
  await page.click('.tab:has-text("Keys")')
  await page.click('.size-btn:has-text("Circle")')
  r.is('a setting applies', await page.getAttribute('html', 'data-keyshape'), 'circle')

  await page.click('button:has-text("Put everything back")')
  await page.waitForTimeout(200)
  r.is('one tap only asks', await page.getAttribute('html', 'data-keyshape'), 'circle')
  await page.click('button:has-text("Put every setting back?")')
  await page.waitForTimeout(200)
  r.is('the setting goes back', await page.getAttribute('html', 'data-keyshape'), 'soft')
  r.is(
    'the palette made here does not',
    await page.evaluate(() => JSON.parse(localStorage.getItem('calculator.v1')).customPalettes.length),
    1,
  )
  await page.click('.tab:has-text("Look")')
  r.is('and is still listed', (await page.$$eval('.own-row strong', (e) => e.map((x) => x.textContent))).join(), 'Site')
  r.is('with nothing left to put back', await page.$('button:has-text("Put everything back")'), null)
  r.done(noise)
  await context.close()
}

// The device's own setting picks between the day and the after-dark palette.
{
  const { context, page } = await open(browser, { settings: {}, dark: true })
  const d = tally('device')
  d.is('a dark device wears Espresso', await page.getAttribute('html', 'data-palette'), 'espresso')
  await page.emulateMedia({ colorScheme: 'light' })
  await page.waitForTimeout(200)
  d.is('and a light one wears Paper, without a reload', await page.getAttribute('html', 'data-palette'), 'paper')
  d.done()
  await context.close()
}

// Following turned off, a palette chosen, following turned back on. The pick
// used to land in the day slot whatever it was, so a dark one sat under By day.
{
  const { context, page, noise } = await open(browser, { settings: {}, dark: false })
  const f = tally('follow the device, off and on again')
  const worn = () => page.getAttribute('html', 'data-palette')
  const active = (slot) => page.$eval(`.field:has(> span:text-is("${slot}")) .palette-card[data-active=true] strong`, (el) => el.textContent.trim())
  const names = (slot) => page.$$eval(`.field:has(> span:text-is("${slot}")) .palette-card:not(.palette-make) strong`, (els) => els.map((el) => el.textContent.trim()))
  const follow = '.toggle-row:has-text("Follow the device") input'
  await page.click('button[aria-label="Settings"]')
  await page.click(follow)
  f.is('turning it off keeps what is on screen', await worn(), 'paper')
  await page.click('.field:has(> span:text-is("Palette")) .palette-card:has-text("Plum")')
  f.is('a palette picked with it off is worn', await worn(), 'plum')
  await page.click(follow)
  f.is('back on, a light device wears the day palette it had', await worn(), 'paper')
  f.is('By day still holds what it held', await active('By day'), 'Paper')
  f.ok('and Plum is not listed by day', !(await names('By day')).includes('Plum'))
  f.is('Plum is filed after dark', await active('After dark'), 'Plum')
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.waitForTimeout(200)
  f.is('and is worn when the device goes dark', await worn(), 'plum')
  // Turned off at night, the night palette stays on rather than flipping to the day one.
  await page.click(follow)
  f.is('turning it off after dark keeps the night palette on', await worn(), 'plum')
  await page.emulateMedia({ colorScheme: 'light' })
  await page.waitForTimeout(200)
  f.is('and keeps it whatever the device does next', await worn(), 'plum')
  f.done(noise)
  await context.close()
}

// Snow is Winter now and the old Linen is Cobblestone; a phone that saved
// either keeps wearing the same colours under the new name.
for (const [old, now] of [['snow', 'winter'], ['linen', 'cobblestone']]) {
  const { context, page, noise } = await open(browser, { settings: { palette: old, fixedPalette: old, followDevice: false } })
  const r = tally(`${old} renamed`)
  r.is(`${old} is worn as ${now}`, await page.getAttribute('html', 'data-palette'), now)
  r.ok('and its ground is still drawn', (await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim())) !== '')
  r.done(noise)
  await context.close()
}

// Settings saved before the all-hours slot existed, with a dark palette left
// in the day slot the old way, are put straight.
{
  const { context, page, noise } = await open(browser, { settings: { palette: 'espresso', nightPalette: 'graphite', followDevice: true }, dark: false })
  const m = tally('a dark palette left by day')
  m.is('a light device wears the default day palette', await page.getAttribute('html', 'data-palette'), 'paper')
  await page.click('button[aria-label="Settings"]')
  m.is('which By day now holds', await page.$eval('.field:has(> span:text-is("By day")) .palette-card[data-active=true] strong', (el) => el.textContent.trim()), 'Paper')
  m.is('and Espresso is after dark', await page.$eval('.field:has(> span:text-is("After dark")) .palette-card[data-active=true] strong', (el) => el.textContent.trim()), 'Espresso')
  m.done(noise)
  await context.close()
}

await browser.close()
