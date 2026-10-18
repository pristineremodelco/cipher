/**
 * Game scores: finding a game, keeping its score the way that game is scored,
 * the rules a tap away, and all of it still there after the app is closed.
 */
import { browser as launch, open, tally } from './harness.mjs'

const browser = await launch()
const { context, page, noise } = await open(browser, { settings: { mode: 'tools', tool: 'games' }, dark: false })
const t = tally('games')
await page.waitForSelector('.games')

const search = async (query) => {
  await page.click('.game-search input')
  await page.keyboard.type(query)
  await page.keyboard.press('Enter')
  await page.waitForSelector('.game-title')
}
const title = () => page.textContent('.game-title h3').then((s) => s.trim())
const totals = () => page.$$eval('.score-head strong', (els) => els.map((el) => el.textContent.trim()).join(' '))
const cell = (row, col) => `.score-table tbody tr:nth-child(${row}) td:nth-child(${col + 1}) .score-cell`
const key = (k) => page.click(`.pad-sheet .key:text-is("${k}")`)

t.ok('it starts with popular games to tap', (await page.$$eval('.popular-card', (els) => els.length)) >= 8)

// Searching, misspellings included.
await page.click('.game-search input')
await page.keyboard.type('yatzy')
t.is('a misspelling still finds the game', (await page.textContent('.game-option >> nth=0')).trim().startsWith('Yahtzee'), true)
await page.keyboard.press('Escape')
t.is('Escape closes the list', await page.$('.game-results'), null)
t.is('and lets go of what was typed', await page.inputValue('.game-search input'), '')

// Scrabble: a turn typed on the pad, with the 50 for all seven tiles.
await search('scrabble')
t.is('Scrabble opens', await title(), 'Scrabble')
await page.click(cell(1, 1))
await key('2')
await key('4')
await page.click('.pad-sheet .chip:has-text("+50")')
t.is('the bonus adds to the turn being typed', (await page.textContent('.pad-display')).trim(), '74')
await page.click('.pad-sheet button:has-text("Next")')
t.is('Next moves to the next player', (await page.textContent('.pad-head h2')).trim(), 'Player 2')
await key('1')
await key('8')
await page.click('.pad-sheet button:has-text("Done")')
t.is('the totals add up', await totals(), '74 18')
t.ok('and the leader is named', (await page.textContent('.standing')).includes('Player 1 is in front'))
t.ok('a fresh row waits for the next turn', Boolean(await page.$(cell(2, 1))))

// Names, kept for the next game.
await page.fill('.player-name >> nth=0', 'Ann')
t.is('a name typed shows on the sheet', (await page.textContent('.score-name >> nth=0')).trim(), 'Ann')

// It is all still there after the app is closed.
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.game-title')
t.is('the game comes back after a reload', await title(), 'Scrabble')
t.is('with its scores', await totals(), '74 18')

// The rules.
await page.click('.rules-button')
await page.waitForSelector('.rules-sheet')
t.ok('the rules open with the house rules note first', (await page.textContent('.rules-sheet .house-rules')).includes('House rules may differ'))
t.ok('then the rules themselves', (await page.$$eval('.rules dt', (els) => els.length)) >= 3)
await page.keyboard.press('Escape')
t.is('Escape closes the rules', await page.$('.rules-sheet'), null)
t.ok('and only the rules', Boolean(await page.$('.games')))

// Uno takes the names from last time.
await search('uno')
t.is('names carry over to the next game', (await page.inputValue('.player-name >> nth=0')), 'Ann')

// Yahtzee: boxes chosen from their possible values, fixed boxes tapped, the bonus worked out.
await search('yahtzee')
const yahtzee = (label) => `.score-table tr:has(th:text-is("${label}")) td:nth-child(2) .score-cell`
for (const [label, value] of [['Aces', '3'], ['Twos', '6'], ['Threes', '9'], ['Fours', '12'], ['Fives', '15'], ['Sixes', '18']]) {
  await page.click(yahtzee(label))
  await page.click(`.pad-choices .key:text-is("${value}")`)
}
t.is('63 above earns the 35 bonus', (await page.textContent('.score-table tr:has(th:text-is("Bonus")) td:nth-child(2)')).trim(), '35')
await page.click('.score-table tr:has(th:has-text("Full house")) td:nth-child(2) .score-cell')
t.is('a fixed box scores at a tap', (await page.textContent('.score-table tr:has(th:has-text("Full house")) td:nth-child(2)')).trim(), '25')
await page.click('.score-table tr:has(th:has-text("Full house")) td:nth-child(2) .score-cell')
t.is('again scratches it', (await page.textContent('.score-table tr:has(th:has-text("Full house")) td:nth-child(2)')).trim(), '0')
await page.click('.score-table tr:has(th:has-text("Full house")) td:nth-child(2) .score-cell')
t.is('and again clears it', (await page.textContent('.score-table tr:has(th:has-text("Full house")) td:nth-child(2)')).trim(), '')
t.is('the total includes the bonus', (await totals()).split(' ')[0], '98')

// Hearts: shooting the moon.
await search('hearts')
await page.click(cell(1, 1))
await page.click('.pad-sheet button:has-text("Shot the moon")')
t.is('shooting the moon gives everyone else 26', await totals(), '0 26 26')

// Darts: a turn below zero is a bust.
await search('darts 501')
for (let turn = 1; turn <= 3; turn++) {
  await page.click(cell(turn, 1))
  for (const k of '180') await key(k)
  await page.click('.pad-sheet button:has-text("Next")')
  await page.click('.pad-sheet button:has-text("Done")')
}
t.is('three 180s leave 141, the third is a bust', (await totals()).split(' ')[0], '141')
t.ok('and the bust is marked', Boolean(await page.$(`${cell(3, 1)} s`)))

// Monopoly: money up and down.
await search('monopoly')
await page.click('.counter-card >> nth=0 >> .chip:has-text("+$200")')
t.is('passing Go adds 200', (await page.textContent('.counter-card >> nth=0 >> .counter-value')).trim(), '$1,700')
await page.click('.counter-card >> nth=0 >> .counter-value')
await key('5')
await key('0')
await page.click('.pad-sheet button:has-text("Take away")')
t.is('an amount can be taken away', (await page.textContent('.counter-card >> nth=0 >> .counter-value')).trim(), '$1,650')

// Spades: a bid made with a bag over.
await search('spades')
await page.click(cell(1, 1))
for (let i = 0; i < 4; i++) await page.click('.pad-sheet [aria-label="More Bid (the team together)"]')
for (let i = 0; i < 5; i++) await page.click('.pad-sheet [aria-label="More Tricks taken"]')
await page.click('.pad-sheet button:has-text("Next")')
await page.keyboard.press('Escape')
t.is('bid 4, took 5 scores 41', (await totals()).split(' ')[0], '41')

// Bowling: a perfect game, alone.
await search('bowling')
while ((await page.$$('.player-chip')).length > 1) {
  await page.click('.player-remove >> nth=-1')
  await page.click('.player-remove >> nth=-1')
}
for (let i = 0; i < 12; i++) await page.click('.pins-grid .key:text-is("X")')
t.is('twelve strikes are 300', (await page.textContent('.bowling-name strong')).trim(), '300')
t.ok('and the game is over', (await page.textContent('.standing')).includes('wins'))
await page.click('button:has-text("Undo the last ball")')
t.is('the last ball can be undone', await page.$$eval('.pins-grid .key', (els) => els.length), 11)

// New game clears the scores and keeps the players.
await search('scrabble')
await page.click('.game-actions button:has-text("New game")')
await page.click('.game-actions button:has-text("Clear every score?")')
t.is('a new game starts from nothing', await totals(), '0 0')
t.is('with the same players', await page.inputValue('.player-name >> nth=0'), 'Ann')

// A wide sheet scrolls in its own box and never pushes the page sideways.
await search('hearts')
while ((await page.$$('.add-player')).length) await page.click('.add-player')
const wide = await page.evaluate(() => {
  const tools = document.querySelector('.tools')
  const box = document.querySelector('.score-wrap')
  return { page: tools.scrollWidth <= tools.clientWidth + 1, box: box.scrollWidth > box.clientWidth }
})
t.ok('six players do not widen the page', wide.page)
t.ok('the sheet scrolls in its own box instead', wide.box)

t.done(noise)
await context.close()
await browser.close()
