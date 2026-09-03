/**
 * Every size, every surface, every tool.
 *
 * Three rules, and every one of them was written after something broke it: the
 * page may not scroll sideways, nothing outside a box that scrolls may sit past
 * the edge, and nothing a finger has to hit may be smaller than a finger.
 */
import { browser as launch, open, tally } from './harness.mjs'

const SIZES = [
  ['iPhone SE', 320, 568],
  ['iPhone 13 mini', 375, 812],
  ['iPhone 15 Pro', 393, 852],
  ['iPhone 15 Pro Max', 430, 932],
  ['Pixel 8', 412, 915],
  ['a folded phone', 344, 882],
  ['a phone on its side', 852, 393],
  ['iPad, upright', 768, 1024],
  ['iPad Air', 834, 1194],
  ['iPad, sideways', 1180, 820],
  ['a laptop', 1280, 800],
  ['a desktop', 1920, 1080],
]

const TOOLS = [
  'discount', 'salestax', 'tip', 'unitprice', 'loan', 'savings', 'currency',
  'percent', 'date', 'worldtime', 'hex', 'grade',
  'fuelcost', 'fuelefficiency', 'body', 'ovulation',
]

const browser = await launch()
const t = tally('layout')

async function inspect(page, where) {
  const found = await page.evaluate(() => {
    // Something inside a box that scrolls is meant to run past the edge; that
    // is what the scrolling is for. Only things loose on the page count.
    const inAScroller = (el) => {
      for (let node = el.parentElement; node; node = node.parentElement) {
        const style = getComputedStyle(node)
        if (/(auto|scroll)/.test(style.overflowX + style.overflowY)) return true
      }
      return false
    }
    const named = (el) => (typeof el.className === 'string' && el.className ? el.className.split(' ')[0] : el.tagName)
    const loose = [...document.querySelectorAll('*')].filter((el) => {
      const box = el.getBoundingClientRect()
      if (box.width === 0 && box.height === 0) return false
      return (box.right > innerWidth + 1 || box.left < -1) && !inAScroller(el)
    })
    const small = [...document.querySelectorAll('button:not([disabled]), select, input')].filter((el) => {
      const box = el.getBoundingClientRect()
      return box.width > 0 && (box.height < 30 || box.width < 24)
    })
    return {
      sideways: document.documentElement.scrollWidth > innerWidth + 1,
      loose: [...new Set(loose.map(named))].slice(0, 4),
      small: [...new Set(small.map(named))].slice(0, 4),
    }
  })
  if (found.sideways) t.note(`${where}: the page scrolls sideways`)
  if (found.loose.length) t.note(`${where}: past the edge, loose on the page: ${found.loose.join(', ')}`)
  if (found.small.length) t.note(`${where}: too small to hit: ${found.small.join(', ')}`)
  t.ok(where, !found.sideways && !found.loose.length && !found.small.length)
}

for (const [name, width, height] of SIZES) {
  for (const mode of ['calculate', 'convert']) {
    const { context, page, noise } = await open(browser, { settings: { mode }, viewport: { width, height } })
    if (mode === 'calculate') await page.keyboard.type('12.5*(3+4)')
    await page.waitForTimeout(200)
    await inspect(page, `${name}, ${mode}`)
    for (const problem of noise) t.note(`${name} ${mode} console: ${problem}`)
    await context.close()
  }

  const { context, page } = await open(browser, { settings: { mode: 'tools', tool: '' }, viewport: { width, height } })
  await inspect(page, `${name}, the tool grid`)
  for (const tool of TOOLS) {
    await page.evaluate((tool) => {
      const settings = JSON.parse(localStorage.getItem('calculator.v1'))
      localStorage.setItem('calculator.v1', JSON.stringify({ ...settings, mode: 'tools', tool }))
    }, tool)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(150)
    await inspect(page, `${name}, ${tool}`)
  }
  await context.close()
}

t.done()
await browser.close()
