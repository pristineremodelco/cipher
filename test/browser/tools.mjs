/**
 * Every tool opens, draws and answers, and the one that needs a signal behaves
 * in all three of the states it can be in.
 */
import { browser as launch, open, tally } from './harness.mjs'

const NAMES = [
  'Discount', 'Sales Tax', 'Tip', 'Unit Price', 'Loan', 'Savings', 'Currencies',
  'Percent', 'Date', 'World Time', 'Hex', 'Grade Average',
  'Fuel Cost', 'Fuel Efficiency', 'Body Metrics', 'Ovulation',
]

const browser = await launch()

{
  const { context, page, noise } = await open(browser, { settings: { mode: 'tools' } })
  const t = tally('tools')
  await page.waitForSelector('.tool-grid')
  t.is('every tool is on the grid', await page.$$eval('.card-name', (els) => els.length), NAMES.length)

  for (const name of NAMES) {
    await page.click(`.card:has-text("${name}")`)
    await page.waitForSelector('.tool-head')
    t.is(`${name} opens on itself`, (await page.textContent('.tool-title h2')).trim(), name)
    t.ok(`${name} draws something`, Boolean(await page.$('.tool-body .tool, .tool-body .offline')))
    await page.click('button[aria-label="Back to the tools"]')
    await page.waitForSelector('.tool-grid')
  }

  // A few answers, read off the screen rather than out of the maths.
  const lead = () => page.textContent('.readout-row[data-lead="true"] .readout-value').then((s) => s.trim())

  await page.click('.card:has-text("Discount")')
  await page.fill('.tool-field:has-text("Price") input', '250')
  await page.fill('.tool-field:has-text("Off") input', '15')
  t.is('15% off 250', await lead(), '$212.50')
  await page.click('button[aria-label="Back to the tools"]')

  await page.click('.card:has-text("Loan")')
  await page.fill('.tool-field:has-text("Amount borrowed") input', '200000')
  await page.waitForTimeout(200)
  t.is('200,000 at 6.5% over 30 years', await lead(), '$1,264.14')
  await page.click('button[aria-label="Back to the tools"]')

  await page.click('.card:has-text("Sales Tax")')
  await page.fill('.tool-field:has-text("Price before tax") input', '100')
  t.is('tax added on', await lead(), '$108.25')
  await page.click('.segment-item:has-text("Take it back off")')
  await page.fill('.tool-field:has-text("Total paid") input', '108.25')
  t.is('and taken back off again', await lead(), '$100.00')
  await page.click('button[aria-label="Back to the tools"]')

  await page.click('.card:has-text("Hex")')
  await page.fill('.tool-field:has-text("Value") input', '255')
  t.is(
    '255 in all four bases',
    (await page.$$eval('.readout-value', (els) => els.map((el) => el.textContent.trim()))).join(' '),
    '11111111 377 255 FF',
  )
  await page.click('button[aria-label="Back to the tools"]')

  await page.click('.card:has-text("World Time")')
  await page.waitForSelector('.clock')
  const clocks = await page.$$eval('.clock', (els) => els.length)
  t.ok('world time starts on this device', clocks >= 1)
  t.is('which is the first row', await page.getAttribute('.clock:first-child', 'data-here'), 'true')
  // It used to carry a remove button, and since the picker below only offers
  // the places in its own list, removing it put this device out of reach.
  t.is('and cannot be removed', await page.$('.clock[data-here="true"] button'), null)
  await page.selectOption('.tool-field:has-text("Add a place") select', 'Asia/Tokyo')
  await page.waitForTimeout(200)
  t.is('and a place can be added', await page.$$eval('.clock', (els) => els.length), clocks + 1)
  t.ok('which can be removed again', Boolean(await page.$('.clock:nth-child(2) button')))
  await page.click('button[aria-label="Back to the tools"]')

  await page.click('.card:has-text("Tip")')
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.tool-head')
  t.is('it reopens on the tool last used', (await page.textContent('.tool-title h2')).trim(), 'Tip')
  t.done(noise)
  await context.close()
}

// The one that needs a signal, in each of its three states.
const RATES = { base: 'USD', date: '2026-08-28', rates: { USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36, JPY: 147 } }

{
  const { context, page } = await open(browser, { settings: { mode: 'tools', tool: 'currency' } })
  const t = tally('currency, with nothing')
  await page.route('**/api.frankfurter.app/**', (route) => route.abort())
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.offline', { timeout: 15000 })
  t.is('it says there are no rates', (await page.textContent('.offline strong')).trim(), 'No rates yet')
  t.ok('and offers to try again', Boolean(await page.$('.offline button')))
  t.done()
  await context.close()
}

{
  const { context, page } = await open(browser, {
    settings: { mode: 'tools', tool: 'currency', currencyFrom: 'USD', currencyTo: 'EUR' },
  })
  const t = tally('currency, on what it had')
  await page.route('**/api.frankfurter.app/**', (route) => route.abort())
  await page.evaluate(
    (rates) => localStorage.setItem('calculator.rates.v1', JSON.stringify({ ...rates, fetchedAt: Date.now() - 1000 * 60 * 60 * 30 })),
    RATES,
  )
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.rates-bar', { timeout: 15000 })
  await page.waitForTimeout(600)
  t.is('the rates are marked old', await page.getAttribute('.rates-bar', 'data-state'), 'stale')
  t.ok('it says how old', (await page.textContent('.rates-when')).includes('yesterday'))
  t.is('the signal is crossed through', await page.getAttribute('.rates-bar .signal', 'data-on'), 'false')
  t.is('and it still converts', (await page.textContent('.readout-row[data-lead="true"] .readout-value')).trim(), '92.00 EUR')
  t.ok('and admits the fetch failed', (await page.textContent('.tool-note')).includes('Could not reach'))
  t.done()
  await context.close()
}

{
  const { context, page } = await open(browser, {
    settings: { mode: 'tools', tool: 'currency', currencyFrom: 'USD', currencyTo: 'EUR' },
  })
  const t = tally('currency, answered')
  await page.route('**/api.frankfurter.app/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ base: 'USD', date: '2026-09-02', rates: { EUR: 0.9, GBP: 0.78, CAD: 1.35, JPY: 148 } }),
    }),
  )
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.rates-bar', { timeout: 15000 })
  await page.waitForTimeout(500)
  t.is('the rates are fresh', await page.getAttribute('.rates-bar', 'data-state'), 'fresh')
  t.is('the signal is whole', await page.getAttribute('.rates-bar .signal', 'data-on'), 'true')
  t.is('it converts at the fetched rate', (await page.textContent('.readout-row[data-lead="true"] .readout-value')).trim(), '90.00 EUR')
  t.ok('and the base currency is in the list', (await page.$$eval('.tool-pair select option', (o) => o.map((x) => x.value))).includes('USD'))
  t.done()
  await context.close()
}

// The card says so before the tap.
{
  const { context, page } = await open(browser, { settings: { mode: 'tools', tool: '' } })
  const t = tally('the card when there is no connection')
  await context.setOffline(true)
  await page.waitForTimeout(400)
  t.is('it marks itself offline', await page.getAttribute('.card:has-text("Currencies")', 'data-offline'), 'true')
  t.is('and says so instead of its hint', (await page.textContent('.card:has-text("Currencies") .card-hint')).trim(), 'No connection')
  t.is(
    'no other card is touched',
    await page.$$eval('.card:not(:has-text("Currencies"))', (cards) => cards.filter((card) => card.getAttribute('data-offline') === 'true').length),
    0,
  )
  t.done()
  await context.close()
}

await browser.close()
