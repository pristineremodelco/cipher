import { counters, gamesWon, rounds } from './kit.ts'
import type { Game } from './types.ts'

export const PARTY: Game[] = [
  {
    id: 'codenames',
    name: 'Codenames',
    category: 'party',
    players: [2, 2],
    teams: true,
    sheet: gamesWon(),
    rules: `Goal: Your team contacts all its agents before the other team does.
Setup: Twenty-five word cards in a grid. Each team's spymaster sees the key showing which words are their agents, which are bystanders, and the one assassin.
Clue: The spymaster gives one word and a number. Their team may make up to that many guesses, plus one.
Guessing: Touching your own agent lets you keep going. A bystander or an enemy agent ends the turn. The assassin loses the game at once.`,
  },
  {
    id: 'taboo',
    name: 'Taboo',
    category: 'party',
    players: [2, 4],
    teams: true,
    sheet: rounds({ win: 'high', round: 'Turn', quick: [1] }),
    rules: `Goal: Your team guesses as many words as it can before time runs out.
Turn: Describe the word on top of the card without saying it, or any of the taboo words listed under it, or any part of them. No gestures or rhymes.
Buzzer: A player from the other team watches the card and buzzes if a taboo word is said.
Scoring: 1 for each word guessed. A buzzed or passed card scores 1 for the other team.`,
  },
  {
    id: 'catchphrase',
    name: 'Catch Phrase',
    aka: ['Catchphrase'],
    category: 'party',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', target: 7, round: 'Round', quick: [1] }),
    rules: `Goal: First team to 7 points.
Play: Describe the word shown so your team says it, without saying it or rhyming it, then pass the timer to the next player, who is on the other team.
Scoring: When the buzzer sounds, the team not holding the timer scores a point; in many games they can guess the last word for a bonus point.`,
  },
  {
    id: 'charades',
    name: 'Charades',
    category: 'party',
    players: [2, 4],
    teams: true,
    sheet: rounds({ win: 'high', round: 'Turn', quick: [1] }),
    rules: `Goal: Act out titles for your team to guess, without a word.
Signs: Show the kind of title first (book, film, song, show) and the number of words. Hold up fingers for which word, tap your arm for syllables, cup your ear for sounds like.
Scoring: A point for each title guessed within the time limit.`,
  },
  {
    id: 'pictionary',
    name: 'Pictionary',
    category: 'party',
    players: [2, 4],
    teams: true,
    sheet: rounds({ win: 'high', round: 'Turn', quick: [1] }),
    rules: `Goal: Draw so your team can guess the word.
Drawing: No letters, numbers or spoken clues. Gestures and talking are not allowed.
Board game: A correct guess within the minute lets your team roll and move; on all-play squares both teams guess. Without the board, a correct guess is a point.`,
  },
  {
    id: 'headsup',
    name: 'Heads Up!',
    aka: ['Heads Up', 'Headbands', 'Hedbanz'],
    category: 'party',
    players: [2, 12],
    sheet: rounds({ win: 'high', round: 'Turn' }),
    rules: `Goal: Guess as many words as you can in a minute.
Play: The guesser holds the card or phone to their forehead where they cannot see it. Everyone else gives clues without saying the word.
Scoring: 1 for each word guessed.`,
  },
  {
    id: 'applestoapples',
    name: 'Apples to Apples',
    category: 'party',
    players: [4, 10],
    sheet: counters({ counters: [{ id: 'green', label: 'Green cards', start: 0, min: 0 }] }),
    rules: `Goal: Win green cards. Commonly 8 wins with four players, 7 with five, 6 with six, 5 with seven, and 4 with eight or more.
Round: The judge turns up a green card. Everyone else plays the red card from their hand that fits it best, face down.
Judging: The judge picks their favourite; that player keeps the green card. The judge passes left.`,
  },
  {
    id: 'cardsagainsthumanity',
    name: 'Cards Against Humanity',
    aka: ['CAH'],
    category: 'party',
    players: [4, 20],
    sheet: counters({ counters: [{ id: 'points', label: 'Awesome points', start: 0, min: 0 }] }),
    rules: `Goal: Win the most black cards.
Round: The Card Czar reads a black card. Everyone else plays a white card, or as many as it asks for, face down.
Judging: The Czar picks the one they like best; its player gets an Awesome Point. The Czar passes on.
End: Whenever you like, or at an agreed number of points.`,
  },
  {
    id: 'dixit',
    name: 'Dixit',
    category: 'party',
    players: [3, 8],
    sheet: rounds({ win: 'high', target: 30, round: 'Round' }),
    rules: `Goal: First to 30.
Round: The storyteller picks a card and gives a clue. Everyone else plays the card from their hand that best fits it. Shuffle, lay them out, and everyone but the storyteller votes for the storyteller's card.
Scoring: If everyone or no one finds it, the storyteller scores 0 and everyone else 2. Otherwise the storyteller and everyone who found it score 3. Each player also scores 1 for every vote on their own card.`,
  },
  {
    id: 'wavelength',
    name: 'Wavelength',
    category: 'party',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', target: 10, round: 'Turn', quick: [1, 2, 3, 4] }),
    rules: `Goal: First team to 10 points.
Turn: The psychic sees where the hidden target sits on a spectrum, such as hot to cold, and gives a clue. Their team turns the dial to where they think it is.
Other team: Guesses whether the target is left or right of the dial, for 1 point if right.
Scoring: 4, 3 or 2 points by how close the dial is to the centre of the target.
Catching up: A team that scores 4 but is still behind goes again.`,
  },
  {
    id: 'justone',
    name: 'Just One',
    category: 'party',
    players: [3, 7],
    sheet: counters({ shared: true, counters: [{ id: 'score', label: 'Cards guessed', start: 0, min: 0, max: 13 }] }),
    rules: `Goal: Together, guess as many of the thirteen words as you can.
Round: Everyone but the guesser writes a one-word clue in secret. Clues that match, or are too close, are removed before the guesser sees the rest.
Guess: One guess. Right keeps the card. Wrong loses it and the next card in the deck too. Passing loses just the one.`,
  },
  {
    id: 'fishbowl',
    name: 'Fishbowl',
    aka: ['Celebrity', 'Salad Bowl', 'Monikers', 'Hat game'],
    category: 'party',
    players: [2, 4],
    teams: true,
    sheet: rounds({ win: 'high', rounds: 3, round: 'Round', labels: ['Describe it', 'One word', 'Act it out'] }),
    rules: `Goal: The team that guesses the most names over three rounds.
Setup: Everyone writes names on slips into a bowl.
Rounds: The same slips every round. First, describe with any words but the name. Second, one word only. Third, act it out in silence.
Turn: Get your team to guess as many as you can in a minute; a point for each.`,
  },
  {
    id: 'trivianight',
    name: 'Trivia Night',
    aka: ['Pub quiz', 'Quiz'],
    category: 'party',
    players: [2, 12],
    teams: true,
    sheet: rounds({ win: 'high', round: 'Round' }),
    rules: `Goal: Most points after every round.
Rounds: A set of questions on a theme; teams write their answers and hand them in.
Scoring: Usually 1 point per correct answer, with a bonus or a doubled round if you agree one beforehand.`,
  },
  {
    id: 'jenga',
    name: 'Jenga',
    aka: ['Giant Jenga', 'Tumbling Tower', 'Yard Jenga'],
    category: 'party',
    players: [1, 8],
    sheet: gamesWon(),
    rules: `Goal: Do not be the one who knocks the tower down.
Turn: Using one hand, take a block from any level below the highest finished one and place it on top, finishing each level of three before starting the next.
End: Whoever makes the tower fall loses.`,
  },
]

export const COLLECTIBLE: Game[] = [
  {
    id: 'magic',
    name: 'Magic: The Gathering',
    aka: ['MTG', 'Magic'],
    category: 'collectible',
    players: [2, 8],
    sheet: counters({
      counters: [
        { id: 'life', label: 'Life', start: 20, lose: 0, steps: [-5, 5] },
        { id: 'poison', label: 'Poison', start: 0, min: 0, lose: 10 },
      ],
    }),
    rules: `Goal: Bring your opponent from 20 life to 0.
Turn: Untap, upkeep, draw, main phase, combat, second main phase, end. Play one land per turn.
Losing: At 0 life, with ten poison counters, or when you must draw from an empty library.`,
  },
  {
    id: 'commander',
    name: 'Commander',
    aka: ['EDH', 'Magic Commander'],
    category: 'collectible',
    players: [2, 6],
    sheet: counters({
      counters: [
        { id: 'life', label: 'Life', start: 40, lose: 0, steps: [-5, 5] },
        { id: 'commander', label: 'Commander damage', start: 0, min: 0, lose: 21 },
        { id: 'poison', label: 'Poison', start: 0, min: 0, lose: 10 },
      ],
    }),
    rules: `Goal: Be the last player standing.
Decks: A hundred cards, no two alike but basic lands, led by a legendary commander kept in the command zone.
Life: Everyone starts at 40.
Losing: At 0 life, ten poison counters, or 21 combat damage from any one commander.
Commander tax: Casting your commander again costs 2 more each time.`,
  },
  {
    id: 'pokemon',
    name: 'Pokémon TCG',
    aka: ['Pokemon', 'Pokemon card game', 'PTCG'],
    category: 'collectible',
    players: [2, 2],
    sheet: counters({ counters: [{ id: 'prizes', label: 'Prize cards left', start: 6, min: 0, max: 6, win: 0 }] }),
    rules: `Goal: Take all six of your prize cards.
Turn: Draw. Then, in any order: play Basic Pokémon to your bench, evolve, attach one Energy, play Item cards and one Supporter, retreat once. Attack to end your turn.
Prizes: Knock out a Pokémon to take one prize card, or two or three for some rule-box Pokémon.
Winning: Take your last prize, knock out your opponent's last Pokémon in play, or leave them with no card to draw.`,
  },
  {
    id: 'yugioh',
    name: 'Yu-Gi-Oh!',
    aka: ['Yugioh', 'Yu Gi Oh'],
    category: 'collectible',
    players: [2, 2],
    sheet: counters({ counters: [{ id: 'lp', label: 'Life points', start: 8000, lose: 0, steps: [-1000, -500, -100, 500] }] }),
    rules: `Goal: Bring your opponent from 8,000 life points to 0.
Turn: Draw, standby, main phase, battle, second main phase, end. One Normal Summon or Set a turn.
Losing: At 0 life points, or when you must draw with no cards left.`,
  },
  {
    id: 'starrealms',
    name: 'Star Realms',
    category: 'collectible',
    players: [2, 6],
    sheet: counters({ counters: [{ id: 'authority', label: 'Authority', start: 50, lose: 0, steps: [-5, 5] }] }),
    rules: `Goal: Bring your opponent's authority from 50 to 0.
Turn: Play your whole hand. Spend trade to buy ships and bases, combat to attack an opponent or their bases, then discard and draw five.
Bases: Outposts must be destroyed before anything else of that player can be attacked.`,
  },
  {
    id: 'lorcana',
    name: 'Disney Lorcana',
    aka: ['Lorcana'],
    category: 'collectible',
    players: [2, 4],
    sheet: counters({ counters: [{ id: 'lore', label: 'Lore', start: 0, min: 0, win: 20 }] }),
    rules: `Goal: First to 20 lore.
Turn: Put one card with the ink symbol into your inkwell, play characters and items with ink, then quest with ready characters to gain lore, or challenge an opponent's exerted character.`,
  },
  {
    id: 'munchkin',
    name: 'Munchkin',
    category: 'collectible',
    players: [3, 6],
    sheet: counters({
      sum: { label: 'Combat strength', of: ['level', 'gear'] },
      counters: [
        { id: 'level', label: 'Level', start: 1, min: 1, max: 10, win: 10 },
        { id: 'gear', label: 'Gear bonus', start: 0 },
      ],
    }),
    rules: `Goal: First to level 10, which must usually come from killing a monster.
Turn: Kick down the door. Fight a monster, or play one from your hand to fight, or loot the room. Then charity: give away cards over five.
Combat: Your level plus gear against the monster's level. Ask one player to help for a share of the treasure. Others may play cards to make it harder.
Running away: Roll a 5 or 6 to escape; fail and bad stuff happens.`,
  },
]

export const OUTDOOR: Game[] = [
  {
    id: 'cornhole',
    name: 'Cornhole',
    aka: ['Bean bag toss', 'Bags', 'Corn toss', 'Sack toss'],
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', target: 21, round: 'Inning', cancel: true, quick: [1, 3] }),
    rules: `Goal: First to 21.
Inning: Each side throws four bags, alternating.
Scoring: A bag on the board is 1, through the hole 3. Only the difference counts: if one side scores 7 and the other 4, the first side scores 3. Enter what each side threw; the difference is worked out.
End: At 21 or more after an inning, though some tables must hit 21 exactly.`,
  },
  {
    id: 'horseshoes',
    name: 'Horseshoes',
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', target: 40, round: 'Inning', cancel: true, quick: [1, 3] }),
    rules: `Goal: First to 40 (21 in casual games).
Inning: Each player pitches two shoes.
Scoring: A ringer encircling the stake is 3. A shoe within a shoe's width, about six inches, is 1. Ringers cancel each other out, and only the difference counts.`,
  },
  {
    id: 'ladderball',
    name: 'Ladder Toss',
    aka: ['Ladder ball', 'Ladder golf', 'Hillbilly golf'],
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', target: 21, round: 'Round', cancel: true, quick: [1, 2, 3] }),
    rules: `Goal: Reach exactly 21.
Round: Each player throws three bolas.
Scoring: Top rung 3, middle 2, bottom 1. In many games bolas on the same rung cancel, and going over 21 means that round's points do not count.`,
  },
  {
    id: 'bocce',
    name: 'Bocce',
    aka: ['Bocce ball', 'Petanque', 'Boules'],
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', target: 12, round: 'Frame', quick: [1, 2, 3, 4] }),
    rules: `Goal: First to 12 (or 16, or 21).
Frame: The pallino is thrown first. Teams then throw their balls as near it as they can; the team further away throws until it is closer or out of balls.
Scoring: The closest team scores one point for each of its balls closer than the other team's closest.`,
  },
  {
    id: 'shuffleboard',
    name: 'Table Shuffleboard',
    aka: ['Shuffleboard'],
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', target: 15, round: 'Round', quick: [1, 2, 3, 4] }),
    rules: `Goal: First to 15 (21 in some games).
Round: Players alternate sliding their four weights.
Scoring: Only the player whose weight is furthest scores, for every weight of theirs past the other player's furthest: 1, 2 or 3 by zone, and 4 for one hanging over the end.`,
  },
  {
    id: 'darts501',
    name: 'Darts 501',
    aka: ['501', 'Darts'],
    category: 'outdoor',
    players: [1, 8],
    sheet: rounds({ win: 'high', countdown: 501, round: 'Turn' }),
    rules: `Goal: Count down from 501 to exactly zero.
Turn: Three darts; subtract their total.
Finish: The last dart must be a double, or the bullseye.
Bust: Going below zero, leaving 1, or reaching zero without a double means the turn does not count. Here a turn that would go below zero is scored as nothing.`,
  },
  {
    id: 'darts301',
    name: 'Darts 301',
    aka: ['301'],
    category: 'outdoor',
    players: [1, 8],
    sheet: rounds({ win: 'high', countdown: 301, round: 'Turn' }),
    rules: `Goal: Count down from 301 to exactly zero.
Turn: Three darts; subtract their total.
Double in and out: Often you must hit a double to start scoring, and finish on a double.
Bust: Going below zero, leaving 1, or reaching zero without a double means the turn does not count.`,
  },
  {
    id: 'cricketdarts',
    name: 'Cricket (darts)',
    aka: ['Darts cricket', 'Cricket'],
    category: 'outdoor',
    players: [2, 4],
    sheet: { kind: 'cricket' },
    rules: `Goal: Close 15 to 20 and the bull, with at least as many points as everyone else.
Marks: A single is one mark, a double two, a treble three. The outer bull is one mark, the inner bull two. Three marks close a number.
Points: Once you have closed a number, more hits on it score its value, until everyone has closed it.
Win: Close everything with equal or more points.
Scoring here: Tap a number once for a single, or hold the player's double or treble button first.`,
  },
  {
    id: 'bowling',
    name: 'Bowling',
    aka: ['Ten pin', 'Tenpin bowling', '10 pin'],
    category: 'outdoor',
    players: [1, 8],
    sheet: { kind: 'bowling' },
    rules: `Goal: Highest score over ten frames, 300 at most.
Frame: Two balls to knock down ten pins.
Strike: All ten with the first ball scores 10 plus the next two balls.
Spare: All ten with both balls scores 10 plus the next ball.
Tenth frame: A strike or spare there earns the extra balls to finish counting it.
Scoring here: Enter the pins each ball knocks down; strikes and spares are worked out.`,
  },
  {
    id: 'minigolf',
    name: 'Mini Golf',
    aka: ['Minigolf', 'Putt putt', 'Crazy golf', 'Miniature golf'],
    category: 'outdoor',
    players: [1, 8],
    sheet: rounds({ win: 'low', rounds: 18, round: 'Hole', quick: [1, 2, 3] }),
    rules: `Goal: Fewest strokes over the course.
Hole: Count every stroke until the ball drops. Most courses cap a hole at six strokes.
Out of bounds: Usually a one-stroke penalty and a replay from where you were.`,
  },
  {
    id: 'golf',
    name: 'Golf (stroke play)',
    aka: ['Golf'],
    category: 'outdoor',
    players: [1, 8],
    sheet: rounds({ win: 'low', rounds: 18, round: 'Hole' }),
    rules: `Goal: Fewest strokes over the round.
Hole: Count every stroke, plus penalty strokes, until the ball is holed.
Order: The ball furthest from the hole plays first; the best score on the last hole tees off first.
Penalties: Out of bounds or a lost ball is stroke and distance; a water hazard is one stroke with a drop.`,
  },
  {
    id: 'pingpong',
    name: 'Table Tennis',
    aka: ['Ping pong', 'Ping-pong'],
    category: 'outdoor',
    players: [2, 2],
    sheet: counters({
      counters: [
        { id: 'points', label: 'Points', start: 0, min: 0, win: 11, winBy: 2 },
        { id: 'games', label: 'Games', start: 0, min: 0 },
      ],
    }),
    rules: `Goal: First to 11 points, winning by 2. Matches are best of three, five or seven games.
Serve: Toss the ball up from an open palm and hit it so it bounces once on each side. Service changes every two points, and every point from 10 all.
Points: Every rally scores. A ball that touches the net on a serve and lands in is a let and is served again.`,
  },
  {
    id: 'pickleball',
    name: 'Pickleball',
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: counters({
      counters: [
        { id: 'points', label: 'Points', start: 0, min: 0, win: 11, winBy: 2 },
        { id: 'games', label: 'Games', start: 0, min: 0 },
      ],
    }),
    rules: `Goal: First to 11, winning by 2.
Serve: Underhand and diagonal, landing past the kitchen line.
Two bounces: The return of serve, and the shot after it, must bounce before being hit.
Kitchen: No volleying while standing in the non-volley zone.
Scoring: Only the serving side scores, in traditional rules. In doubles, the score is called as serving side, receiving side, server number.`,
  },
  {
    id: 'badminton',
    name: 'Badminton',
    category: 'outdoor',
    players: [2, 2],
    sheet: counters({
      counters: [
        { id: 'points', label: 'Points', start: 0, min: 0, max: 30, win: 21, winBy: 2 },
        { id: 'games', label: 'Games', start: 0, min: 0 },
      ],
    }),
    rules: `Goal: First to 21, winning by 2, up to 30. Best of three games.
Points: Every rally scores; the winner of a rally serves next.
Serve: Underhand, below the waist, diagonally across.`,
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: counters({
      counters: [
        { id: 'points', label: 'Points', start: 0, min: 0, win: 25, winBy: 2 },
        { id: 'sets', label: 'Sets', start: 0, min: 0 },
      ],
    }),
    rules: `Goal: Sets to 25, winning by 2; a deciding set goes to 15.
Rally: Up to three touches a side, no player touching twice in a row (a block does not count).
Points: Every rally scores; rotate when you win back the serve.`,
  },
  {
    id: 'spikeball',
    name: 'Spikeball',
    aka: ['Roundnet'],
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: counters({
      counters: [
        { id: 'points', label: 'Points', start: 0, min: 0, win: 21, winBy: 2 },
        { id: 'games', label: 'Games', start: 0, min: 0 },
      ],
    }),
    rules: `Goal: Games to 21 (or 11 or 15), winning by 2.
Rally: Up to three touches a side, alternating players, then hit the ball onto the net.
Faults: The ball hitting the rim, bouncing twice, or not reaching the net.
Points: Every rally scores.`,
  },
  {
    id: 'foosball',
    name: 'Foosball',
    aka: ['Table football', 'Table soccer'],
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: counters({
      counters: [
        { id: 'goals', label: 'Goals', start: 0, min: 0, win: 5 },
        { id: 'games', label: 'Games', start: 0, min: 0 },
      ],
    }),
    rules: `Goal: First to 5 goals (10 in some games).
Play: No spinning the rods a full turn to strike. A ball stopped dead out of reach is put back in by the side it stopped on.`,
  },
  {
    id: 'airhockey',
    name: 'Air Hockey',
    category: 'outdoor',
    players: [2, 2],
    sheet: counters({ counters: [{ id: 'goals', label: 'Goals', start: 0, min: 0, win: 7 }] }),
    rules: `Goal: First to 7 goals.
Play: Strike the puck only with your mallet, and only on your side of the centre line. Whoever was scored on serves next.`,
  },
  {
    id: 'eightball',
    name: 'Pool (8-ball)',
    aka: ['8 ball', 'Eight ball', 'Pool', 'Billiards'],
    category: 'outdoor',
    players: [2, 2],
    sheet: gamesWon(),
    rules: `Goal: Pocket all your group, solids or stripes, then the 8.
Groups: The table is open after the break; the first ball legally pocketed after that decides groups.
Shots: Call the ball and pocket, except obvious shots in casual play.
Fouls: A scratch or missing your group first gives your opponent ball in hand.
Losing: Pocketing the 8 early, in the wrong pocket, or scratching on it.`,
  },
  {
    id: 'nineball',
    name: 'Pool (9-ball)',
    aka: ['9 ball', 'Nine ball'],
    category: 'outdoor',
    players: [2, 2],
    sheet: gamesWon(),
    rules: `Goal: Pocket the 9.
Shots: The lowest numbered ball on the table must be hit first. Anything pocketed on a legal shot stays down and you keep shooting.
Win: Pocketing the 9 on any legal shot, the break included.
Fouls: Ball in hand for your opponent.`,
  },
  {
    id: 'snooker',
    name: 'Snooker',
    category: 'outdoor',
    players: [2, 2],
    sheet: counters({
      counters: [
        { id: 'points', label: 'Points', start: 0, min: 0, steps: [2, 3, 4, 5, 6, 7] },
        { id: 'frames', label: 'Frames', start: 0, min: 0 },
      ],
    }),
    rules: `Goal: More points than your opponent in each frame.
Order: Pot a red (1), then any colour, then a red, and so on; colours go back on their spots while reds remain. Then the colours in order: yellow 2, green 3, brown 4, blue 5, pink 6, black 7.
Fouls: Give your opponent at least 4 points, or the value of the ball involved if higher.`,
  },
  {
    id: 'horse',
    name: 'HORSE',
    aka: ['H.O.R.S.E.', 'Horse basketball', 'PIG'],
    category: 'outdoor',
    players: [2, 10],
    sheet: rounds({ win: 'high', round: 'Shot', word: 'HORSE' }),
    rules: `Goal: Do not spell HORSE.
Play: The first shooter calls and takes any shot. If it goes in, the next player must make the same shot or take a letter. If it misses, the next player sets a shot of their own.
Out: Spell HORSE and you are out. Last one standing wins.`,
  },
  {
    id: 'kubb',
    name: 'Kubb',
    aka: ['Viking chess'],
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: gamesWon(),
    rules: `Goal: Knock over all the other side's kubbs, then the king.
Throwing: Batons go underhand and end over end. Kubbs knocked down are thrown into the other half and stood up there, and must be knocked down first.
Losing: Knocking over the king before the other kubbs are down.`,
  },
]

export const YARD: Game[] = [
  {
    id: 'discgolf',
    name: 'Disc Golf',
    aka: ['Frisbee golf', 'Frolf', 'Folf'],
    category: 'outdoor',
    players: [1, 8],
    sheet: rounds({ win: 'low', rounds: 18, round: 'Hole', quick: [1, 2, 3] }),
    rules: `Goal: Fewest throws over the course.
Hole: Throw from the tee. After that, the player furthest from the basket throws next, from behind the spot where their disc landed.
Holing out: The disc must come to rest in the basket or hang in its chains.
Penalties: Out of bounds is one throw, played from where the disc went out or from a drop zone. Missing a mandatory, passing on the wrong side of a marked tree or pole, is usually a throw too.
Order: The best score on the last hole throws first from the next tee.`,
  },
  {
    id: 'washers',
    name: 'Washers',
    aka: ['Washer toss', 'Washer pitching'],
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', target: 21, round: 'Inning', cancel: true, quick: [1, 3] }),
    rules: `Goal: First to 21.
Inning: Each side pitches its washers, commonly three each, at the box or board opposite.
Scoring: Commonly 1 for a washer in the box and 3 in the cup or hole; boards vary, so agree first. Only the difference counts each inning.`,
  },
  {
    id: 'kanjam',
    name: 'Kan Jam',
    aka: ['KanJam', 'Can Jam', 'Disc slam'],
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', target: 21, round: 'Turn', quick: [1, 2, 3] }),
    rules: `Goal: First team to 21.
Play: Partners stand at opposite cans. One throws the disc at the far can; the partner there may deflect it, but not catch or carry it.
Scoring: Dinger, the deflected disc hits the can: 1. Deuce, the throw hits the can on its own: 2. Bucket, the deflected disc drops in the top: 3. Through the front slot is an instant win.
Going over: Many play to exactly 21, so a throw that would go over is taken off instead.`,
  },
  {
    id: 'molkky',
    name: 'Mölkky',
    aka: ['Molkky', 'Finnish skittles'],
    category: 'outdoor',
    players: [2, 8],
    sheet: rounds({ win: 'high', round: 'Throw', exact: { target: 50, over: 25 }, misses: 3 }),
    rules: `Goal: Reach exactly 50.
Throw: Toss the throwing pin underhand at the twelve numbered pins.
Scoring: Knock down one pin and score its number. Knock down several and score how many fell. Pins are stood up where they land.
Going over: Past 50 drops you back to 25.
Misses: Three throws in a row that knock nothing down and you are out.`,
  },
  {
    id: 'croquet',
    name: 'Croquet',
    category: 'outdoor',
    players: [2, 6],
    sheet: counters({ counters: [{ id: 'points', label: 'Wickets and stakes', start: 0, min: 0, max: 16, win: 16 }] }),
    rules: `Goal: Be first round the course: through every wicket in order, hitting the turning stake and then the finishing stake.
Strokes: One stroke a turn. Running your next wicket or hitting a stake earns one more.
Roquet: Hitting another ball earns two more strokes, or one croquet stroke, placing your ball against it to send it away, and then one more.
Scoring here: The nine-wicket backyard course has fourteen wicket passes and two stakes: 16 in all.`,
  },
  {
    id: 'wiffleball',
    name: 'Wiffle Ball',
    aka: ['Whiffle ball', 'Backyard baseball', 'Stickball'],
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', round: 'Inning' }),
    rules: `Goal: Score more runs.
Innings: Each side bats until it makes three outs.
Outs: Three strikes, a caught fly ball, or a fielder hitting a runner with the ball in many backyard games.
Hits: With no running, a hit is often scored by where it lands: single, double, triple, or over the line for a home run.`,
  },
  {
    id: 'kickball',
    name: 'Kickball',
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', round: 'Inning' }),
    rules: `Goal: Score more runs.
Innings: Each side kicks until it makes three outs.
Outs: Three strikes, a caught kick, a runner tagged or hit below the shoulders with the ball off base, or the ball beating a runner to a forced base.
Fouls: Kicks landing outside the lines; commonly four fouls is an out.`,
  },
  {
    id: 'ultimate',
    name: 'Ultimate Frisbee',
    aka: ['Ultimate', 'Frisbee'],
    category: 'outdoor',
    players: [2, 2],
    teams: true,
    sheet: counters({ counters: [{ id: 'points', label: 'Points', start: 0, min: 0, win: 15 }] }),
    rules: `Goal: First to 15 points, or an agreed number.
Scoring: Catch the disc in the end zone you are attacking.
Moving: No running with the disc; pivot and pass. The marker counts to ten, and the disc must be thrown before ten.
Turnovers: A dropped, blocked, intercepted or out of bounds pass goes to the other side where it stopped.
Spirit: Players call their own fouls.`,
  },
  {
    id: 'tetherball',
    name: 'Tetherball',
    category: 'outdoor',
    players: [2, 2],
    sheet: gamesWon(),
    rules: `Goal: Wind the rope all the way round the pole in your direction.
Play: Hit only the ball, with your hands. Touching the pole or the rope, or catching the ball, is a foul and the game goes to your opponent in many playground rules.`,
  },
]

export const ANY: Game[] = [
  {
    id: 'anyhigh',
    name: 'Any game: highest wins',
    aka: ['Custom', 'Other', 'Scoresheet'],
    category: 'any',
    players: [1, 12],
    sheet: rounds({ win: 'high', round: 'Round' }),
    rules: `Goal: Whatever the game says. This sheet adds up rounds and puts the highest total in front.
Tip: For a game that ends at a score, agree on it before you start.`,
  },
  {
    id: 'anylow',
    name: 'Any game: lowest wins',
    aka: ['Custom', 'Other', 'Scoresheet', 'Penalty points'],
    category: 'any',
    players: [1, 12],
    sheet: rounds({ win: 'low', round: 'Round' }),
    rules: `Goal: Whatever the game says. This sheet adds up rounds and puts the lowest total in front.`,
  },
  {
    id: 'anycounter',
    name: 'Any game: tap to count',
    aka: ['Counter', 'Tally', 'Clicker'],
    category: 'any',
    players: [1, 12],
    sheet: counters({ counters: [{ id: 'points', label: 'Points', start: 0 }] }),
    rules: `Goal: Whatever the game says. Each player has a number to tap up and down, and the leader is marked.`,
  },
]
