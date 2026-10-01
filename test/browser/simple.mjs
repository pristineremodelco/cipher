/**
 * The simple converter: two units found by typing, the bottom one kept to what
 * the top one converts to, and a pair typed in one go.
 */
import { browser as launch, open, tally } from './harness.mjs'

const browser = await launch()
const t = tally('simple')
const { context, page, noise } = await open(browser, { settings: { mode: 'convert', convertStyle: 'simple' } })

const reading = (n) => page.textContent(`.convert-row:nth-of-type(${n}) .convert-reading`).then((s) => s.trim())
const unit = (n) => page.textContent(`.convert-row:nth-of-type(${n}) .unit-pick`).then((s) => s.trim())
const pad = (k) => page.click(`.convert-pad .key:text-is("${k}")`)

t.is('it opens with nothing chosen', await unit(1), 'Choose a unit')
t.is('and says how to start', (await page.textContent('.simple-sentence')).trim(), 'Choose a unit, or type something like 5 g to lb.')
t.is('there are no category tabs', await page.$$eval('.categories', (e) => e.length), 0)

// With nothing on top, the bottom list holds every kind of unit.
await page.click('.convert-row:nth-of-type(2) .unit-pick')
const kinds = await page.$$eval('.pick-group h3', (h) => h.length)
t.ok(`with nothing on top the bottom list holds every kind (${kinds})`, kinds >= 18)
await page.click('.picker-head button:has-text("Cancel")')

// Volts, and then what volts go to, each with what the number comes to.
await page.click('.convert-row:nth-of-type(1) .unit-pick')
t.ok('the search is ready to type into', await page.evaluate(() => document.activeElement?.classList.contains('picker-search')))
await page.keyboard.type('volts')
t.is('volts finds the volt first', (await page.textContent('.pick-row >> nth=0')).includes('Volt'), true)
await page.keyboard.press('Enter')
await page.waitForSelector('.picker-sheet[aria-label="Convert to"]')
t.is('the bottom list opens by itself', await page.inputValue('.picker-search'), '')
const names = await page.$$eval('.pick-row .pick-name', (e) => e.map((x) => x.textContent.trim()))
t.is('holding only what volts convert to', names.join(','), 'Millivolt,Microvolt,Kilovolt,Megavolt')
t.is('each with what one volt comes to', (await page.textContent('.pick-row:has-text("Millivolt") .pick-worth')).trim(), '1,000')
await page.click('.pick-row:has-text("Millivolt")')
await pad('C')
await pad('1')
await pad('2')
t.is('it converts', await reading(2), '12,000')
t.is('and says what one of them is', (await page.textContent('.simple-sentence')).trim(), '1 V = 1,000 mV')

// A pair typed in one go, amount and all.
await page.click('.convert-row:nth-of-type(1) .unit-pick')
await page.keyboard.type('5 grams to lbs')
t.is('reads it as a pair', (await page.textContent('.pick-pair strong')).trim(), '5 g → lb')
await page.keyboard.press('Enter')
t.is('takes the amount', await reading(1), '5')
t.is('and both units', `${await unit(1)} / ${await unit(2)}`, 'gGram / lbPound')
t.is('and answers', await reading(2), '0.011023113')

// The bottom number is the answer and nothing else. A tap on it used to make
// the bottom row the input, after which a new bottom unit moved the top number
// instead: 1 lb became 0.000001 lb with nothing to say why.
await page.click('.convert-row:nth-of-type(1) .unit-pick')
await page.keyboard.type('1 lb to kg')
await page.keyboard.press('Enter')
await page.click('.convert-row:nth-of-type(2) .convert-reading')
await page.click('.convert-row:nth-of-type(2) .unit-pick')
await page.click('.pick-row:has(.pick-symbol:text-is("g"))')
t.is('a tap on the answer does not make it the input', await reading(1), '1')
t.is('and a new answer unit still converts the top', await reading(2), '453.59237')
t.is('the top row is the one being typed into', await page.getAttribute('.convert-row:nth-of-type(1)', 'data-active'), 'true')

// Swapping turns it round and keeps the reading where the eye is.
await page.click('.convert-pair .swap')
t.is('swap turns the pair round', `${await unit(1)} / ${await unit(2)}`, 'gGram / lbPound')

// A new kind on top lets go of a bottom it cannot convert to.
await page.click('.convert-row:nth-of-type(1) .unit-pick')
await page.keyboard.type('psi')
await page.keyboard.press('Enter')
await page.waitForSelector('.picker-sheet[aria-label="Convert to"]')
await page.click('.picker-head button:has-text("Cancel")')
t.is('a new kind on top clears a bottom it cannot reach', await unit(2), 'Choose a unit')
t.is('and the result says so rather than guessing', await reading(2), '—')

// It is remembered.
await page.reload({ waitUntil: 'networkidle' })
t.is('the top unit is remembered', await unit(1), 'psiPound per square inch')

// And the setting puts the categories back.
await page.click('button[aria-label="Settings"]')
await page.click('.tab:has-text("Math")')
await page.click('.field:has-text("Converter") .size-btn:text-is("By category")')
await page.click('button:has-text("Done")')
t.ok('by category brings the tabs back', (await page.$$eval('.categories', (e) => e.length)) === 1)

t.done(noise)
await context.close()
await browser.close()
