import { counters, gamesWon, points, rounds, sheet } from './kit.ts'
import type { Game } from './types.ts'

const upper = (id: string, label: string, face: number) =>
  points(id, label, { choices: [0, 1, 2, 3, 4, 5].map((n) => n * face), hint: `Count of ${face}s, times ${face}` })

const TRIANGLE = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78]

export const DICE: Game[] = [
  {
    id: 'yahtzee',
    name: 'Yahtzee',
    aka: ['Yatzy', 'Yatzee', 'Yahtzi', 'Yacht', 'Yardzee', 'Lawn Yahtzee', 'Giant Yahtzee'],
    category: 'dice',
    players: [1, 8],
    sheet: sheet([
      { ...upper('aces', 'Aces', 1), section: 'Upper section' },
      upper('twos', 'Twos', 2),
      upper('threes', 'Threes', 3),
      upper('fours', 'Fours', 4),
      upper('fives', 'Fives', 5),
      upper('sixes', 'Sixes', 6),
      points('upperbonus', 'Bonus', { bonus: { of: ['aces', 'twos', 'threes', 'fours', 'fives', 'sixes'], atLeast: 63, add: 35 }, hint: '35 with 63 or more above' }),
      points('three', '3 of a kind', { section: 'Lower section', hint: 'Total of all five dice' }),
      points('four', '4 of a kind', { hint: 'Total of all five dice' }),
      points('full', 'Full house', { fixed: 25 }),
      points('small', 'Small straight', { fixed: 30, hint: 'Four in a row' }),
      points('large', 'Large straight', { fixed: 40, hint: 'Five in a row' }),
      points('yahtzee', 'Yahtzee', { fixed: 50, hint: 'Five of a kind' }),
      points('chance', 'Chance', { hint: 'Total of all five dice' }),
      points('extra', 'Yahtzee bonus', { per: 100, hint: 'Each Yahtzee after the first' }),
    ]),
    rules: `Goal: Highest total after thirteen turns.
Turn: Roll five dice up to three times, setting aside any you want to keep between rolls. Then score in one empty box; if nothing fits, score 0 in a box of your choice.
Upper section: Add only the dice of that number. 63 or more across the six boxes earns a 35 bonus.
Lower section: 3 and 4 of a kind score all five dice. Full house 25, small straight (four in a row) 30, large straight (five) 40, Yahtzee 50. Chance scores all five dice.
Extra Yahtzees: Each one after a scored Yahtzee of 50 earns 100, and must also fill a box (the Joker rule).
Scoring here: Tap a fixed box once to score it, again to score it as 0, and once more to clear it.`,
  },
  {
    id: 'farkle',
    name: 'Farkle',
    aka: ['10000', '10,000', 'Ten Thousand', 'Zilch', 'Dice 10000', 'Greed'],
    category: 'dice',
    players: [2, 8],
    sheet: rounds({ win: 'high', target: 10000, round: 'Turn', quick: [50, 100, 500, 1000] }),
    rules: `Goal: First to 10,000 points.
Turn: Roll six dice. Set aside at least one scoring die each roll, then bank your points or roll the rest. Score with all six and you may roll all six again.
Farkle: A roll with nothing that scores loses everything from that turn.
Common scoring: A single 1 is 100 and a single 5 is 50. Three of a kind is 100 times the number, with three 1s at 1,000. Four of a kind 1,000, five 2,000, six 3,000. A straight of 1 to 6 is 1,500, three pairs 1,500. Tables vary, so agree first.
Getting on the board: Many tables need a first turn of 500 or more.
End: Once someone reaches 10,000, everyone else has one last turn to beat them.`,
  },
  {
    id: 'bunco',
    name: 'Bunco',
    aka: ['Bunko', 'Bonko'],
    category: 'dice',
    players: [2, 12],
    sheet: rounds({
      win: 'high',
      rounds: 6,
      round: 'Round',
      labels: ['Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes'],
      parts: [
        { label: "Dice showing the round's number", per: 1 },
        { label: 'Buncos', per: 21 },
        { label: 'Three of a kind, other numbers', per: 5 },
      ],
    }),
    rules: `Goal: Score the most across six rounds, each with its own target number, ones to sixes.
Turn: Roll three dice. Score 1 for each die showing the round's number and keep rolling while you score.
Bunco: All three dice showing the round's number scores 21. Three of a kind of any other number commonly scores 5.
Rounds: Usually played at tables in pairs; a round ends when the head table reaches 21. Winners move up a table.`,
  },
  {
    id: 'liarsdice',
    name: "Liar's Dice",
    aka: ['Perudo', 'Dudo', 'Pirates dice'],
    category: 'dice',
    players: [2, 6],
    sheet: counters({ counters: [{ id: 'dice', label: 'Dice left', start: 5, min: 0, max: 5, lose: 0 }] }),
    rules: `Goal: Be the last player with dice.
Round: Everyone rolls five dice under a cup and looks only at their own.
Bidding: In turn, bid a quantity of a face across all cups, such as four 3s. Each bid must raise the quantity, or the face with the same quantity. In many games 1s are wild.
Challenge: Instead of bidding, call liar. Everyone shows; if the bid is there, the challenger loses a die, if not, the bidder does.`,
  },
  {
    id: 'qwixx',
    name: 'Qwixx',
    category: 'dice',
    players: [2, 5],
    sheet: sheet([
      points('red', 'Red', { table: TRIANGLE, hint: 'Crosses, the lock included' }),
      points('yellow', 'Yellow', { table: TRIANGLE, hint: 'Crosses, the lock included' }),
      points('green', 'Green', { table: TRIANGLE, hint: 'Crosses, the lock included' }),
      points('blue', 'Blue', { table: TRIANGLE, hint: 'Crosses, the lock included' }),
      points('penalties', 'Penalties', { per: -5 }),
    ]),
    rules: `Goal: Most points from crossing off numbers in four coloured rows.
Turn: The active player rolls all six dice. Everyone may cross off the total of the two white dice in any row. The active player may then also cross off one white die plus one coloured die, in that colour's row.
Order: Rows run left to right; skipped numbers can never be crossed afterwards.
Locking: The last number in a row needs five crosses in that row first; crossing it locks the row and counts as an extra cross.
Penalty: An active player who crosses nothing takes a penalty, minus 5.
End: After four penalties for one player, or when two rows are locked.
Scoring: Each row scores by its crosses: 1, 3, 6, 10, 15, and so on.`,
  },
  {
    id: 'shutthebox',
    name: 'Shut the Box',
    aka: ['Canoga', 'Tric-Trac', 'Batten Down the Hatches'],
    category: 'dice',
    players: [1, 8],
    sheet: rounds({ win: 'low', round: 'Turn' }),
    rules: `Goal: Shut as many tiles as you can.
Turn: Roll two dice, or one once 7, 8 and 9 are shut. Shut any open tiles that add up to the roll. Keep rolling until you cannot.
Scoring: The tiles left open, added up. Shutting them all is shutting the box, which often wins outright. Lowest total wins.`,
  },
  {
    id: 'pig',
    name: 'Pig',
    aka: ['Pass the Pigs'],
    category: 'dice',
    players: [2, 10],
    sheet: rounds({ win: 'high', target: 100, round: 'Turn' }),
    rules: `Goal: First to 100.
Turn: Roll one die as many times as you like, adding up the rolls, then hold to bank them.
Pig out: Rolling a 1 loses everything from that turn.`,
  },
  {
    id: 'shipcaptaincrew',
    name: 'Ship, Captain, and Crew',
    aka: ['Ship Captain Crew', '6 5 4', 'Clickety Clack'],
    category: 'dice',
    players: [2, 10],
    sheet: rounds({ win: 'high', round: 'Turn' }),
    rules: `Goal: The highest cargo.
Turn: Three rolls of five dice. You need a 6 (the ship), then a 5 (the captain), then a 4 (the crew), in that order; set each aside as you get it.
Cargo: With all three, the other two dice are your cargo; you may use leftover rolls to improve it. Without all three, you score nothing.`,
  },
  {
    id: 'leftcenterright',
    name: 'Left Centre Right',
    aka: ['LCR', 'Left Right Centre', 'Left Center Right', 'Left Right Center'],
    category: 'dice',
    players: [3, 12],
    sheet: counters({ counters: [{ id: 'chips', label: 'Chips', start: 3, min: 0 }] }),
    rules: `Goal: Be the last with chips.
Setup: Three chips each.
Turn: Roll one die per chip you hold, three at most. L passes a chip to the left, R to the right, C into the centre pot; dots keep it.
No chips: You do not roll but stay in, since chips can come back to you.
End: The last player holding chips wins the pot.`,
  },
  {
    id: 'zombiedice',
    name: 'Zombie Dice',
    category: 'dice',
    players: [2, 8],
    sheet: rounds({ win: 'high', target: 13, round: 'Turn' }),
    rules: `Goal: Eat 13 brains.
Turn: Draw three dice from the cup and roll. Brains score, shotguns hurt, footprints are rolled again. Keep drawing back up to three and rolling, or stop to bank your brains.
Shot: A third shotgun in a turn ends it with nothing.
End: Once someone reaches 13, finish the round. Most brains wins.`,
  },
  {
    id: 'kingoftokyo',
    name: 'King of Tokyo',
    category: 'dice',
    players: [2, 6],
    sheet: counters({
      counters: [
        { id: 'vp', label: 'Victory points', start: 0, min: 0, max: 20, win: 20 },
        { id: 'health', label: 'Health', start: 10, min: 0, max: 12, lose: 0 },
        { id: 'energy', label: 'Energy', start: 0, min: 0 },
      ],
    }),
    rules: `Goal: Reach 20 victory points, or be the last monster standing.
Turn: Roll six dice up to three times, keeping any. Three of a number score that many points, plus 1 per extra die. Claws hit, hearts heal, lightning gives energy.
Tokyo: Entering it scores 1, starting a turn there scores 2. A monster in Tokyo cannot heal and hits everyone outside; those outside hit only it. When hit, it may yield Tokyo to the attacker.
Cards: Spend energy on power cards.`,
  },
  {
    id: 'tenzi',
    name: 'Tenzi',
    category: 'dice',
    players: [2, 10],
    sheet: gamesWon(),
    rules: `Goal: Be first to have all ten of your dice showing the same number.
Play: Everyone rolls at once and keeps rolling, setting aside dice that match the number they are going for.
End: The first to get all ten shouts Tenzi and wins.`,
  },
  {
    id: 'threes',
    name: 'Threes',
    aka: ['Tripsies', 'Low Ball'],
    category: 'dice',
    players: [2, 10],
    sheet: rounds({ win: 'low', round: 'Turn' }),
    rules: `Goal: The lowest total.
Turn: Roll five dice. After each roll keep at least one, until all five are kept.
Scoring: Threes count as zero; everything else counts face value. Lowest wins.`,
  },

  // Words.
  {
    id: 'scrabble',
    name: 'Scrabble',
    category: 'word',
    players: [2, 4],
    sheet: rounds({ win: 'high', round: 'Turn', quick: [50] }),
    rules: `Goal: Score the most points by building words on the board.
Turn: Play tiles in one line to make a word that joins the tiles already there; the first word covers the centre star. Score it and draw back up to seven. Or swap tiles, or pass.
Scoring: Add the letter values, doubling or tripling letters first, then the whole word. Premium squares only count on the turn they are covered. Using all seven tiles earns 50 more.
Blanks: Stand for any letter and score nothing.
End: When the bag is empty and someone plays their last tile, or nobody can play. Everyone subtracts their unplayed tiles; a player who went out adds the others' totals.`,
  },
  {
    id: 'upwords',
    name: 'Upwords',
    category: 'word',
    players: [2, 4],
    sheet: rounds({ win: 'high', round: 'Turn', quick: [20] }),
    rules: `Goal: Score the most by building and stacking words.
Turn: Play tiles in one line to make words, or stack them on letters already played to change a word. Stacks go no higher than five, and a whole word cannot be covered at once.
Scoring: A word with every tile on the bottom level scores 2 per tile. Once any of it is stacked, each letter scores 1 for every tile in its stack. Using all seven tiles adds 20.`,
  },
  {
    id: 'bananagrams',
    name: 'Bananagrams',
    category: 'word',
    players: [1, 8],
    sheet: gamesWon(),
    rules: `Goal: Be first to use all your tiles in your own connected crossword.
Start: Tiles face down. Take 21 each with two to four players, 15 with five or six, 11 with seven or eight. Someone says split and everyone builds at once.
Peel: When you use all your tiles, say peel, and everyone takes one more.
Dump: Put one tile back to take three.
End: When fewer tiles remain than players, the first to use all theirs says bananas. A wrong word means they are out and their tiles go back.`,
  },
  {
    id: 'boggle',
    name: 'Boggle',
    category: 'word',
    players: [2, 8],
    sheet: rounds({
      win: 'high',
      round: 'Round',
      parts: [
        { label: '3 or 4 letter words', per: 1 },
        { label: '5 letter words', per: 2 },
        { label: '6 letter words', per: 3 },
        { label: '7 letter words', per: 5 },
        { label: '8 or more letters', per: 11 },
      ],
    }),
    rules: `Goal: Find the most points' worth of words nobody else found.
Round: Shake the grid and turn the timer, three minutes. Write words of three or more letters made from touching letters, in any direction including diagonally, using each die once per word.
Compare: Words that more than one player found are crossed off everyone's list.
Scoring: 3 or 4 letters 1, 5 letters 2, 6 letters 3, 7 letters 5, 8 or more 11.`,
  },
  {
    id: 'scattergories',
    name: 'Scattergories',
    category: 'word',
    players: [2, 6],
    sheet: rounds({ win: 'high', rounds: 3, round: 'Round' }),
    rules: `Goal: Most points after three rounds.
Round: Roll the letter die and start the timer. Write an answer for each of the twelve categories, each starting with that letter.
Scoring: Read the answers out. One no one else gave scores 1. Several words starting with the letter score 1 each. Answers can be challenged and voted on.`,
  },
  {
    id: 'quiddler',
    name: 'Quiddler',
    category: 'word',
    players: [1, 8],
    sheet: rounds({
      win: 'high',
      rounds: 8,
      round: 'Round',
      labels: ['3 cards', '4 cards', '5 cards', '6 cards', '7 cards', '8 cards', '9 cards', '10 cards'],
    }),
    rules: `Goal: Most points over eight rounds, dealing three cards in the first and one more each round.
Turn: Draw and discard. Go out by laying every remaining card as words.
Going out: Everyone else has one more turn and lays down what words they can.
Scoring: Letters used in words score their values; letters left in hand count against you. Commonly 10 for the longest word and 10 for the most words.`,
  },

  // Tiles and dominoes.
  {
    id: 'rummikub',
    name: 'Rummikub',
    aka: ['Rummy-O', 'Rummikube'],
    category: 'tiles',
    players: [2, 4],
    sheet: rounds({ win: 'high', round: 'Game' }),
    rules: `Goal: Be first to play every tile from your rack.
Start: Fourteen tiles each. Your first play must be sets or runs from your own rack worth 30 or more.
Turn: Play tiles, rearranging anything on the table as long as every group is valid at the end, or draw one tile.
Groups: Runs of three or more in one colour, or sets of three or four of a number in different colours. Jokers are wild.
Scoring: The others subtract the tiles left on their racks (a joker 30); the winner adds that total.`,
  },
  {
    id: 'mahjong',
    name: 'Mahjong',
    aka: ['Mah Jongg', 'Mahjongg', 'Majong'],
    category: 'tiles',
    players: [3, 4],
    sheet: rounds({ win: 'high', round: 'Hand' }),
    rules: `Goal: Complete a winning hand, usually four sets and a pair.
Turn: Draw a tile, then discard one. Claim a discard to complete a pung (three alike), kong (four alike) or chow (a run, only from the player before you), or to win.
Winning: Declare mahjong when your hand is complete.
Scoring: Varies greatly between Chinese, Hong Kong, Japanese and American styles; enter each hand's result by the rules at your table.`,
  },
  {
    id: 'dominoes',
    name: 'Dominoes (draw)',
    aka: ['Dominos', 'Block dominoes', 'Draw dominoes'],
    category: 'tiles',
    players: [2, 4],
    sheet: rounds({ win: 'high', target: 100, round: 'Hand' }),
    rules: `Goal: First to 100 points.
Start: Seven tiles each with two players, five with three or four. The highest double usually starts.
Turn: Play a tile matching an open end. If you cannot, draw from the boneyard until you can.
Scoring: The first out scores the pips left in everyone else's hands. A blocked game goes to the lowest hand.`,
  },
  {
    id: 'allfives',
    name: 'All Fives',
    aka: ['Muggins', 'Fives and Threes', 'Five Up'],
    category: 'tiles',
    players: [2, 4],
    sheet: rounds({ win: 'high', target: 250, round: 'Hand', quick: [5, 10, 15, 20] }),
    rules: `Goal: First to an agreed total, often 150 or 250.
Play: As draw dominoes. The first double is a spinner, open on all four sides.
Scoring: Whenever the open ends add up to a multiple of five, score that total. Going out scores the pips left in others' hands, rounded to five.`,
  },
  {
    id: 'mexicantrain',
    name: 'Mexican Train',
    aka: ['Mexican Train Dominoes', 'Train dominoes'],
    category: 'tiles',
    players: [2, 8],
    sheet: rounds({
      win: 'low',
      rounds: 13,
      round: 'Round',
      labels: ['Double 12', 'Double 11', 'Double 10', 'Double 9', 'Double 8', 'Double 7', 'Double 6', 'Double 5', 'Double 4', 'Double 3', 'Double 2', 'Double 1', 'Double blank'],
    }),
    rules: `Goal: Lowest total after thirteen rounds, starting from double 12 and counting down to double blank.
Trains: Each player builds their own train from the engine in the middle; the Mexican train is open to all.
Turn: Play one tile on your train, the Mexican train, or any train with a marker on it. If you cannot, draw one; still nothing, and you put a marker on your own train, opening it to everyone until you play on it.
Doubles: A double must be covered before anything else is played, by anyone.
Scoring: When someone goes out, everyone counts the pips left in their hand; a double blank often counts 50.`,
  },
  {
    id: 'chickenfoot',
    name: 'Chickenfoot',
    aka: ['Chicken foot'],
    category: 'tiles',
    players: [2, 8],
    sheet: rounds({
      win: 'low',
      rounds: 10,
      round: 'Round',
      labels: ['Double 9', 'Double 8', 'Double 7', 'Double 6', 'Double 5', 'Double 4', 'Double 3', 'Double 2', 'Double 1', 'Double blank'],
    }),
    rules: `Goal: Lowest total after the rounds, with a double-nine set from double 9 down to double blank.
Start: The round's double begins it; six tiles must be played around it before anything else.
Chickenfoot: Every double played needs three tiles on its far side, like a chicken's foot, before play goes on elsewhere.
Turn: Play one tile or draw one; play it if you can.
Scoring: Pips left in hand count against you; a double blank counts 50.`,
  },
  {
    id: 'qwirkle',
    name: 'Qwirkle',
    category: 'tiles',
    players: [2, 4],
    sheet: rounds({ win: 'high', round: 'Turn', quick: [6] }),
    rules: `Goal: Score the most by making lines of tiles that share a colour or a shape.
Turn: Play one or more tiles in a single line, all sharing one colour or one shape with no repeats, then draw back up to six. Or swap tiles.
Scoring: 1 point for each tile in every line you make or add to. A line of all six is a Qwirkle and scores 12.
End: When the bag is empty and someone plays their last tile, earning 6 more.`,
  },
  {
    id: 'sequence',
    name: 'Sequence',
    category: 'board',
    players: [2, 3],
    teams: true,
    sheet: gamesWon(),
    rules: `Goal: Make sequences of five chips in a row on the board.
Turn: Play a card and place a chip on a matching space. Two-eyed jacks are wild; one-eyed jacks remove an opponent's chip (not one in a finished sequence).
Corners: Free spaces that count for everyone.
Dead cards: A card with both of its spaces taken can be swapped on your turn.
End: Two sequences win with two teams; one wins with three.`,
  },
]
