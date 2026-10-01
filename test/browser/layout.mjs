/**
 * Every size, every surface, every tool.
 *
 * Five rules: the page may not scroll sideways, nothing outside a box that
 * scrolls may sit past the edge, nothing a finger has to hit may be smaller
 * than a finger, nothing along the top bar may run into what is beside it, and
 * no segment of named choices may hide an option off its own edge.
 *
 * The fifth was written after ten of them were found clipped across five
 * tools, one cut mid-word at every phone width there is: a strip that scrolls
 * hides half of itself behind a gesture nobody thinks to try.
 *
 * The first three were each written after something broke them. The fourth
 * catches overlap and touching, which is a real class of fault, but it is not
 * a judge of whether a row looks crowded: the bar has been through a version
 * that measured a legal ten pixels between the switch and the buttons and
 * still read as cramped. That one was fixed by looking at it, and no threshold
 * here would have found it without also failing the narrowest screen.
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
    // The bar is one row of things that must not run into each other. Boxes
    // that merely touch still read as broken, so this asks for a little gap
    // rather than only for an absence of overlap.
    // A segment names its choices, so every one of them has to be on screen.
    // The converter's category strip is exempt: thirteen of them are meant to
    // scroll, and it says so with a fade at its edge.
    const clipped = [...document.querySelectorAll('.segment')]
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => `a segment hides ${el.scrollWidth - el.clientWidth}px of its options`)

    const bar = document.querySelector('.bar')
    const along = bar ? [...bar.children].map((el) => ({ name: named(el), box: el.getBoundingClientRect() })) : []
    const crowded = []
    for (let i = 1; i < along.length; i += 1) {
      const gap = along[i].box.left - along[i - 1].box.right
      if (gap < 6) crowded.push(`${along[i - 1].name} and ${along[i].name} are ${Math.round(gap)}px apart`)
    }

    return {
      sideways: document.documentElement.scrollWidth > innerWidth + 1,
      loose: [...new Set(loose.map(named))].slice(0, 4),
      small: [...new Set(small.map(named))].slice(0, 4),
      crowded,
      clipped,
    }
  })
  if (found.sideways) t.note(`${where}: the page scrolls sideways`)
  if (found.loose.length) t.note(`${where}: past the edge, loose on the page: ${found.loose.join(', ')}`)
  if (found.small.length) t.note(`${where}: too small to hit: ${found.small.join(', ')}`)
  for (const problem of found.crowded) t.note(`${where}: ${problem}`)
  for (const problem of found.clipped) t.note(`${where}: ${problem}`)
  t.ok(where, !found.sideways && !found.loose.length && !found.small.length && !found.crowded.length && !found.clipped.length)
}

for (const [name, width, height] of SIZES) {
  // Both converter layouts, the simple one with a pair chosen so its rows and
  // the line under them are all drawn.
  const surfaces = [
    ['calculate', { mode: 'calculate' }],
    ['convert, standard', { mode: 'convert', convertStyle: 'categories' }],
    ['convert, simple', { mode: 'convert', convertStyle: 'simple', simpleFrom: 'mass:lb', simpleTo: 'mass:kg' }],
  ]
  for (const [label, settings] of surfaces) {
    const { context, page, noise } = await open(browser, { settings, viewport: { width, height } })
    if (settings.mode === 'calculate') await page.keyboard.type('12.5*(3+4)')
    await page.waitForTimeout(200)
    await inspect(page, `${name}, ${label}`)
    for (const problem of noise) t.note(`${name} ${label} console: ${problem}`)
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
