# Calculator

A calculator that works the whole expression out. No ads, no account, no
network. Everything stays in the browser it runs in.

It is its own app: its own build, its own service worker, its own icon on the
home screen. It shares a repository with Almanac and nothing else.

## The mark

Four operations in a square, which is what a calculator looks like from across
a room. Paper white on espresso, with equals picked out in cinnabar, so it sits
beside Almanac's crescent as one family rather than as two apps that happen to
be next to each other.

## Two surfaces

**Calculate** and **Convert**, one switch apart at the top of the screen. Which
one you were on is remembered, so an app opened to convert opens to convert.

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
- A **keyboard** works: digits, `+ - * / ^ ( ) . %`, Enter for equals,
  Backspace, Delete to clear. Letters are deliberately not bound; the named
  functions are one tap away instead

## Converting

Thirteen categories and 103 units: length, area, volume, mass, temperature,
speed, time, data, pressure, energy, power, angle and fuel economy.

Type into either row and the other one follows, so a conversion runs in
whichever direction you happen to want it. Under the pair sits the same
quantity in every other unit the category holds, which is usually the thing you
did not know you wanted until it was there; tapping one makes it the unit being
converted to. The pair you used in a category is remembered, so feet to inches
stays feet to inches.

Every factor is the exact defined value rather than one rounded off a chart: a
foot is 0.3048 metres, a pound is 0.45359237 kilograms, a US gallon is
3.785411784 litres. Readings are shown to eight significant figures rather than
to a fixed number of decimal places, because a conversion is a measurement and
not a sum: twelve feet in yards wants 3.3333333, and 304,800,000 nanometres
wants every digit it has.

Temperature carries an offset and fuel economy is a reciprocal, so those two
convert through a pair of functions rather than a factor. Currency is
deliberately absent: a rate is a live number and this app does not go near a
network.

## What it looks like

Nine palettes, three light and six dark, and the device's own light or dark
setting picks between a pair of them unless you say otherwise. On top of that: an accent of any colour, seven
typefaces, four text sizes, a heavier weight, four key styles, four key corner
shapes, the answer's size, the operator column on either side, and a bottom row
with a double zero or one wide one. All under Settings, with a preview that
changes as you set it.

Every typeface is one the device already has, so nothing is fetched and the app
looks right offline and on first paint.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints. `npm run build` writes `dist`, which is
static files: any host that serves a directory will do.

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
    theme.ts         palettes, typefaces, key styles, and deriving one
    storage.ts       settings defaults and forward migration
  components/
    keys.ts          what is on the pad, and nothing about how it is drawn
    Converter.tsx    categories, a pair, everything else, and a pad
    SettingsPanel.tsx
    PaletteEditor.tsx  three colours in, nine out
    Icons.tsx
```

Settings live under the `calculator.v1` key and the history under
`calculator.tape.v1`. They are apart because one changes on every press and the
other twice a year, and writing the whole of one every time the other moves is
how a storage key ends up rewritten a hundred times a minute. Settings are
migrated forward on load, so adding a field never strands an existing save.
