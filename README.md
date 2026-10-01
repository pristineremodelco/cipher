# Cipher

A calculator that works the whole expression out. No ads, no account, no
network. Everything stays in the browser it runs in.

It is its own app: its own build, its own service worker, its own icon on the
home screen. It shares a repository with Almanac and nothing else.

## The name

To cipher meant to do arithmetic, and in the trades it still does. It is the
right word for this one in particular: it works an expression out rather than
accumulating a running total, which is the difference between reading a sum and
adding up.

## The mark

Four operations in a square, which is what a calculator looks like from across
a room. Paper white on espresso, with equals picked out in cinnabar, so it sits
beside Almanac's crescent as one family rather than as two apps that happen to
be next to each other.

## Three surfaces

**Calculate**, **Convert** and **Tools**, one switch apart at the top of the
screen. Which one you were on is remembered, and so is the tool you were in, so
an app opened to work something out opens on it.

## What it does

- **The whole expression**, parsed rather than accumulated, so brackets and
  precedence work and the answer is there before equals is pressed
- **Scientific**: π, e, φ, log, ln, log₂, √, ∛, |x|, x², x³, x⁻¹, x!, mod, Ans,
  the trig families with their inverses and hyperbolics, degrees or radians
- **Percent that reads its neighbour**: `200+10%` is 220, because the ten means
  ten percent of the two hundred beside it. Beside a times or a divide it is a
  plain hundredth, so `200×10%` is 20
- **Memory**: MC, MR, M+, M-
- **History**: the last 200 answers, each with the working that produced it.
  Tap the working to put it back on the display, or the answer to carry it into
  the next sum. Nothing expires with time: the 201st sum pushes the oldest off
  and that is the only way one leaves, short of Clear or turning history off
- **Hold the rub-out** to clear the lot
- **Tap the answer** to copy it
- **Tap inside the sum** to put a cursor there and change one part of it, even
  after equals. Keys and the rub-out work at the cursor. It is a setting, for
  anyone who would rather a finished answer could not be reopened by a stray tap
- A **keyboard** works: digits, `+ - * / ^ ( ) . %`, Enter for equals,
  Backspace, Delete to clear, and the arrow keys, Home and End to move the
  cursor. Letters are deliberately not bound; the named functions are one tap
  away instead

## Converting

Eighteen categories and 127 units: length, area, volume, mass, temperature,
speed, time, data, pressure, force, energy, power, voltage, current,
resistance, frequency, angle and fuel economy.

Type into either row and the other one follows, so a conversion runs in
whichever direction you happen to want it. Under the pair sits the same
quantity in every other unit the category holds, which is usually the thing you
did not know you wanted until it was there; tapping one makes it the unit being
converted to. The pair you used in a category is remembered, so feet to inches
stays feet to inches.

Or, with **Simple** chosen under Settings → Maths, no categories at all: two
unit pickers found by typing. The top one searches every unit there is, and
reads the way people write units: plural, American, abbreviated or misspelt,
so "lbs", "liters", "feet", "kph" and "celcius" all land. Once it is chosen the
bottom one holds only what it converts to, each with what the number comes to
in it, so volts to what is answered by looking. A whole conversion typed in one
go, "5 grams to lbs", sets both units and the amount.

Every factor is the exact defined value rather than one rounded off a chart: a
foot is 0.3048 metres, a pound is 0.45359237 kilograms, a US gallon is
3.785411784 litres. Readings are shown to eight significant figures rather than
to a fixed number of decimal places, because a conversion is a measurement and
not a sum: twelve feet in yards wants 3.3333333, and 304,800,000 nanometres
wants every digit it has.

Temperature carries an offset and fuel economy is a reciprocal, so those two
convert through a pair of functions rather than a factor. Currency lives under
Tools rather than here, because it is the one conversion that needs a signal:
a rate is a live number, and it is marked as needing a connection.

## The tools

Sixteen of them, grouped by what they are for rather than listed alphabetically
in a drawer.

**Money.** Discount, Sales Tax, Tip, Unit Price, Loan, Savings, Currencies.
**Everyday.** Percent, Date, World Time, Hex, Grade Average.
**Vehicle.** Fuel Cost, Fuel Efficiency.
**Health.** Body Metrics, Ovulation.

Every one of them has the same shape: the fields at the top, the answer in a
block underneath with the figure you came for drawn large, and a note where the
sum needs one. Sales Tax runs backwards as well as forwards, because taking 8%
off a total that already includes 8% does not give the price before tax and
plenty of tools get that wrong. Loan is a level payment amortisation and says
so. Ovulation says out loud that every date on it is an average of other
people's cycles.

### The one that needs a signal

Fifteen of the sixteen work with the aeroplane mode on. **Currencies** cannot:
an exchange rate is a live number, and inventing one would be worse than saying
so. It carries a signal mark on its card, crossed through when the device
reports no connection, so the reason a tap will disappoint is visible before
the tap.

Rates come from the European Central Bank through Frankfurter, which is free,
needs no key and answers cross-origin, so the browser asks directly and no
server sits in the middle holding anybody's traffic. The ECB publishes once a
working day, so a set fetched this morning is the set everybody has: what was
last fetched is kept, still converts offline, and says how old it is rather
than pretending to be current.

World Time looks as though it should need a signal and does not. Every browser
ships the whole IANA time zone database, so what time it is in Tokyo is a
question the device can already answer, daylight saving included.

## What it looks like

Nine palettes, three light and six dark, and the device's own light or dark
setting picks between a pair of them unless you say otherwise. Either slot can
take a palette of your own, which starts as a copy of the one it replaces. On
top of that: an accent of any colour, seven
typefaces, four text sizes, a heavier weight, four key styles, four key corner
shapes, the answer's size, the operator column on either side, and a bottom row
with a double zero or one wide one. Spelling is American or British, which
covers the metric units, colour and grey, and the name of the Maths tab. All under Settings, with a preview that
changes as you set it.

Six of the seven typefaces ship with the app, so a choice lands the same way
on every phone and works offline; the seventh is the device's own. Operators
are drawn in a version of the accent worked out to stand off their keys by at
least 5.5 to 1 in every palette and key style, so a chosen accent is a fill
first and never an unreadable glyph.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints. `npm run build` writes `dist`, which is
static files: any host that serves a directory will do.

## Putting it somewhere

`npm run build` writes `dist`, which is static files: any host that serves a
directory will do, and the app needs no server of its own.

Pushing to `main` builds it and puts it on GitHub Pages, at
`https://pristineremodelco.github.io/cipher/`. The tests run first and the
deploy waits on them, so a push that breaks the parser never reaches a phone.

A host that gives the app a whole domain rather than a folder needs nothing
set. One that gives it a folder needs to say so, because the manifest has to
agree about where the app lives or the installed icon opens on a page that is
not there:

```bash
BASE_PATH=/cipher/ npm run build
```

## Checking it

```bash
npm test
```

The sums, run under node with no test framework and no dependency: node runs
TypeScript and ships a test runner, so there is nothing to install. 227 of
them, covering the expression parser, what each key does to what is already on
the display, every answer carried on reading back as itself, all 127 unit
factors with every pair round tripped, what typing a unit finds, and every one
of the tools' formulas. The awkward cases are in there by name: percent reading
its neighbour, sales tax taken back off a total, a base refusing a digit it
cannot hold, and 4,000 random key sequences that must never crash the parser.
`npm run build` typechecks them alongside the app, so a rename that breaks one
fails the build rather than waiting to be noticed.

```bash
npm i --no-save playwright && npx playwright install chromium
npm run dev
npm run test:browser
```

The rest, which needs a browser: 483 checks across seven suites. Every key on
the pad pressed with the answer read back off the screen; what carries forward
between presses and how far the history goes; a palette made from three colours
and worn; every setting driven and its effect measured, from key corners to
operator contrast to each typeface drawing differently; the simple converter
searched and answered; every tool opened and answered, with the one that needs
a signal put through all three of the states it can be in; and the layout swept
over twelve screen sizes in all three surfaces and every tool.

Playwright is deliberately not a dependency, the same way sharp is not: both
are check-once tools, and adding a browser download to the install for
something that runs before a release is a cost with no return.

## The icons

```bash
npm i --no-save sharp png-to-ico && npm run icons
```

Three sources in `icons/`, rasterised into every size the platforms ask for.
`mark.svg` is the mark as drawn, with its own rounded corner, for anywhere the
icon is used as-is. `mark-square.svg` is square to the edge for iOS, which cuts
its own corners but does not crop. `mark-maskable.svg` is square too and eased
down to 0.74, because Android guarantees only the inner circle of radius 21.3
survives its mask and the far edge of the cinnabar disc sits 28.8 out from the
centre. The output is committed; run this only when the mark changes.

## Layout

```
src/
  App.tsx            the display, the pad, the sheets, and the keying
  store.tsx          settings, persistence, and applying them to :root
  index.css          palettes first, then everything reading from them
  types.ts           what a setting can be
  lib/
    calc.ts          the expression parser and the number formatter
    calcinput.ts     what each key does to what is already on the display
    calctape.ts      the history and the memory register
    units.ts         what one unit is in terms of another
    unitsearch.ts    finding a unit, or a pair, by what was typed
    tools.ts         the sums behind the tools, and nothing that draws
    rates.ts         exchange rates, and what to do when there are none
    zones.ts         world time, worked out on the device
    theme.ts         palettes, typefaces, key styles, and deriving one
    spelling.ts      American or British, on the way to the screen
    storage.ts       settings defaults and forward migration
  components/
    keys.ts          what is on the pad, and nothing about how it is drawn
    Converter.tsx    by category or simple: a pair, a picker, and a pad
    Confirm.tsx      a button that asks once before it does what cannot be undone
    Tools.tsx        the grid, and one screen at a time
    Form.tsx         the field, the choice and the answer block they all share
    tools/           one file per group: Money, Everyday, Vehicle, Health, Currency
    SettingsPanel.tsx
    PaletteEditor.tsx  three colours in, nine out
    Icons.tsx
```

```
test/
  *.test.ts        the sums, under node, no framework
  browser/         the rest, needing playwright and a running dev server
```

Settings live under the `calculator.v1` key and the history under
`calculator.tape.v1`. They are apart because one changes on every press and the
other twice a year, and writing the whole of one every time the other moves is
how a storage key ends up rewritten a hundred times a minute. Settings are
migrated forward on load, so adding a field never strands an existing save.
