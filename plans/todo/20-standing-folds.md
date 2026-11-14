---
title: Several standing folds
description: Lets a Sandbox session mix several standing folds with flat ones, keeping standing flaps with their hinge, refusing folds that would move or cross them, and stopping a fold where it would sweep into one, as a stepping stone to the fold tree.
type: plan
---

## Context

- The last of the five Basic Sandbox Mode plans, on
  [Plan 18](./18-fold-angle.md)'s standing folds and
  [Plan 19](./19-export-design.md)'s export, which records every angle
  already. It delivers the research's ruling in
  [Angles](./13-sandbox-mode-research.md#7-angles-several-standing-folds-a-stepping-stone-to-the-fold-tree):
  several standing folds, each left standing by every later fold, with
  a 3D sweep test, as a stepping stone to the fold tree. Everything it
  adds is built to carry over: the sweep test, the limits the Fold
  Buttons and the ring show, and the side rule once a flap stands.
- What it allows, measured in
  [Several standing folds](./13-sandbox-mode-research.md#several-standing-folds):
  two standing folds, such as a pair of wings or two parallel walls,
  with flat folds before and between them; a third almost never fits,
  and a box never does. The fold tree, after its own research, lifts
  the rule that a standing flap's hinge must stay on the held side.
- The ghost preview is not part of this plan.
- Figures marked "measured" were run on 2026-11-14 with the research's
  prototype of these rules over a patched copy of the engine, kept at
  the repo root as `tmp-sandbox-mode-standing.mjs`, which git ignores.
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
   exports hingePoints(session, sheet, stage), the standing flaps'
   hinge ends in the folded plane, and the rule is a test of their
   signed distances from the fold's line.
3. **The side rule once a flap stands**, per the research's ruling: a
   flat fold moves the side that holds no hinge, the smaller when both
   are free; a standing fold always raises the smaller side, which
   keeps the paper at rest within the flat sheet's reach, where raising
   the larger side measured 45% beyond the camera's sphere.
   foldableLines() takes the hinge points and returns, per line, the
   orientation for a flat fold and whether a standing fold is allowed
   on its smaller side.
4. **The sweep test.** standingPolygons(session, sheet, stage) returns
   each standing face as a polygon in 3D, turned about its hinge by its
   fold's angle; sweepLimitRadians(fold, movingPolygons,
   standingPolygons) turns the moving polygons about the fold's line in
   steps of `SWEEP_STEP_RADIANS = π / 60` (3°), up to the fold's angle,
   and returns the last step before any moving polygon crosses any
   standing one, snapped down to 15°; the fold's angle itself when
   nothing crosses. Two polygons cross when their planes' line of
   intersection passes through both interiors by more than
   `CONTACT_METERS = 1e-6`; coplanar or touching polygons never cross,
   so a flat stack's layers never block each other. Paper has no
   thickness in the test.
5. **What the Fold Buttons and the ring show.** A line whose hinge rule
   fails is not foldable: it lights for nothing. A foldable line offers
   a button for each direction whose sweep limit is 15° or more; a
   direction whose limit is below 15° shows no button, so a line
   blocked one way shows its one free button, of the same design as a
   one-way fold. A click folds flat only if the limit is 180°, and
   otherwise to the limit; a drag's ring will not pass the limit, and
   a drag to it folds as far as the paper goes, as a real fold stops
   against a wall. The limits are computed once per rest state with the
   foldable lines, replacing Plan 18's trial of the engine.
6. **The pose and the centres are as they are.** stageCentres() keeps
   reading every face's placement: a standing flap's reflected
   placement lies over the flat paper beside its hinge, which every
   later fold keeps, so it never pulls the paper off centre (measured
   on the two-wall case). writePaperPositions() already leaves a
   face moved by a fold that stops short where that fold put it, and
   writePaperPositions() already leaves a face moved by a fold that
   stops short where that fold put it, and a later flat fold's held
   faces rise by their layers as they do today; with standing faces
   left out of `"all"`, no fold ever lists a standing face among its
   moving ones, so no new pose arithmetic is needed (derived; Manual QA
   2 and 5 watch for a flap that drifts).

## Steps

### Step 1: The engine leaves standing faces out

- Changes `docs/src/fold/engine.js` (applyFold()'s `"all"`; Decision
  1).
- It should cut a flat fold after a standing one, leaving the standing
  flap where it stands (Agent QA 1).
- It should leave every design's sheet exactly as it was
  (Agent QA 2).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; const p = PATTERNS[3]; const W = 0.2121320343559643, H = 0.05303300858899107 * 2; let s = foldAt(createSession(), 0, { from: [0.375 * W, H / 2], targetRadians: Math.PI / 2, to: [0.375 * W, -H / 2], type: "valley" }); s = foldAt(s, 1, { from: [-0.375 * W, -H / 2], targetRadians: Math.PI, to: [-0.375 * W, H / 2], type: "valley" }); const sheet = cutSession(p, s); const standing = sheet.faces.filter((f) => f.movedBy.includes(0)); console.log(sheet.faces.length, standing.length, standing.every((f) => !f.movedBy.includes(1)), sheet.centres.map(([x, y]) => (x / W).toFixed(4)).join());'`
   Expect: `3 1 true 0.0000,0.0000,0.0000` (a wall stood at the right end, then the left end folded flat over: three faces, the wall moved by its own fold only, and the paper stays centred; measured)
2. Do: `node --input-type=module -e 'import { createHash } from "node:crypto"; import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; console.log(createHash("sha256").update(JSON.stringify(DESIGNS.filter((d) => d.id !== "blintz").map((d) => { const s = cutSheet(d); return [s.faces, s.creaseLines, s.centres, s.bridges]; }))).digest("hex").slice(0, 16));'`
   Expect: `e1029fb4c0d55948` (the five designs' faces, creases, centres and bridges, as Plan 16's Agent QA hashes them)

### Step 2: The hinge rule, the side rule and the sweep test

- Adds `docs/src/sandbox/standing.js` (hingePoints(),
  standingPolygons(), sweepLimitRadians(); Decisions 2, 4) and changes
  `docs/src/sandbox/lattice.js` (foldableLines() with the hinge and
  side rules; Decision 3).
- It should refuse every line whose hinge rule fails, and offer the
  rest with the hingeless side moving (Agent QA 1).
- It should stop a fold where it would sweep into a wall, at the angle
  the geometry gives, and leave the other direction free (Agent QA 1,
  2).
- It should leave nothing foldable once two walls stand at the ends
  (Agent QA 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { hingePoints, standingPolygons, sweepLimitRadians } from "./docs/src/sandbox/standing.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const p = PATTERNS[3]; const W = 0.2121320343559643, H = 0.10606601717798213; const s = foldAt(createSession(), 0, { from: [0.375 * W, H / 2], targetRadians: Math.PI / 2, to: [0.375 * W, -H / 2], type: "valley" }); const sheet = cutSession(p, s); const polys = placedPolygons(sheet, 1); const hinges = hingePoints(s, sheet, 1); const walls = standingPolygons(s, sheet, 1); const lines = foldableLines(p, polys, hinges); const deg = (r) => Math.round((r * 180) / Math.PI); console.log(lines.map((l) => { const moving = polys.filter((poly) => poly.some(([x, y]) => (l.to[0] - l.from[0]) * (y - l.from[1]) - (l.to[1] - l.from[1]) * (x - l.from[0]) > 1e-7)); const lim = (type) => deg(sweepLimitRadians({ ...l, targetRadians: Math.PI, type }, moving, walls)); return l.family + l.index + ":" + lim("valley") + "/" + lim("mountain"); }).join(" "));'`
   Expect: `v-3:180/180 v-2:180/180 v-1:180/180 v0:150/180 v1:150/180 v2:135/180` (on the 2:1 quarter lattice with its right end stood up as a wall: the three horizontal lines fail the hinge rule, the three leftmost upright lines are free, and the three nearest the wall stop a valley at 150°, 150° and 135°, where the left side folding over meets the wall's top edge; measured)
2. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { hingePoints } from "./docs/src/sandbox/standing.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const [p] = PATTERNS; const s = foldAt(createSession(), 0, { from: [0, 0.075], targetRadians: Math.PI / 2, to: [0.075, 0], type: "valley" }); const sheet = cutSession(p, s); const lines = foldableLines(p, placedPolygons(sheet, 1), hingePoints(s, sheet, 1)); console.log(lines.map((l) => l.family + l.index).join(","));'`
   Expect: `a-1,a0` (the square's top-right corner stood up: only the far corner's line and the diagonal parallel to the wall survive the hinge rule; measured)
3. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { hingePoints } from "./docs/src/sandbox/standing.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const p = PATTERNS[3]; const W = 0.2121320343559643, H = 0.10606601717798213; let s = foldAt(createSession(), 0, { from: [0.375 * W, H / 2], targetRadians: Math.PI / 2, to: [0.375 * W, -H / 2], type: "valley" }); s = foldAt(s, 1, { from: [-0.375 * W, -H / 2], targetRadians: Math.PI / 2, to: [-0.375 * W, H / 2], type: "valley" }); const sheet = cutSession(p, s); const lines = foldableLines(p, placedPolygons(sheet, 2), hingePoints(s, sheet, 2)); let reach = 0; for (const poly of placedPolygons(sheet, 2)) for (const [x, y] of poly) reach = Math.max(reach, Math.hypot(x, y)); console.log(sheet.faces.length, lines.length, reach < 0.1186);'`
   Expect: `3 0 true` (two walls at the ends: every line between them has a hinge on each side, and the flat paper's reach stays under the flat sheet's; measured)

### Step 3: The limits on screen

- Changes `docs/src/main.js` (limits per rest state, the trial of the
  engine removed), `docs/src/ui/fold-buttons.js` (one button where one
  direction is blocked; the ring capped at the limit) and
  `docs/src/sandbox/pick.js` if the pick needs the limits, per
  Decision 5.
- It should show one button where a direction is blocked, and none
  for a line that fails the hinge rule (Manual QA 2, 4).
- It should stop a click or a drag at the sweep limit, the ring going
  no further (Manual QA 3).
- It should keep folding flat after a wall is up, and stand a second
  wall (Manual QA 2, 5).

**Agent QA**

1. Do: `grep -c "sweepLimitRadians\|hingePoints" docs/src/main.js; grep -c "catch" docs/src/main.js`
   Expect: a count of at least `2`, then `0` (the limits come from the
   rules, and no engine refusal is caught any more)
2. Do: `for f in docs/src/sandbox/standing.js docs/src/sandbox/lattice.js docs/src/fold/engine.js docs/src/ui/fold-buttons.js docs/src/main.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/sandbox/*.js docs/src/fold/engine.js docs/src/ui/fold-buttons.js docs/src/main.js`
   Expect: prints nothing.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser two parallel walls can be raised on the oblong, a fold
between them stops against one, a flat fold is made after a wall is
up, and the five designs play exactly as before.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome, open the dev tools
console, hard-reload (Shift+Cmd+R), click "Sandbox", then "Oblong ¼".
Wait for the pink oblong with its ten lines.

1. **Do:** click the upright line nearest the right-hand end, press
   the V button, drag to 90° and release.
   - **Expect:** the right-hand strip stands up as a wall, towards the
     camera; the paper rests with the wall standing and lines light
     again on the flat part.
2. **Do:** move the pointer across the flat paper.
   - **Expect:** the three lines across the paper, which the wall's
     hinge crosses, never light; the upright lines do. Click the
     upright line next to the wall.
   - **Expect:** two buttons: the chevron and the V both show, since a
     valley there still has room to turn before the wall. Press the
     chevron.
   - **Expect:** the strip folds flat, away from the camera, under the
     paper; the wall stays standing and does not move.
3. **Do:** click "Undo", click the same line, press the V, and drag
   as far as it goes.
   - **Expect:** the ring stops at 135° and will not go further; on
     release the strip folds up and over, towards the wall, and comes
     to rest leaning on the wall's top edge, not through it.
4. **Do:** click "Undo", then click the upright line two spacings left
   of the wall, press the V and drag to the stop.
   - **Expect:** the ring stops at 150°; the longer flap leans on the
     wall's top edge. Click "Undo".
5. **Do:** click the upright line nearest the left-hand end, press
   the V, drag to 90° and release.
   - **Expect:** the left-hand strip stands up as a second wall; now no
     line lights anywhere, and a click shows no buttons: "Undo" is the
     only way on.
6. **Do:** drag the paper round and look along the two walls, then at
   the back.
   - **Expect:** both walls stand straight, with no gap or seam at
     either hinge, and the printed lines run up them.
7. **Do:** click "Export".
   - **Expect:** two steps, each with `"halfTurns": "1/2"`.
8. **Do:** click "Unfold", then on the square pattern stand a corner
   at 90° and drag the paper to look at it; then click "Presentation"
   and "Paper Dart".
   - **Expect:** the square's corner stands as in Plan 18; the dart
     folds with its wings standing at the end, exactly as before.
9. **Do:** click "Sandbox", stand a wall, and record the Performance
   panel while clicking a line.
   - **Expect:** the click's frame computes the limits in well under a
     frame, and nothing runs per frame at rest afterwards.

## Audit

- **2026-11-14T14:05:33Z** — **drafted**: standing faces left out of "all
  layers", the hinge rule, the side rule once a flap stands, the 3D sweep
  test with 15° snapping, the stage centre over the flat faces, and the
  limits shown by the Fold Buttons and the ring; the ghost left out.
