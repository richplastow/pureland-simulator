---
title: Sandbox Mode shows a printed lattice
description: Adds the mode and pattern radios, prints a pattern's lattice as plain lines on both sides, and makes the stepper walk a sheet rather than a design, so the paper can switch between a design and a pattern.
type: plan
---

## Context

- The second of the five Basic Sandbox Mode plans, after
  [Plan 15](./15-lattice-engine.md), whose patterns and printed lines it
  puts on the page, and before [Plan 17](./17-sandbox-folds.md), which
  folds them. It delivers the mode itself: a Presentation Mode and
  Sandbox Mode radio pair, pattern radios in place of the design radios,
  the lattice printed as plain lines on both sides of the sheet, and the
  stretch, turn and colour fade between a design and a pattern, all
  with the stepper as it is.
- It implements the research's
  [toolbar](./13-sandbox-mode-research.md#8-the-toolbar),
  [sandbox sheet](./13-sandbox-mode-research.md#4-the-sandbox-sheet-undo-redo-and-unfold)
  (the printing, not yet the folding) and
  [the stepper walks a sheet](./13-sandbox-mode-research.md#5-the-stepper-walks-a-sheet-not-a-design),
  and the ruling that a line shows its direction only where the
  direction is fixed, so Presentation Mode keeps its dashes.
- Needed because nothing in the app yet knows a mode, and the stepper
  and the pose writers read a design by id, which a pattern is not.
- Browser behaviour it rests on: the
  [`hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden)
  attribute, and
  [`CanvasRenderingContext2D.setLineDash()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash),
  whose empty array draws a solid line.

## Decisions

1. **The stepper and the pose writers read a sheet, not a design.**
   The sequence state's and target's `designId` become `sheetId`,
   naming an entry in `main.js`'s `sheets` map, and cutSheet() gives
   every sheet what the per-frame path read from the design:
   `aspect`, `finishedPosition` (the design's step count),
   `leanRadians` (as leanOf() reads it) and `start` (as startOf()
   reads it). stepSequence(), writeStretchScale(), writeStartPose(),
   writeLean() and sharesSheet() take `sheets` in place of `designs`;
   writeStretchScale() reads `widthMeters` and `heightMeters` directly.
   The `designs` map stays in `main.js` for a design's `colorId` at
   takeover, and design-radios.js's targets name a `sheetId`.
   - A sandbox sheet, from cutSession(), has `finishedPosition: null`:
     it is never finished, so its lines never fade out at rest, and
     `isFinished` in stepSequence() is false for it.
   - A pattern's sheet carries the pattern's `aspect`, the default
     start and a lean of 0, so a design's sheet and a pattern's stretch
     and turn between each other through the code that stretches
     between two designs today.

   ```json
   {
     "sheetId": "square-quarter",
     "direction": 0,
     "linesFade": 0,
     "linesVisibility": 1,
     "position": 0,
     "stretchFromId": "pencil",
     "stretchProgress": 1
   }
   ```

2. **Every pattern's flat sheet is cut once at load**, into `sheets`
   under the pattern's id beside the designs' sheets, through
   cutSession() with an empty session. The paper swaps sheets when
   `sheets[state.sheetId]` is no longer the object it shows, by
   identity rather than by id, so that Plan 17 can replace a pattern's
   sheet on every fold under the same id.
3. **A sheet says what to print.** cutSheet() adds `printedLines` to a
   sheet, the same array as its `creaseLines`; cutSession() sets it to
   printedLines(pattern) from Plan 15, each line typed `"plain"`.
   drawFoldLines() draws `printedLines`, and gives `"plain"` a solid
   stroke of the same width and colour as the dashes, with
   `setLineDash([])`. A plain line is the same on both sides.
4. **The mode is a radio group**, `name="mode"`, first in the toolbar,
   with the values `presentation` and `sandbox` and the labels
   "Presentation" and "Sandbox", drawn and keyboard-driven exactly as
   the design radios are: the CSS rules that draw `.designs` move to a
   shared class, `.choices`, which the mode, design and pattern groups
   all carry. Presentation Mode is checked at load whatever the
   browser restored, as the first design is. Gameplay Mode has no
   radio until its own plan adds one: a disabled radio would promise a
   mode the page does not have.
5. **The pattern radios**, `name="pattern"`, in a `.patterns` group
   after the mode group, one per pattern in `PATTERNS`'s order, with
   the labels "Square ½", "Square ¼", "Oblong ½" and "Oblong ¼" (open
   to rewording). In Sandbox Mode the `.designs` group is `hidden` and
   `.patterns` shown; in Presentation Mode the reverse. `hidden` takes
   a group out of keyboard reach as well as off the screen, which is
   right: its radios choose nothing in the other mode. The first
   pattern is checked at load.
6. **Choosing a mode or a pattern sets the target**, as choosing a
   design does: Sandbox Mode targets the checked pattern's sheet at
   position 0, so the stepper unfolds the design, fades its lines out,
   stretches and turns the flat sheet to the pattern's shape and the
   front, fades the pattern's colour in and its lines in, and rests;
   Presentation Mode targets the checked design's finished position,
   the reverse. A pattern's `colorId` applies as a design's does, when
   the pattern takes over the flat sheet.
7. **"Fold lines" is forced on in Sandbox Mode**: the checkbox is
   checked and disabled while the mode is Sandbox, and the target's
   `linesOn` is true whatever it says; on return to Presentation Mode
   the checkbox is enabled again with the state it had, and governs the
   lines as before.
8. **The hidden toolbar is no longer called a presentation mode.** The
   comments in `controls-toggle.js`, `main.js` and `main.css` that say
   "presentation mode" say "the hidden toolbar", so the term
   Presentation Mode means one thing. Escape behaves as it does.
9. **The canvas's label covers both modes:** "A sheet of origami
   paper, which folds into designs or along a printed grid, and turns
   when dragged".
10. **The geometry's bounding sphere keeps the designs' radius.** The
    2:1 patterns reach 6% beyond it early in some folds; the sphere's
    centre, the origin, is always on screen, so the renderer never
    culls the mesh, and the paper slides briefly under the toolbar's
    room as the research's ruling welcomes (derived; Plan 17's Manual
    QA watches it).

## Steps

### Step 1: The stepper walks a sheet

- Changes `docs/src/fold/engine.js` (`aspect`, `finishedPosition`,
  `leanRadians`, `start` and `printedLines` on the sheet),
  `docs/src/sandbox/session.js` (cutSession() sets `finishedPosition`
  null and `printedLines`), `docs/src/fold/stepper.js`,
  `docs/src/designs/sheet.js` (the three writers and their
  parameters), `docs/src/ui/design-radios.js` (`sheetId`) and
  `docs/src/main.js` (`sheets` carries the four pattern sheets, the
  swap by identity), per Decisions 1 to 3.
- It should fold, unfold, stretch and fade exactly as before for every
  design (Agent QA 1, 2; Manual QA 2, 6).
- It should never fade a sandbox sheet's lines out at rest
  (Agent QA 3).
- It should stretch from a design's sheet to a pattern's and back, the
  2:1 oblong turning from the pencil's upright half square (Agent QA 4;
  Manual QA 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { createHash } from "node:crypto"; import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; console.log(createHash("sha256").update(JSON.stringify(DESIGNS.map((d) => { const s = cutSheet(d); return [s.faces, s.creaseLines, s.centres, s.bridges]; }))).digest("hex").slice(0, 16), DESIGNS.map((d) => { const s = cutSheet(d); return s.finishedPosition + ":" + s.aspect + ":" + s.start.side + ":" + (s.printedLines === s.creaseLines); }).join(" "));'`
   Expect: `e1029fb4c0d55948 8:0.5:back:true 6:1:front:true 3:1:back:true 7:1:front:true 13:2:back:true` (the faces, creases, centres and bridges as at `9b63c96`, measured; then each sheet's finished position, aspect and start side)
2. Do: `node --input-type=module -e 'import { FADE_OUT_SECONDS, stepSequence } from "./docs/src/fold/stepper.js"; import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const sheets = Object.fromEntries(DESIGNS.map((d) => [d.id, cutSheet(d)])); const end = sheets.pencil.finishedPosition; const state = { sheetId: "pencil", direction: 0, linesFade: 0, linesVisibility: 1, position: end, stretchFromId: "pencil", stretchProgress: 1 }; const target = { sheetId: "pencil", linesOn: true, position: end }; stepSequence(FADE_OUT_SECONDS, sheets, state, target); console.log(state.linesVisibility, state.position === end);'`
   Expect: `0 true` (the finished pencil's lines fade out, as Plan 12's Agent QA proved by design id)
3. Do: `node --input-type=module -e 'import { stepSequence } from "./docs/src/fold/stepper.js"; import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession } from "./docs/src/sandbox/session.js"; const sheets = Object.fromEntries(PATTERNS.map((p) => [p.id, cutSession(p, createSession())])); const state = { sheetId: "square-quarter", direction: 0, linesFade: 0, linesVisibility: 1, position: 0, stretchFromId: "square-quarter", stretchProgress: 1 }; const target = { sheetId: "square-quarter", linesOn: true, position: 0 }; console.log(stepSequence(1, sheets, state, target), state.linesVisibility, sheets["square-quarter"].finishedPosition, sheets["square-quarter"].printedLines.length);'`
   Expect: `false 1 null 6` (at rest on a pattern's flat sheet with the lines showing, a second passes and nothing changes)
4. Do: `node --input-type=module -e 'import { STRETCH_SECONDS, stepSequence } from "./docs/src/fold/stepper.js"; import { writeStartPose, writeStretchScale } from "./docs/src/designs/sheet.js"; import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession } from "./docs/src/sandbox/session.js"; const sheets = { ...Object.fromEntries(DESIGNS.map((d) => [d.id, cutSheet(d)])), ...Object.fromEntries(PATTERNS.map((p) => [p.id, cutSession(p, createSession())])) }; const state = { sheetId: "pencil", direction: 0, linesFade: 0, linesVisibility: 0, position: 0, stretchFromId: "pencil", stretchProgress: 1 }; const target = { sheetId: "oblong-quarter", linesOn: true, position: 0 }; stepSequence(STRETCH_SECONDS / 2, sheets, state, target); const scale = {}; const rotation = {}; writeStretchScale(sheets, scale, state); writeStartPose(sheets, rotation, state); console.log(state.sheetId, state.stretchFromId, state.stretchProgress.toFixed(2), scale.x.toFixed(3), scale.y.toFixed(3), rotation.y.toFixed(3));'`
   Expect: `oblong-quarter pencil 0.50 0.750 1.500 -1.571` (half-way through the stretch from the flat pencil sheet, 0.5 wide, to the oblong, 2 wide, the scale is the mid-size over the oblong's and the sheet has turned half-way from the back to the front)

### Step 2: Plain lines

- Changes `docs/src/scene/fold-lines.js` (the `"plain"` style,
  `printedLines`, the file's comment) and `docs/src/scene/paper.js`
  (its doc comment names printed lines), per Decision 3.
- It should draw a plain line solid, at the dashes' width and colour,
  on both sides (Agent QA 1; Manual QA 4).
- It should draw every design's dashes as before (Manual QA 2).

**Agent QA**

1. Do: `grep -n "setLineDash\|plain\|printedLines\|creaseLines" docs/src/scene/fold-lines.js | grep -c "plain\|printedLines"; grep -c "creaseLines" docs/src/scene/fold-lines.js`
   Expect: a count of at least `3`, then `0` (the plain style and
   `printedLines` are read; `creaseLines` no longer is)
2. Do: `node --check docs/src/scene/fold-lines.js && node --check docs/src/scene/paper.js`
   Expect: prints nothing.

### Step 3: The mode and the patterns in the toolbar

- Changes `docs/index.html` (the mode and pattern groups, the canvas
  label, `.choices`), `docs/styles/main.css` (`.designs` rules become
  `.choices`, `[hidden]` groups), `docs/src/ui/controls-toggle.js`
  and `docs/src/main.js` (the hidden toolbar's comments, the mode's
  wiring), `docs/src/ui/fold-lines-toggle.js` (forced on) and adds
  `docs/src/ui/mode-radios.js` and `docs/src/ui/pattern-radios.js`,
  per Decisions 4 to 9.
- It should show the mode radios first, Presentation checked at load,
  and swap the design group for the pattern group in Sandbox Mode
  (Agent QA 1; Manual QA 1, 3).
- It should unfold, stretch, recolour and print the lattice on
  choosing Sandbox Mode, and fold the checked design back on choosing
  Presentation Mode (Manual QA 3, 5, 6).
- It should force "Fold lines" on in Sandbox Mode and restore it after
  (Manual QA 7).
- It should drive the mode and patterns from the keyboard as the
  designs are driven, and keep Escape's hidden toolbar (Manual QA 8, 9).
- It should say "hidden toolbar", never "presentation mode", in the
  code (Agent QA 2).

**Agent QA**

1. Do: `grep -o 'name="mode" value="[a-z]*"\( checked\)\?\|name="pattern" value="[a-z-]*"' docs/index.html | tr '\n' ' '`
   Expect: `name="mode" value="presentation" checked name="mode" value="sandbox" name="pattern" value="square-half-diagonals" name="pattern" value="square-quarter" name="pattern" value="oblong-half-diagonals" name="pattern" value="oblong-quarter" `
2. Do: `grep -rin "presentation mode" docs/src docs/styles | grep -vi "Presentation Mode" | wc -l; grep -c "hidden toolbar" docs/src/ui/controls-toggle.js docs/src/main.js docs/styles/main.css`
   Expect: `0`, then a count of at least `1` for each of the three files
3. Do: `for f in docs/src/ui/mode-radios.js docs/src/ui/pattern-radios.js docs/src/ui/fold-lines-toggle.js docs/src/main.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/ui/*.js docs/src/main.js docs/styles/main.css docs/index.html | grep -v "index.html:9$"`
   Expect: prints nothing (line 9 of `index.html` is the favicon's data URL)

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and
in the browser choosing "Sandbox" unfolds the design, stretches the
sheet to the pattern's shape and prints its lattice as plain lines on
both sides, and "Presentation" folds the design back up.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome, open the dev tools
console, and hard-reload (Shift+Cmd+R).

1. **Do:** look at the page.
   - **Expect:** the toolbar starts with "Presentation" and "Sandbox",
     drawn like the design buttons, Presentation ringed; then the six
     design buttons, "Fold lines", and the swatches, as before. No
     pattern buttons are visible. The finished red pencil, no console
     errors or warnings.
2. **Do:** click "Heart".
   - **Expect:** it unfolds, stretches, turns pink and folds, with its
     dashed and dash-dot-dot lines showing while it moves, exactly as
     before.
3. **Do:** click "Sandbox".
   - **Expect:** the design buttons give way to "Square ½", "Square ¼",
     "Oblong ½" and "Oblong ¼", the first ringed. The heart unfolds,
     its lines fade out at flat, the sheet stretches from the heart's
     wide oblong to a square and fades to blue, and a grid of eight
     plain, solid black lines fades in: the two centre lines, both
     diagonals, and four lines through the edges' midpoints. The paper
     then rests, lines showing.
4. **Do:** drag the paper round to see its back.
   - **Expect:** the same eight lines on the white side, solid, in
     blue: no dashes anywhere on either side.
5. **Do:** click "Oblong ¼".
   - **Expect:** the lines fade out, the sheet stretches to a wide
     oblong and fades to pink, and ten plain lines fade in: seven
     upright and three across, all a quarter of the short side apart.
6. **Do:** click "Presentation".
   - **Expect:** the pattern buttons give way to the design buttons,
     Heart still ringed. The lines fade out, the sheet stretches back
     to the heart's shape, fades to the heart's pink, its dashed lines
     fade in, and it folds up to the finished heart.
7. **Do:** untick "Fold lines", click "Sandbox", then "Presentation".
   - **Expect:** in Sandbox Mode the checkbox is ticked and greyed out,
     and the lattice shows; back in Presentation Mode it is unticked
     and enabled again, and the heart folds up without lines.
8. **Do:** hard-reload, press Tab, then Right, then Tab, then Right.
   - **Expect:** Tab rings "Presentation"; Right chooses "Sandbox" and
     the paper begins its change; the next Tab lands on "Square ½"; and
     Right chooses "Square ¼".
   - **Why:** the mode and pattern groups must be native radio groups,
     so the keyboard works as it does for the designs.
9. **Do:** press Escape, then Escape again.
   - **Expect:** the toolbar fades out and back in, the pattern group
     still showing in place of the designs.
10. **Do:** in the dev tools' device mode, choose a phone (iPhone 12
    Pro), reload, and choose "Sandbox".
    - **Expect:** the toolbar wraps onto several lines without
      overflowing the screen, and the lattice reads clearly at the
      phone's size.
11. **Do:** in the Elements panel, select the `<canvas>`.
    - **Expect:** its `aria-label` reads "A sheet of origami paper,
      which folds into designs or along a printed grid, and turns when
      dragged".

## Audit

- **2026-11-14T14:05:33Z** — **drafted**: the stepper walks a sheet by
  `sheetId`, sheets carry their finished position and printed lines, plain
  lines print solid, and the mode and pattern radios swap the design group
  out; Gameplay Mode gets no radio yet.
