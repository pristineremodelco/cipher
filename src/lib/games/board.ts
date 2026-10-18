import { counters, gamesWon, points, rounds, sheet } from './kit.ts'
import type { Game } from './types.ts'

export const BOARD: Game[] = [
  {
    id: 'catan',
    name: 'Catan',
    aka: ['Settlers of Catan', 'Settlers'],
    category: 'board',
    players: [3, 6],
    sheet: sheet(
      [
        points('settlements', 'Settlements', { per: 1 }),
        points('cities', 'Cities', { per: 2 }),
        points('vp', 'Victory point cards', { per: 1 }),
        points('road', 'Longest Road', { fixed: 2, hint: 'Five or more road pieces in a row' }),
        points('army', 'Largest Army', { fixed: 2, hint: 'Three or more knights played' }),
      ],
      10,
    ),
    rules: `Goal: Be the first to reach 10 victory points on your own turn.
Turn: Roll two dice; every settlement on a hex with that number takes one of its resource, a city takes two. Then trade with players or the bank (4 to 1, or better at a harbour) and build.
Building: Road is brick and lumber. Settlement is brick, lumber, wool and grain, at least two edges from any other. City is three ore and two grain, upgrading a settlement. Development card is ore, wool and grain.
The robber: A 7 means anyone holding more than seven cards discards half, rounded down. The roller moves the robber to a new hex, which then produces nothing, and steals a card from someone with a settlement or city there.
Scoring: Settlement 1, city 2, victory point card 1, Longest Road 2 (five or more in a row), Largest Army 2 (three or more knights).`,
  },
  {
    id: 'tickettoride',
    name: 'Ticket to Ride',
    aka: ['TTR', 'Ticket to Ride USA'],
    category: 'board',
    players: [2, 5],
    sheet: sheet([
      points('r1', '1-car routes', { per: 1, section: 'Routes claimed' }),
      points('r2', '2-car routes', { per: 2 }),
      points('r3', '3-car routes', { per: 4 }),
      points('r4', '4-car routes', { per: 7 }),
      points('r5', '5-car routes', { per: 10 }),
      points('r6', '6-car routes', { per: 15 }),
      points('done', 'Tickets completed', { section: 'Destination tickets', hint: 'Points on the tickets' }),
      points('failed', 'Tickets not completed', { minus: true, hint: 'Points on the tickets' }),
      points('longest', 'Longest continuous route', { fixed: 10, section: 'Bonus' }),
    ]),
    rules: `Goal: Score the most points by claiming routes and completing destination tickets.
Turn: Do one thing: draw two train cards (a face-up locomotive counts as both), claim a route by playing cards of its colour and length (grey routes take any one colour), or draw three tickets and keep at least one.
Routes: Locomotives are wild. In a two or three player game only one of a double route can be used.
Scoring: A route scores by length: 1, 2, 4, 7, 10 or 15 points for 1 to 6 cars. At the end, completed tickets add their value and unfinished ones take it away. The longest continuous path scores 10.
End: When someone has two or fewer trains left, everyone, that player included, has one last turn.`,
  },
  {
    id: 'tickettorideeurope',
    name: 'Ticket to Ride: Europe',
    aka: ['TTR Europe'],
    category: 'board',
    players: [2, 5],
    sheet: sheet([
      points('r1', '1-car routes', { per: 1, section: 'Routes claimed' }),
      points('r2', '2-car routes', { per: 2 }),
      points('r3', '3-car routes', { per: 4 }),
      points('r4', '4-car routes', { per: 7 }),
      points('r6', '6-car routes', { per: 15 }),
      points('r8', '8-car routes', { per: 21 }),
      points('done', 'Tickets completed', { section: 'Destination tickets', hint: 'Points on the tickets' }),
      points('failed', 'Tickets not completed', { minus: true, hint: 'Points on the tickets' }),
      points('stations', 'Stations kept', { per: 4, section: 'Bonus', hint: 'Of three' }),
      points('express', 'European Express', { fixed: 10, hint: 'Longest continuous route' }),
    ]),
    rules: `Goal: Score the most points from routes, tickets and unused stations.
Turn: Draw train cards, claim a route, draw tickets, or build a station in a city to borrow one of another player's routes there.
Ferries and tunnels: Ferries need a locomotive for each locomotive symbol. For a tunnel, turn up three cards; each that matches the colour played, or is a locomotive, costs one more card or the claim fails.
Scoring: Routes score 1, 2, 4, 7, 15 or 21 for 1, 2, 3, 4, 6 or 8 cars. Each station not built is worth 4. The longest continuous route scores 10.
End: When someone has two or fewer trains left, everyone has one last turn.`,
  },
  {
    id: 'monopoly',
    name: 'Monopoly',
    category: 'board',
    players: [2, 8],
    sheet: counters({ counters: [{ id: 'cash', label: 'Cash', start: 1500, min: -999999, steps: [200], money: true }] }),
    rules: `Goal: Be the last player who is not bankrupt.
Turn: Roll two dice and move. Doubles roll again; three doubles in a row go straight to Jail. Buy an unowned property you land on, or the bank auctions it.
Rent: Landing on someone's property means paying rent. Owning a whole colour group doubles the rent on unimproved lots, and houses and hotels can then be built evenly across it.
Go: Collect $200 for passing or landing on Go.
Jail: Get out by rolling doubles, paying $50, or using a Get Out of Jail Free card; after three failed turns you must pay. You still collect rent while in Jail.
Commonly house ruled: Money paid in fines does not go on Free Parking in the official rules, and landing there does nothing.`,
  },
  {
    id: 'gameoflife',
    name: 'The Game of Life',
    aka: ['Life'],
    category: 'board',
    players: [2, 6],
    sheet: counters({ counters: [{ id: 'cash', label: 'Money', start: 10000, min: -9999999, money: true, steps: [10000] }] }),
    rules: `Goal: Retire with the most money once everything is counted.
Turn: Spin and move the number shown, following any space you land on and stopping at every stop space.
Along the way: Choose college or career, collect your salary on each payday you pass, marry, buy a house and add children to your car.
End: Players retire as they reach the end. Add up cash, the value of houses, and any cards your edition counts; loans are paid back. Editions differ in the details, so go by the one on the table.`,
  },
  {
    id: 'clue',
    name: 'Clue',
    aka: ['Cluedo'],
    category: 'board',
    players: [3, 6],
    sheet: {
      kind: 'notes',
      groups: [
        { label: 'Who', items: ['Miss Scarlet', 'Colonel Mustard', 'Mrs. White', 'Mr. Green', 'Mrs. Peacock', 'Professor Plum'] },
        { label: 'What', items: ['Candlestick', 'Knife', 'Lead Pipe', 'Revolver', 'Rope', 'Wrench'] },
        {
          label: 'Where',
          items: ['Kitchen', 'Ballroom', 'Conservatory', 'Dining Room', 'Billiard Room', 'Library', 'Lounge', 'Hall', 'Study'],
        },
      ],
    },
    rules: `Goal: Be first to name the suspect, weapon and room in the envelope.
Turn: Roll and move, or take a secret passage between corner rooms. In a room you may suggest that a suspect did it there with a weapon; the suspect's token is moved in.
Suggestions: Going left, the first player who holds any of the three named cards must show you one of them privately.
Accusation: Once per game, on your turn, you may accuse; check the envelope in secret. Wrong, and you stop playing but keep showing cards when asked.
Notes: Tap a square to mark it: a tick for a card someone has, a cross for one they do not, a question mark for a guess.`,
  },
  {
    id: 'trivialpursuit',
    name: 'Trivial Pursuit',
    category: 'board',
    players: [2, 6],
    sheet: {
      kind: 'checklist',
      items: [
        { id: 'blue', label: 'Geography', colour: '#2f6feb' },
        { id: 'pink', label: 'Entertainment', colour: '#e05ba2' },
        { id: 'yellow', label: 'History', colour: '#e2b100' },
        { id: 'brown', label: 'Arts & Literature', colour: '#8a5a2b' },
        { id: 'green', label: 'Science & Nature', colour: '#2e9e4f' },
        { id: 'orange', label: 'Sports & Leisure', colour: '#ef7d1a' },
      ],
    },
    rules: `Goal: Collect all six wedges, return to the hub and answer one last question.
Turn: Roll and move either way. Answer the question for the colour you land on; a right answer keeps your turn going.
Wedges: Answer correctly on a category headquarters (the large spaces at the ends of the spokes) to earn that colour's wedge.
End: With all six, reach the hub by exact count; the other players choose the final category. Get it right and you win.`,
  },
  {
    id: 'pandemic',
    name: 'Pandemic',
    category: 'board',
    players: [2, 4],
    sheet: counters({
      shared: true,
      counters: [
        { id: 'cures', label: 'Cures found', start: 0, min: 0, max: 4, win: 4 },
        { id: 'outbreaks', label: 'Outbreaks', start: 0, min: 0, max: 8, lose: 8 },
        { id: 'rate', label: 'Infection rate', start: 2, min: 2, max: 4 },
        { id: 'epidemics', label: 'Epidemics drawn', start: 0, min: 0, max: 6 },
      ],
    }),
    rules: `Goal: Together, discover cures for all four diseases.
Turn: Take four actions: move, build a research station, treat a disease (remove a cube), share a city card, or cure a disease with five cards of its colour at a research station. Then draw two player cards and infect cities.
Epidemics: Raise the infection rate, infect the bottom city with three cubes, then shuffle the infection discards back on top.
Outbreaks: A fourth cube in a city spreads one to each connected city instead.
You lose: At the eighth outbreak, when a colour runs out of cubes, or when the player deck runs out.`,
  },
  {
    id: 'carcassonne',
    name: 'Carcassonne',
    category: 'tiles',
    players: [2, 5],
    sheet: rounds({ win: 'high', round: 'Turn' }),
    rules: `Goal: Score the most points by placing tiles and claiming features with your followers.
Turn: Draw and place a tile so every edge matches its neighbours. You may then place one follower on a feature of that tile, if nobody already holds that feature.
Scoring while playing: A finished road scores 1 per tile; a finished city 2 per tile plus 2 per shield; a finished monastery, surrounded by eight tiles, scores 9. Followers come back once scored.
Ties: When followers share a feature, whoever has the most scores it; equal numbers all score in full.
End: Unfinished roads and monasteries score 1 per tile, unfinished cities 1 per tile and shield, and each field scores 3 for every finished city it touches.`,
  },
  {
    id: 'azul',
    name: 'Azul',
    category: 'tiles',
    players: [2, 4],
    sheet: rounds({ win: 'high', round: 'Round' }),
    rules: `Goal: Score the most points decorating your wall.
Turn: Take all tiles of one colour from a factory (the rest go to the middle) or all of one colour from the middle. The first to take from the middle takes the first player marker too, which counts as a floor tile. Place them on one pattern line; extras fall to the floor.
Tiling: When the round ends, each full pattern line moves one tile to the wall. It scores 1 alone, or 1 for each tile it joins in a row and in a column.
Floor: Tiles on the floor line lose 1, 1, 2, 2, 2, 3, 3 points.
End: After a round in which someone completes a horizontal row. Bonuses: 2 per full row, 7 per full column, 10 per colour placed five times.`,
  },
  {
    id: 'splendor',
    name: 'Splendor',
    category: 'board',
    players: [2, 4],
    sheet: counters({ counters: [{ id: 'prestige', label: 'Prestige', start: 0, min: 0, win: 15, steps: [2, 3, 4, 5] }] }),
    rules: `Goal: Reach 15 prestige points.
Turn: Do one thing: take three gems of different colours; take two of the same colour if four or more are there; reserve a card and take a gold joker; or buy a card from the table or your reserve.
Holding: You may hold no more than ten tokens and three reserved cards.
Nobles: A noble visits at the end of your turn once your cards show enough bonuses, worth 3 points; only one a turn.
End: When someone reaches 15, finish the round so everyone has the same number of turns. Most points wins; fewest cards bought breaks a tie.`,
  },
  {
    id: 'sevenwonders',
    name: '7 Wonders',
    aka: ['Seven Wonders'],
    category: 'board',
    players: [2, 7],
    sheet: sheet([
      points('military', 'Military', { hint: 'Tokens, minus the defeats' }),
      points('coins', 'Coins', { divide: 3, hint: 'One point for every three' }),
      points('wonder', 'Wonder'),
      points('civil', 'Civilian (blue)'),
      points('commerce', 'Commerce (yellow)'),
      points('guilds', 'Guilds (purple)'),
      points('science', 'Science (green)', { science: true }),
    ]),
    rules: `Goal: Have the most points after the third age.
Turn: Everyone picks one card from their hand at once and passes the rest on, left in ages I and III and right in age II. Build it by paying its cost, discard it for three coins, or tuck it under your wonder to build a stage.
Trade: Buy a resource you lack from a neighbour for two coins.
Military: After each age, compare shields with both neighbours: win for 1, 3 or 5 points by age, lose for minus 1.
Science: Each set of three different symbols scores 7, and each kind scores its count squared.`,
  },
  {
    id: 'wingspan',
    name: 'Wingspan',
    category: 'board',
    players: [1, 5],
    sheet: sheet([
      points('birds', 'Birds'),
      points('bonus', 'Bonus cards'),
      points('goals', 'End-of-round goals'),
      points('eggs', 'Eggs', { per: 1 }),
      points('food', 'Food on cards', { per: 1 }),
      points('tucked', 'Tucked cards', { per: 1 }),
    ]),
    rules: `Goal: Have the most points after four rounds.
Turn: Place one action cube and do one thing: play a bird into a habitat (paying its food and eggs), or gain food, lay eggs or draw cards, activating the brown powers along that row from right to left.
Rounds: Each round you have one fewer action. After each, score the round's goal.
Scoring: Points on birds, bonus cards and round goals, plus 1 for each egg, each food on a card and each tucked card.`,
  },
  {
    id: 'terraformingmars',
    name: 'Terraforming Mars',
    category: 'board',
    players: [1, 5],
    sheet: sheet([
      points('tr', 'Terraform rating'),
      points('milestones', 'Milestones', { per: 5 }),
      points('awards', 'Awards', { hint: '5 for first, 2 for second' }),
      points('greenery', 'Greenery tiles', { per: 1 }),
      points('cities', 'Cities', { hint: '1 for each adjacent greenery' }),
      points('cards', 'Cards'),
    ]),
    rules: `Goal: Have the most points once oxygen, temperature and oceans are all maxed out.
Generation: Each turn take one or two actions: play a card, use a standard project, claim a milestone, fund an award, convert plants to greenery or heat to temperature, or use a card's action. Pass when done.
Production: When everyone has passed, energy becomes heat and you gain resources by production plus credits by terraform rating and credit production.
Scoring: Terraform rating, milestones 5 each, awards 5 for first and 2 for second, 1 per greenery, 1 per greenery next to each city, and the points on cards.`,
  },
  {
    id: 'everdell',
    name: 'Everdell',
    category: 'board',
    players: [1, 4],
    sheet: sheet([
      points('cards', 'Cards (base points)'),
      points('tokens', 'Point tokens'),
      points('prosperity', 'Prosperity cards'),
      points('journey', 'Journey'),
      points('events', 'Events'),
    ]),
    rules: `Goal: Build the city worth the most points over four seasons.
Turn: Place a worker to gather, play a card into your city (paying berries, twigs, resin or pebbles), or prepare for the next season.
City: No more than fifteen cards. A critter can be played free if its construction is in your city.
Scoring: Points on cards and tokens, prosperity card bonuses, journey and events.`,
  },
  {
    id: 'cascadia',
    name: 'Cascadia',
    category: 'tiles',
    players: [1, 4],
    sheet: sheet([
      points('bear', 'Bear', { section: 'Wildlife' }),
      points('elk', 'Elk'),
      points('salmon', 'Salmon'),
      points('hawk', 'Hawk'),
      points('fox', 'Fox'),
      points('mountain', 'Mountain', { section: 'Habitats', hint: 'Largest area, plus any majority bonus' }),
      points('forest', 'Forest'),
      points('prairie', 'Prairie'),
      points('wetland', 'Wetland'),
      points('river', 'River'),
      points('nature', 'Nature tokens', { section: 'Other', per: 1 }),
    ]),
    rules: `Goal: Score the most from wildlife patterns and habitat areas.
Turn: Take a habitat tile and its paired wildlife token, place the tile touching your area, and place the token on a tile that shows that animal.
Nature tokens: Spend one to take any tile and any token, or to wipe any number of tokens.
End: After twenty turns each. Wildlife scores by the cards in play; each habitat scores its largest connected area, plus a bonus for the largest of each.`,
  },
  {
    id: 'kingdomino',
    name: 'Kingdomino',
    category: 'tiles',
    players: [2, 4],
    sheet: sheet([
      points('lands', 'Properties', { hint: 'Each area: squares × crowns' }),
      points('middle', 'Middle Kingdom', { fixed: 10, hint: 'Castle in the middle' }),
      points('harmony', 'Harmony', { fixed: 5, hint: 'Every domino placed' }),
    ]),
    rules: `Goal: Build the most valuable five by five kingdom.
Turn: In turn order, place the domino your king picked last round, then choose a domino from the new line, which sets next round's order.
Placing: At least one end must match a touching terrain or meet your castle, and the kingdom must fit in five by five, or the domino is discarded.
Scoring: Each connected area of one terrain scores its squares times its crowns. Optional bonuses: 10 for a centred castle, 5 if no domino was discarded.`,
  },
  {
    id: 'dominion',
    name: 'Dominion',
    category: 'card',
    players: [2, 4],
    sheet: sheet([
      points('estates', 'Estates', { per: 1 }),
      points('duchies', 'Duchies', { per: 3 }),
      points('provinces', 'Provinces', { per: 6 }),
      points('colonies', 'Colonies', { per: 10, hint: 'Prosperity' }),
      points('curses', 'Curses', { per: -1 }),
      points('other', 'Other victory points'),
    ]),
    rules: `Goal: Have the most victory points in your deck when the game ends.
Turn: Action, then Buy, then Clean-up. You get one action and one buy unless cards give more. Play treasure to buy one card, then discard everything and draw five.
End: When the Provinces run out, or any three supply piles are empty.
Scoring: Estate 1, Duchy 3, Province 6, Curse minus 1, plus any other victory cards.`,
  },
  {
    id: 'blokus',
    name: 'Blokus',
    category: 'board',
    players: [2, 4],
    sheet: sheet([
      points('left', 'Squares not placed', { per: -1 }),
      points('all', 'All pieces placed', { fixed: 15 }),
      points('mono', 'Last piece was the single square', { fixed: 5 }),
    ]),
    rules: `Goal: Place as many of your squares as you can.
Turn: Place one piece. Your first covers your corner; after that each piece must touch one of your own pieces corner to corner and never along a side.
End: When nobody can place a piece.
Scoring: Lose 1 for each square left. Placing every piece scores 15, or 20 if the last was the single square.`,
  },
  {
    id: 'chess',
    name: 'Chess',
    category: 'board',
    players: [2, 2],
    sheet: rounds({ win: 'high', round: 'Game', quick: [1, 0.5] }),
    rules: `Goal: Checkmate the other king: attack it so it cannot escape.
Moves: King one square any way. Queen any distance in a line. Rook along ranks and files, bishop diagonally, knight in an L and may jump. Pawns move forward one (two from their first square) and capture diagonally.
Special: Castling moves king two squares towards a rook and the rook over it, if neither has moved, nothing is between, and the king is not in, through or into check. En passant takes a pawn that just moved two, as if it moved one, on the very next move only. A pawn reaching the far rank becomes any piece but a king.
You may not: Make any move that leaves your own king in check.
Draws: Stalemate (no legal move, not in check), threefold repetition, fifty moves without a capture or pawn move, or agreement.
Scoring a match: 1 for a win, ½ each for a draw.`,
  },
  {
    id: 'checkers',
    name: 'Checkers',
    aka: ['Draughts'],
    category: 'board',
    players: [2, 2],
    sheet: gamesWon(),
    rules: `Goal: Capture all of the other side's pieces, or leave them with no move.
Moves: Pieces move one square diagonally forward on the dark squares.
Captures: Jump a diagonally adjacent enemy piece onto the empty square beyond. If you can capture, you must, and keep jumping while you can in the same move.
Kings: A piece reaching the far row is crowned and may move and capture backwards too.`,
  },
  {
    id: 'backgammon',
    name: 'Backgammon',
    category: 'board',
    players: [2, 2],
    sheet: rounds({ win: 'high', round: 'Game', quick: [1, 2, 3] }),
    rules: `Goal: Move all fifteen of your checkers home and bear them off first.
Turn: Roll two dice and move a checker for each number, or one checker for both; doubles are played four times. You may not land on a point holding two or more of the other side.
Hitting: Landing on a lone enemy checker sends it to the bar; it must come back in before anything else moves.
Bearing off: Only once all fifteen are in your home board.
Scoring: A win is 1, a gammon 2 (the loser has borne nothing off), a backgammon 3 (and still has a checker on the bar or in the winner's home), times the doubling cube.`,
  },
  {
    id: 'go',
    name: 'Go',
    aka: ['Baduk', 'Weiqi'],
    category: 'board',
    players: [2, 2],
    sheet: sheet([points('territory', 'Territory'), points('captures', 'Captures'), points('komi', 'Komi', { hint: 'Usually 6.5 for white' })]),
    rules: `Goal: Surround more of the board than your opponent.
Turn: Place a stone on an empty point, black first, or pass.
Capture: A group with no empty points next to it is removed.
Ko: You may not immediately recapture in a way that repeats the board.
Scoring: After two passes, count territory and captures (or territory and stones, by area rules). White adds komi.`,
  },
  {
    id: 'sorry',
    name: 'Sorry!',
    category: 'board',
    players: [2, 4],
    sheet: gamesWon(),
    rules: `Goal: Get all your pawns from Start to Home first.
Cards: 1 starts a pawn or moves 1. 2 starts a pawn or moves 2, then draw again. 3, 5, 8 and 12 move forward. 4 moves back four. 7 moves 7 or splits between two pawns. 10 moves 10 or back 1. 11 moves 11 or swaps with an opponent. Sorry! takes a pawn from Start and bumps an opponent back to theirs.
Slides: Landing on the start of another colour's slide carries you to its end, bumping anyone in the way.
Home: Must be reached by exact count.`,
  },
  {
    id: 'ludo',
    name: 'Ludo',
    aka: ['Parcheesi', 'Pachisi'],
    category: 'board',
    players: [2, 4],
    sheet: gamesWon(),
    rules: `Goal: Bring all four pawns round the board and home.
Turn: Roll a die. A 6 brings a pawn out and earns another roll.
Capture: Landing on an opponent sends their pawn back to the start. Safe squares cannot be captured on.
Home: Reached by exact roll. Parcheesi uses two dice and blockades; go by the board you have.`,
  },
  {
    id: 'mancala',
    name: 'Mancala',
    aka: ['Kalah'],
    category: 'board',
    players: [2, 2],
    sheet: rounds({ win: 'high', round: 'Game' }),
    rules: `Goal: Have the most stones in your store at the end.
Turn: Pick up every stone in one of your pits and sow them one by one anticlockwise, into your own store but not your opponent's.
Extra turn: If the last stone lands in your store, go again.
Capture: If it lands in an empty pit on your side, take it and the stones opposite into your store.
End: When one side is empty, the other player stores what is left on theirs. Score is stones in your store.`,
  },
  {
    id: 'connectfour',
    name: 'Connect Four',
    aka: ['Connect 4', 'Giant Connect Four'],
    category: 'board',
    players: [2, 2],
    sheet: gamesWon(),
    rules: `Goal: Be first to line up four of your discs in a row, across, down or diagonally.
Turn: Drop one disc into any column with room.
End: Four in a row wins; a full grid with none is a draw.`,
  },
]
