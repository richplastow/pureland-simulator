---
title: Sandbox Mode shows a printed lattice
description: Adds the mode and pattern radios, prints a pattern's lattice as plain lines on both sides, and makes the stepper walk a sheet rather than a design, so the paper can switch between a design and a pattern.
type: plan
---

## Context

- The second of the five Basic Sandbox Mode plans, after
  [Plan 15](./15-lattice-engine.md), whose patterns and printed lines it
  puts on the page, and before [Plan 17](../todo/17-sandbox-folds.md), which
  folds them. It delivers the mode itself: a Presentation Mode and
  Sandbox Mode radio pair, pattern radios in place of the design radios,
  the lattice printed as plain lines on both sides of the sheet, and the
  stretch, turn and colour fade between a design and a pattern, all
  with the stepper as it is.
- It implements the research's
  [toolbar](../todo/13-sandbox-mode-research.md#8-the-toolbar),
  [sandbox sheet](../todo/13-sandbox-mode-research.md#4-the-sandbox-sheet-undo-redo-and-unfold)
  (the printing, not yet the folding) and
  [the stepper walks a sheet](../todo/13-sandbox-mode-research.md#5-the-stepper-walks-a-sheet-not-a-design),
  and the ruling that a line shows its direction only where the
  direction is fixed, so Presentation Mode keeps its dashes.
- Needed because nothing in the app yet knows a mode, and the stepper
  and the pose writers read a design by id, which a pattern is not.
- Browser behaviour it rests on: the
  [`hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden)
  attribute, and
  [`CanvasRenderingContext2D.setLineDash()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash),
  whose empty array draws a solid line.
- Three.js r187 source it rests on, read on 2026-11-14:
  [`Frustum.intersectsObject()`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/math/Frustum.js)
  (line 146) and `intersectsSphere()` (line 197), which a mesh's
  [`intersectsFrustum()`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/objects/Mesh.js)
  (line 234) calls for
  [`WebGLRenderer`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/renderers/WebGLRenderer.js)
  (line 1927) and
  [`WebGLShadowMap`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/renderers/webgl/WebGLShadowMap.js)
  (line 528).

## Decisions

1. **The stepper and the pose writers read a sheet, not a design.**
   The sequence state's and target's `designId` become `sheetId`,
   naming an entry in `main.js`'s `sheets` map, and cutSheet() gives
   every sheet what the per-frame path read from the design:
   `aspect`, `finishedPosition` (the design's step count),
   `leanRadians` (as leanOf() reads it) and `start` (as startOf()
   reads it). stepSequence(), writeStretchScale(), writeStartPose(),
   writeLean() and sharesSheet() take `sheets` in place of `designs`,
   the writers' arguments then running A-Z: writeLean(rotation, sheets,
   state), writeStartPose(rotation, sheets, state) and
   writeStretchScale(scale, sheets, state). writeStretchScale() reads
   `widthMeters` and `heightMeters` directly. The `designs` map stays
   in `main.js` for a design's `colorId` at takeover, beside a
   `patterns` map, keyed by id, for a pattern's (Decision 6); and
   design-radios.js's targets name a `sheetId`, null for "Flat".
   - A sandbox sheet, from cutSession(), has `finishedPosition: null`:
     it is never finished, so its lines never fade out at rest, and
     `isFinished` in stepSequence() is false for it.
   - A pattern's sheet carries the pattern's `aspect`, the default
     start and a lean of 0, so a design's sheet and a pattern's stretch
     and turn between each other through the code that stretches
     between two designs today.

   The state at rest on a pattern's flat sheet, after the stretch from
   the pencil's:

   ```json
   {
     "direction": 0,
     "linesFade": 0,
     "linesVisibility": 1,
     "position": 0,
     "sheetId": "square-quarter",
     "stretchFromId": "pencil",
     "stretchProgress": 1
   }
   ```

   The target it rests at:

   ```json
   { "linesOn": true, "position": 0, "sheetId": "square-quarter" }
   ```

   What that pattern's flat sheet carries beside what cutSheet()
   returns today, the first of its six printed lines shown:

   ```json
   {
     "aspect": 1,
     "finishedPosition": null,
     "leanRadians": 0,
     "printedLines": [
       { "from": [-0.0375, -0.075], "to": [-0.0375, 0.075], "type": "plain" }
     ],
     "start": { "rollRadians": 0, "side": "front" }
   }
   ```

2. **Every pattern's flat sheet is cut once at load**, into `sheets`
   under the pattern's id beside the designs' sheets, through
   cutSession() with an empty session. The paper swaps sheets when
   `sheets[state.sheetId]` is no longer the object it shows, by
   identity rather than by id, so that Plan 17 can replace a pattern's
   sheet on every fold under the same id. The colour still follows the
   id: a design's or pattern's `colorId` applies when `state.sheetId`
   changes, never on a swap under the same id, so a swatch chosen in
   Sandbox Mode survives Plan 17's folds.
   - `docs/src/fold/pose.js` poses a sheet with no folds, such as a
     pattern's flat sheet, flat: writePaperPositions() writes each face
     at its stage-0 placement less the stage-0 centre, and
     foldPositionAt() and viewTurnRadiansAt() return 0 for a sheet with
     no steps. Today all three read the sheet's first fold or step,
     which a sheet cut from the empty session lacks, and throw a
     TypeError (measured), so paper.setSheet() and maxPaperRadius()
     would throw on a pattern's sheet.
3. **A sheet says what to print.** cutSheet() adds `printedLines` to a
   sheet, the same array as its `creaseLines`; cutSession() sets it to
   printedLines(pattern) from Plan 15, each line typed `"plain"`.
   drawFoldLines() draws `printedLines`, and gives `"plain"` a solid
   stroke of the same width and colour as the dashes, with
   `setLineDash([])`. A plain line is the same on both sides.
4. **The mode is a radio group**, `name="mode"`, first in the toolbar,
   a `role="radiogroup"` with `aria-label="Mode"`, with the values
   `presentation` and `sandbox` and the labels "Presentation" and
   "Sandbox", drawn and keyboard-driven exactly as the design radios
   are: the CSS rules that draw `.designs` move to a shared class,
   `.choices`, which the mode, design and pattern groups all carry.
   Presentation Mode is checked at load whatever the browser restored,
   as the first design is. Gameplay Mode has no radio until its own
   plan adds one: a disabled radio would promise a mode the page does
   not have.
5. **The pattern radios**, `name="pattern"`, in a `.patterns` group
   after the mode group, a `role="radiogroup"` with
   `aria-label="Pattern"`, one per pattern in `PATTERNS`'s order, with
   the labels "Square ½", "Square ¼", "Oblong ½" and "Oblong ¼" (open
   to rewording). In Sandbox Mode the `.designs` group is `hidden` and
   `.patterns` shown; in Presentation Mode the reverse. `hidden` takes
   a group out of keyboard reach as well as off the screen, which is
   right: its radios choose nothing in the other mode. An author rule's
   `display: flex` on `.choices` outranks the browser's own
   `[hidden] { display: none }`, so `main.css` gives `.choices[hidden]`
   `display: none`. The first pattern is checked at load.
6. **Choosing a mode or a pattern sets the target**, as choosing a
   design does: Sandbox Mode targets the checked pattern's sheet at
   position 0, so the stepper unfolds the design, fades its lines out,
   stretches and turns the flat sheet to the pattern's shape and the
   front, fades the pattern's colour in and its lines in, and rests;
   Presentation Mode targets the checked design's finished position,
   the reverse. A pattern's `colorId` applies as a design's does, when
   the pattern takes over the flat sheet.
   - Per group: a pattern's choice is its target, `{ position: 0,
     sheetId }`, and its colour, which re-applies at once if the paper
     already holds that pattern, as a design's does. A mode's choice
     passes on the choice of the checked pattern (Sandbox) or the
     checked design (Presentation), as if that radio had been chosen.
     Every group passes its choice on at both `change` and `click`, as
     the design radios do, so choosing the checked mode or pattern again
     re-applies the colour, and a choice that arrives twice does nothing
     the second time.
   - With "Flat" the checked design, Presentation Mode targets flat, as
     "Flat" does, so the pattern's flat sheet stays, in its colour, and
     its lines fade out, until a design is chosen.
7. **"Fold lines" is forced on in Sandbox Mode**: the checkbox is
   checked and disabled while the mode is Sandbox, and the target's
   `linesOn` is true whatever it says; on return to Presentation Mode
   the checkbox is enabled again with the state it had, and governs the
   lines as before. At load, in Presentation Mode, the checkbox is
   enabled whatever the browser restored: Firefox keeps a form control's
   disabled state across a reload
   ([bug 654072](https://bugzilla.mozilla.org/show_bug.cgi?id=654072)).
8. **The hidden toolbar is no longer called a presentation mode.** The
   comments in `controls-toggle.js`, `main.js` and `main.css` that say
   "presentation mode" say "the hidden toolbar", so the term
   Presentation Mode means one thing. Escape behaves as it does, per
   mode: on hiding, with focus outside the toolbar, it moves focus to
   the checked design in Presentation Mode, as now, and to the checked
   pattern in Sandbox Mode, since a radio in a `hidden` group cannot
   take focus, so the arrow keys step through the shown group at once.
9. **The canvas's label covers both modes:** "A sheet of origami
   paper, which folds into designs or along a printed grid, and turns
   when dragged".
10. **The geometry's bounding sphere keeps the designs' radius.**
    `main.js` works `paperRadiusMeters` out over the designs' sheets
    alone: 0.1189 m, the heart's. A pattern's flat sheet reaches
    0.1186 m, inside it; Plan 17's 2:1 folds reach up to 0.1287 m
    mid-fold, 8% beyond it but within the 0.1308 m that `FRAME_MARGIN`
    leaves, as
    [Plan 15's Decision 8](./15-lattice-engine.md#decisions)
    measured. The sphere's centre stays at the origin, since the pose
    slides the vertices rather than a group, and the origin is always
    inside both the camera's view and the shadow camera's box;
    intersectsSphere() rejects a sphere only when its centre lies more
    than its radius outside a plane, so neither pass ever culls the
    mesh (checked against the r187 source in Context). The paper slides
    briefly under the toolbar's room as the research's ruling welcomes;
    Plan 17's Manual QA watches it.

## Steps

### Step 1: The stepper walks a sheet

- Changes `docs/src/fold/engine.js` (`aspect`, `finishedPosition`,
  `leanRadians`, `start` and `printedLines` on the sheet),
  `docs/src/sandbox/session.js` (cutSession() sets `finishedPosition`
  null and `printedLines`), `docs/src/fold/stepper.js`,
  `docs/src/fold/pose.js` (a sheet with no folds poses flat),
  `docs/src/designs/sheet.js` (the three writers and their
  parameters), `docs/src/ui/design-radios.js` (`sheetId`) and
  `docs/src/main.js` (`sheets` carries the four pattern sheets, the
  swap by identity, the radius over the designs' sheets alone), per
  Decisions 1 to 3 and 10.
- It should fold, unfold, stretch and fade exactly as before for every
  design (Agent QA 1, 2; Manual QA 2, 6).
- It should never fade a sandbox sheet's lines out at rest
  (Agent QA 3).
- It should stretch from a design's sheet to a pattern's and back, the
  2:1 oblong turning from the pencil's upright half square (Agent QA 4;
  Manual QA 3).
- It should pose a pattern's flat sheet, which has no folds, flat at
  its full size and unturned, without throwing (Agent QA 5).

**Agent QA**

1. Do: `node --input-type=module -e 'import { createHash } from "node:crypto"; import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; console.log(createHash("sha256").update(JSON.stringify(DESIGNS.map((d) => { const s = cutSheet(d); return [s.faces, s.creaseLines, s.centres, s.bridges]; }))).digest("hex").slice(0, 16), DESIGNS.map((d) => { const s = cutSheet(d); return s.finishedPosition + ":" + s.aspect + ":" + s.start.side + ":" + (s.printedLines === s.creaseLines); }).join(" "));'`
   Expect: `e1029fb4c0d55948 8:0.5:back:true 6:1:front:true 3:1:back:true 7:1:front:true 13:2:back:true` (the faces, creases, centres and bridges as at `9b63c96`, measured; then each sheet's finished position, aspect and start side)
2. Do: `node --input-type=module -e 'import { FADE_OUT_SECONDS, stepSequence } from "./docs/src/fold/stepper.js"; import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const sheets = Object.fromEntries(DESIGNS.map((d) => [d.id, cutSheet(d)])); const end = sheets.pencil.finishedPosition; const state = { sheetId: "pencil", direction: 0, linesFade: 0, linesVisibility: 1, position: end, stretchFromId: "pencil", stretchProgress: 1 }; const target = { sheetId: "pencil", linesOn: true, position: end }; stepSequence(FADE_OUT_SECONDS, sheets, state, target); console.log(state.linesVisibility, state.position === end);'`
   Expect: `0 true` (the finished pencil's lines fade out, as Plan 12's Agent QA proved by design id)
3. Do: `node --input-type=module -e 'import { stepSequence } from "./docs/src/fold/stepper.js"; import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession } from "./docs/src/sandbox/session.js"; const sheets = Object.fromEntries(PATTERNS.map((p) => [p.id, cutSession(p, createSession())])); const state = { sheetId: "square-quarter", direction: 0, linesFade: 0, linesVisibility: 1, position: 0, stretchFromId: "square-quarter", stretchProgress: 1 }; const target = { sheetId: "square-quarter", linesOn: true, position: 0 }; console.log(stepSequence(1, sheets, state, target), state.linesVisibility, sheets["square-quarter"].finishedPosition, sheets["square-quarter"].printedLines.length);'`
   Expect: `false 1 null 6` (at rest on a pattern's flat sheet with the lines showing, a second passes and nothing changes)
4. Do: `node --input-type=module -e 'import { STRETCH_SECONDS, stepSequence } from "./docs/src/fold/stepper.js"; import { writeStartPose, writeStretchScale } from "./docs/src/designs/sheet.js"; import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession } from "./docs/src/sandbox/session.js"; const sheets = { ...Object.fromEntries(DESIGNS.map((d) => [d.id, cutSheet(d)])), ...Object.fromEntries(PATTERNS.map((p) => [p.id, cutSession(p, createSession())])) }; const state = { sheetId: "pencil", direction: 0, linesFade: 0, linesVisibility: 0, position: 0, stretchFromId: "pencil", stretchProgress: 1 }; const target = { sheetId: "oblong-quarter", linesOn: true, position: 0 }; stepSequence(STRETCH_SECONDS / 2, sheets, state, target); const scale = {}; const rotation = {}; writeStretchScale(scale, sheets, state); writeStartPose(rotation, sheets, state); console.log(state.sheetId, state.stretchFromId, state.stretchProgress.toFixed(2), scale.x.toFixed(3), scale.y.toFixed(3), rotation.y.toFixed(3));'`
   Expect: `oblong-quarter pencil 0.50 0.750 1.500 -1.571` (half-way through the stretch from the flat pencil sheet, 0.5 wide, to the oblong, 2 wide, the scale is the mid-size over the oblong's and the sheet has turned half-way from the back to the front)
5. Do: `node --input-type=module -e 'import { foldPositionAt, maxPaperRadius, viewTurnRadiansAt, writePaperPositions } from "./docs/src/fold/pose.js"; import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession } from "./docs/src/sandbox/session.js"; console.log(PATTERNS.map((p) => { const s = cutSession(p, createSession()); const out = new Float64Array(12); writePaperPositions(out, 0, s); const xs = out.filter((_, i) => i % 3 === 0); const zs = out.filter((_, i) => i % 3 === 2); return [maxPaperRadius(s).toFixed(4), Math.max(...xs).toFixed(4), Math.max(...zs.map(Math.abs)), viewTurnRadiansAt(0, s), foldPositionAt(0, s)].join(":"); }).join(" "));'`
   Expect: `0.1061:0.0750:0:0:0 0.1061:0.0750:0:0:0 0.1186:0.1061:0:0:0 0.1186:0.1061:0:0:0` (each pattern's flat sheet reaches its half-diagonal, its right edge at half its width, all four corners at z = 0, with no turn and no folds done; before the change, a TypeError)

### Step 2: Plain lines

- Changes `docs/src/scene/fold-lines.js` (the `"plain"` style,
  `printedLines`, the file's comment) and `docs/src/scene/paper.js`
  (its doc comment names printed lines), per Decision 3.
- It should draw a plain line solid, at the dashes' width and colour,
  on both sides (Agent QA 1; Manual QA 4).
- It should draw every design's dashes as before (Manual QA 2).

**Agent QA**

1. Do: `grep -v '^ *\(\*\|//\)' docs/src/scene/fold-lines.js | grep -c 'plain\|printedLines'; grep -v '^ *\(\*\|//\)' docs/src/scene/fold-lines.js | grep -c creaseLines`
   Expect: a count of at least `2`, then `0` (in code, comments left
   out: the plain style and `printedLines` are read; `creaseLines` no
   longer is; at `c8178c5` it prints `0`, then `2`)
2. Do: `node --check docs/src/scene/fold-lines.js && node --check docs/src/scene/paper.js`
   Expect: prints nothing.

### Step 3: The mode and the patterns in the toolbar

- Changes `docs/index.html` (the mode and pattern groups, the canvas
  label, `.choices`), `docs/styles/main.css` (`.designs` rules become
  `.choices`, `.choices[hidden]`), `docs/src/ui/controls-toggle.js`
  (the hidden toolbar's comments, focus per mode), `docs/src/main.js`
  (the hidden toolbar's comment, the mode's wiring, the `patterns`
  map), `docs/src/ui/fold-lines-toggle.js` (forced on), and
  `docs/src/ui/design-radios.js` if the mode needs it to hand over the
  checked design's choice, and adds
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
  designs are driven, and keep Escape's hidden toolbar, which puts
  focus on the checked pattern in Sandbox Mode (Manual QA 8, 9).
- It should say "hidden toolbar", never "presentation mode", in the
  code (Agent QA 2).

**Agent QA**

1. Do: `tr -s ' \n' ' ' < docs/index.html | grep -o 'name="mode" value="[a-z]*"\( checked\)\?\|name="pattern" value="[a-z-]*"' | tr '\n' ' '`
   Expect: `name="mode" value="presentation" checked name="mode" value="sandbox" name="pattern" value="square-half-diagonals" name="pattern" value="square-quarter" name="pattern" value="oblong-half-diagonals" name="pattern" value="oblong-quarter" `
   (whitespace is squeezed first, so an `<input>` wrapped one attribute
   per line still matches)
2. Do: `grep -rn "[Pp]resentation mode" docs/src docs/styles docs/index.html | wc -l | tr -d ' '; grep -c "hidden toolbar" docs/src/ui/controls-toggle.js docs/src/main.js docs/styles/main.css`
   Expect: `0`, then a count of at least `1` for each of the three
   files (at `c8178c5` the first prints `3`; the title-case
   "Presentation Mode" does not match)
3. Do: `for f in docs/src/ui/*.js docs/src/main.js; do node --check "$f"; done; awk 'length > 80 && !/data:image|aria-label="A sheet/ { print FILENAME ":" FNR }' docs/src/ui/*.js docs/src/main.js docs/styles/main.css docs/index.html`
   Expect: prints nothing (the favicon's data URL and the canvas's
   `aria-label` are the two lines no wrap can shorten, so the `awk`
   skips them)

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
     "Oblong ½" and "Oblong ¼", the first ringed. The heart's lines
     fade in and it unfolds, its lines fade out at flat, the sheet stretches from the heart's
     wide oblong to a square, turning from its white side to its
     coloured side, and fades to blue, and a grid of eight plain, solid
     black lines fades in: the two centre lines, both diagonals, and
     four lines through the edges' midpoints. The paper then rests,
     lines showing.
4. **Do:** drag the paper round to see its back.
   - **Expect:** the same eight lines on the white side, solid, in
     blue: no dashes anywhere on either side.
5. **Do:** click "Oblong ¼".
   - **Expect:** the lines fade out, the sheet stretches to a wide
     oblong and fades to pink, and ten plain lines fade in: seven
     upright and three across, all a quarter of the short side apart.
6. **Do:** click "Presentation".
   - **Expect:** the pattern buttons give way to the design buttons,
     Heart still ringed. The lines fade out; the sheet, already the
     heart's wide oblong and pink, does not stretch but turns over to
     its white side; the heart's dashed and dash-dot-dot lines fade in,
     and it folds up to the finished heart, whose lines then fade out.
     The console still shows no errors or warnings.
7. **Do:** untick "Fold lines", click "Sandbox", wait for the paper to
   rest, then click "Presentation".
   - **Expect:** in Sandbox Mode the checkbox is ticked and greyed out,
     the heart unfolds showing its lines, since Sandbox Mode forces
     them on, and the lattice shows; back in Presentation Mode it is
     unticked and enabled again, and the heart folds up without lines.
8. **Do:** hard-reload, press Tab, then Right, then Tab, then Right.
   - **Expect:** Tab rings "Presentation"; Right chooses "Sandbox" and
     the paper begins its change; the next Tab lands on "Square ½"; and
     Right chooses "Square ¼".
   - **Why:** the mode and pattern groups must be native radio groups,
     so the keyboard works as it does for the designs.
9. **Do:** press Escape, then Escape again. Then run
   `document.activeElement.blur()` in the console, click the paper
   once, press Escape, then Right.
   - **Expect:** the toolbar fades out and back in, the pattern group
     still showing in place of the designs. After the blur, Escape
     fades the toolbar out, and Right changes the paper to a wide
     orange oblong, "Oblong ½".
   - **Why:** with focus outside the toolbar, Escape must move it to
     the checked pattern, not to the hidden design group.
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
- **2026-11-14T15:23:47Z** — **reviewed**: no Major finding; Step 1
  Agent QA 1 to 4 pass against a scratch prototype over the real engine,
  hash included. Fixed: pose.js throws a TypeError on a sheet with no
  folds, so Decision 2 and Step 1 add its flat pose, criterion 4 and
  Agent QA 5; the writers' arguments run A-Z (Decision 1, Agent QA 4);
  Decision 1 gains A-Z JSON for the state, the target and a pattern's
  sheet, and a `patterns` map for colours; Decision 2 ties the colour to
  the id, not the swap; Decisions 4 and 5 name the groups' labels and
  `.choices[hidden]`; Decision 6 names each group's choice and "Flat";
  Decision 8 moves Escape's focus to the checked pattern in Sandbox Mode
  (Step 3 criterion 4, Manual QA 9); Decision 10's 6% was the stale
  0.1211 m sphere, now 8% of 0.1189 m per Plan 15, with the culling
  checked against r187; Step 2 Agent QA 1 and Step 3 Agent QA 1 to 3
  made sound (QA 2's first count always printed 0; the favicon is line
  10 and the canvas label also passes 80); Manual QA 3, 6 and 7 match
  the heart's back-up start, pink and forced lines; QA 6 checks the
  console.
- **2026-11-14T15:30:13Z** — **reviewed**: round 2, no Major finding;
  Step 1 Agent QA 1 to 5 pass on a fresh scratch prototype over the real
  engine, hash included, and simulated runs match Manual QA 3 and 5 to 7 and the
  "Flat" reading. Fixed: Context's WebGLRenderer mesh-culling line is
  1927, not 1903 (the sprite branch); Decision 6 has every group pass its
  choice on at `change` and `click`; Decision 7 enables the checkbox at
  load (Firefox bug 654072); Step 3 may touch design-radios.js; Manual QA
  3 fades the heart's lines in before it unfolds, and QA 7 waits for rest.
- **2026-11-14T15:38:29Z** — **implemented**: Steps 1 to 3. Step 1:
  engine.js, session.js, pose.js (writeFlatPositions(), no-step guards),
  stepper.js, sheet.js, design-radios.js, main.js. Step 2: fold-lines.js,
  paper.js doc comments. Step 3: index.html, main.css (`.designs` rules
  now `.choices`, the `--design-*` custom properties renamed `--choice-*`,
  `.choices[hidden]`), controls-toggle.js, fold-lines-toggle.js
  (returns setForcedOn()), design-radios.js (returns
  checkedDesignChoice()), main.js, new mode-radios.js and
  pattern-radios.js. Every Agent QA block failed first as expected, bar
  the parse and line-length checks, and now passes; simulated runs over
  the real modules match Manual QA 3 and 5 to 7 and the "Flat" reading.
  Manual QA unchanged.
- **2026-11-14T15:38:29Z** — **verified**: agent checks pass: every
  changed module parses, no long lines beyond the favicon and canvas
  label, `/` and every changed file served with status 200, vendored
  checksums match "as stored"; browser not run.
- **2026-11-14T15:43:32Z** — **quality-checked**: Fixed: none at fix
  tier; first-run polish: `main.css` `:root` now runs A-Z, the renamed
  `--choice-*` properties moved ahead of `--controls-*`; Step 1 Agent QA
  5 also prints foldPositionAt(0, sheet), expecting `:0` per pattern,
  since no check reached its no-step guard (mutant survived). Deferred:
  a reload in Sandbox Mode may bring "Fold lines" back ticked, as the
  browser saves the forced state, not the checkbox’s own (needs a
  browser to confirm, and to rule on any fix); the disabled checkbox
  greys itself natively but its "Fold lines" text does not (Manual QA 7
  reads "greyed out"); writeFlatPositions()’s stage-0 centre is always
  the origin for a sheet with no folds, an equivalent mutant. Verified
  fine: per-frame path (stepSequence(), sharesSheet(), the three
  writers, writePaperPositions() and writeFlatPositions() allocate
  nothing; writeSequenceState() allocates only through setSheet() on a
  swap); disposal (setSheet() disposes of the old geometry and both
  line textures on every design and pattern swap; materials and grain
  stay); resize unchanged, `paperRadiusMeters` 0.1189 m, measured; no
  new Three.js API or addon; mode, pattern and design choices at
  `change` and `click` idempotent, setForcedOn() guarded against a
  second call; Escape focus per mode; colour by id, not swap; mutants
  in pose.js, stepper.js, session.js and sheet.js caught by Agent QA 3
  to 5 or Manual QA 5; Agent QA all pass; agent checks pass.
- **2026-11-14T17:21:56Z** — **done**: the Lead Developer passed every group
  of the manual QA walk (desktop, phone, diff review); moved to
  `plans/done/`.
