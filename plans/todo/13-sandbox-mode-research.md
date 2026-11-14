---
title: Basic Sandbox Mode research
description: The brief for Basic Sandbox Mode, free folding on a printed lattice, and the case for building it before Gameplay Mode, measured against the fold engine on four lattices and two sheet shapes, with an outline of how it could be built and exported as a design.
type: research
---

## Context

- Plans 01 to 12 are done and committed, and the app is launched as
  Pureland Simulator at version 1.0.0. Today it has one mode, in which a
  design radio folds the paper to a finished model. This file names that
  mode Presentation Mode, and brings together the brief for a second,
  Basic Sandbox Mode, in which the player folds a printed pattern
  freely. It comes before a third, Gameplay Mode, a game that teaches each
  design's folds, whose research follows in
  [14](./14-gameplay-mode-research.md) and builds on this one.
- The first section, [The brief](#the-brief), records the brief. The rest
  makes the case for building the Sandbox first, measures it against the
  engine, and outlines how it could be built. Nothing here is a plan:
  the plans are 15 to 20, listed in [The plans](#9-the-plans), and this
  file is their reference, as
  [the design research](../done/07-design-research.md) was for Plans 08
  to 12.
- Each claim below is one of four kinds, and says which:
  - **Code**: checked in this repo's source on 2026-11-11.
  - **Measured**: run on 2026-11-11 for the square sheet and 2026-11-14
    for the 2:1 sheet, in Node 25.8.0 on the Lead Developer's Mac, by a
    script that drives the repo's own engine through random walks of
    folds on four printed patterns. It is kept at the repo root as
    `tmp-sandbox-mode-grid.mjs`, which git ignores, and runs as
    `node tmp-sandbox-mode-grid.mjs [aspect]`, the aspect, width over
    height, defaulting to 1. Standing folds were measured on 2026-11-14
    by `tmp-sandbox-mode-standing.mjs`, beside it, which runs a copy of
    the engine patched to the rules in
    [Several standing folds](#several-standing-folds), as
    `node tmp-sandbox-mode-standing.mjs [walks] [side rule]`.
  - **Source**: read in the pinned Three.js release's unminified source,
    r187 on GitHub, or on MDN, web.dev or the W3C's site, linked where
    cited.
  - **Derived**: worked out, not prototyped and not seen in a browser.
- Terms the briefs give in title case keep it: Presentation Mode,
  Sandbox Mode, Gameplay Mode, Fold Button, and the Undo, Redo, Unfold and
  Export buttons.

## The brief

### Modes

- The app today works only in Presentation Mode, which stays the
  default. A new radio group chooses the mode.
- Sandbox Mode has designs of its own, regular geometric patterns of
  folds, for free experiment: no points, lives or hints, just folding.
  In full, it would also offer a way to save and share results, so
  players can show their creations and explore others'.
- Basic Sandbox Mode starts with two sheet shapes, a square and a 2:1
  oblong, so that its interface is exercised on more than one shape from
  the start. Other whole-number ratios are not needed for now.
- Gameplay Mode is a game: shown a design's lines on a flat sheet, the
  player presses a Fold Button on a line to fold it, tries different
  orders, and learns one that works.

### A basic Sandbox Mode before Gameplay Mode

- A basic Sandbox Mode, without the saving, sharing or viewing of
  others' creations, is built before Gameplay Mode.
- The thought behind it: a basic Sandbox Mode is a subset of Gameplay Mode,
  so it is a step on the way, not a detour. It would be a fun and
  interesting feature on its own, even without saving and sharing. And
  it could be a handy workbench for finding better Gameplay Mode designs.

### Fold Buttons

- Every fold the player can make is offered by Fold Buttons: circles
  carrying an icon, with no words. A line that may fold either way, as
  every Sandbox line does, has two side by side, a mountain and a
  valley. A line that may fold only one way, as each of a Gameplay Mode
  design's lines does, has that one alone, of the same design.
- Each icon combines the line pattern origami diagrams use for its fold,
  dash-dot-dot for a mountain and dashed for a valley, as the paper
  prints them, with a shape: a chevron, like a peak, for the mountain,
  and a V for the valley.
- Mountain and valley hold as the player sees the paper. When a spin
  brings the other side to face the camera, the two buttons simply swap
  designs, so each still means what it shows.
- The buttons are graphic, where the paper is photorealistic. The
  paper's lit, grained colours never reach the ends of the colour space;
  the buttons' colours do, so they read as controls laid over the scene,
  never as part of the paper. Their colours follow the side facing the
  camera:
  - **On the coloured side:** a brighter, lighter shade of the paper's
    colour as the background, more vivid than the paper itself, with the
    icon in 100% black.
  - **On the white side:** a 100% white background, with the icon in a
    brighter, deeper shade of the paper's colour, more saturated than the
    paper. The white side might be darkened by 5 or 10%, so that the
    paper's white stays clearly short of the buttons' pure white.
- A click on a Fold Button folds the fold's default angle: flat in
  Sandbox Mode, and the design's own angle in Gameplay Mode. A drag on it
  chooses the angle instead. A circular progress ring appears around the
  button and grows or shrinks with the drag, perhaps with a translucent
  ghost of the fold to fine-tune by eye, and on release the paper
  animates to the chosen angle.

### Export as a design

- A Sandbox session's folds should be exportable as a design, as a JSON
  dump of the fold list, which can then be fed back into the app as a
  Presentation Mode or Gameplay Mode design.

### Folds at 90° and other angles

- Sandbox Mode might also allow folds that stop at 90°, or at other
  angles, rather than always pressing flat, chosen by dragging a Fold
  Button. This is an interesting mathematical wrinkle to explore.

## Why Sandbox Mode comes first

- **It is the hard part of Gameplay Mode.** The parts of Gameplay Mode that are
  hard to get right in the browser, a sheet cut along the player's path,
  buttons projected over the canvas, a choice of fold direction, and
  Undo, Redo and Unfold, are exactly a basic Sandbox Mode. Gameplay Mode's
  live graph, availability rule, lives, hints and points are a layer on
  top, all pure maths that Node can check. Building the Sandbox first
  puts the risky visible work behind the first gate and leaves Gameplay Mode
  as rules over a working toy.
- **It builds what Gameplay Mode can reuse.** A Sandbox pattern is untyped, so
  the Sandbox prints plain lines and asks for a direction at every fold;
  Gameplay Mode can then offer the same choice with the same Fold Buttons,
  showing one alone where a fold may go only one way. Sandbox lines need no
  labels that hide an order, since there is no order to hide; Gameplay Mode's
  will.
- **The engine's fold model fits a regular pattern without change**,
  provided the pattern is closed under reflection in its own lines. A
  quarter grid with only its two centre diagonals is not;
  [the measurements](#measurements) say why, and which patterns do
  qualify.
- **Sandbox folds go through all layers**, since there is no earlier fold
  to name in a `{ movedBy }` or `{ heldBy }` selection. That limits the
  Sandbox as a design workbench: of the five designs on the page, only
  the pencil and Mount Fuji use all-layer folds throughout (**Code**).
  The yacht's sail, the dart's wings and the heart's corners and tips
  fold one flap only, and the dart's wings stop at 90°. A later Sandbox
  could add "top layer only" as a modifier; the first one should not.
- **A Sandbox session is already a design.** Its fold list, lines in the
  folded plane with a direction each, is what createFold() takes, with
  the start facing front and no turn-overs (**Code**). So "export this as
  a design" is that list written out as a JSON design file, as the brief
  asks.
- **The plan order is**: the engine opens up; then Sandbox Mode, whose
  several standing folds are a stepping stone to the fold tree; then
  Gameplay Mode as rules on top; and the fold tree after its own
  research.

## What the code does today

All **Code**, checked on 2026-11-11.

- A design is a frozen `{ aspect, colorId, id, leanRadians?, start?,
  steps }`. Each step is a fold, written in the view frame, or a turn-over
  (`docs/src/designs/steps.js`).
- cutSheet() in `docs/src/fold/engine.js` reads the steps into `folds` in
  the front's terms, with turn-overs dropped and each fold's `layers`
  renamed to a fold index, then runs the folds in order. A fold is an
  infinite line in the folded plane, a side (its left moves), a layer
  selection (`"all"`, `{ movedBy }` or `{ heldBy }`, naming one earlier
  fold), a `type` and a `targetRadians`. applyFold(), not exported, splits
  the selected faces along the line, reflects the left pieces, and stacks
  them above everything for a valley or below for a mountain. It throws
  when a fold moves nothing, and when a fold would move faces that an
  earlier fold left standing short of 180°.
- A fold's `from` and `to` set its line and which side moves: the side to
  the line's left. Nothing about a fold says how much paper lies on each
  side.
- A fold whose `targetRadians` is under π "stops short": pose.js turns
  the faces it moves as one rigid block about its line and leaves them
  standing; applyFold() still reflects their placements in the folded
  plane, as if pressed flat, and throws if any later fold would move
  those faces. stageCentres() keeps the centre from the stage before.
- The sheet cutSheet() returns holds the final faces, each with a
  placement and a layer per stage, so one geometry serves every point in
  the sequence; plus `bridges`, `centres`, the `creaseLines` to print, and
  `steps`. The crease lines are made by the folds as they run: a fold
  through several layers prints several.
- writePaperPositions() in `docs/src/fold/pose.js` poses every vertex at
  a sequence position, allocating nothing, through a scratch point that
  each fold's turn, the both-sides turn and the stage centre's slide pass
  through in turn.
- stepSequence() in `docs/src/fold/stepper.js` moves `position` towards
  a target along one design's steps, unfolding to 0 and stretching the
  flat sheet to another design's shape and pose when the target names
  one. It reads `designs[state.designId].steps.length` as the finished
  position, where the fold lines fade out.
- drawFoldLines() draws one dash pattern per crease type, valley or
  mountain, and the back's lines as the opposite type. It has no untyped
  style.
- `main.js` cuts every design once at load, keeps the sheets by design
  id, sets the camera once from the widest reach of any design's sheet
  over its whole sequence, 0.1211 m (the pencil), and swaps sheets with
  paper.setSheet() only at rest, flat, with the lines hidden. Each
  geometry's bounding sphere has that radius.
- `distanceToFitSphere()` in `docs/src/camera/fit.js` is pure, so a
  camera that refits to a changing radius needs no new maths.
- Escape hides the toolbar, which `controls-toggle.js` and `main.css` call
  "a presentation mode". That name clashes with Presentation Mode, and
  should change to "hidden toolbar" when the mode radios land.

## Measurements

### Why the pattern must be closed under its own reflections

**Derived**, then **Measured**. The engine folds along a fixed line in
the folded plane. After a fold, the moved paper's printed lines lie
wherever the reflection put them. If every reflection of a pattern line
in another pattern line is itself a pattern line, then every printed line
on every layer always lies on a line the Sandbox can fold, and every
crease a fold makes lies on a printed line. If not, the paper shows
printed lines the Sandbox cannot fold, and folds that crease the paper
where nothing is printed.

- A square lattice of spacing `s` is closed: reflecting the line
  `x = m·s` in `x = k·s` gives `x = (2k − m)·s`, and horizontals are
  unchanged.
- The lattice with both diagonal families through every lattice point
  is closed too: reflecting `y = x + c` in `x = k·s` gives
  `y = −x + 2k·s + c`, a line of the other family through lattice
  points, and reflecting in a diagonal swaps the horizontal and vertical
  families and keeps each diagonal family.
- A quarter grid with only the two centre diagonals is not closed:
  reflecting a centre diagonal in `x = W/4` gives a diagonal through no
  lattice point. With only that sheet's eight printed lines foldable,
  random walks made a crease off the pattern in 494 of 2,013 states
  (**Measured**). Every pattern below is closed, and made 0.
- Closure also means the foldable lines are the whole lattice, not the
  lines printed on the flat sheet: a flap folded outwards carries
  printed lines beyond the sheet's original footprint, and they must be
  foldable too. So a pattern is a lattice, and a line is foldable
  wherever paper now crosses it.

### Which side moves

**Derived**, then **Measured**. A fold moves the side to its line's left,
so each lattice line could move either side. Moving the large side over
the small one gives the same object as moving the small side over the
large, turned over and shifted in the plane, so the choice is
presentational. It is not free of cost, though: with the side chosen by
the line's arbitrary orientation, random walks never ran out of folds,
the folded plane's footprint drifted 11 to 15 spacings from the origin,
and the mid-fold reach rose to 0.1856 m, half as much again as the
camera's 0.1211 m sphere. With **the smaller side moving**, the footprint
stays within 3 spacings and the reach within 0.1135 m on a square sheet,
inside the sphere as it is; a 2:1 sheet does not stay inside it (see
[The same four patterns on a 2:1 sheet](#the-same-four-patterns-on-a-21-sheet)).
Every figure below uses that rule.

### Millimetres on screen

**Derived**: the camera fits the 0.1211 m sphere, with its 1.1 margin,
to the view's smaller dimension, so a 390 px-wide phone shows about
1.5 px per millimetre and a 900 px-tall desktop window about 3.4.
Buttons of the swatches' 24 px, WCAG 2.2's minimum target, whose centres
lie 15 mm apart are 22 px apart on the phone, and overlap; on the
desktop they clear.

### Four patterns on a square sheet

**Measured**: 100 random walks per pattern, each up to 10 flat folds,
every fold a valley or a mountain through every layer along a lattice
line that paper crosses, the smaller side moving. "Foldable lines" counts
lattice lines that paper crosses; "exhausted" counts walks that found no
foldable line before their tenth fold; "refoldable" counts states where a
line already folded is foldable again, because a later fold brought paper
back across it; "crowded" counts states where two foldable lines'
midpoint anchors lie within 15 mm, the distance at which 24 px buttons
overlap on a phone (see [Millimetres on screen](#millimetres-on-screen)).

| Pattern | Printed on the sheet | Foldable lines, folds 0 to 3 | Exhausted | Max faces | Max vertices | Max reach | Refoldable | Crowded |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Half lattice: the two centre lines | 2 | 2.0, 1.0, 0 | 100 of 100, by fold 2 | 4 | 16 | 0.1112 m | 0 of 300 | 100 of 300 |
| Half lattice with diagonals: centre lines, both diagonals, and the four lines through the edges' midpoints | 8 | 8.0, 6.2, 4.7, 3.5 | 100 of 100, by fold 8 | 16 | 48 | 0.1135 m | 120 of 725 | 412 of 725 |
| Quarter lattice: lines at every quarter | 6 | 6.0, 4.7, 3.4, 2.3 | 100 of 100, by fold 6 | 16 | 64 | 0.1112 m | 51 of 623 | 220 of 623 |
| Quarter lattice with diagonals | 20 | 20.0, 17.3, 14.8, 12.8 | 12 of 100 | 64 | 192 | 0.1122 m | 308 of 1,094 | 1,038 of 1,094 |

What the table says:

- **Every reachable state renders as the engine does today.** No walk
  left a T-junction, which cutSheet() refuses, and no crease fell off the
  printed pattern.
- **The paper runs out of folds**, since every fold halves the smaller
  side and the lattice is finite on the paper: the half lattice is done
  in two folds, the quarter lattice in about five, the eight-line pattern
  in about seven. That is physics, not a defect, and Undo is the way
  back. The twenty-line pattern lasts, at the price of up to 64 faces and
  192 vertices, four times the heart's.
- **A line can become foldable again** once paper returns across it, in
  up to a quarter of states. The Sandbox must not treat a folded line as
  spent.
- **Buttons at line midpoints do not work for a Sandbox.** Two foldable
  lines' midpoints lie within 15 mm in a third to nineteen twentieths of
  states, because lattice lines meet at lattice points and symmetric
  crossings share midpoints. Crowding is the rule here, not an exception
  to place around, so the Sandbox needs another way to pick a line; see
  [Picking a line](#3-picking-a-line-with-the-pointer).
- **On a square sheet, the camera can stay as it is** under the
  smaller-side rule: no reach exceeded the 0.1211 m sphere.

### The same four patterns on a 2:1 sheet

**Measured**, as above, on a sheet twice as wide as it is tall, with the
same area as every sheet, 0.2121 m by 0.1061 m, whose flat reach is
0.1186 m. The cells stay square, so each spacing is a fraction of the
short side: half of it gives a lattice of four cells by two, a quarter
of it eight by four.

| Pattern | Printed on the sheet | Foldable lines, folds 0 to 3 | Exhausted | Max faces | Max vertices | Max reach | Refoldable | Crowded |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Half lattice | 4 | 4.0, 2.8, 1.7, 0.7 | 100 of 100, by fold 4 | 8 | 32 | 0.1276 m | 22 of 467 | 160 of 467 |
| Half lattice with diagonals | 14 | 14.0, 11.6, 9.2, 7.6 | 86 of 100 | 32 | 96 | 0.1287 m | 228 of 983 | 644 of 983 |
| Quarter lattice | 10 | 10.0, 8.0, 6.1, 4.7 | 100 of 100, by fold 10 | 32 | 128 | 0.1276 m | 110 of 823 | 510 of 823 |
| Quarter lattice with diagonals | 32 | 32.0, 27.9, 24.3, 20.9 | 1 of 100 | 128 | 384 | 0.1276 m | 389 of 1,099 | 1,095 of 1,099 |

What the table says:

- **Every reachable state still renders**: no T-junction, and no crease
  off the printed pattern.
- **The patterns last longer**, with twice as many cells: the
  fourteen-line pattern about ten folds, where its square cousin lasts
  about seven. The thirty-two-line pattern reaches 128 faces and 384
  vertices, eight times the heart's.
- **The camera's sphere does not hold.** The reach peaks at 0.1287 m,
  6% over the 0.1211 m sphere. Every state at rest fits; the overflow
  comes early in a fold. Folding the flat sheet in half across its long
  side peaks at 0.1252 m a quarter of the way through, and ends at
  0.0750 m (**Measured**, by a one-off check of single folds). The heart,
  on a 2:1 sheet too, fits because its folds differ: the sphere is the
  widest reach of the page's five designs, the pencil's (**Code**:
  `docs/src/main.js`). With the camera's 10% margin, `FRAME_MARGIN`, the
  paper stays on screen but slides briefly under the room left for the
  toolbar, which suits it: the camera stays as it is (see
  [Which side moves](#2-which-side-moves)).
- **Crowding is worse**, up to every state but four of the thirty-two-line
  pattern's, which confirms picking a line with the pointer.
- A 1:2 sheet, stood upright, is the same sheet turned a quarter turn,
  and folds the same; which way up it starts is a matter of how it fills
  the screen, such as a phone held upright (**Derived**).

### A 90° fold in the engine as it stands

**Measured**, on the half lattice, at 55 random states 0 to 3 flat folds
deep: after one fold stopped at 90°, no fold of any kind was available
in any trial. Every lattice line crossing the paper crosses the standing
flap's reflected footprint too, and applyFold() refuses to move a
standing flap's faces. So with the engine as it is, a fold at any angle
short of flat is a **finishing fold**: it can be made at any time, from
any flat state, and ends the session but for Undo. The dart's wings are
exactly this case.

### Several standing folds

**Measured**: 200 walks per pattern and side rule, on the four first
patterns. Each walk makes 0 to 3 random flat folds, then stands one
random allowed fold at 90°, or as far as it can go, then a second. At
each stage every lattice line that crosses flat paper is tried both
ways, flat, under the rules in
[Angles](#7-angles-several-standing-folds-a-stepping-stone-to-the-fold-tree):
standing faces left out of "all layers", every standing flap's hinge
strictly on the held side, and a 3D sweep test sampled every 3°,
treating paper as having no thickness. Three side rules were tried:
the smaller side always moves; the side holding no standing flap's
hinge moves, the smaller when both are free; and that rule for flat
folds only, with a standing fold always moving the smaller side.

| Pattern | Flat: foldable lines | After one standing fold, smaller side: lines, no fold left | Side without a hinge: lines, no fold left | The same, flat folds only: lines, no fold left |
| --- | --- | --- | --- | --- |
| Square, half lattice with diagonals | 5.6 | 0.6, 93 of 200 | 0.8, 91 of 200 | 0.8, 88 of 200 |
| Square, quarter lattice | 4.1 | 0.4, 127 of 200 | 1.1, 56 of 200 | 1.1, 61 of 200 |
| 2:1, half lattice with diagonals | 10.9 | 2.4, 28 of 200 | 3.4, 20 of 200 | 3.4, 18 of 200 |
| 2:1, quarter lattice | 7.2 | 1.0, 63 of 200 | 2.5, 15 of 200 | 2.5, 18 of 200 |

What the table says:

- **Two standing folds is the practical limit.** After a second
  standing fold, no fold of any kind was left in every state but one,
  under every rule: 488 of 489 with the smaller side moving. Every line
  across the paper still flat either crosses a standing flap's hinge, or
  has a hinge on each side of it.
- **A box is out of reach**, and not only here (**Derived**). A second
  wall at right angles to the first must fold across the first wall's
  hinge. A real box folds its corners in as its walls rise, several
  creases moving at once, which no sequence of simple folds does, the
  fold tree as outlined included. Two parallel walls, a pair of wings,
  or a tent with a raised flap are what fit.
- **Moving the side without a hinge recovers folds.** With one fold
  standing, letting the larger side move when only the smaller holds a
  hinge raises the foldable lines by a third to nearly three times, and
  cuts the states with no fold left, on the quarter lattices to under
  half.
- **But standing the larger side up overflows the camera.** At rest,
  about the sheet's centre, every state stayed within the flat sheet's
  reach under the smaller-side rule and under the flat-folds-only rule.
  Letting a standing fold move the larger side reached 0.1591 m and
  0.1759 m on the 2:1 sheet, up to 45% beyond the camera's 0.1211 m
  sphere. The flat-folds-only rule keeps the gains and the reach.
- **Folds stop part-way against walls**, at 105° to 150°: with the side
  without a hinge moving, 0.2 to 1.0 options per state, the most on the
  2:1 sheet; with the smaller side always moving, almost never, since a
  small flap seldom reaches a wall. The ring's stop at contact will be
  met often enough to matter. A flap folding over a wall as tall as it
  stands from the fold line stops at 135°, as the geometry says it
  should. No fold was blocked before its first 15°.
- **Not measured**: the reach mid-fold with flaps standing, the reach as
  posed after the engine's centring slide, and paper thickness.

## An outline of the implementation

**Derived** throughout, unless marked. An exploration, not a plan: each
part names its options and a recommendation, for discussion.

### 1. A pattern is a lattice, and a fold is a lattice line through every layer

- A Sandbox pattern is data: the sheet's `aspect`, 1 or 2; a
  `spacingFraction`, the lattice spacing as a fraction of the sheet's short
  side; and whether the diagonals are printed. Cells are square: the
  diagonals need them, and they fit any sheet whose sides are a whole-number
  ratio, which A4's 1 : √2 is not. Its printed lines are the lattice lines
  that cross the flat sheet, drawn on both sides as today. Its foldable
  lines are every lattice line that paper crosses at the current state,
  found by clipping each face's placed polygon against the lines within the
  footprint's bounding box: tens of lines, cheap on a press.
- **The first patterns are four**: the half lattice with diagonals and
  the quarter lattice, on each of the square and 2:1 sheets. On the
  square they print eight lines and six, and last about seven folds and
  five; on the 2:1, fourteen and ten, lasting about ten and eight. The
  half lattice with diagonals folds the classic blintz and kite bases.
  Each sheet so has one pattern with diagonals and one without, to try
  the interface on both. The plain half lattice is over in two folds on
  the square, too soon to be a toy; the quarter lattice with diagonals,
  twenty lines and thirty-two, is crowded in nearly every state and
  reaches 128 faces, so it waits for the fold tree, where its length is
  worth more.
- **Every line folds either way.** Patterns are untyped, so a picked line
  always shows both Fold Buttons. One-way lines, as a crease pattern
  would print them, wait in the backlog:
  [One-way folds in Sandbox Mode](./backlog/20261114-one-way-sandbox-folds.md).
- A fold is a lattice line, a direction, `"all"` layers and a target
  angle of π. Its `from` and `to` are oriented so the smaller side
  moves, by comparing the clipped areas on each side; equal areas take
  the line's own orientation.
- Lattice lines are never saved, so they need no ids: a line is known
  on screen by its family and index, and a session records a fold by
  its oriented line, as a design's steps do. Only the exported design
  file carries an id, assigned by code at export, as
  [CLAUDE.md](../../CLAUDE.md#engineering-discipline) asks of anything
  that other things point at.

```json
{
  "id": "half-lattice-diagonals",
  "aspect": 1,
  "spacingFraction": 0.5,
  "diagonals": true,
  "colorId": "blue"
}
```

### 2. Which side moves

- **The smaller side moves**, by area, as measured. The paper keeps
  still under the player's eye, the footprint stays near the origin, and
  the camera stays fixed, as it is today.
- **Once a flap stands**, a flat fold moves the side that holds no
  standing flap's hinge, the smaller when both are free, so a raised
  wall does not refuse a fold that the other side could make. A standing
  fold still raises only the smaller side, which keeps the paper at rest
  within the flat sheet's reach; raising the larger side measured up to
  45% beyond the camera's sphere (see
  [Several standing folds](#several-standing-folds)).
- **The camera does not change.** On the square sheet every reach fits
  its 0.1211 m sphere. On the 2:1 sheet, the paper reaches up to 6%
  beyond it early in some folds, and so slides briefly under the room
  the frame margin leaves for the toolbar, then settles inside: a
  welcome effect, as if the paper passed beneath the controls (see
  [The same four patterns on a 2:1 sheet](#the-same-four-patterns-on-a-21-sheet)).
  The first plan's checks should assert that every state at rest fits
  the sphere, and that no reach mid-fold passes 0.1332 m, the sphere
  with its 1.1 margin, so the paper never leaves the canvas
  (**Derived**).
- The side under the pointer was the alternative: more direct, since the
  player points at the part to fold, but it brings back the drift and
  reach the smaller-side rule removes, so the camera would have to refit
  to each state, against the fixed camera's design, and the lattice
  would have to be generated around the footprint.

### 3. Picking a line with the pointer

- Since midpoint buttons crowd, the Sandbox picks a line by pointing at
  it: the pointer's ray meets the paper's plane, the nearest foldable
  lattice line within a named distance lights up along its crossing
  extent, and its two Fold Buttons, a mountain and a valley, appear at
  the pointer, or at the tap point on a touch screen. A click folds;
  moving away clears the pick.
- The ray comes from `Raycaster.setFromCamera()` (**Source**: r187
  `src/core/Raycaster.js` line 119) and meets the plane through
  `Ray.intersectPlane()` (**Source**: r187 `src/math/Ray.js` line 395).
  With flat folds only, the paper lies in its local XY plane, slid by the
  stage centre; the hit point in that plane, plus the slide, is a point
  of the folded plane, which the lattice is defined in. No raycast
  against the mesh is needed.
- The lit line is a two-vertex `Line` along the crossing extent, written
  on each pick and allocating nothing per frame.
- **The Fold Buttons are real `<button>`s** in a container over the
  canvas, which gives `cursor: pointer`, hover, focus rings, Tab and
  Enter, and `aria-label`s for free, as
  [CLAUDE.md](../../CLAUDE.md#standard-javascript-no-build) asks, and
  needs nothing vendored. They sit at the picked point, carried to the
  screen by the paper's `localToWorld()` (**Source**: r187
  `src/core/Object3D.js` line 670, which calls updateWorldMatrix()
  first) and `Vector3.project(camera)` (**Source**: r187
  `src/math/Vector3.js` line 499), which give normalised device
  coordinates; the canvas's CSS size gives pixels. Projecting after
  renderer.render() in the same frame uses the matrices that frame drew
  with.
- **Per-frame cost.** A DOM write allocates a string, which the
  per-frame rule forbids. Writes happen only on frames where the pose,
  spin, stretch or canvas size changed, which the stepper and the spin
  reset already report by returning true; at rest, nothing is written.
  During a fold, undo or unfold, the buttons fade out.
- **Mountain and valley as seen.** Whether the camera lies in front of
  or behind the paper's plane says which side faces it, and so which of
  the two folds is a valley as the player sees it: the one that lifts
  the moving side towards the camera. The buttons show only at rest, so
  the side cannot flip under them. When a spin brings the other side
  round, the two swap icons and colours, as the back's printed lines
  already swap dash patterns (**Code**: `docs/src/scene/fold-lines.js`).
  An icon-only button needs an accessible name, so their `aria-label`s,
  "Valley fold" and "Mountain fold", swap with them.
- **Colours: graphic buttons over photorealistic paper.** The paper is a
  `MeshLambertMaterial`, lit and shaded, whose grain texture multiplies
  each side's colour, and its back is an off-white, `PAPER_BACK_COLOR`,
  `0xf4f1ea` (**Code**: `docs/src/scene/paper.js`). So on screen the
  paper's colours are muted versions of its base colours, short of pure
  white, pure black and full saturation. The Fold Buttons take exactly
  those extremes, which is what sets them apart from the paper beneath
  them, whatever its colour:
  - On the coloured side, a brighter, lighter shade of the paper colour,
    more vivid than the lit paper, behind a pure black icon.
  - On the white side, a pure white background behind a brighter, deeper
    shade of the paper colour, more saturated than the paper.
  - Each of the five paper colours in `docs/src/scene/paper-colors.js`
    therefore gains two named shades, lighter and deeper, chosen by eye
    against the rendered paper; a Decision for the plan.
  - Darkening the back by 5 or 10% widens the gap between the paper's
    off-white and the buttons' pure white. It changes `PAPER_BACK_COLOR`,
    and with it the contrast of the back's printed lines, which
    `paper-colors.js` records.
  - WCAG's non-text contrast of 3:1 (**Source**:
    [WCAG 2.2, 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html))
    is the floor for an icon against its button. Black on a light, vivid
    shade clears it easily. A deep shade on white needs checking per
    colour: green and orange, as they are, measure only 2.47:1 and 2.43:1
    against today's off-white (**Code**: `paper-colors.js`), so their
    deep shades need depth as well as saturation.
- **Click or drag.** A click, a press that does not move, folds the
  default angle, flat in Sandbox Mode. A drag that starts on a Fold Button
  sets the angle instead, and does not spin the paper, since the button
  captures the pointer. A ring around the button, an SVG circle whose dash
  length shows the angle from 0 to 180°, follows the drag, snapping to 15°
  steps; how far a pixel turns it is a named constant. Snapping keeps
  every angle a whole number of twelfths of a half turn, so the export can
  write it as a fraction, such as `"1/2"` for 90°, as it writes
  coordinates. On release, the stepper animates the fold to the chosen
  angle; a drag back to 0 cancels. With the engine as it stands, any angle
  short of flat is a finishing fold (see
  [Angles](#7-angles-several-standing-folds-a-stepping-stone-to-the-fold-tree)), which the
  ring could show by a change of colour below 180°.
- **The ghost**, left out of the first Sandbox plan, and added later if
  the ring alone proves hard to judge by: a second, translucent mesh
  sharing the paper's geometry index, with its own position buffer, posed
  at the drag angle. It is allocated when a drag starts and written only
  when the angle changes, so nothing is allocated per frame.
- **Dragging needs an alternative.** WCAG 2.2's Dragging Movements, at
  level AA, asks that anything done by dragging can be done with a
  single pointer without dragging (**Source**:
  [WCAG 2.2, 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)).
  The click covers the default angle; for other angles, a tap on the
  ring could set it. A Decision for the plan.
- Keyboard: while the canvas has focus, the arrow keys cycle the
  foldable lines, and Tab reaches their Fold Buttons, where Enter or
  Space folds and the arrow keys step the ring. Escape clears the pick
  before it hides the toolbar.
- The pick must not fight the drag that spins the paper: a press that
  moves is a drag, a press that does not is a pick, which the pointer
  capture already distinguishes.

### 4. The sandbox sheet, Undo, Redo and Unfold

- The paper in Sandbox Mode shows a **sandbox sheet**: the pattern's flat
  sheet cut along the session's path, every fold made so far, in order,
  with the undone tail kept for Redo. It has the same shape as any sheet,
  so paper.js and pose.js render it unchanged.
- The sequence position along the sandbox sheet is the number of folds
  done. **Undo** is the position less one, at `UNFOLD_SECONDS`; **Redo**
  is the position plus one, at `FOLD_SECONDS`; **Unfold** is position 0.
  All three are the stepper's existing moves. A fold at position *k*
  drops the undone tail, appends the fold, recuts the sandbox sheet,
  swaps it in with paper.setSheet() at rest, and sets the target to
  *k* + 1. The swap is invisible: the new sheet posed at *k* puts every
  vertex where the old one did, since both are cut along the same *k*
  folds, and only the new fold's creases subdivide it further.
- paper.setSheet() today also redraws both fold-line canvases and uploads
  two 2,048 px textures. On a sandbox sheet swap the printed pattern is
  unchanged, so the geometry swap and the line redraw should be
  separable: a Decision for the plan, with the cost measured.
- Allocation happens on the press, not per frame, as a design change
  does today. The old geometry is disposed of, as setSheet() does.
- The printed pattern is the lattice's lines on the flat sheet, untyped,
  so drawFoldLines() needs a plain style beside its two dash patterns.
- **A line shows its direction only where the direction is fixed.**
  Presentation Mode keeps its Yoshizawa–Randlett dashes, since a design
  fixes every fold's direction; Sandbox lines are plain, since the
  player chooses. The dash patterns live on in the Fold Buttons' icons.
  Gameplay Mode applies the same rule, by whether it lets the player
  choose a direction
  ([its first open question](./14-gameplay-mode-research.md#open-questions)).
- The engine work: applyFold() exported over a face list; a builder that
  turns a face list and a fold list into the sheet shape that paper.js
  and pose.js already consume, so a sheet can be cut from any fold list;
  and the crossing extent of a line over a face list. cutSheet(design)
  stays as a thin wrapper, so Presentation Mode changes nothing.

### 5. The stepper walks a sheet, not a design

- stepSequence() reads the finished position from
  `designs[state.designId].steps.length`, and `main.js` keys sheets by
  design id. A sandbox sheet belongs to no design, so the state should
  name a **sheet**, each sheet carrying its design's or pattern's id for
  the aspect, start pose and lean lookups, and its own
  `finishedPosition`: the step count for a design's sheet, and none for
  a sandbox sheet, whose lines therefore never fade out.

### 6. Export as a design

- The session's fold list, with each fold's oriented `from` and `to`,
  its type and its angle, is a design's `steps` in the view frame, since
  the sheet starts front up with no roll and never turns over. The
  Export button writes it out as a **JSON design file**, the app's
  export format, which the app can load back as a design.
- **Named fractions and notes survive in JSON.** Lattice points are exact
  fractions of the sheet, so a coordinate can be written as a fraction of
  the sheet's width or height, such as `["1/4", "-1/2"]`, rather than in
  metres, `[0.0375, -0.075]`; and the design and each fold can carry an
  optional note, in place of the comments a design module has. That keeps
  the named tuning numbers
  [CLAUDE.md](../../CLAUDE.md#engineering-discipline) asks for. The exact
  encoding is a Decision for the plan.
- A design file also names its format version, its `aspect` and
  `colorId`, and an `id` assigned by code at export, never derived from
  its content or name, as CLAUDE.md asks of anything that other things
  point at.
- **Loading.** A design file is a static file under `docs/`, served as
  is. The app reads it through a JSON module import,
  `import design from "./x.json" with { type: "json" }`, Baseline in
  every major browser since April 2025: Chrome 123, Firefox 138, and
  Safari 17.2 or 17.4, as sources differ (**Source**:
  [web.dev](https://web.dev/blog/json-imports-baseline-newly-available)),
  or through fetch(). A small converter, pure and checkable in Node, then
  turns it into the frozen design object that a design module builds
  today, resolving the fractions with sheetSize(). A static import that
  fails stops every module that imports it, so the whole page if
  `main.js` does; fetch() can fail one design alone. Which route, and
  where design files live, are Decisions for the plan.
- Hand-written design modules stay as they are. A JSON design joins the
  list and gets a radio, as a design module does today.
- The text goes to the clipboard through `navigator.clipboard.writeText()`,
  which needs a secure context (**Source**:
  [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText));
  `localhost` and GitHub Pages over `https` both are. A `<dialog>`
  showing the text, selectable, is the fallback and the place to say
  what to do with it.
- JSON is also the natural base for the full Sandbox Mode's saving and
  sharing, which can extend this format rather than start another.
- A design exported this way folds every layer at every step, so it
  plays back in Presentation Mode as recorded, and in Gameplay Mode becomes a
  maze whose traps can be measured as the
  [Gameplay Mode research](./14-gameplay-mode-research.md) measures the page's
  five designs'.

### 7. Angles: several standing folds, a stepping stone to the fold tree

- **In the first Sandbox plan:** a finishing fold at any angle, since the
  engine already poses one and refuses what would follow it. Dragging a
  Fold Button chooses the angle, snapping to 15° steps (see
  [Picking a line](#3-picking-a-line-with-the-pointer)); after a standing
  fold, no line can be picked and only Undo remains. The export records
  the angle as `targetRadians`, which createFold() takes.
- **How the engine keeps paper from passing through paper: it does not
  check.** applyFold() has no intersection test. It refuses only a fold
  that moves nothing, a fold that moves faces an earlier fold left
  standing, and a fold that leaves a T-junction (**Code**:
  `docs/src/fold/engine.js`). The theory makes the check part of a fold:
  Arkin et al. define a simple fold, a turn of paper by 180° about one
  line, and call it invalid "if the paper self-intersects during this
  rotation" (**Source**:
  [When Can You Fold a Map?](https://ar5iv.labs.arxiv.org/html/cs/0011026),
  Section 2).
- **Flat Sandbox folds never need the check** (**Derived**). A Sandbox
  fold takes every layer, so it moves everything on one side of its line
  and nothing on the other: a rigid turn of a half-plane of flat paper
  about its edge. The two sides meet only along the line, so while all
  the paper lies flat, the moving half sweeps empty space and lands on
  top or underneath, where the engine stacks it. Presentation Mode's
  one-flap folds have no such guarantee; their designs are written to be
  valid.
- **Standing flaps make collisions real** (**Derived**). Once a flap
  stands, a later fold's moving half can sweep into it: a flap standing
  up on the held side blocks a valley fold that would land on top within
  its reach. A flap standing up on the moving side would point down into
  the stack after a valley fold. And a line can cross a standing flap,
  which no fold in the paper's plane could crease. Checking for this
  means testing the moving faces, turned through the fold's angles,
  against the standing faces in 3D: tens of faces, cheap on a press, but
  new code, which must tolerate the touching layers a flat stack is made
  of.
- **Several standing folds, as a stepping stone to the fold tree.**
  Sandbox Mode allows several standing folds, mixed with flat ones. A
  fold, flat or standing, is allowed if every standing flap's hinge lies
  on its held side, so that it neither moves nor splits a standing flap,
  and if its turn sweeps into no standing flap. A flat fold moves the side
  holding no hinge, and a standing fold the smaller side (see
  [Which side moves](#2-which-side-moves)). The engine change is moderate:
  "all layers" leaves standing faces out, so they stay with their hinge;
  the refusal of a fold that moves them stays; and a 3D sweep test is
  added. Measured, it allows two standing folds, such as a pair of wings
  or two parallel walls, with flat folds before and between them; a third
  almost never fits, and a box never does (see
  [Several standing folds](#several-standing-folds)). Finishing folds
  only, the engine as it stands, would have allowed one: a tent or a
  raised flap, never two wings. The modest gain is why this scope is a
  stepping stone, not a destination.
- **The fold tree is the goal**, and this scope is built to lead to it.
  The fold tree lets a later fold carry standing flaps with it, as an
  accordion or a staircase of alternating angles does; that is where most
  of the creative freedom lies. Everything this scope adds carries over
  unchanged: the sweep test, the limits shown by the Fold Buttons and the
  ring, the drag and its snapping, and the export of each fold's angle.
  The fold tree replaces only what lies beneath them, the 2D placements in
  one folded plane, and lifts the rule that a standing flap's hinge must
  stay on the held side.
- **Making a limit feel natural.** The Fold Buttons show what the paper
  allows: a line that cannot fold either way shows none, and a line
  blocked one way shows only its free button, of the same design as a
  one-way fold. A drag stops where paper would touch paper: the ring
  will not pass the first contact, so the fold goes as far as it can, as
  a real fold stops against a standing wall. Undo is the way back, as
  always.
- **Next, the fold tree:** folds at an angle that the player keeps
  folding after. The engine's placements are 2D reflections in one
  folded plane, which is why a standing flap cannot be moved again: its
  placement no longer says where it is. The general model is a **fold
  tree**: each face a rigid body with a 3D pose, each fold a rotation
  about a hinge line in a face's plane by any angle up to π, carrying
  every face attached beyond the hinge; "all layers" then means the
  faces coplanar with the hinge face that cross the hinge line, and the
  stacking and thickness logic applies within each coplanar stack.
  Posing becomes "transform each face by its pose, interpolating the
  fold under way", simpler than today's writePaperPositions(); cutting
  becomes harder, since a line in one face's plane must be tested
  against faces in every plane. Folds would then be defined on the
  sheet, a line in sheet coordinates carried by a face, rather than in
  one folded plane, which the design format would have to express. The
  sweep test above would carry over. This is a new engine, and needs its
  own research; the dart's wings are its special case, standing folds
  last.

### 8. The toolbar

- A mode radio group, Presentation Mode and Sandbox Mode, in the same
  style as the design radios, keyboard-driven as they are. Gameplay Mode is
  added by its own plan, or present and disabled until then: a Decision
  for the plan.
- In Sandbox Mode the design radios give way to pattern radios, the Fold lines
  checkbox is forced on and disabled, the swatches work as before, and a sandbox
  bar holds Undo, Redo, Unfold and Export. Undo and Unfold disable at position
  0, Redo with no undone tail.
- Shortcuts: Ctrl+Z or Cmd+Z undoes; Ctrl+Y, Ctrl+Shift+Z or Cmd+Shift+Z
  redoes, with `preventDefault()` so the browser's own undo stays out of
  it. The page has no text field to compete with.
- Switching to Presentation Mode unfolds the sandbox sheet, swaps to the
  current design's sheet flat and folds it up, all with the stepper as it
  is.

### 9. The plans

Five plans, drafted on 2026-11-14, each ending in something the Lead
Developer can QA in the browser; the seam between each pair is where
one could be accepted and the next rejected. The research's "Sandbox
Mode folds" became two plans, 17 and 18, since one gate could not hold
both the folding and the drag to an angle.

1. [Plan 15, Lattice patterns and the sandbox sheet, in pure maths](../done/15-lattice-engine.md):
   the four patterns as data, the lattice's printed and foldable lines
   with the smaller-side rule, and a session cut as a sheet, with Agent
   QA pinning every design's sheet by hash. Visible proof: Presentation
   Mode is unchanged.
2. [Plan 16, Sandbox Mode shows a printed lattice](../done/16-sandbox-mode.md):
   the mode and pattern radios, plain lines on both sides, and the
   stepper walking a sheet rather than a design. Visible proof: choosing
   Sandbox unfolds the design and prints the lattice.
3. [Plan 17, Sandbox Mode folds](./17-sandbox-folds.md): picking a
   line by click or tap, the icon Fold Buttons coloured by the facing
   side, a click folding flat with an invisible sheet swap, Undo, Redo,
   Unfold and the shortcuts. Visible proof: the blintz by hand.
4. [Plan 18, Dragging a Fold Button to an angle](./18-fold-angle.md):
   the drag, its ring snapping to 15°, a finishing fold left standing,
   and the keyboard and tap alternatives. Visible proof: a corner stood
   at 90°.
5. [Plan 19, Export a Sandbox session as a JSON design](./19-export-design.md):
   the JSON design format, its reader and writer, the Export dialog,
   and the blintz round-tripped into a radio. Visible proof: a design
   folded in the Sandbox plays in Presentation Mode.
6. [Plan 20, Several standing folds](./20-standing-folds.md): standing
   faces left out of "all layers", the hinge rule, the side rule once a
   flap stands, the 3D sweep test, and the limits shown by the Fold
   Buttons and the ring. Visible proof: two walls, and a fold that
   stops against one.
7. Then Gameplay Mode, as the
   [Gameplay Mode research](./14-gameplay-mode-research.md) outlines, on
   top of 15 to 17; and the fold tree, after its own research, building
   on 20.

## Open questions

None: every question this research raised is settled above.

## Sources

- Three.js r187 unminified source, read on 2026-11-11:
  [`src/core/Raycaster.js`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/core/Raycaster.js)
  (setFromCamera(), line 119),
  [`src/math/Ray.js`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/math/Ray.js)
  (intersectPlane(), line 395),
  [`src/math/Vector3.js`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/math/Vector3.js)
  (project(), line 499) and
  [`src/core/Object3D.js`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/core/Object3D.js)
  (localToWorld(), line 670, which calls updateWorldMatrix() first).
- [web.dev: JSON module scripts are now Baseline Newly available](https://web.dev/blog/json-imports-baseline-newly-available),
  for the JSON module import's browser support.
- [WCAG 2.2, Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
  and
  [Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html),
  for the Fold Buttons' colours and the drag's alternative.
- Arkin, Bender, Demaine, Demaine, Mitchell, Sethia and Skiena,
  [When Can You Fold a Map?](https://ar5iv.labs.arxiv.org/html/cs/0011026),
  Computational Geometry 29, 2004, Section 2, for simple folds and their
  self-intersection rule.
- [MDN: Clipboard.writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText),
  for the secure-context requirement.
- [WCAG 2.2, Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  the 24 px the swatches already follow, behind the "crowded" column.

## Decision record

The ten questions this research put to the Lead Developer, from
2026-11-12 to 2026-11-14, one at a time: each one's background as it
stood, the options offered, the recommendation, and the answer. The
rulings are already folded into the sections above; this record keeps
the reasoning beside them.

| Question | Date | Answer |
| --- | --- | --- |
| [Q1. Export format](#q1-export-format) | 2026-11-12 | B: a JSON design file |
| [Q2. The direction buttons](#q2-the-direction-buttons) | 2026-11-12 | The Lead Developer's own design |
| [Q3. Sheet shapes](#q3-sheet-shapes) | 2026-11-14 | Square and 2:1, after measuring 2:1 |
| [Q4. The first patterns](#q4-the-first-patterns) | 2026-11-14 | A: two patterns per sheet |
| [Q5. One-way Sandbox folds](#q5-one-way-sandbox-folds) | 2026-11-14 | A: not now, to the backlog |
| [Q6. Which side moves](#q6-which-side-moves) | 2026-11-14 | B: smaller side, camera unchanged |
| [Q7. Dragging to an angle](#q7-dragging-to-an-angle) | 2026-11-14 | B: in the first Sandbox folding plan |
| [Q8. How far standing folds go](#q8-how-far-standing-folds-go) | 2026-11-14 | B: several, a stepping stone to the fold tree |
| [Q9. Which side moves once a flap stands](#q9-which-side-moves-once-a-flap-stands) | 2026-11-14 | C: hingeless side for flat folds only |
| [Q10. Lines in Presentation Mode](#q10-lines-in-presentation-mode) | 2026-11-14 | A: Presentation Mode keeps its dashes |

### Q1. Export format

**Asked**: should a Sandbox session export as JavaScript source or as
JSON?

**Background.** Every design is a hand-written JS module, such as
`docs/src/designs/mount-fuji.js`, whose coordinates are named fractions
of the sheet with comments, and whose steps are createFold() calls; a
new design is its file, a line in `list.js` and a radio in
`index.html`. The draft recommended source, saying JSON "would need a
loader". That was half out of date: a JSON module import,
`with { type: "json" }`, has been Baseline in every major browser since
April 2025, though not yet widely available, so a failed import on an
older browser would stop the page. JSON would still need a converter
into a design object, and holds no comments or named fractions as
such. The full Sandbox's saving and sharing will want a data format.

**Options.** A: source only, pasted in as a module. B: JSON only, with
a converter in the app. C: both.

**Recommended**: A, matching how designs are written today.

**Answer**: B. JSON is a proper export format, and it can carry named
fractions and comments with a little creativity.

### Q2. The direction buttons

**Asked**: should the two buttons that choose a fold's direction read
"towards me" and "away from me", or "mountain" and "valley"?

**Background.** The brief asked for a mountain and a valley button; the
draft labelled them "towards me" and "away from me", because a drag
spins the paper with no limit on the yaw, and a valley seen from the
front is a mountain seen from the back. The app already draws the
back's lines as the opposite type, so its mountain and valley already
mean "as seen from where you look".

**Options.** A: "towards me" and "away from me". B: mountain and
valley in the front's terms. C: mountain and valley as the player sees
the paper, with the dash patterns on the buttons.

**Recommended**: C.

**Answer**: the Lead Developer's own design, close to C. Fold Buttons
are circles with icons, no words: each combines its fold's dash
pattern with a chevron for a mountain or a V for a valley. When a spin
brings the other side round, the two buttons swap designs, so each
stays true to the camera. Their colours are graphic, where the paper
is photorealistic: on the coloured side, a brighter, lighter shade of
the paper's colour behind a 100% black icon; on the white side,
perhaps darkened by 5 or 10%, a 100% white background behind a
brighter, deeper shade of the paper's colour. A fold allowed only one
way shows its one button, of the same design. A click folds the
fold's default angle; a drag chooses the angle, with a circular
progress ring and perhaps a translucent ghost, and on release the
paper animates to it.

### Q3. Sheet shapes

**Asked**: should Sandbox patterns start on square sheets only?

**Background.** A pattern records its sheet's aspect, and every
measurement so far was on a square. A lattice without diagonals is
closed under its own reflections on any sheet; diagonals need square
cells, which fit any sheet whose sides are a whole-number ratio, such
as 2:1, but never A4's 1 : √2.

**Options.** A: square sheets only, for now. B: square cells on any
whole-number ratio. C: any sheet, with diagonals only where the cells
come out square.

**Recommended**: A, with an offer to measure a 2:1 sheet first.

**Answer**: measure 2:1, then start with square and 2:1 sheets: two
aspect ratios usefully exercise the interface, and other whole-number
ratios are not needed for now. The measurement is in
[The same four patterns on a 2:1 sheet](#the-same-four-patterns-on-a-21-sheet).

### Q4. The first patterns

**Asked**: which patterns should the first Sandbox plan offer?

**Background.** Two lattice spacings, with or without diagonals, on
two sheets, make eight patterns. The plain half lattice is over in two
folds on the square; the half lattice with diagonals folds the classic
blintz and kite bases; the quarter lattice with diagonals lasts
longest, but is crowded in nearly every state and reaches 128 faces,
eight times the heart's.

**Options.** A: the half lattice with diagonals and the quarter
lattice, on each sheet. B: the half lattice with diagonals only. C:
all eight.

**Recommended**: A.

**Answer**: A.

### Q5. One-way Sandbox folds

**Asked**: should some Sandbox folds ever be allowed only one way?

**Background.** Every Sandbox line is untyped and folds either way.
The engine never forces a direction: it stacks moved paper above for a
valley and below for a mountain, and checks no intersection. One-way
lines would come from a pattern that types some lines, as a crease
pattern does: guided folding, without a score.

**Options.** A: not for now, as a backlog note. B: yes, in the first
Sandbox plan. C: yes, alongside Gameplay Mode.

**Recommended**: A.

**Answer**: A. The idea waits in
[One-way folds in Sandbox Mode](./backlog/20261114-one-way-sandbox-folds.md).

### Q6. Which side moves

**Asked**: when a Sandbox fold is made, which side of the line moves,
and how does the camera cope with the 2:1 sheet?

**Background.** The camera is fitted once, at load, to the widest
reach of any design, 0.1211 m, so that it never moves. With the
smaller side moving, the square sheet stays inside that sphere, but
the 2:1 sheet reaches 0.1287 m early in some folds, 6% beyond it,
within the 10% frame margin left for the toolbar. With an arbitrary
side moving, the paper drifts up to 15 spacings and reaches 0.1856 m.

**Options.** A: smaller side, one camera fitted a little wider for
both modes, so every design shows about 6% smaller. B: smaller side,
camera unchanged, the paper sliding briefly under the toolbar's room.
C: the side under the pointer, with a camera refitted after each fold.

**Recommended**: A.

**Answer**: B. The paper briefly sliding under the toolbar is welcome.

### Q7. Dragging to an angle

**Asked**: when is dragging a Fold Button to an angle built, and does
the angle snap?

**Background.** With the engine as it stands, a fold short of flat is
a finishing fold: after it, nothing else can be folded. The drag needs
the ring, pointer handling that tells it from a spin, a non-drag
alternative for WCAG 2.2's Dragging Movements, and the angle in the
export; the ghost is optional. Snapping keeps every angle a fraction
of a half turn, which the JSON export can write as named fractions.

**Options.** A: its own later plan, snapping to 15°, the ghost tried
there. B: in the first Sandbox folding plan, snapping to 15°, without
the ghost. C: hold until the fold tree is researched.

**Recommended**: A, to land flat folding first.

**Answer**: B, with a wish to tackle paper intersection as soon as
possible: how the engine prevents it, how to make it feel natural,
whether it adds creative freedom, and whether standing folds should be
finishing folds or allowed on any fold. The answers are in
[Angles](#7-angles-several-standing-folds-a-stepping-stone-to-the-fold-tree).

### Q8. How far standing folds go

**Asked**: finishing folds only, several standing folds, or the fold
tree?

**Background.** The engine checks no intersection; flat Sandbox folds
need none, since an all-layers fold turns a half-plane of flat paper
rigidly about its edge. Standing flaps make collisions real, so any
scope beyond finishing folds needs a 3D sweep test. Finishing folds
allow one standing fold per session; several standing folds that no
later fold moves need a moderate engine change; the fold tree, which
lets later folds carry standing flaps, is a new engine.

**Options.** A: finishing folds only. B: several standing folds, with
the hinge rule and a sweep test. C: the fold tree.

**Recommended**: B, with an offer to count how many folds remain
after one or two standing folds.

**Answer**: B, as a stepping stone to C, which the plans and docs must
make clear; and count the folds. The count, in
[Several standing folds](#several-standing-folds), found two standing
folds the practical limit and a box out of reach, so the scope's own
gain is modest, and the fold tree is where most of the freedom lies.

### Q9. Which side moves once a flap stands

**Asked**: once a flap stands, which side of a fold line moves?

**Background.** Under the smaller-side rule, the smaller side often
holds a standing flap's hinge, so a fold is refused that the other
side could make. Moving the side without a hinge raised the foldable
lines by a third to nearly three times; but letting a standing fold
raise the larger side reached up to 0.1759 m at rest on the 2:1 sheet,
45% beyond the camera's sphere.

**Options.** A: always the smaller side. B: the side holding no
hinge, for every fold. C: that for flat folds only, with a standing
fold always raising the smaller side.

**Recommended**: C, which kept B's gains and the reach.

**Answer**: C.

### Q10. Lines in Presentation Mode

**Asked**: should Presentation Mode switch to plain lines too?

**Background.** Presentation Mode prints dashed valleys and
dash-dot-dot mountains, after Yoshizawa and Randlett. Sandbox lines
must be plain, since their direction is the player's choice, so the
plain style is built whatever the answer. The dash patterns also live
on in the Fold Buttons' icons. Whether Gameplay Mode prints plain
lines is its own first open question.

**Options.** A: Presentation Mode keeps its dashes; a line shows its
direction only where the direction is fixed. B: plain lines
everywhere. C: hold until Gameplay Mode's question is ruled.

**Recommended**: A.

**Answer**: A.

## Audit

- **2026-11-11T14:14:18Z** — **drafted**: the brief recorded and the
  case for building the Sandbox before Gameplay Mode made; four lattice
  patterns measured under the smaller-side rule, and a 90° fold under
  the engine as it stands; an outline of lattice patterns, pointer
  picking, the sandbox sheet, export as source and angles; six open
  questions.
- **2026-11-12T17:05:06Z** — **ruled**: a Sandbox export is a JSON design
  file, by the Lead Developer, who noted that JSON can carry named
  fractions and comments; the fraction coordinates, notes, assigned id,
  format version, and import or fetch() loading were proposed by the
  agent. Open question 4, export as source or JSON, removed; 5 and 6
  renumbered.
- **2026-11-12T17:31:09Z** — **ruled**: Fold Buttons are circular, icon-only
  buttons (dash patterns with a chevron or a V), named as the player sees the
  paper and swapping designs when the other side faces the camera, coloured by
  the side facing the camera; one-way folds use the same design; a click folds
  the default angle and a drag chooses another, with a ring and perhaps a ghost;
  all by the Lead Developer, replacing "towards me" and "away from me" and the
  separate angle control. The accessible names, contrast floor, ring as SVG,
  ghost mesh and dragging alternative were added by the agent. Open question 4
  reworded to dragging to an angle; 6, one-way Sandbox folds, added.
- **2026-11-12T17:39:21Z** — **clarified**: the Fold Buttons' colours are
  graphic, taking the colour space's extremes (pure black, pure white,
  shades more vivid than the paper), against the photorealistic, lit and
  grained paper, which never reaches them; by the Lead Developer.
- **2026-11-14T11:11:24Z** — **ruled**: Basic Sandbox Mode starts with
  square and 2:1 sheets, with square cells, by the Lead Developer; the
  script now takes an aspect; the four patterns measured on a 2:1 sheet,
  finding a mid-fold reach 6% over the camera's sphere; open questions 1 and
  2 extended to the 2:1 sheet and its camera.
- **2026-11-14T11:17:57Z** — **ruled**: the first patterns are the half
  lattice with diagonals and the quarter lattice, on each of the square and
  2:1 sheets, by the Lead Developer. Open question 1 removed; the rest
  renumbered.
- **2026-11-14T12:14:25Z** — **ruled**: every Sandbox line folds either way,
  and one-way folds go to the backlog, by the Lead Developer. Open question
  5 removed.
- **2026-11-14T12:33:58Z** — **ruled**: the smaller side moves and the
  camera stays as it is, the 2:1 sheet briefly sliding under the toolbar's
  room mid-fold, by the Lead Developer; the reach checks for the first plan
  proposed by the agent. Open question 1 removed; the rest renumbered.
- **2026-11-14T12:54:27Z** — **ruled**: dragging a Fold Button to an angle
  joins the first Sandbox plan, snapping to 15° steps, without the ghost, by
  the Lead Developer, who asked how paper is kept from passing through
  paper. Added: the engine checks nothing, flat Sandbox folds need no check,
  standing flaps make collisions real, three scopes for standing folds, and
  how limits could feel natural. Open questions 2 and 3 merged into 2, how
  far standing folds go; Plans 2 and 4 rewritten.
- **2026-11-14T13:05:37Z** — **ruled**: Sandbox Mode allows several standing
  folds that no later fold moves, with a 3D sweep test, as a stepping stone
  to the fold tree, by the Lead Developer, who asked that the stepping stone
  be made clear. Section 7 renamed, Plans 4 and 5 rewritten, open question 2
  removed.
- **2026-11-14T13:10:16Z** — **measured**: several standing folds on the
  four first patterns under three side rules, by
  `tmp-sandbox-mode-standing.mjs`; two standing folds found to be the
  practical limit, and a box out of reach, correcting the earlier claim of
  trays and boxes; open question 2, which side moves once a flap stands,
  added.
- **2026-11-14T13:18:14Z** — **ruled**: once a flap stands, a flat fold
  moves the side holding no standing flap's hinge, the smaller when both are
  free, and a standing fold always raises the smaller side, by the Lead
  Developer. Open question 2 removed.
- **2026-11-14T13:24:29Z** — **ruled**: a line shows its direction only
  where the direction is fixed, so Presentation Mode keeps its dashes and
  Sandbox lines are plain, by the Lead Developer. The last open question
  removed; none remain.
- **2026-11-14T13:37:05Z** — **recorded**: the decision record added, with
  each of the ten questions' background, options, recommendation and answer.
- **2026-11-14T14:05:33Z** — **planned**: Plans 15 to 20 drafted from this
  research; section 9 links them, the sandbox folding split into Plans 17
  and 18; the line-id bullet reworded, since lattice lines are never saved.
