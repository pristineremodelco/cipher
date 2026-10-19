import { bids, counters, gamesWon, rounds } from './kit.ts'
import type { Game } from './types.ts'

const PHASES = [
  '2 sets of 3',
  '1 set of 3 + 1 run of 4',
  '1 set of 4 + 1 run of 4',
  '1 run of 7',
  '1 run of 8',
  '1 run of 9',
  '2 sets of 4',
  '7 cards of one colour',
  '1 set of 5 + 1 set of 2',
  '1 set of 5 + 1 set of 3',
]

export const CARDS: Game[] = [
  {
    id: 'poker',
    name: 'Poker',
    aka: ["Texas Hold'em", 'Holdem', 'Hold em', 'Poker night', 'Omaha', 'Seven card stud', 'Five card draw'],
    category: 'card',
    players: [2, 10],
    sheet: counters({
      sum: { label: 'Up or down', of: ['chips'], less: ['buyin'], leads: true, money: true },
      counters: [
        { id: 'buyin', label: 'Bought in', start: 0, min: 0, steps: [20], money: true },
        { id: 'chips', label: 'Chips at the end', start: 0, min: 0, money: true },
      ],
    }),
    rules: `Goal: Win chips with the best hand at the showdown, or by everyone else folding.
Texas Hold'em: Two cards each, face down. The two players left of the dealer put in the small and big blinds.
Betting: A round after the deal, after the flop (three shared cards), after the turn (a fourth) and after the river (a fifth). On your turn check, bet, call, raise or fold.
Hands, best first: royal flush, straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, one pair, high card. Your best five of the seven cards play.
Ties: The higher cards in the same kind of hand win; suits never break a tie, and an exact tie splits the pot.
Tracking here: Enter what each player bought in for, and their chips when they finish; each shows up or down.`,
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    aka: ['Twenty-one', '21', 'Pontoon', 'Vingt-et-un'],
    category: 'card',
    players: [1, 7],
    sheet: counters({ counters: [{ id: 'chips', label: 'Chips', start: 100, min: 0, steps: [-10, 10], money: true }] }),
    rules: `Goal: Beat the dealer by getting closer to 21 without going over.
Values: Number cards face value, faces 10, aces 1 or 11.
Turn: Hit for another card or stand. Double down: double the bet for exactly one more card. Split a pair into two hands with a second bet.
Dealer: Draws to 16 and stands on 17 in most games.
Paying: A win pays even money; a blackjack, an ace and a ten-value card as the first two, commonly pays 3 to 2. Ties push.`,
  },
  {
    id: 'pitch',
    name: 'Pitch',
    aka: ['Setback', 'High Low Jack', 'Auction Pitch'],
    category: 'card',
    players: [2, 3],
    teams: true,
    sheet: rounds({
      win: 'high',
      target: 11,
      round: 'Hand',
      parts: [
        { label: 'High', per: 1 },
        { label: 'Low', per: 1 },
        { label: 'Jack', per: 1 },
        { label: 'Game', per: 1 },
        { label: 'Set back (bid not made, as a minus)', typed: true },
      ],
    }),
    rules: `Goal: First to 11 (21 in some games).
Bidding: Six cards each. Bid 2 to 4 for the right to lead; the first card led sets trump.
Points: High, the highest trump played. Low, the lowest trump played. Jack, the jack of trump if it was played. Game, the most points in tricks taken: tens 10, aces 4, kings 3, queens 2, jacks 1.
Set back: A bidder who does not make the bid loses that many.`,
  },
  {
    id: 'nertz',
    name: 'Nertz',
    aka: ['Nerts', 'Pounce', 'Racing demon'],
    category: 'card',
    players: [2, 8],
    sheet: rounds({
      win: 'high',
      target: 100,
      round: 'Hand',
      parts: [
        { label: 'Cards played to the middle', per: 1 },
        { label: 'Cards left in your Nertz pile', per: -2 },
      ],
    }),
    rules: `Goal: First to 100.
Setup: Every player has their own deck: a Nertz pile of thirteen, four face-up work piles, the rest in hand.
Play: Everyone at once. Aces start shared piles in the middle, built up by suit by anyone. Work piles build down in alternating colours.
Nertz: Empty your Nertz pile and call it; the hand stops.
Scoring: 1 for each of your cards in the middle, minus 2 for each card left in your Nertz pile.`,
  },
  {
    id: 'racko',
    name: 'Rack-O',
    aka: ['Racko', 'Rack O'],
    category: 'card',
    players: [2, 4],
    sheet: rounds({ win: 'high', target: 500, round: 'Hand', quick: [5, 75] }),
    rules: `Goal: First to 500.
Setup: Ten cards each, slotted into your rack in the order dealt.
Turn: Take the top discard or the top of the deck, and swap it into your rack or discard it. Aim for the numbers to rise from front to back.
Rack-O: All ten in rising order wins the hand and scores 75.
Scoring: Everyone else scores 5 for each card in rising order from the front, up to the first one out of order.`,
  },
  {
    id: 'hearts',
    name: 'Hearts',
    category: 'card',
    players: [3, 6],
    sheet: rounds({ win: 'low', target: 100, round: 'Hand', moon: 26 }),
    rules: `Goal: Take as few points as you can. Lowest score wins.
Passing: Before each hand pass three cards left, then right, then across, then keep them, and repeat.
Play: Whoever holds the 2 of clubs leads it. Follow suit if you can; otherwise play anything. Hearts cannot be led until one has been played, and points are usually barred from the first trick.
Scoring: Each heart taken is 1 point, the queen of spades 13.
Shooting the moon: Take every heart and the queen of spades and you score 0 while everyone else takes 26.
End: When someone reaches 100. Lowest total wins.`,
  },
  {
    id: 'spades',
    name: 'Spades',
    category: 'card',
    players: [2, 2],
    teams: true,
    sheet: bids({ scoring: 'spades', target: 500 }),
    rules: `Goal: Partners bid how many tricks they will take together, then take at least that many. First team to 500 wins.
Bidding: Each player bids a number of tricks; partners' bids are added together. Nil means bidding to take none.
Play: Follow suit if you can. Spades are always trump and cannot be led until one has been played, unless you hold nothing else.
Scoring: Make the bid and score 10 per trick bid, plus 1 for each extra trick (a bag). Fall short and lose 10 per trick bid. Nil scores 100 if made, minus 100 if not.
Bags: Every 10 bags collected costs 100 points.`,
  },
  {
    id: 'euchre',
    name: 'Euchre',
    category: 'card',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', target: 10, round: 'Hand', quick: [1, 2, 4] }),
    rules: `Goal: First team to 10 points.
Cards: Twenty-four cards, nine through ace. Five each; the next card is turned up to propose trump.
Trump: The jack of trump (right bower) is highest, then the other jack of the same colour (left bower), then ace, king, queen, ten, nine of trump.
Making trump: Going round, each player may order the turned card up as trump or pass; if all pass, each may name another suit. The makers may go alone, their partner sitting out.
Scoring: Makers taking three or four tricks score 1; all five scores 2, or 4 going alone. Makers taking fewer than three are euchred, and the other team scores 2.`,
  },
  {
    id: 'ginrummy',
    name: 'Gin Rummy',
    aka: ['Gin'],
    category: 'card',
    players: [2, 2],
    sheet: rounds({ win: 'high', target: 100, round: 'Hand', quick: [25] }),
    rules: `Goal: First to 100 points.
Play: Ten cards each. Draw from the stock or the discard pile, then discard. Arrange cards into sets (three or four of a rank) and runs (three or more in suit).
Knocking: With deadwood (cards in no meld) of 10 or less you may knock, laying down your melds; the opponent may lay off cards on them.
Scoring: Aces 1, faces 10, others face value. The knocker scores the difference in deadwood. Gin, with no deadwood at all, scores 25 plus the opponent's deadwood. If the opponent has as little or less deadwood than the knocker, they undercut, scoring the difference plus 25.
End: Commonly a 100 bonus for reaching 100 and 25 for every hand won.`,
  },
  {
    id: 'rummy',
    name: 'Rummy 500',
    aka: ['Rummy', '500 Rum', 'Rum'],
    category: 'card',
    players: [2, 8],
    sheet: rounds({ win: 'high', target: 500, round: 'Hand' }),
    rules: `Goal: First to 500 points.
Play: Draw from the stock, or take cards from the discard pile as long as you use the deepest one taken at once. Lay down sets and runs, or add to anyone's, then discard.
End of a hand: When someone runs out of cards.
Scoring: Cards you have laid down count for you and cards left in your hand count against you. Aces 15 (1 when played low in A-2-3), faces 10, others face value.`,
  },
  {
    id: 'canasta',
    name: 'Canasta',
    category: 'card',
    players: [2, 2],
    teams: true,
    sheet: rounds({
      win: 'high',
      target: 5000,
      round: 'Hand',
      parts: [
        { label: 'Natural canastas', per: 500 },
        { label: 'Mixed canastas', per: 300 },
        { label: 'Red threes', per: 100 },
        { label: 'Going out', per: 100 },
        { label: 'Card points, melded less those in hand', typed: true },
      ],
    }),
    rules: `Goal: First partnership to 5,000.
Cards: Two decks and four jokers. Jokers and twos are wild. Red threes are laid down at once and a replacement drawn.
Play: Draw two from the stock, or take the whole discard pile if you can meld its top card. Melds are three or more of a rank with no more than three wild cards. A canasta is seven of a rank.
First meld: Must reach 50, 90 or 120 points depending on your score.
Card values: Joker 50, two and ace 20, king to eight 10, seven to four 5, black three 5.
Scoring: Natural canasta 500, mixed 300, red threes 100 each (800 for all four), going out 100, plus melded cards less cards in hand. You need a canasta to go out.`,
  },
  {
    id: 'cribbage',
    name: 'Cribbage',
    category: 'card',
    players: [2, 4],
    sheet: rounds({ win: 'high', target: 121, round: 'Hand', quick: [1, 2, 3, 4, 6] }),
    rules: `Goal: First to 121.
Deal: Six cards each with two players; each puts two face down into the dealer's crib. Cut a starter card; a jack gives the dealer 2.
Pegging: Take turns playing a card and calling the running total, up to 31. Fifteen is 2, thirty-one is 2, a pair 2, three of a kind 6, four 12, a run 1 per card. If you cannot play, say go; the last to play scores 1.
Counting: Non-dealer, then dealer, then the crib, each with the starter: fifteens 2 each, pairs 2, runs 1 per card, a flush 4 (5 with the starter; the crib only counts five), and the jack of the starter's suit 1.
Skunk: Finishing under 91 is a skunk, often counted as two games.`,
  },
  {
    id: 'crazyeights',
    name: 'Crazy Eights',
    aka: ['Crazy 8s', 'Eights'],
    category: 'card',
    players: [2, 7],
    sheet: rounds({ win: 'high', target: 100, round: 'Hand' }),
    rules: `Goal: Be first to play every card.
Play: Match the top card's suit or rank. Eights are wild and name a new suit. If you cannot play, draw until you can (or draw three, by some rules).
Scoring: The player who goes out collects for the cards left in the others' hands: eights 50, faces 10, aces 1, others face value. First to an agreed total, often 100, wins.`,
  },
  {
    id: 'ohhell',
    name: 'Oh Hell',
    aka: ['Oh Heck', 'Up and Down the River', 'Blackout', 'Contract Whist'],
    category: 'card',
    players: [3, 7],
    sheet: bids({ scoring: 'ohhell' }),
    rules: `Goal: Take exactly the number of tricks you bid.
Rounds: The number of cards dealt changes each hand, commonly down from as many as fit to one, or up and back down. The next card turned up sets trump.
Bidding: Each player bids in turn. Commonly the dealer may not bid a number that makes the bids add up to the tricks available, so someone must miss.
Play: Follow suit if you can; trump wins.
Scoring: Make your bid exactly and score 10 plus your bid. Miss and score nothing (some tables subtract instead).`,
  },
  {
    id: 'wizard',
    name: 'Wizard',
    category: 'card',
    players: [3, 6],
    sheet: bids({ scoring: 'wizard', rounds: (n) => Math.floor(60 / n) }),
    rules: `Goal: Bid exactly the tricks you will take, round after round.
Cards: A normal deck plus four Wizards and four Jesters. Round one deals one card each, round two two, and so on, until the deck runs out.
Trump: The card turned after the deal is trump; a Wizard lets the dealer choose, a Jester means none.
Play: Wizards always win (the first one played) and may be played at any time; Jesters always lose. Otherwise follow suit if you can.
Scoring: Exactly right scores 20 plus 10 per trick. Wrong loses 10 for every trick you are off.`,
  },
  {
    id: 'skullking',
    name: 'Skull King',
    category: 'card',
    players: [2, 8],
    sheet: bids({ scoring: 'skullking', rounds: () => 10 }),
    rules: `Goal: Bid exactly the tricks you will take across ten rounds; round one deals one card, round ten deals ten.
Cards: Black flags (trump) beat other suits; pirates beat all numbers; the Skull King beats pirates; mermaids beat the Skull King. Escapes always lose.
Scoring: Bid one or more and make it exactly: 20 per trick, plus bonuses. Miss: minus 10 per trick off. Bid zero and make it: 10 times the round number; miss: minus that.
Bonuses: Only count when the bid is made; enter them on the round, such as for capturing 14s, or pirates with the Skull King.`,
  },
  {
    id: 'bridge',
    name: 'Bridge',
    aka: ['Contract Bridge', 'Rubber Bridge'],
    category: 'card',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', round: 'Deal' }),
    rules: `Goal: Win more points than the other partnership by making contracts and defeating theirs.
Auction: Bids name a number of tricks over six and a trump suit or no trump. Each bid must outrank the last; it ends after three passes in a row. The highest bid is the contract, and the partner of the declarer lays their hand face up as dummy.
Play: Follow suit if you can; trump wins.
Scoring: Making the contract scores trick points, bonuses for game, slam and overtricks; defeating it scores penalties. Enter each deal's points from a bridge scoring table.`,
  },
  {
    id: 'pinochle',
    name: 'Pinochle',
    category: 'card',
    players: [2, 2],
    teams: true,
    sheet: rounds({
      win: 'high',
      target: 1500,
      round: 'Hand',
      parts: [
        { label: 'Meld', typed: true },
        { label: 'Points in tricks', typed: true },
      ],
    }),
    rules: `Goal: First partnership to the agreed total, commonly 1,500.
Cards: Forty-eight: two each of nine to ace in every suit. Aces rank highest, then tens, kings, queens, jacks and nines.
Auction: The highest bidder names trump; partners pass cards across in many games.
Meld: Show scoring combinations, such as a run in trump, marriages (king and queen of a suit), pinochle (queen of spades and jack of diamonds) and four of a kind.
Tricks: Aces, tens and kings taken count, plus the last trick.
Scoring: The bidding side must make its bid with meld and tricks together, or loses the bid.`,
  },
  {
    id: 'golfcards',
    name: 'Golf (card game)',
    aka: ['Six card golf', 'Polish poker'],
    category: 'card',
    players: [2, 8],
    sheet: rounds({ win: 'low', rounds: 9, round: 'Hole' }),
    rules: `Goal: Have the lowest total after nine holes.
Deal: Six cards each, face down in two rows of three. Turn two of them up.
Turn: Draw from the stock or take the top discard, then swap it for one of your cards (face up) or discard it.
End of a hole: Once someone has all six face up, everyone else has one more turn.
Scoring: Ace 1, two minus 2, three to ten face value, jack and queen 10, king 0. A matching pair in one column scores 0.`,
  },
  {
    id: 'kingsinthecorner',
    name: 'Kings in the Corner',
    aka: ['Kings Corner'],
    category: 'card',
    players: [2, 4],
    sheet: rounds({ win: 'low', round: 'Hand' }),
    rules: `Goal: Be first to play all your cards.
Layout: Four cards face up beside the deck. Kings go into the corners.
Turn: Draw one, then play as many cards as you can onto the piles in descending order, alternating red and black. You may move a whole pile onto another when it fits.
Scoring: When someone goes out, everyone else counts what they hold against them, commonly 10 for a king and 1 for any other card. Lowest total wins.`,
  },
  {
    id: 'president',
    name: 'President',
    aka: ['Scum', 'Capitalism'],
    category: 'card',
    players: [3, 8],
    sheet: rounds({ win: 'high', round: 'Hand', quick: [1, 2] }),
    rules: `Goal: Get rid of your cards first.
Play: The leader plays one card or a set of one rank. Each player in turn plays the same number of cards of a higher rank, or passes. Twos are commonly highest. When everyone passes, the last to play leads again.
Ranks: The order players go out sets their titles for the next hand, from President to Scum. The Scum gives the President their best cards, and gets back the President's worst.
Scoring: Commonly 2 for President and 1 for Vice President each hand.`,
  },
  {
    id: 'gofish',
    name: 'Go Fish',
    category: 'card',
    players: [2, 6],
    sheet: rounds({ win: 'high', round: 'Game' }),
    rules: `Goal: Collect the most books, four cards of one rank.
Turn: Ask any player for a rank you already hold. If they have any, they hand them all over and you ask again. If not, they say go fish and you draw; drawing the rank you asked for earns another go.
Books: Lay down a book as soon as you have it.
End: When every book is made. Enter books for each game.`,
  },
  {
    id: 'spoons',
    name: 'Spoons',
    category: 'card',
    players: [3, 12],
    sheet: rounds({ win: 'high', round: 'Round', word: 'SPOONS' }),
    rules: `Goal: Do not be the one left without a spoon.
Setup: One spoon fewer than players, in the middle. Four cards each.
Play: The dealer draws a card and passes one face down to the left; everyone keeps passing a card on as fast as they can, holding four.
Spoons: Whoever gets four of a kind takes a spoon, and then everyone grabs one.
Letters: The player left without a spoon takes a letter. Spell SPOONS and you are out.`,
  },
  {
    id: 'whist',
    name: 'Whist',
    category: 'card',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', target: 5, round: 'Hand' }),
    rules: `Goal: First partnership to 5 points (7 in American whist).
Play: Thirteen cards each. The last card dealt shows trump. Follow suit if you can; trump wins.
Scoring: The first six tricks a side takes are its book; each trick after that scores 1.`,
  },
  {
    id: 'rook',
    name: 'Rook',
    category: 'card',
    players: [2, 2],
    teams: true,
    sheet: rounds({ win: 'high', target: 500, round: 'Hand' }),
    rules: `Goal: First partnership to an agreed total, often 500.
Cards: The Rook deck, four colours numbered 1 to 14, and the Rook bird card. Many tables play with 5 to 14.
Auction: Bid for the right to name trump and take the nest. The Rook is the highest trump in most rules.
Counters: Points are in the cards taken: commonly 5s are 5, 10s and 14s are 10 and the Rook 20.
Scoring: The bidding side must take at least its bid or loses that many; the other side keeps what it took.`,
  },
  {
    id: 'handandfoot',
    name: 'Hand and Foot',
    category: 'card',
    players: [2, 3],
    teams: true,
    sheet: rounds({
      win: 'high',
      rounds: 4,
      labels: ['Meld 50', 'Meld 90', 'Meld 120', 'Meld 150'],
      round: 'Hand',
      parts: [
        { label: 'Clean books', per: 500 },
        { label: 'Dirty books', per: 300 },
        { label: 'Going out', per: 100 },
        { label: 'Card points, laid down less those left', typed: true },
      ],
    }),
    rules: `Goal: The partnership with the most points after four hands.
Cards: Several decks with jokers. Each player has a hand and a foot of eleven cards; play the hand first, then the foot.
Play: Draw two, meld, discard one. Melds are three to seven of a rank; seven makes a book. Twos and jokers are wild.
First meld: Must reach 50, 90, 120 and 150 points in the four hands.
Card values: Joker 50, two and ace 20, eight to king 10, four to seven 5. Red threes are commonly worth 100.
Scoring: Clean book 500, dirty book 300, going out 100, plus cards laid down less cards left.`,
  },
  {
    id: 'contractrummy',
    name: 'Contract Rummy',
    aka: ['Shanghai', 'Liverpool Rummy', 'Progressive Rummy'],
    category: 'card',
    players: [3, 8],
    sheet: rounds({
      win: 'low',
      rounds: 7,
      round: 'Round',
      labels: ['2 sets', '1 set, 1 run', '2 runs', '3 sets', '2 sets, 1 run', '1 set, 2 runs', '3 runs'],
    }),
    rules: `Goal: Lowest total after seven rounds.
Contracts: Each round has its own: two sets, then a set and a run, two runs, three sets, two sets and a run, a set and two runs, and three runs (the common order).
Play: Draw, meld once you have the whole contract, add to any meld afterwards, discard.
Scoring: When someone goes out, the rest count their cards: commonly two to nine 5, ten to king 10, ace 15, joker 50.`,
  },
  {
    id: 'fivecrowns',
    name: 'Five Crowns',
    category: 'card',
    players: [2, 7],
    sheet: rounds({
      win: 'low',
      rounds: 11,
      round: 'Round',
      labels: ['3 cards, 3s wild', '4 cards, 4s wild', '5 cards, 5s wild', '6 cards, 6s wild', '7 cards, 7s wild', '8 cards, 8s wild', '9 cards, 9s wild', '10 cards, 10s wild', '11 cards, Jacks wild', '12 cards, Queens wild', '13 cards, Kings wild'],
    }),
    rules: `Goal: Lowest score after eleven rounds.
Cards: Five suits from 3 to king, plus jokers. Round one deals three cards and threes are wild; each round deals one more and the next rank is wild.
Turn: Draw, discard. Go out when every card is in books (three or more of a rank) or runs (three or more in a suit).
Going out: Everyone else has one more turn, then lays down what they can.
Scoring: Cards left count face value, jack 11, queen 12, king 13, a wild card 20, a joker 50.`,
  },
  {
    id: 'phase10',
    name: 'Phase 10',
    aka: ['Phase Ten'],
    category: 'card',
    players: [2, 6],
    sheet: rounds({ win: 'low', round: 'Hand', phases: PHASES }),
    rules: `Goal: Be the first to finish all ten phases.
Phases: 1, two sets of 3. 2, a set of 3 and a run of 4. 3, a set of 4 and a run of 4. 4, a run of 7. 5, a run of 8. 6, a run of 9. 7, two sets of 4. 8, seven cards of one colour. 9, a set of 5 and a set of 2. 10, a set of 5 and a set of 3.
Turn: Draw, lay down your phase if you can, then hit on laid-down phases, then discard. Wilds fit anywhere; a Skip makes someone lose a turn.
Hand ends: When someone runs out of cards. Anyone who made their phase moves on to the next.
Scoring: Cards left count against you: 1 to 9 are 5, 10 to 12 are 10, Skip 15, Wild 25.
End: The first to finish phase 10 wins; a tie goes to the lowest score. Tick a player's box on a hand they made their phase.`,
  },
  {
    id: 'uno',
    name: 'Uno',
    aka: ['UNO', 'Uno Flip'],
    category: 'card',
    players: [2, 10],
    sheet: rounds({ win: 'high', target: 500, round: 'Hand' }),
    rules: `Goal: First to 500 points.
Play: Match the top card by colour, number or symbol, or play a Wild. If you cannot, draw one; you may play it if it fits.
Action cards: Skip, Reverse, Draw Two. Wild names a colour. Wild Draw Four may officially only be played when you have no card of the current colour, and can be challenged.
Uno: Say it when you play your next to last card; caught not saying it, draw two.
Scoring: The first out scores the cards left in everyone's hands: number cards face value, Draw Two, Reverse and Skip 20, Wilds 50.`,
  },
  {
    id: 'skipbo',
    name: 'Skip-Bo',
    aka: ['Skipbo', 'Skip Bo'],
    category: 'card',
    players: [2, 6],
    sheet: rounds({ win: 'high', target: 500, round: 'Game', quick: [25] }),
    rules: `Goal: Empty your stockpile first.
Setup: Thirty cards in each stockpile (twenty with five or more players), top card turned up. Five in hand.
Turn: Fill your hand to five. Play onto the shared building piles in order from 1 to 12, from your stockpile, hand or discard piles. Skip-Bo cards are wild. End by discarding onto one of your four discard piles.
Scoring: The winner of a game scores 25 plus 5 for each card left in the others' stockpiles. First to 500, or simply count games won.`,
  },
  {
    id: 'millebornes',
    name: 'Mille Bornes',
    category: 'card',
    players: [2, 6],
    sheet: rounds({
      win: 'high',
      target: 5000,
      round: 'Hand',
      parts: [
        { label: 'Distance (miles or km)', typed: true },
        { label: 'Safeties played', per: 100 },
        { label: 'All four safeties', per: 300 },
        { label: 'Coups fourrés', per: 300 },
        { label: 'Trip completed', per: 400 },
        { label: 'Delayed action', per: 300 },
        { label: 'Safe trip (no 200s)', per: 300 },
        { label: 'Shutout', per: 500 },
        { label: 'Extension', per: 200 },
      ],
    }),
    rules: `Goal: First to 5,000 points over several hands.
Play: Draw one, play one. You need a Go card to start moving. Play distance cards to reach exactly 1,000 (700 in some games) and hazards on your opponents, who need the matching remedy.
Safeties: Make you immune to a hazard. Played straight away when that hazard is played on you, it is a coup fourré: an extra 300 and another turn.
Scoring: Every mile travelled, 100 per safety, 300 more for all four, 300 per coup fourré, 400 for completing the trip, and bonuses for delayed action, a safe trip with no 200s, a shutout and an extension.`,
  },
  {
    id: 'explodingkittens',
    name: 'Exploding Kittens',
    category: 'card',
    players: [2, 5],
    sheet: gamesWon(),
    rules: `Goal: Be the last player who has not exploded.
Turn: Play as many cards as you like, then end by drawing one.
Exploding Kitten: Draw one and you are out, unless you play a Defuse and put the kitten back in the deck anywhere you like, in secret.
Cards: Attack, Skip, Favor, Shuffle, See the Future, and Nope, which stops any action except an Exploding Kitten or Defuse. Two matching cat cards steal a random card from another player.`,
  },
  {
    id: 'loveletter',
    name: 'Love Letter',
    category: 'card',
    players: [2, 6],
    sheet: counters({ counters: [{ id: 'tokens', label: 'Tokens', start: 0, min: 0 }] }),
    rules: `Goal: Win enough tokens of affection. In the original game that is 7 with two players, 5 with three and 4 with four; newer editions differ.
Turn: Draw a card, so you hold two, then play one and do what it says.
Round ends: When the deck runs out, the highest card still in hand wins; or when everyone else has been knocked out.
Watch out: Discarding the Princess knocks you out. The Countess must be played if you hold the King or Prince with it.`,
  },
  {
    id: 'coup',
    name: 'Coup',
    category: 'card',
    players: [2, 6],
    sheet: gamesWon(),
    rules: `Goal: Be the last player with influence.
Setup: Two face-down character cards and two coins each.
Turn: Take income (1 coin), foreign aid (2, which a Duke can block) or launch a coup (7 coins, and you must with 10 or more). Or claim a character: Duke takes 3, Assassin pays 3 to assassinate, Captain steals 2, Ambassador exchanges cards. The Contessa blocks assassination.
Challenges: Anyone may challenge a claim. Whoever turns out to be wrong loses an influence card.`,
  },
  {
    id: 'hanabi',
    name: 'Hanabi',
    category: 'card',
    players: [2, 5],
    sheet: counters({
      shared: true,
      counters: [
        { id: 'score', label: 'Fireworks score', start: 0, min: 0, max: 25 },
        { id: 'clues', label: 'Clue tokens', start: 8, min: 0, max: 8 },
        { id: 'fuses', label: 'Fuse tokens', start: 3, min: 0, max: 3, lose: 0 },
      ],
    }),
    rules: `Goal: Together, build five fireworks from 1 to 5, one per colour, without seeing your own cards.
Turn: Give a clue (spend a token and tell a player every card they hold of one colour or one number), discard a card to regain a token, or play a card.
Playing: A card that continues a firework is added. A card that does not loses a fuse token; the third lost ends the game. Completing a 5 regains a clue token.
Score: The top card of every firework added together, up to 25.`,
  },
  {
    id: 'themind',
    name: 'The Mind',
    category: 'card',
    players: [2, 4],
    sheet: counters({
      shared: true,
      counters: [
        { id: 'level', label: 'Level', start: 1, min: 1, max: 12 },
        { id: 'lives', label: 'Lives', start: 2, min: 0, max: 5, lose: 0 },
        { id: 'stars', label: 'Throwing stars', start: 1, min: 0, max: 3 },
      ],
    }),
    rules: `Goal: Together, play every card in rising order without talking.
Levels: Level one deals one card each, level two two, and so on: twelve levels with two players, ten with three, eight with four.
Play: Anyone may play their lowest card at any time. A card played out of order costs a life, and the lower cards are discarded.
Throwing stars: All agree, and everyone discards their lowest card.
Lives: Start with one per player, so set them with + and − before the first level. Some levels reward a life or a star.`,
  },
  {
    id: 'dutchblitz',
    name: 'Dutch Blitz',
    category: 'card',
    players: [2, 8],
    sheet: rounds({
      win: 'high',
      target: 75,
      round: 'Round',
      parts: [
        { label: 'Cards in the Dutch piles', per: 1 },
        { label: 'Cards left in your Blitz pile', per: -2 },
      ],
    }),
    rules: `Goal: First to 75 points.
Setup: Each player has a deck. Ten-card Blitz pile, three post piles, the rest in hand.
Play: Everyone plays at once. Start shared Dutch piles in the middle with 1s and build them up to 10 in one colour. Build your post piles down, alternating boy and girl cards.
Blitz: Empty your Blitz pile and call it; the round stops.
Scoring: 1 for each of your cards in the Dutch piles, minus 2 for each card left in your Blitz pile.`,
  },
  {
    id: 'sushigo',
    name: 'Sushi Go!',
    aka: ['Sushi Go', 'Sushi Go Party'],
    category: 'card',
    players: [2, 5],
    sheet: rounds({ win: 'high', rounds: 3, round: 'Round', labels: ['Round 1', 'Round 2', 'Round 3 and pudding'] }),
    rules: `Goal: Most points after three rounds.
Play: Everyone picks one card from their hand at the same time, then passes the rest left.
Scoring: Maki rolls: most 6, second 3. Tempura: 5 a pair. Sashimi: 10 a set of three. Dumplings: 1, 3, 6, 10, 15 for one to five. Nigiri: 1, 2 or 3, tripled on a wasabi. Chopsticks let you take two later.
Pudding: Kept until the end: most scores 6, fewest loses 6 (not with two players).`,
  },
  {
    id: 'cassino',
    name: 'Cassino',
    aka: ['Casino'],
    category: 'card',
    players: [2, 4],
    sheet: rounds({
      win: 'high',
      target: 21,
      round: 'Hand',
      parts: [
        { label: 'Most cards', per: 3 },
        { label: 'Most spades', per: 1 },
        { label: 'Big casino (10 of diamonds)', per: 2 },
        { label: 'Little casino (2 of spades)', per: 1 },
        { label: 'Aces', per: 1 },
        { label: 'Sweeps', per: 1 },
      ],
    }),
    rules: `Goal: First to 21.
Play: Four cards each and four face up. Play one card a turn to capture table cards of the same rank, or cards that add up to it, to build a total you can capture next turn, or simply to trail it on the table.
Scoring: Most cards 3, most spades 1, big casino 2, little casino 1, each ace 1, and in many games 1 for each sweep that clears the table.`,
  },
]
