/**
 * Every setting has to change something.
 *
 * Two of them silently did not: key corners and text size both wrote their
 * attribute onto the root and were then overruled by a :root rule of equal
 * weight sitting further down the stylesheet, so the setting saved, the
 * attribute appeared, and the page drew the default. Nothing caught it,
 * because nothing here had ever asserted that a control has an effect.
 *
 * So this suite drives the controls and measures the result. A control that
 * stops working fails a check rather than waiting to be noticed on a phone.
 */
import { browser as launch, open, tally } from './harness.mjs'
import { FONTS, KEY_SHAPES, TEXT_SCALES, TEXT_SIZES } from '../../src/lib/theme.ts'

const browser = await launch()
const t = tally('settings')
const { context, page, noise } = await open(browser, { settings: {} })

const cssVar = (name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name)

await page.click('button[aria-label="Settings"]')

// ---- Key corners -------------------------------------------------------
await page.click('.tab:has-text("Keys")')
const radii = new Map()
for (const shape of KEY_SHAPES) {
  await page.click(`.field:has-text("Key corners") .size-btn:text-is("${shape.name}")`)
  const radius = await cssVar('--key-radius')
  t.ok(`${shape.name} corners set a radius`, radius !== '')
  t.ok(`${shape.name} corners differ from ${radii.get(radius) ?? 'the others'}`, !radii.has(radius))
  radii.set(radius, shape.name)
}
// And the keys themselves, not only the variable, have to follow it.
await page.click('.field:has-text("Key corners") .size-btn:text-is("Circle")')
const round = await page.$eval('.preview .key', (el) => getComputedStyle(el).borderRadius)
await page.click('.field:has-text("Key corners") .size-btn:text-is("Sharp")')
const sharp = await page.$eval('.preview .key', (el) => getComputedStyle(el).borderRadius)
t.ok('a key is drawn with the corners that were chosen', round !== sharp)

// ---- Operator column ---------------------------------------------------
const order = await page.$$eval('.field:has-text("Operator column") .size-btn', (els) =>
  els.map((el) => el.textContent.trim()),
)
t.is('left is on the left and right on the right', order.join(' '), 'Left Right')
t.is('and right is what it starts on', await page.getAttribute('html', 'data-layout'), 'right')
await page.click('.field:has-text("Operator column") .size-btn:text-is("Left")')
t.is('choosing left moves the column', await page.getAttribute('html', 'data-layout'), 'left')
await page.click('.field:has-text("Operator column") .size-btn:text-is("Right")')

// ---- Text size ---------------------------------------------------------
await page.click('.tab:has-text("Look")')
for (const size of TEXT_SIZES) {
  await page.click(`.field:has-text("Text size") .size-btn >> nth=${TEXT_SIZES.indexOf(size)}`)
  t.is(`${size} sets the scale it says`, await cssVar('--tx'), String(TEXT_SCALES[size]))
  const sample = await page.$eval('.size-sample strong', (el) => parseFloat(getComputedStyle(el).fontSize))
  t.is(`and the sample is drawn at it`, Math.round(sample * 100) / 100, Math.round(20 * TEXT_SCALES[size] * 100) / 100)
}
t.ok('the sample stays up after choosing', await page.isVisible('.size-sample'))

// ---- Typefaces ---------------------------------------------------------
// Every choice has to draw differently from every other. The stacks used to be
// device font names, and on Android four of the seven all came back Roboto.
const widths = new Map()
for (const font of FONTS) {
  await page.click(`.font-card:has-text("${font.name}")`)
  const width = await page.evaluate(async () => {
    const stack = getComputedStyle(document.documentElement).getPropertyValue('--font-stack').trim()
    const first = stack.split(',')[0].trim()
    // A face is only fetched once something asks for it, so ask, then wait.
    try { await document.fonts.load(`400 40px ${first}`, 'Cipher 1234567890') } catch { /* a device family */ }
    await document.fonts.ready
    const el = document.createElement('span')
    el.style.cssText = 'position:fixed;left:-9999px;font-size:40px;font-weight:400;white-space:pre'
    el.style.fontFamily = stack
    el.textContent = 'Cipher 1234567890'
    document.body.appendChild(el)
    const w = el.getBoundingClientRect().width
    el.remove()
    return Math.round(w * 100) / 100
  })
  t.ok(`${font.name} draws unlike ${widths.get(width) ?? 'every other'}`, !widths.has(width))
  widths.set(width, font.name)
}

// ---- Places, padded and not -------------------------------------------
await page.click('.tab:has-text("Maths")')
await page.selectOption('.field:has-text("Decimal places") select', '2')
await page.click('button:has-text("Done")')
for (const key of ['1', '0', '0', 'Equals']) await page.click(`.pad .key[aria-label="${key}"]`)
t.is('a whole answer keeps no places by default', (await page.textContent('.answer')).trim(), '100')
await page.click('button[aria-label="Settings"]')
await page.click('.tab:has-text("Maths")')
await page.click('.toggle-row:has-text("Keep the places") input')
await page.click('button:has-text("Done")')
t.is('and keeps them when asked to', (await page.textContent('.answer')).trim(), '100.00')

// ---- Making a palette for a named slot ---------------------------------
// The two slots each offer their own way in, and what is made there lands
// there rather than wherever its lightness would have filed it.
await page.click('button[aria-label="Settings"]')
await page.click('.tab:has-text("Look")')
const following = await page.isChecked('.toggle-row:has-text("Follow the device") input')
if (!following) await page.click('.toggle-row:has-text("Follow the device") input')

t.is('both slots offer a way in', await page.$$eval('.palette-make', (e) => e.length), 2)

await page.click('.field:has-text("After dark") .palette-make')
await page.waitForSelector('.palette-editor')
// It starts as a copy of whatever the slot is wearing, Espresso here, so a
// palette that is nearly right is one colour away rather than three.
t.is('one made for the night starts as the night palette', (await page.inputValue('.colour-field:has-text("Ground") .hex')).toLowerCase(), '#191309')
t.is('accent and all', (await page.inputValue('.colour-field:has-text("Accent") .hex')).toLowerCase(), '#b4502f')
t.is('and says where it came from', await page.inputValue('.text-input'), 'My Espresso')
await page.fill('.text-input', 'Night Own')
await page.fill('.colour-field:has-text("Ground") .hex', '#0a0f14')
await page.fill('.colour-field:has-text("Keys") .hex', '#141d26')
await page.fill('.colour-field:has-text("Accent") .hex', '#e0b050')
await page.click('button:has-text("Save palette")')
await page.waitForSelector('.own-row')
const nightPick = await page.$eval('.field:has-text("After dark") .palette-card[data-active=true] strong', (el) => el.textContent.trim())
t.is('and it is worn in the slot it was made for', nightPick, 'Night Own')

// A light palette made from the day slot must go to the day slot and stay
// listed there, which strict filtering by lightness would not have done.
await page.click('.field:has-text("By day") .palette-make')
await page.waitForSelector('.palette-editor')
t.is('one made for the day starts as the day palette', (await page.inputValue('.colour-field:has-text("Ground") .hex')).toLowerCase(), '#ede4d0')
await page.fill('.text-input', 'Day Own')
await page.fill('.colour-field:has-text("Ground") .hex', '#12161b')
await page.fill('.colour-field:has-text("Keys") .hex', '#1d242c')
await page.fill('.colour-field:has-text("Accent") .hex', '#66d9a0')
await page.click('button:has-text("Save palette")')
await page.waitForSelector('.own-row')
const dayPick = await page.$eval('.field:has-text("By day") .palette-card[data-active=true] strong', (el) => el.textContent.trim())
t.is('a dark one chosen for the day slot stays listed there', dayPick, 'Day Own')

// Made from a palette of your own, it is a copy of that one.
await page.click('.field:has-text("By day") .palette-make')
await page.waitForSelector('.palette-editor')
t.is('a copy of your own carries its colours', (await page.inputValue('.colour-field:has-text("Accent") .hex')).toLowerCase(), '#66d9a0')
t.is('and its name, numbered', await page.inputValue('.text-input'), 'Day Own 2')
await page.click('.palette-editor button:has-text("Cancel")')

// ---- The rest of them, each measured rather than assumed -----------------
await page.click('button:has-text("Done")')
const html = (attr) => page.getAttribute('html', attr)

// Key style: four styles that have to draw four different keys.
await page.click('button[aria-label="Settings"]')
await page.click('.tab:has-text("Keys")')
const looks = new Map()
for (const style of ['Raised', 'Flat', 'Outline', 'Contrast']) {
  await page.click(`.style-card:has-text("${style}")`)
  const drawn = await page.$eval('.preview .key', (el) => {
    const s = getComputedStyle(el)
    return [s.backgroundColor, s.borderColor, s.borderWidth, s.boxShadow].join(' | ')
  })
  t.ok(`${style} keys draw unlike ${looks.get(drawn) ?? 'the others'}`, !looks.has(drawn))
  looks.set(drawn, style)
}

// Bottom row: one wide zero really removes the 00 key.
await page.click('.field:has-text("Bottom row") .size-btn:text-is("One wide 0")')
t.is('one wide zero is recorded', await html('data-zero'), 'wide')
await page.click('button:has-text("Done")')
t.is('and there is no 00 key', await page.$$eval('.pad .key[aria-label="00"]', (e) => e.length), 0)
await page.click('button[aria-label="Settings"]')
await page.click('.tab:has-text("Keys")')
await page.click('.field:has-text("Bottom row") .size-btn:text-is("0 and 00")')
await page.click('button:has-text("Done")')
t.is('and it comes back', await page.$$eval('.pad .key[aria-label="00"]', (e) => e.length), 1)

// Memory row: off by default, and shows when asked for.
t.is('no memory row to begin with', await page.$$eval('.memory-value', (e) => e.length), 0)
await page.click('button[aria-label="Settings"]')
await page.click('.tab:has-text("Keys")')
await page.click('.toggle-row:has-text("Show the memory row") input')
await page.click('button:has-text("Done")')
t.is('and one when asked for', await page.$$eval('.memory-value', (e) => e.length), 1)

// Heavier text really is heavier.
await page.click('button[aria-label="Settings"]')
await page.click('.tab:has-text("Look")')
for (const what of ['.preview .key', '.preview-display strong']) {
  await page.click('.toggle-row:has-text("Heavier text weight") input')
  const heavy = Number(await page.$eval(what, (el) => getComputedStyle(el).fontWeight))
  await page.click('.toggle-row:has-text("Heavier text weight") input')
  const normal = Number(await page.$eval(what, (el) => getComputedStyle(el).fontWeight))
  t.ok(`heavier text weighs more on ${what}`, heavy > normal)
}
await page.click('.toggle-row:has-text("Heavier text weight") input')

// Answer size moves the answer.
const before = await page.$eval('.preview-display strong', (el) => parseFloat(getComputedStyle(el).fontSize))
await page.$eval('.span-row input[type="range"]', (el) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  setter.call(el, el.max)
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
const after = await page.$eval('.preview-display strong', (el) => parseFloat(getComputedStyle(el).fontSize))
t.ok('answer size changes the answer', after > before)

// Accent really repaints the accent, and clearing hands it back.
await page.$eval('.accent-row input[type="color"]', (el) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  setter.call(el, '#ff0066')
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
await page.waitForTimeout(150)
t.is('a chosen accent is worn', await cssVar('--accent'), '#ff0066')
t.is('and fills the equals key exactly', await page.$eval('.preview .key[data-kind="equals"]', (el) => getComputedStyle(el).backgroundColor), 'rgb(255, 0, 102)')
// The operators wear it too, but moved as far as they need to be to read on
// their keys: a chosen accent is a fill first, and a deep one is unreadable as
// a glyph on a dark key.
const opInk = await page.$eval('.preview .key[data-kind="operator"]', (el) => getComputedStyle(el).color)
const [r, g, b] = opInk.match(/\d+/g).map(Number)
t.ok(`and draws the operators in its own hue (${opInk})`, r > g && r > b)

// Degrees and radians. What each one answers is covered on the pad; what
// matters here is that the two places that set it agree with each other.
await page.click('.tab:has-text("Maths")')
await page.click('button:has-text("Done")')
t.is('degrees is what it starts in', await page.getAttribute('.util.angle', 'aria-pressed'), 'false')
await page.click('.util.angle')
t.is('the display toggle reaches radians', await page.getAttribute('.util.angle', 'aria-pressed'), 'true')
await page.click('button[aria-label="Settings"]')
await page.click('.tab:has-text("Maths")')
t.is('and the settings agree with it', await page.inputValue('.field:has-text("Angles") select'), 'rad')
await page.selectOption('.field:has-text("Angles") select', 'deg')
await page.click('button:has-text("Done")')
t.is('and setting it back reaches the display', await page.getAttribute('.util.angle', 'aria-pressed'), 'false')

// Thousands grouping.
await page.click('.pad .key[aria-label="Clear"]')
for (const k of ['1', '0', '0', '0', '0', 'Equals']) await page.click(`.pad .key[aria-label="${k}"]`)
t.is('thousands are grouped', (await page.textContent('.answer')).trim(), '10,000.00')
await page.click('button[aria-label="Settings"]')
await page.click('.tab:has-text("Maths")')
await page.click('.toggle-row:has-text("Group thousands") input')
await page.click('button:has-text("Done")')
t.is('and ungrouped when asked', (await page.textContent('.answer')).trim(), '10000.00')

// History can be turned off, and then records nothing.
await page.click('button[aria-label="Settings"]')
await page.click('.tab:has-text("Maths")')
await page.click('.toggle-row:has-text("Keep a history") input')
await page.click('button:has-text("Done")')
await page.click('.pad .key[aria-label="Clear"]')
for (const k of ['8', 'Plus', '1', 'Equals']) await page.click(`.pad .key[aria-label="${k}"]`)
const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('calculator.tape.v1') ?? '{}').entries ?? [])
t.ok('nothing is written down once history is off', !kept.some((e) => e.expression === '8+1'))

t.done(noise)
await context.close()
await browser.close()
