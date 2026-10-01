/**
 * How the keypad behaves between presses: what carries forward, what starts
 * again, what is remembered, and how far back the history goes.
 */
import { browser as launch, open, tally } from './harness.mjs'

const browser = await launch()
const { context, page, noise } = await open(browser, {
  settings: { memoryRow: true },
  extra: { permissions: ['clipboard-read', 'clipboard-write'] },
})
const t = tally('behaviour')

const answer = () => page.textContent('.answer').then((s) => s.trim())
const expression = () => page.textContent('.expression').then((s) => s.trim())
const tap = (label) => page.click(`.pad .key[aria-label="${label}"]`)

for (const key of ['9', 'Divide', '4']) await tap(key)
t.is('the answer is there before equals', await answer(), '2.25')
await tap('Equals')
t.is('the working stays on show', await expression(), '9÷4')
t.is('under its answer', await answer(), '2.25')

await tap('Plus')
await tap('1')
t.is('an operator carries the answer on', await answer(), '3.25')
await tap('Equals')
await tap('7')
t.is('a digit starts again', await expression(), '7')

// Holding the rub-out clears everything.
const rub = await page.$('.rub')
await rub.dispatchEvent('pointerdown')
await page.waitForTimeout(600)
await rub.dispatchEvent('pointerup')
t.is('holding the rub-out clears the lot', await expression(), '')

// Memory
await tap('5')
await tap('0')
await page.click('button:has-text("M+")')
await tap('Clear')
t.is('memory holds what was added', (await page.textContent('.memory-value')).trim(), 'M 50')
await page.click('button:has-text("MR")')
t.is('and recalls it', await expression(), '50')
await page.click('button:has-text("MC")')
t.is('and clears', (await page.textContent('.memory-value')).trim(), 'M 0')

// The answer copies
await tap('Clear')
await tap('8')
await tap('Multiply')
await tap('8')
await tap('Equals')
await page.click('.answer')
t.is('tapping the answer copies it', await page.evaluate(() => navigator.clipboard.readText()), '64')
t.is('and says so', await answer(), 'Copied')

// Degrees against radians
await tap('Clear')
await page.click('.util[aria-label="Scientific functions"]')
await page.click('.sci-sheet .key[aria-label="sin"]')
await tap('3')
await tap('0')
t.is('sine of thirty degrees', await answer(), '0.5')
await page.click('button[title="Degrees or radians"]')
t.is('the unit switches', (await page.textContent('button[title="Degrees or radians"]')).trim(), 'RAD')
t.is('and the answer with it', await answer(), '-0.988031624093')
await page.click('button[title="Degrees or radians"]')

// History: how deep, and for how long
await tap('Clear')
await page.click('button[aria-label="History"]')
const before = await page.$$eval('.tape-list li', (rows) => rows.length)
t.ok('answers are written down', before > 0)
await page.click('button:has-text("Done")')
await page.reload({ waitUntil: 'networkidle' })
await page.click('button[aria-label="History"]')
t.is('and survive a reload', await page.$$eval('.tape-list li', (rows) => rows.length), before)
await page.click('.tape-list li:first-child .tape-value')
t.ok('and can be put back on the display', (await expression()).length > 0)

// The cap, and the absence of any time limit.
await page.evaluate(() => localStorage.removeItem('calculator.tape.v1'))
await page.reload({ waitUntil: 'networkidle' })
for (let i = 1; i <= 210; i += 1) {
  await page.keyboard.type(`${i}+1`)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Delete')
}
const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('calculator.tape.v1')).entries)
t.is('the history keeps two hundred', kept.length, 200)
t.is('newest first', kept[0].expression, '210+1')
t.is('and drops the oldest', kept[kept.length - 1].expression, '11+1')

await page.evaluate(() => {
  const tape = JSON.parse(localStorage.getItem('calculator.tape.v1'))
  tape.entries = tape.entries.map((entry) => ({ ...entry, at: entry.at - 365 * 24 * 3600 * 1000 }))
  localStorage.setItem('calculator.tape.v1', JSON.stringify(tape))
})
await page.reload({ waitUntil: 'networkidle' })
await page.click('button[aria-label="History"]')
t.is('nothing expires with time', await page.$$eval('.tape-list li', (rows) => rows.length), 200)
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('calculator.tape.v1')).entries.length)
await page.click('.tape-sheet button:has-text("Clear")')
t.is('one tap on clear only asks', await stored(), 200)
t.is('and says what the next tap does', (await page.textContent('.tape-sheet [data-armed="true"]')).trim(), 'Clear all 200?')
await page.waitForTimeout(3800)
t.is('left alone it stands down', await page.$$eval('.tape-sheet [data-armed="true"]', (e) => e.length), 0)
await page.click('.tape-sheet button:has-text("Clear")')
await page.click('.tape-sheet button:has-text("Clear all")')
t.is('the second tap clears it', await stored(), 0)

// The error line: quiet while an expression is being typed, and said the
// moment somebody presses equals and there is no answer to give.
await page.keyboard.press('Escape') // the history panel is still open above
await tap('Clear')
const shown = () => page.$eval('.display', (d) => d.querySelector('.error')?.textContent.trim() ?? '')

await tap('5')
await tap('Plus')
t.is('nothing is said midway through typing', await shown(), '')
await tap('Equals')
t.is('equals on an unfinished sum says why', await shown(), 'The expression stops early')
await tap('3')
t.is('and typing on takes it back', await shown(), '')
await tap('Equals')
t.is('which then answers as normal', await answer(), '8')

await tap('Clear')
await tap('1')
await tap('Divide')
await tap('0')
t.is('a sum that is wrong rather than unfinished still says so at once', await shown(), 'Nothing divides by zero')

// Editing inside a sum: a tap puts the caret between two pieces, and a key
// lands there rather than at the end.
await page.keyboard.press('Escape')
await tap('Clear')
for (const k of ['1', '2', 'Plus', '3', '4']) await tap(k)
const tapAfter = async (index) => {
  const box = await page.$eval(`.expression [data-index="${index}"]`, (el) => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height } })
  await page.click(`.expression [data-index="${index}"]`, { position: { x: box.w * 0.75, y: box.h / 2 } })
}
await tapAfter(1)
t.is('a tap puts a caret in the sum', await page.$$eval('.expression .caret', (e) => e.length), 1)
await tap('5')
t.is('a key lands at the caret', (await expression()).replace(/,/g, ''), '125+34')
t.is('and the answer follows', await answer(), '159')
await page.click('.rub')
t.is('a rub-out takes the piece before the caret', (await expression()).replace(/,/g, ''), '12+34')
await tap('Equals')
t.is('equals answers the whole sum', await answer(), '46')
t.is('and the caret goes', await page.$$eval('.expression .caret', (e) => e.length), 0)
// The finished sum is still on show; a tap opens it again.
await tapAfter(0)
await tap('9')
t.is('a tap on a finished sum opens it to be changed', (await expression()).replace(/,/g, ''), '192+34')
t.is('and it is a live sum again', await answer(), '226')

// Turned off, a tap does nothing at all.
await page.click('button[aria-label="Settings"]')
await page.click('.tab:has-text("Math")')
await page.click('.toggle-row:has-text("to edit inside it") input')
await page.click('button:has-text("Done")')
await tap('Equals')
await tapAfter(0)
t.is('with editing off a tap leaves a finished sum alone', await answer(), '226')
t.is('and puts no caret anywhere', await page.$$eval('.expression .caret', (e) => e.length), 0)

t.done(noise)
await context.close()
await browser.close()
