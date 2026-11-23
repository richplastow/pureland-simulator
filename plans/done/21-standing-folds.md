---
title: Several standing folds
description: Lets a Sandbox session mix several standing folds with flat ones, keeping standing flaps with their hinge, refusing folds that would move or cross them, and stopping a fold where it would sweep into one, as a stepping stone to the fold tree.
type: plan
---

## Context

- The last of the five Basic Sandbox Mode plans, on
  [Plan 19](./19-fold-angle.md)'s standing folds and
  [Plan 20](./20-export-design.md)'s export, which records every angle
  already. It delivers the research's ruling in
  [Angles](../todo/13-sandbox-mode-research.md#7-angles-several-standing-folds-a-stepping-stone-to-the-fold-tree):
  several standing folds, each left standing by every later fold, with
  a 3D sweep test, as a stepping stone to the fold tree. Everything it
  adds is built to carry over: the sweep test, the limits the Fold
  Buttons and the paper show, and the side rule once a flap stands.
- What it allows, measured in
  [Several standing folds](../todo/13-sandbox-mode-research.md#several-standing-folds):
  two standing folds, such as a pair of wings or two parallel walls,
  with flat folds before and between them; a third almost never fits,
  and a box never does. The fold tree, after its own research, lifts
  the rule that a standing flap's hinge must stay on the held side.
- [Plan 19](./19-fold-angle.md#decisions) changes the pose of a fold
  that stops short: its pivot now counts held faces at the hinge (its
  Decision 4), which Decision 7 here relies on.
- [Plan 19](./19-fold-angle.md#decisions) has no ring: the paper alone
  shows a drag's angle (its Decision 3), so here the paper is what
  stops at a sweep limit.
- The research's figures were run on 2026-11-14 with its prototype of
  these rules over a patched copy of the engine, kept at the repo root
  as `tmp-sandbox-mode-standing.mjs`, which git ignores. Figures marked
  "measured" in this plan were run on 2026-11-18 over throwaway builds
  of its Decisions on the real engine and pose at `3c34e01`, since
  deleted.
- Theory it rests on: Arkin et al.,
  [When Can You Fold a Map?](https://ar5iv.labs.arxiv.org/html/cs/0011026),
  Section 2, whose simple fold is invalid "if the paper self-intersects
  during this rotation".

## Definitions

- **A standing flap**: the faces a fold that stops short of flat
  moved; its **hinge** is that fold's line where those faces meet the
  paper still flat.
- **The sweep**: the volume the moving faces pass through as a fold
  turns them from 0 to its angle.

## Decisions

1. **"All layers" leaves standing faces out.** In applyFold(), a
   selection of `"all"` takes every face except one moved by an earlier
   fold that stops short, so a standing flap stays with its hinge. The
   refusal of a fold whose explicit selection moves a standing flap
   stays. Presentation Mode is untouched: the dart's wings are its last
   folds, and the Agent QA hashes every design's sheet.
2. **The hinge rule.** A fold is allowed only if every standing flap's
   hinge lies strictly on its held side, which keeps it from moving a
   flap and from creasing across one. `docs/src/sandbox/standing.js`
   exports hingePoints(sheet, stage), the hinge ends, in the folded
   plane, of the faces moved by a fold before the stage that stops
   short, and the rule is a test of their signed distances from the
   fold's line. The sheet's `folds` carry each fold's line, type and
   `targetRadians`, so neither function here takes the session.
3. **The side rule stays as it is once a flap stands**: every fold,
   flat or standing, moves the smaller side, as on the flat sheet, so
   a line whose smaller side holds a hinge fails the hinge rule. Where
   the two sides are equal, the line may turn to whichever orientation
   keeps every hinge on its held side. Moving a larger side, flat or
   standing, measured up to 83% beyond the camera's sphere, at rest
   and part-way through a fold; with the smaller side moving, the
   squares stay within 1% of it, and the oblongs stay within today's
   Sandbox reach part-way through a fold and up to 20% beyond the
   sphere at rest in about 3% of sessions, the height of a wall itself.
   foldableLines(pattern, polygons, hinges) takes the hinge points as
   an optional last argument, none by default, as printedLines() calls
   it, and leaves out every line that fails the hinge rule.
4. **The sweep test.** standingPolygons(sheet, stage) returns each
   standing face as a polygon in 3D, turned about its hinge by its
   fold's angle; sweepLimitRadians(fold, movingPolygons,
   standingPolygons) turns the part of each moving polygon to the left
   of the fold's line, clipped as applyFold() clips, so a caller may
   pass whole faces, about that line in steps of
   `SWEEP_STEP_RADIANS = π / 60` (3°), up to the fold's angle, and
   returns the last step before any moving polygon crosses any
   standing one, snapped down to a whole number of `SNAP_RADIANS`
   steps (15° today, in `docs/src/sandbox/angle.js`), as every fold's
   angle is; the fold's angle itself when nothing crosses. Two
   polygons cross when their planes' line of intersection passes
   through both interiors by more than `CONTACT_METERS = 1e-6`;
   coplanar or touching polygons never cross,
   so a flat stack's layers never block each other, and a fold may
   come to rest touching a wall. Paper has no thickness in the test,
   so once posed with its layers, a flap at rest touching another, or
   stopped at its limit, can pass up to 0.09 mm into it: measured in 3
   of 1,800 random sessions over a throwaway build of Decisions 1 to 7,
   never with flat paper.
5. **What the Fold Buttons and the paper show.** A line whose hinge
   rule fails is not foldable: it lights for nothing. A foldable line
   offers a button for each direction whose sweep limit is at least
   `SNAP_RADIANS`; a direction whose limit is below it shows no button,
   so a line blocked one way shows its pair with the free button alone.
   Nothing shows a lone Fold Button yet (one-way folds wait in the
   backlog item
   [One-way folds in Sandbox Mode](../todo/backlog/20261114-one-way-sandbox-folds.md)):
   every pair is two `<button>`s, so `docs/src/ui/fold-buttons.js`
   gains a way to hide one, and `docs/styles/main.css` a `[hidden]`
   rule for it, since `.fold-buttons button` sets `display: grid`,
   which overrides the attribute. Up, Down or a Fast Fold side press
   for a hidden button does nothing. A click folds flat only if the
   limit is 180°, and otherwise to the limit; a drag's angle, and with
   it the paper folding live, will not pass the limit, nor will Shift
   and the arrows, and a drag to it folds as far as the paper goes, as
   a real fold stops against a wall. The limits are computed once per
   rest state with the foldable lines, replacing Plan 19's rule that
   nothing is foldable after a standing fold. No state with a lone
   button was found over a throwaway build of Decisions 1 to 7: none
   after up to two folds at every snapped angle, none after up to
   three with walls at 45°, 90° or 135°, or at 135° to 165°, on any
   pattern, and none in 2,400 random sessions; and, derived, a flap
   rising from a line parallel to a wall's hinge meets even a wall at
   165° only past 15°. So no Manual QA step shows one; the hidden
   button is still built, for any longer sequence that reaches one,
   and Step 3's Agent QA 3 checks its CSS rule.
6. **The centres count a standing flap by its shadow, and the lines
   read flat paper only.** A standing face's reflected placement lies
   over flat paper only until a later fold moves the paper beside its
   hinge; read as paper after that, it pulls the paper at rest up to
   0.1666 m off centre, 40% beyond the camera's sphere, and offers
   lines whose fold moves nothing, which throws. So stageCentres() in
   `docs/src/fold/engine.js` counts each face moved by an earlier fold
   that stops short by its flat projection, the outline it casts
   straight down: each point at its placement before that fold, pulled
   towards its foot on the hinge by the cosine of that fold's angle,
   the same for a valley and a mountain. Under 90° the shadow stays on
   the flap's own side of the hinge; past 90° the cosine is negative,
   and it falls across the hinge, over the reflected placement, which
   it meets at 180°. The stage of a fold that stops short
   keeps the centre it has today, which leaves the dart's centres as
   they are. `docs/src/main.js` passes foldableLines() only the faces
   no fold that stops short has moved, so the side rule weighs flat
   paper alone. Measured over a throwaway build: at rest the squares
   reach up to 0.1197 m, under 1% beyond the sphere in under 1% of
   sessions, and the oblongs up to 0.1421 m, beyond it in about 3% of
   sessions, from a wall's own height; every design's sheet and pose
   is unchanged.
7. **A standing flap rides with the stack at its hinge.** A face
   moved by a fold that stops short is posed from its own stage's
   layer and pivot, while the held face it is joined to rises with
   every later fold that slides paper under the stack; left as it is,
   flat paper shows through the flap's foot at rest, up to 0.99 mm
   on a wall leaning back at 135°. So writePaperPositions() in
   `docs/src/fold/pose.js` raises each standing face by the change,
   since its own fold, in the stack's height at its hinge: the top
   layer for a valley, the bottom for a mountain, counted over faces
   no fold that stops short has moved, easing in step with the held
   faces. It runs on the per-frame path, so it allocates nothing.
   Measured over a throwaway build: no flat paper crosses a flap at
   rest, an exhaustive search of one wall and up to five flat folds
   included; one crossing of 0.74 mm remains part-way through a fold,
   a mountain fold sliding paper under the foot of a flap at 150°;
   no fold is lost, and every design's pose is unchanged.
   - **The hinge height is Plan 19's, over flat faces.** A fold that
     stops short turns its flap about its line raised to the highest
     face with a point on that line, held faces included, for a
     valley, or lowered to the lowest for a mountain: pivotLayers() in
     `docs/src/fold/pose.js`, as
     [Plan 19, Decision 4](./19-fold-angle.md#decisions) changed it.
     It leaves out faces moved by an earlier fold that stops short,
     which no longer lie in the stack; counted, they lifted a second
     flap by up to 0.6 mm, never into paper. The helper that finds the
     stack's height at a hinge shares pivotLayers()' line test rather
     than copying it.

## Steps

### Step 1: The engine and the pose leave standing faces out

- Changes `docs/src/fold/engine.js` (applyFold()'s `"all"`, Decision
  1; stageCentres()' shadow of a standing face, Decision 6) and
  `docs/src/fold/pose.js` (a standing flap riding with the stack, and
  pivotLayers() over flat faces; Decision 7).
- It should cut a flat fold after a standing one, leaving the standing
  flap where it stands (Agent QA 1).
- It should keep the paper centred when a standing flap's reflected
  placement lies over no flat paper (Agent QA 3).
- It should keep a standing flap on its hinge, with no flat paper
  through its foot, as later folds raise the stack there, easing with
  it through each fold (Agent QA 4, 5, Manual QA 4).
- It should leave every design's sheet exactly as it was
  (Agent QA 2).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; const [p] = PATTERNS; let s = foldAt(createSession(), 0, { from: [-0.075, 0.075], targetRadians: Math.PI / 2, to: [0.075, -0.075], type: "valley" }); s = foldAt(s, 1, { from: [0, -0.075], targetRadians: Math.PI, to: [-0.075, 0], type: "valley" }); const sheet = cutSession(p, s); const standing = sheet.faces.filter((f) => f.movedBy.includes(0)); console.log(sheet.faces.length, standing.length, standing.every((f) => !f.movedBy.includes(1)));'`
   Expect: `3 1 true` (on the square, the upper-right half stood up along the diagonal, then the lower-left corner folded flat over, its line crossing the half's reflected placement: three faces, the half moved by its own fold only; measured. Before this step the cut throws that step 0 stops short but step 1 moves its faces)
2. Do: `node --input-type=module -e 'import { createHash } from "node:crypto"; import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; console.log(createHash("sha256").update(JSON.stringify(DESIGNS.map((d) => { const s = cutSheet(d); return [s.faces, s.creaseLines, s.centres, s.bridges]; }))).digest("hex").slice(0, 16));'`
   Expect: `a12e365bc635109e` (all six designs' faces, creases, centres and bridges, the blintz included, as Plan 16's Agent QA hashes them; measured at `3c34e01`, before this step, and after it)
3. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; const p = PATTERNS[2]; const H = 0.10606601717798213; let s = foldAt(createSession(), 0, { from: [0, -H / 2], targetRadians: Math.PI / 12, to: [0, H / 2], type: "valley" }); s = foldAt(s, 1, { from: [H / 2, H / 2], targetRadians: Math.PI, to: [H / 2, -H / 2], type: "mountain" }); const sheet = cutSession(p, s); console.log(sheet.centres[2].map((v) => v.toFixed(4)).join(" "));'`
   Expect: `-0.0247 0.0000` (Oblong ½, its left half stood at 15° about the centre line, then the quarter right of the next upright line folded under: the rest centre lies between the flat quarter's right edge, 0.0530 m, and the half's shadow, reaching to −0.1025 m. The same for a mountain half. Reading the half's reflected placement as paper gives `0.0530`, its rest reaching 0.1666 m; the shadow's sign misread, pulling the reflected placement towards the hinge, gives `0.0512`. Before this step the cut throws that step 0 stops short but step 1 moves its faces; measured over a throwaway build of Decisions 1 to 7)
4. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { writePaperPositions } from "./docs/src/fold/pose.js"; const H = 0.10606601717798213, S = H / 4, Q = 0.0375; const footOff = (p, folds, x) => { let s = createSession(); folds.forEach((f, i) => { s = foldAt(s, i, f); }); const sheet = cutSession(p, s); const n = folds.length; const positions = new Float64Array(3 * sheet.faces.reduce((k, f) => k + f.polygon.length, 0)); writePaperPositions(positions, n, sheet); let v = 0, foot = 0; const stack = []; for (const f of sheet.faces) for (const [x0, y0] of f.polygon) { const z = positions[3 * v++ + 2]; const standing = f.movedBy.includes(0); const [a, _b, c, _d, tx] = f.placements[standing ? 0 : n]; if (Math.abs(a * x0 + c * y0 + tx - x) > 1e-9) continue; if (standing) foot = z; else stack.push(z); } const end = folds[0].type === "valley" ? Math.max(...stack) : Math.min(...stack); return Math.round((foot - end) * 1e6) + 0 + " " + Math.round(end * 1e6); }; console.log(footOff(PATTERNS[3], [{ from: [-S, -H / 2], targetRadians: (3 * Math.PI) / 4, to: [-S, H / 2], type: "valley" }, { from: [2 * S, H / 2], targetRadians: Math.PI, to: [2 * S, -H / 2], type: "mountain" }, { from: [S, H / 2], targetRadians: Math.PI, to: [S, -H / 2], type: "mountain" }], -S), "|", footOff(PATTERNS[1], [{ from: [0, -2 * Q], targetRadians: (3 * Math.PI) / 4, to: [0, 2 * Q], type: "mountain" }, { from: [Q, 2 * Q], targetRadians: Math.PI, to: [Q, -2 * Q], type: "valley" }], 0));'`
   Expect: `0 300 | 0 100` (per case, in micrometres at rest, the wall's foot less the stack's top at its hinge for a valley wall, or its bottom for a mountain wall, then that height. First, Oblong ¼, its left three spacings stood at 135° as a valley wall leaning back over the paper, then two mountain folds that slide paper under the stack, lifting the face at the hinge three layers; second, Square ¼, its left half stood at 135° as a mountain wall leaning back under the paper, then a valley fold that lays the right quarter on top up to the hinge, which lifts the stack's top but not its bottom, 100 µm up since stackLayers() still counts the standing half's reflected placement beneath the held face. A flap that keeps its own stage's height gives `-300 300 | -100 100`, flat paper through its foot; one that counts standing faces at the hinge gives `100 300 | -100 100`; one that follows the top for a mountain wall gives `0 300 | 100 100`. Before this step both cuts throw; measured over a throwaway build of Decisions 1 to 7)
5. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { writePaperPositions } from "./docs/src/fold/pose.js"; const H = 0.10606601717798213, S = H / 4; const folds = [{ from: [-S, -H / 2], targetRadians: (3 * Math.PI) / 4, to: [-S, H / 2], type: "valley" }, { from: [2 * S, H / 2], targetRadians: Math.PI, to: [2 * S, -H / 2], type: "mountain" }, { from: [S, H / 2], targetRadians: Math.PI, to: [S, -H / 2], type: "mountain" }]; let s = createSession(); folds.forEach((f, i) => { s = foldAt(s, i, f); }); const sheet = cutSession(PATTERNS[3], s); const positions = new Float64Array(3 * sheet.faces.reduce((k, f) => k + f.polygon.length, 0)); console.log([2, 2.5, 3].map((at) => { writePaperPositions(positions, at, sheet); let v = 0, foot = 0, top = -Infinity; for (const f of sheet.faces) for (const [x0, y0] of f.polygon) { const z = positions[3 * v++ + 2]; const standing = f.movedBy.includes(0); const [a, _b, c, _d, tx] = f.placements[standing ? 0 : 3]; if (f.movedBy.includes(2) || Math.abs(a * x0 + c * y0 + tx + S) > 1e-9) continue; if (standing) foot = z; else top = Math.max(top, z); } return Math.round((foot - top) * 1e6) + 0 + " " + Math.round(top * 1e6); }).join(" "));'`
   Expect: `0 100 0 200 0 300` (Agent QA 4's first case, Oblong ¼ with its valley wall at 135°, read at the start, the middle and the end of the last mountain fold, per reading in micrometres, the wall's foot less the stack's top at its hinge, then that height: the foot stays on the stack as the fold eases it from one layer to three. A flap that takes the next stage's height as the fold starts gives `200 100 100 200 0 300`, lifting off the paper before it rises; measured)

### Step 2: The hinge rule, the side rule and the sweep test

- Adds `docs/src/sandbox/standing.js` (hingePoints(),
  standingPolygons(), sweepLimitRadians(); Decisions 2, 4) and changes
  `docs/src/sandbox/lattice.js` (foldableLines() with the hinge and
  side rules; Decision 3).
- It should refuse every line whose hinge rule fails, and offer the
  rest with the smaller side moving, or, where the two sides are
  equal, turned to keep every hinge held (Agent QA 1, 2, 6).
- It should stop a fold where it would sweep into a wall, valley or
  mountain, at the angle the geometry gives, leave the other direction
  free, and let a fold come to rest touching a wall (Agent QA 4 to 7).
- It should leave nothing foldable once two walls stand at the ends
  (Agent QA 3).
- It should stand a flap at its own angle, leaning where it leans, and
  read only the folds before the stage, so an undone wall frees every
  line (Agent QA 4).

**Agent QA**

Each line passes foldableLines() and sweepLimitRadians() the flat faces
only, those no fold that stops short has moved, as `docs/src/main.js`
passes them (Decision 6), and passes sweepLimitRadians() whole faces,
which it clips to the fold's moving side (Decision 4). Every expectation
was measured over a throwaway build of Decisions 1 to 7, then checked
against mutations of it: a dropped hinge rule or tie rule, a non-strict
hinge test, the larger side moving, the stage bound off by one, a
dropped valley or mountain sign in either polygon set, no clipping,
touching counted as crossing, no snapping, and the limit one step late;
each fails at least one line.

1. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { hingePoints, standingPolygons, sweepLimitRadians } from "./docs/src/sandbox/standing.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const p = PATTERNS[3]; const W = 0.2121320343559643, H = 0.10606601717798213; const s = foldAt(createSession(), 0, { from: [0.375 * W, H / 2], targetRadians: Math.PI / 2, to: [0.375 * W, -H / 2], type: "valley" }); const sheet = cutSession(p, s); const flat = placedPolygons(sheet, 1).filter((_, i) => !sheet.faces[i].movedBy.includes(0)); const walls = standingPolygons(sheet, 1); const deg = (r) => Math.round((r * 180) / Math.PI); console.log(foldableLines(p, flat, hingePoints(sheet, 1)).map((l) => l.family + l.index + (l.to[1] > l.from[1] ? "up" : "down") + ":" + ["valley", "mountain"].map((type) => deg(sweepLimitRadians({ ...l, targetRadians: Math.PI, type }, flat, walls))).join("/")).join(" "));'`
   Expect: `v-3up:180/180 v-2up:180/180 v-1up:180/180` (Oblong ¼, its right end stood up as a wall: the three lines across the paper fail the hinge rule; the three upright lines nearest the wall fail it too, since their smaller side holds the hinge; the three leftmost move their left side, the smaller, and fold freely, the wall being out of reach)
2. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { hingePoints } from "./docs/src/sandbox/standing.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const [p] = PATTERNS; const s = foldAt(createSession(), 0, { from: [0, 0.075], targetRadians: Math.PI / 2, to: [0.075, 0], type: "valley" }); const sheet = cutSession(p, s); const flat = placedPolygons(sheet, 1).filter((_, i) => !sheet.faces[i].movedBy.includes(0)); console.log(foldableLines(p, flat, hingePoints(sheet, 1)).map((l) => l.family + l.index).join(","));'`
   Expect: `a-1` (Square ½ with diagonals, its top-right corner stood up: the far corner's line alone survives; the diagonal parallel to the wall fails, since its smaller side holds the hinge)
3. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { hingePoints } from "./docs/src/sandbox/standing.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const p = PATTERNS[3]; const W = 0.2121320343559643, H = 0.10606601717798213; let s = foldAt(createSession(), 0, { from: [0.375 * W, H / 2], targetRadians: Math.PI / 2, to: [0.375 * W, -H / 2], type: "valley" }); s = foldAt(s, 1, { from: [-0.375 * W, -H / 2], targetRadians: Math.PI / 2, to: [-0.375 * W, H / 2], type: "valley" }); const sheet = cutSession(p, s); const flat = placedPolygons(sheet, 2).filter((_, i) => sheet.faces[i].movedBy.length === 0); const lines = foldableLines(p, flat, hingePoints(sheet, 2)); let reach = 0; for (const poly of flat) for (const [x, y] of poly) reach = Math.max(reach, Math.hypot(x, y)); console.log(sheet.faces.length, lines.length, reach < 0.1186);'`
   Expect: `3 0 true` (Oblong ¼ with two walls at the ends: every line between them has a hinge on each side, and the flat paper's reach stays under the flat sheet's)
4. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { hingePoints, standingPolygons, sweepLimitRadians } from "./docs/src/sandbox/standing.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const p = PATTERNS[2]; const D = 0.05303300858899107; const deg = (r) => Math.round((r * 180) / Math.PI); console.log([Math.PI / 6, (5 * Math.PI) / 6].map((lean) => { const sheet = cutSession(p, foldAt(createSession(), 0, { from: [-D, -D], targetRadians: lean, to: [D, D], type: "valley" })); const flat = placedPolygons(sheet, 1).filter((_, i) => !sheet.faces[i].movedBy.includes(0)); const walls = standingPolygons(sheet, 1); const lines = foldableLines(p, flat, hingePoints(sheet, 1)); return [lines.map((l) => l.family + l.index + ":" + ["valley", "mountain"].map((type) => deg(sweepLimitRadians({ ...l, targetRadians: Math.PI, type }, flat, walls))).join("/")).join(" "), deg(sweepLimitRadians({ ...lines[0], targetRadians: Math.PI / 2, type: "valley" }, flat, walls)), foldableLines(p, placedPolygons(sheet, 0), hingePoints(sheet, 0)).length].join(" "); }).join(" | "));'`
   Expect: `d-2:180/180 d-1:150/180 90 14 | d-2:180/180 d-1:45/180 90 14` (Oblong ½, its upper-left half stood about the centre diagonal, first at 30°, low over its own side, then at 150°, leaning back over the flat half: the diagonal nearer the wall stops a valley at 150°, then at 45°, as the paper folding over meets the wall's top edge; the mountains stay free; a free fold short of flat keeps its own angle, 90°; and at stage 0, before the wall, all 14 lines are foldable)
5. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { hingePoints, standingPolygons, sweepLimitRadians } from "./docs/src/sandbox/standing.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const p = PATTERNS[2]; const D = 0.05303300858899107; const deg = (r) => Math.round((r * 180) / Math.PI); console.log(["valley", "mountain"].map((wall) => { const sheet = cutSession(p, foldAt(createSession(), 0, { from: [-D, -D], targetRadians: Math.PI / 2, to: [D, D], type: wall })); const flat = placedPolygons(sheet, 1).filter((_, i) => !sheet.faces[i].movedBy.includes(0)); const walls = standingPolygons(sheet, 1); return foldableLines(p, flat, hingePoints(sheet, 1)).map((l) => l.family + l.index + ":" + ["valley", "mountain"].map((type) => deg(sweepLimitRadians({ ...l, targetRadians: Math.PI, type }, flat, walls))).join("/")).join(" "); }).join(" | "));'`
   Expect: `d-2:180/180 d-1:120/180 | d-2:180/180 d-1:180/120` (Oblong ½, its upper-left half stood at 90° as a valley wall, then as a mountain wall: the diagonal nearer the wall stops the fold towards the wall at 120°, Manual QA 6's stop, and leaves the other direction free)
6. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { hingePoints, standingPolygons, sweepLimitRadians } from "./docs/src/sandbox/standing.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const p = PATTERNS[1]; const s = foldAt(createSession(), 0, { from: [0, -0.075], targetRadians: (3 * Math.PI) / 4, to: [0, 0.075], type: "valley" }); const sheet = cutSession(p, s); const flat = placedPolygons(sheet, 1).filter((_, i) => !sheet.faces[i].movedBy.includes(0)); const walls = standingPolygons(sheet, 1); const deg = (r) => Math.round((r * 180) / Math.PI); console.log(foldableLines(p, flat, hingePoints(sheet, 1)).map((l) => l.family + l.index + (l.to[1] > l.from[1] ? "up" : "down") + ":" + ["valley", "mountain"].map((type) => deg(sweepLimitRadians({ ...l, targetRadians: Math.PI, type }, flat, walls))).join("/")).join(" "));'`
   Expect: `v1down:90/180` (Square ¼, its left half stood at 135°, leaning back over the paper: the upright line one quarter in is a tie, turned so its right quarter moves and the hinge stays held; a valley stands that quarter up to 90°, where its top edge touches the wall without crossing it, and a mountain folds it flat under the paper, its edge touching the wall's foot; counting touching as crossing gives `v1down:75/165`)
7. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { hingePoints, standingPolygons, sweepLimitRadians } from "./docs/src/sandbox/standing.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const p = PATTERNS[1]; const deg = (r) => Math.round((r * 180) / Math.PI); console.log(["valley", "mountain"].map((wall) => { const sheet = cutSession(p, foldAt(createSession(), 0, { from: [0, -0.075], targetRadians: (5 * Math.PI) / 6, to: [0, 0.075], type: wall })); const flat = placedPolygons(sheet, 1).filter((_, i) => !sheet.faces[i].movedBy.includes(0)); const walls = standingPolygons(sheet, 1); return foldableLines(p, flat, hingePoints(sheet, 1)).map((l) => l.family + l.index + (l.to[1] > l.from[1] ? "up" : "down") + ":" + ["valley", "mountain"].map((type) => deg(sweepLimitRadians({ ...l, targetRadians: Math.PI, type }, flat, walls))).join("/")).join(" "); }).join(" | "));'`
   Expect: `v1down:60/180 | v1down:180/60` (Square ¼, its left half stood at 150°, leaning back over the paper, as a valley wall, then as a mountain wall: the quarter right of the next upright line, turned towards the wall, stops at 60°, where its far edge touches the wall without crossing it, and the other direction stays free. Setting `CONTACT_METERS` to 0, which counts rounding noise at that touch as crossing, gives `v1down:45/180 | v1down:180/45`; measured)

### Step 3: The limits on screen

- Changes `docs/src/main.js` (limits per rest state, the click, the
  drag and Shift and the arrows capped at them, Plan 19's
  hasStandingFold() rule removed, foldableLines() given flat faces
  only, Decision 6), `docs/src/sandbox/session.js`
  (hasStandingFold() removed, its only caller gone),
  `docs/src/ui/fold-buttons.js` (one button hidden where one direction
  is blocked), `docs/styles/main.css` (that button's `[hidden]` rule),
  and `docs/src/ui/fast-fold.js` and `docs/src/sandbox/line-pick.js`
  if its pairs or the pick need the limits, per Decision 5.
- It should show no button for a line that fails the hinge rule
  (Manual QA 2, 3), and hide the button of a direction whose limit is
  under `SNAP_RADIANS`, keeping its pair's other button (Agent QA 3;
  Decision 5 says why no Manual QA step can show it).
- It should stop a click or a drag at the sweep limit, the paper going
  no further (Manual QA 6).
- It should keep folding flat after a wall is up, and stand a second
  wall (Manual QA 2, 3).

**Agent QA**

1. Do: `grep -c "sweepLimitRadians\|hingePoints" docs/src/main.js; grep -c "hasStandingFold" docs/src/main.js docs/src/sandbox/session.js`
   Expect: a count of at least `2`, then `docs/src/main.js:0` and
   `docs/src/sandbox/session.js:0` (the limits come from the rules,
   and Plan 19's rule is gone; at `3c34e01` the second grep prints `2`
   and `1`)
2. Do: `for f in docs/src/sandbox/*.js docs/src/fold/engine.js docs/src/fold/pose.js docs/src/ui/fold-buttons.js docs/src/ui/fast-fold.js docs/src/main.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/sandbox/*.js docs/src/fold/engine.js docs/src/fold/pose.js docs/src/ui/fold-buttons.js docs/src/ui/fast-fold.js docs/src/main.js docs/styles/main.css`
   Expect: prints nothing (every module Steps 1 to 3 change, Step 1's
   `pose.js` included).
3. Do: `grep -c "^\.fold-buttons button\[hidden\]" docs/styles/main.css`
   Expect: `1` (Decision 5's rule, so a hidden button stays hidden
   although `.fold-buttons button` sets `display: grid`; `0` at
   `3c34e01`)

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser two parallel walls can be raised on Oblong ¼ with a flat
fold between them, a fold stops against a wall on Oblong ½, and the
six designs play exactly as before.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome with a mouse, open the
dev tools console, hard-reload (Shift+Cmd+R), click "Sandbox", then
"Oblong ¼". Wait for the pink oblong with its ten lines, then untick
"Fast Fold", which starts ticked.

1. **Do:** press on the upright line nearest the right-hand end and,
   holding, drag left, the side its V button shows on, until the strip
   stands upright, then release.
   - **Expect:** the right-hand strip stands up as a wall, towards the
     camera; the paper rests with the wall standing and lines light
     again on the flat part.
2. **Do:** move the pointer across the flat paper.
   - **Expect:** only the three upright lines furthest from the wall
     light; the three lines across the paper, which the wall's hinge
     crosses, and the three upright lines nearest the wall, whose
     smaller side holds the hinge, never light. Click the third
     upright line from the left.
   - **Expect:** two buttons, the chevron and the V. Press the V.
   - **Expect:** the left three spacings fold flat over onto the
     paper, towards the camera; the wall stays standing and does not
     move. Now only the upright line through the centre lights.
3. **Do:** press on it and, holding, drag left until the paper left
   of it stands upright, then release.
   - **Expect:** the folded paper left of the centre stands up as a
     second wall, parallel to the first; now no line lights anywhere,
     and a click shows no buttons: "Undo" is the only way on.
4. **Do:** drag the paper round and look along the two walls, then at
   the back.
   - **Expect:** both walls stand straight, with no gap or seam at
     either hinge, no flat paper showing through either wall's foot,
     and the printed lines run up them.
5. **Do:** click "Export".
   - **Expect:** three steps, with `"halfTurns"` of `"1/2"`, `"1"`
     and `"1/2"`.
6. **Do:** click "Unfold", then "Oblong ½". Click the 45° line through
   the centre that rises to the right, note the side its V button
   shows on, and press Escape. Press on the line and, holding, drag out
   on that side until the half stands upright, then release.
   - **Expect:** one half stands as a wall along that line, and two
     lines parallel to it light on the flat half. Click the one
     nearer the wall.
   - **Expect:** two buttons, the chevron and the V. Note the side
     the V shows on, and press Escape. Press on the line and, holding,
     drag out on that side as far as the window allows.
   - **Expect:** the paper stops turning at 120°, however far the
     pointer goes; on release the flap comes to rest leaning on the
     wall, not through it, and no line lights. Click "Undo", then
     click the same line and press its V.
   - **Expect:** the click folds the paper straight to 120°, leaning
     on the wall, not flat.
7. **Do:** click "Unfold", then "Square ½", and stand a corner at 90°
   by a drag from the diagonal line across it, and drag the paper to
   look at it; then click "Presentation" and "Paper Dart".
   - **Expect:** the square's corner stands as in Plan 19; the dart
     folds with its wings standing at the end, exactly as before.
8. **Do:** click "Sandbox", start recording in the Performance panel,
   stand a wall, wait for the paper to rest, click a line, then stop
   recording.
   - **Expect:** the frame in which the paper comes to rest, which
     finds the lines and their limits, takes under 16 ms (one frame at
     60 Hz; a throwaway build took 2 to 3 ms per rest state in Node);
     the click adds no long task, and nothing runs per frame at rest
     afterwards.

## Audit

- **2026-11-14T14:05:33Z** — **drafted**: standing faces left out of "all
  layers", the hinge rule, the side rule once a flap stands, the 3D sweep
  test with 15° snapping, the stage centre over the flat faces, and the
  limits shown by the Fold Buttons and the ring; the ghost left out.
- **2026-11-18T10:51:54Z** — **changed**: the line leaving out the ghost
  preview removed, since Plan 19 dropped the ghost altogether.
- **2026-11-18T11:02:43Z** — **changed**: noted that Plan 19 has no ring, so the
  ring’s part in showing the sweep limit is reworked at review.
- **2026-11-18T11:24:44Z** — **changed**: Plan 19 now keeps nothing
  foldable after a standing fold by a session rule, hasStandingFold(),
  not a trial of the engine, which still cuts folds that leave the
  flap held; Decision 5 and Step 3 name the rule this plan replaces.
- **2026-11-18T13:02:17Z** — **changed**: Decision 6 no longer says no new pose
  arithmetic is needed in general: Plan 19 changed pivotLayers() to
  count held faces at the hinge, so Decision 6 names that pivot, keeps
  “this plan adds no pose arithmetic”, and asks this plan’s review to
  test a standing face’s pull on a second fold’s pivot; a Context line
  says so; a duplicated sentence in Decision 6 removed. At the Lead
  Developer’s request.
- **2026-11-18T20:19:39Z** — **reviewed**: three major issues, open for
  a ruling, measured over a throwaway build of Decisions 1 to 4 on the
  real engine and pose at `3c34e01`. (1) Decisions 3 and 5 conflict:
  a standing fold raises only the smaller side, yet a click or a drag
  stops a fold at a wall, and almost every such stop is on a line
  whose flat fold moves the larger side (0.20 to 1.04 per state after
  one wall, against 0.00 to 0.10 on smaller-side lines), as in Manual
  QA 2 to 4, where the left six spacings fold, not a strip; nothing
  says what a drag short of flat does on a line with no standing fold
  allowed; and mid-fold a larger side reaches 0.168 m, 41% beyond the
  camera’s 0.1189 m sphere, in 75 of 200 random sessions. (2) Decision
  6’s pose fails: a standing flap keeps its own stage’s height, so a
  later fold that slides paper under the stack at its hinge makes paper
  pass through it at rest, in 21 of 200 random sessions (2 of 200 with
  walls at 90° only), up to 0.49 mm; the pivot pull it asked about is
  real (8 of 200, 0.1 to 0.4 mm) but only lifts the flap clear. (3)
  Decision 6’s centres fail: the hinge rule keeps a flap’s hinge, not
  the paper beside it, so its reflected placement can lie over nothing
  and pull the centre, leaving the paper at rest up to 0.1666 m from
  the origin, 40% beyond the sphere, in 13 of 200 sessions; read as
  paper by foldableLines(), it also yields lines whose fold moves
  nothing and throws. Minor fixes: hingePoints() and
  standingPolygons() take (sheet, stage), the session redundant;
  sweepLimitRadians() clips each polygon to the moving side; both 15°s
  are `SNAP_RADIANS`; foldableLines()’s hinges optional; Decision 5
  reworded against the code (a pair with one button hidden, its CSS
  rule, Shift and the arrows capped) and the ring dropped from Context,
  Decision 5, Step 3 and Manual QA 3 and 4; Step 1 Agent QA 1 replaced
  by a fold the old engine refuses, Agent QA 2 hashes all six designs;
  Step 2 Agent QA 1 to 3 re-signed, Agent QA 4 and a fourth criterion
  added, two criteria re-pointed, after mutation testing; Step 3’s
  files (`line-pick.js`, `session.js`, `main.css`, `fast-fold.js`),
  third criterion, Agent QA 1 and 2; Done when’s six designs; Manual
  QA 9 timed at rest. Left for the ruling: Decision 6, Manual QA 2 to
  4 and Done when’s stop against a wall.
- **2026-11-18T20:38:01Z** — **ruled**: the review’s first major issue.
  A fold a wall stops may lean the larger side against it; on a line
  whose moving side is the larger, a fold comes to rest only flat or at
  its sweep limit, never standing free short of flat; by the Lead
  Developer, from the agent’s recommendation. Decisions 3 and 5, Step
  3’s second criterion, Manual QA 2 and 3 (the paper left of the line
  moves, not the strip; a release at 90° still leans on the wall) and
  Done when’s stop say so. Decision 3’s flag still has no Agent QA line.
- **2026-11-18T21:07:24Z** — **ruled**: the review’s first major issue,
  again, superseding
  the ruling at 20:38 once measured: a leaning larger side rested up to
  0.2174 m out, 83% beyond the sphere. Every fold moves the smaller
  side, standing flap or not; by the Lead Developer, from the agent’s
  recommendation. Decision 3 rewritten (the tie rule, letting an equal
  line take the orientation that passes the hinge rule, was proposed
  by the measuring agent); Decision 5’s larger-side clause removed;
  Step 2’s first criterion; Step 3’s criteria re-pointed; Done when;
  Manual QA 2 to 6 rewritten from a measured walk (two walls with a
  flat fold between on Oblong ¼, a stop at 120° on Oblong ½, since
  Oblong ¼ has no stop within three folds), 7 and 8 renumbered.
  Still open for the next review: Step 2’s Agent QA 1, 2 and 4 were
  measured under the old side rule and need re-measuring (the stops in
  1 and 4 are on lines now refused); Step 2’s stop criterion needs an
  Agent QA line with a stop, such as Oblong ½’s 120°; no Manual QA
  step shows a lone button.
- **2026-11-18T21:17:49Z** — **ruled**: the review’s third major issue
  (centres). The
  centres count each face moved by an earlier fold that stops short by
  its flat projection, its shadow, and foldableLines() reads flat faces
  only; by the Lead Developer, from the measuring agent’s
  recommendation over two refusal-based options. Decision 6 rewritten
  for it; the pose, left for the next ruling, moved to Decision 7, its
  Context reference and Manual QA reference updated; Step 1 gains
  stageCentres() and a criterion; Step 3’s `main.js` line names the
  flat faces. Still open for the next review: Step 1’s Agent QA 3 is
  not yet written (Oblong ½, its left half stood at 15° about the
  centre line, then the quarter right of the next upright line folded
  under as a mountain: the rest centre, which was 0.1666 m off with
  every face read).
- **2026-11-18T21:36:33Z** — **ruled**: the review’s second major issue
  (pose). A standing flap rides with the stack at its hinge, and
  pivotLayers() leaves standing faces out; by the Lead Developer, from
  the measuring agent’s recommendation over accepting the crossing or
  refusing the folds that cause it. Decision 7 rewritten (no longer “no pose
  arithmetic”); Step 1 renamed, gains `docs/src/fold/pose.js` and a
  criterion. All three major issues are now ruled. Still open for the
  next review: Step 1’s Agent QA 3 and 4 are not yet written (4: a
  135° wall, then flat folds that slide paper under its hinge, such as
  Oblong ½’s, checked for no crossing at rest), with the Step 2 Agent
  QA re-measuring and the lone-button case named above.
- **2026-11-18T22:00:52Z** — **reviewed**: round 2, no major issues,
  measured over a throwaway build of Decisions 1 to 7 on the real engine
  and pose at `3c34e01`, with 2,400 random sessions, exhaustive searches
  and mutation tests. Step 1 gains Agent QA 3 (the rest centre, with
  the shadow’s sign) and 4 (a valley and a mountain wall riding the
  stack); Step 2’s Agent QA 1 to 4 re-measured under Decision 3 with
  flat faces only, as `main.js` passes them, and gains 5 (a 120° stop
  for both wall types) and 6 (the tie rule and touching contact), its
  first two criteria reworded; Step 3’s first criterion reworded, Agent
  QA 2 gains `pose.js`, Agent QA 3 added. Decision 6’s shadow worded so
  its sign cannot be misread; Decisions 3 and 6’s square reach
  corrected to 0.1197 m; Decision 4 records flap-into-flap crossings
  of up to 0.09 mm at rest from paper thickness; Decision 5 records
  that no state with a lone button was found, so no Manual QA step
  shows one; Context dates the plan’s measurements.
- **2026-11-18T22:15:58Z** — **implemented**: Steps 1 to 3.
  `engine.js`: `"all"` leaves standing faces out, stageCentres()
  counts them by their shadow, and a new export, standingFoldOf(), is
  the one test of a face standing at a stage, which `pose.js`,
  `standing.js` and `main.js` share. `pose.js`: pivotLayers() takes the
  sheet’s folds and a stage, leaves standing faces out, and serves a
  resting flap’s ride with the stack. `standing.js` added; `lattice.js`
  gains the hinge and tie rules; `session.js` loses hasStandingFold().
  `main.js`: limits per rest state, the click, drag and keys capped, a
  line blocked both ways left out, and the rest faces, which also give
  the lines’ inks and picks, flat faces only. `fold-buttons.js` gains
  setHiddenButton(); `fast-fold.js` takes hiddenButtonOf(); `main.css`
  gains the rule. Agent QA: all thirteen lines pass; every design’s
  pose, sampled 64 times a step, hashes as at `3c34e01`. Manual QA
  changed: preconditions untick Fast Fold; 1, 3 and 6 drag from the
  line, not the V button; 6 adds the click to 120°; 7 names the drag.
- **2026-11-18T22:15:58Z** — **verified**: agent checks pass: 8
  changed or new modules parse, no long lines, every changed file
  served with status 200, the vendored checksums match; browser not
  run.
- **2026-11-18T22:29:17Z** — **quality-checked**: Fixed: no fix-tier
  finding; first-run polish of this plan’s new code: `standing.js`’s
  copies of turnSign() and turnAboutLine() removed, `pose.js` exporting
  turnSign() and rotateAboutLine(), which now writes into a vector it is
  given, `point` on the per-frame path, so it still allocates nothing
  (design poses, 64 samples a step, and 1,500 random sessions’ poses
  hash as before, and 11,590 rest states’ lines and limits match);
  holdsHinges()’ arguments A-Z in `lattice.js`; three comments in
  `main.js` reflowed; Step 1 gains Agent QA 5 (a wall’s foot easing
  with the stack mid-fold, which catches a flap taking the next stage’s
  height at once) and its third criterion names it; Step 2 gains Agent
  QA 7 (a 60° stop touching a 150° wall, which catches
  `CONTACT_METERS = 0`) and its second criterion names it; Manual QA 7
  names “Square ½” and its diagonal. Deferred: a pointer over a standing
  wall picks the flat line behind it, since the pick hits the paper’s
  plane (needs a ray test against standingPolygons(), a follow-up);
  pivotLayers() runs three times per standing face per frame, measured
  at 26 µs a pose at most over 3,000 random sessions, too little to
  cache; no state reached a ±Infinity pivot. Verified fine: all 15 Agent QA lines pass; 23 mutants, all
  caught but two equivalent ones (every corner of a flap as a hinge
  point, and touching spans counted as overlapping), which change no
  line or limit over 8,412 exhaustive states of one and two folds; 15,000
  random sessions of up to six folds: no throw, no non-finite pose, no
  lone button, rest state found in 2.6 ms at most; per-frame path
  allocation-free; no Three.js resource, API or loop change; input
  paths (hidden button press, Fast Fold proxy, Shift and arrows, drag
  cap) read and sound; agent checks pass; browser not run.
- **2026-11-23T11:55:29Z** — **done**: several standing folds, the hinge
  and side rules, the sweep test and the limits on screen; the Lead
  Developer’s manual QA passed.
