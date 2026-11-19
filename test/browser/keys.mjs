/**
 * Every key on the pad, pressed, with the answer read back off the screen.
 *
 * The engine has its own tests; this is the layer between a finger and the
 * engine, which is where a key can be wired to the wrong thing and no unit
 * test would notice. It runs wide, so the scientific set is on the pad and
 * every key is one click away.
 */
import { browser as launch, open, tally } from './harness.mjs'

const browser = await launch()
const { context, page, noise } = await open(browser, { viewport: { width: 1280, height: 900 }, settings: {} })
const t = tally('keys')

const answer = () => page.textContent('.answer').then((s) => s.trim())
const expression = () => page.textContent('.expression').then((s) => s.trim())
const clear = () => page.click('.key[aria-label="Clear"]')

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const tap = (label) => page.locator('.pads .key', { hasText: new RegExp(`^${escape(label)}$`) }).first().click()
const byName = (name) =>
  name === 'Power' ? page.click('.util[aria-label="Power"]') : page.click(`.pads .key[aria-label="${name}"]`)

async function sum(what, presses, wantAnswer, wantExpression) {
  await clear()
  for (const press of presses) {
    if (typeof press === 'object') await byName(press.aria)
    else await tap(press)
  }
  t.is(what, await answer(), wantAnswer)
  if (wantExpression !== undefined) t.is(`${what}, as written`, await expression(), wantExpression)
}

// Digits and the point
await sum('every digit', ['1', '2', '3', '4', '5', '6', '7', '8', '9'], '123,456,789')
await sum('zero', ['0'], '0')
await sum('double zero', ['5', '00'], '500')
await sum('a decimal point', ['3', '.', '1', '4'], '3.14')

// Operators
await sum('plus', ['1', '2', { aria: 'Plus' }, '3'], '15')
await sum('minus', ['1', '2', { aria: 'Minus' }, '3'], '9')
await sum('times', ['1', '2', { aria: 'Multiply' }, '3'], '36')
await sum('divide', ['1', '2', { aria: 'Divide' }, '3'], '4')
await sum('power', ['2', { aria: 'Power' }, '1', '0'], '1,024')

// The action keys
await sum('brackets', ['2', { aria: 'Parentheses' }, '3', { aria: 'Plus' }, '4', { aria: 'Parentheses' }], '14', '2×(3+4)')
await sum('a percent on its own', ['5', '0', '%'], '0.5')
await sum('a percent added', ['2', '0', '0', { aria: 'Plus' }, '1', '0', '%'], '220')
await sum('a percent taken off', ['2', '0', '0', { aria: 'Minus' }, '1', '0', '%'], '180')
await sum('a percent of', ['2', '0', '0', { aria: 'Multiply' }, '1', '0', '%'], '20')

// Every scientific key
await sum('pi', ['π'], '3.14159265359')
await sum('e', ['e'], '2.718281828459')
await sum('phi', ['φ'], '1.61803398875')
await sum('log', ['log', '1', '0', '0', '0'], '3')
await sum('ln', ['ln', '1'], '0')
await sum('log base two', ['log₂', '8'], '3')
await sum('square root', ['√', '9'], '3')
await sum('cube root', ['∛', '2', '7'], '3')
await sum('absolute value', ['|x|', { aria: 'Minus' }, '4'], '4')
await sum('squared', ['5', 'x²'], '25', '5²')
await sum('cubed', ['5', 'x³'], '125', '5³')
await sum('reciprocal', ['5', 'x⁻¹'], '0.2', '5⁻¹')
await sum('factorial', ['5', 'x!'], '120', '5!')
await sum('mod', ['1', '0', 'mod', '3'], '1')
await sum('sine', ['sin', '3', '0'], '0.5')
await sum('cosine', ['cos', '6', '0'], '0.5')
await sum('tangent', ['tan', '4', '5'], '1')
await sum('inverse sine', ['sin⁻¹', '0', '.', '5'], '30')
await sum('inverse cosine', ['cos⁻¹', '0', '.', '5'], '60')
await sum('inverse tangent', ['tan⁻¹', '1'], '45')
await sum('sinh', ['sinh', '1'], '1.175201193644')
await sum('cosh', ['cosh', '1'], '1.543080634815')
await sum('tanh', ['tanh', '1'], '0.761594155956')
await sum('inverse sinh', ['sinh⁻¹', '1'], '0.88137358702')
await sum('inverse cosh', ['cosh⁻¹', '1'], '0')
await sum('inverse tanh', ['tanh⁻¹', '0', '.', '5'], '0.549306144334')

// Ans needs an answer behind it
await clear()
await tap('7')
await byName('Multiply')
await tap('6')
await byName('Equals')
await clear()
await tap('Ans')
await byName('Plus')
await tap('2')
t.is('Ans recalls the last answer', await answer(), '44')

// The utility row
await clear()
for (const digit of ['1', '2', '3']) await tap(digit)
await page.click('.util[aria-label="Backspace. Hold to clear."]')
t.is('the rub-out takes one press off', await expression(), '12')

await clear()
await tap('sin')
await tap('3')
await tap('0')
for (let i = 0; i < 3; i += 1) await page.click('.util[aria-label="Backspace. Hold to clear."]')
t.is('a function rubs out whole', await expression(), '')

// Errors name themselves rather than showing a wrong number
await clear()
await tap('1')
await byName('Divide')
await tap('0')
t.is('dividing by zero says so', (await page.textContent('.error')).trim(), 'Nothing divides by zero')
t.is('and shows no answer', await answer(), '')

await clear()
await tap('sin⁻¹')
await tap('5')
t.ok('an impossible inverse sine is refused', (await page.textContent('.error')).includes('no answer'))

// The physical keyboard: Escape clears, a paste is read as keys, ? lists them.
await clear()
await page.keyboard.type('12+3')
await page.keyboard.press('Escape')
t.is('Escape clears the sum', await expression(), '')
await page.evaluate(() => {
  const data = new DataTransfer()
  data.setData('text/plain', '1,200 x 3')
  window.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }))
})
t.is('a paste lands as the sum it holds', await expression(), '1200×3')
t.is('and is worked out', await answer(), '3,600')
await page.keyboard.press('Escape')
await page.keyboard.press('Shift+Slash')
t.ok('? opens the keyboard list', await page.isVisible('.keyboard-list'))
await page.keyboard.press('Escape')

// Wide enough, as this suite is, the history sits beside the keypad and the
// clock button hides it.
t.ok('a laptop shows the history beside the keypad', await page.isVisible('aside.dock'))
await page.click('button[aria-label="History"]')
t.is('the clock button hides it', await page.$$eval('aside.dock', (e) => e.length), 0)
await page.click('button[aria-label="History"]')
t.ok('and shows it again', await page.isVisible('aside.dock'))
await page.setViewportSize({ width: 1000, height: 800 })
await page.waitForTimeout(150)
t.is('narrower, it goes back to a sheet', await page.$$eval('aside.dock', (e) => e.length), 0)

t.done(noise)
await context.close()
await browser.close()
