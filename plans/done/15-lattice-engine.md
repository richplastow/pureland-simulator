---
title: Lattice patterns and the sandbox sheet, in pure maths
description: Adds the four lattice patterns as data, the lattice lines paper crosses at any state with the smaller-side rule, and a session cut as a sheet, all pure and checked in Node, changing nothing the page shows.
type: plan
---

## Context

- The first of the six plans, 15 to 20, that build Basic Sandbox Mode,
  as the
  [Basic Sandbox Mode research](../todo/13-sandbox-mode-research.md) lays it
  out and its [likely plans](../todo/13-sandbox-mode-research.md#9-the-plans)
  order them. This one delivers the pure maths the mode needs: a
  pattern as data, the lattice lines that paper crosses at a state,
  oriented so the smaller side moves, and a session's folds cut into a
  sheet, with fold ends exact enough for
  [Plan 19](../todo/19-export-design.md)'s JSON design file to write as
  fractions.
- Nothing visible changes: Presentation Mode renders exactly as at
  `9b63c96`, which the Agent QA proves by hashing every design's cut
  sheet. [Plan 16](./16-sandbox-mode.md) then puts a pattern on the page,
  and [Plan 17](../todo/17-sandbox-folds.md) folds it.
- The rulings it builds on, all in the research: a pattern is a square
  lattice on a square or 2:1 sheet
  ([A pattern is a lattice](../todo/13-sandbox-mode-research.md#1-a-pattern-is-a-lattice-and-a-fold-is-a-lattice-line-through-every-layer)),
  the smaller side moves
  ([Which side moves](../todo/13-sandbox-mode-research.md#2-which-side-moves)),
  and the measurements those rest on
  ([Four patterns on a square sheet](../todo/13-sandbox-mode-research.md#four-patterns-on-a-square-sheet),
  [The same four patterns on a 2:1 sheet](../todo/13-sandbox-mode-research.md#the-same-four-patterns-on-a-21-sheet)).
- Figures marked "measured" were run on 2026-11-14 against the engine
  as `9b63c96` leaves it, through synthetic designs, as the research's
  scripts measure. Every Agent QA expectation was re-run the same day
  against a throwaway prototype of this plan's functions over the real
  engine, as were random walks of up to ten folds on each pattern,
  which found the foldable lines below exactly the lines whose fold
  cutSheet() accepts.

## Decisions

1. **The engine does not open up; a session is a design.** cutSheet()
   already cuts a sheet from any fold list, through a design of
   `{ aspect, id, steps }` with no `start` and no turn-overs, which is
   how the research measured every figure. So applyFold() stays
   private, and a session is cut by building that design. The
   engine's one new function is placedPolygons(), below; it also
   exports, unchanged, its two tolerances (Decision 4) and three pure
   geometry helpers, clipPolygon(), crossingSegment() and signedArea(),
   so the lattice clips, meets and measures from the same source as a
   fold.
2. **A pattern is data**, frozen, in `docs/src/sandbox/patterns.js`:
   `aspect`, 1 or 2; `colorId`, as a design names one; `diagonals`,
   whether both diagonal families are printed; `id`, assigned; and
   `spacingFraction`, the lattice spacing as a fraction of the sheet's
   short side. Cells are square. The four first patterns, per the
   research's ruling, with colours open to retuning by eye:

   | `id`                     | `aspect` | `spacingFraction` | `diagonals` | `colorId` |
   | ------------------------ | -------- | ----------------- | ----------- | --------- |
   | `square-half-diagonals`  | 1        | 0.5               | true        | `blue`    |
   | `square-quarter`         | 1        | 0.25              | false       | `green`   |
   | `oblong-half-diagonals`  | 2        | 0.5               | true        | `orange`  |
   | `oblong-quarter`         | 2        | 0.25              | false       | `pink`    |

   ```json
   {
     "aspect": 2,
     "colorId": "orange",
     "diagonals": true,
     "id": "oblong-half-diagonals",
     "spacingFraction": 0.5
   }
   ```

3. **Lattice lines are not saved and have no ids.** A lattice line is
   named, while it is on screen, by its `family`, `"a"` (y = −x + c),
   `"d"` (y = x + c), `"h"` (y = c) or `"v"` (x = c), with the origin
   at the sheet's centre, and its `index`, the whole number `k` with
   c = k × spacing; the pair is a transient key for picking,
   never written to a session or a file. A session records a fold by
   its oriented line, as a design's steps do.
4. **A foldable line is a lattice line that paper crosses**, with
   paper on both sides of it, found over the faces placed at the
   sequence position's stage: the lattice lines of each family within
   the placed faces' bounding box, kept if the clipped area on each
   side of the line, summed over every face so each layer counts, is
   more than the engine's sliver, `MIN_AREA_SQUARE_METERS` (1e−10 m²).
   A line that only touches the paper, at a corner or along an edge,
   such as the flat sheet's own edges or a fold's folded edge, is not
   foldable: a fold along it would move nothing, which cutSheet()
   refuses.
   - Each carries `family`, `index`, `from` and `to`: the ends of its
     crossing extent, from the first to the last point where the line
     meets any face, corners and edges on the line included, oriented
     so that the side to the line's left, the moving side, is the
     smaller by that clipped area. Areas within
     `MIN_AREA_SQUARE_METERS` of each other are equal, and take the
     family's own direction (+y for `"v"`, +x for the others).
   - Lines come in order of `index`, lowest first, and within an index
     in the family order `"v"`, `"h"`, `"d"`, `"a"`.
   - Every face edge lies on a lattice line, the lattice being closed
     under its own reflections, so the ends lie on lattice points, or
     at a cell's centre where a line of one diagonal family meets an
     edge on the other: each coordinate is a whole multiple of half the
     spacing, which is why [Plan 19](../todo/19-export-design.md) can write
     them as exact fractions.
   - The engine exports its two tolerances, `TOLERANCE_METERS` and
     `MIN_AREA_SQUARE_METERS`, as they are, so the lattice judges a
     side and a sliver exactly as applyFold() does, from one source.

   ```json
   {
     "family": "a",
     "from": [0, 0.075],
     "index": 1,
     "to": [0.075, 0]
   }
   ```

5. **A session is its fold list**, frozen, in
   `docs/src/sandbox/session.js`: `folds`, each `{ from, targetRadians,
   to, type }` in metres and radians in the folded plane, which is
   the front's frame since a session starts front up and never turns
   over. createSession() returns the empty session, `{ folds: [] }`.
   foldAt(session, position, fold) returns a new session whose
   folds are the first `position` of the old one's, then the new fold:
   an undone tail is dropped. Its arguments run as the call reads, the
   session, then where, then what, rather than A-Z, as Plans 17 to 20
   call it. The session, its `folds` and each fold are frozen; the fold
   and its ends are copied, so the caller's arrays are never frozen. A
   `position` that is not a whole number from 0 to the fold count
   throws a RangeError.
   cutSession(pattern, session) returns
   cutSheet() of `{ aspect: pattern.aspect, id: pattern.id, steps }`,
   one createFold() per fold with `"all"` layers.

   ```json
   {
     "folds": [
       {
         "from": [0, 0.075],
         "targetRadians": 3.141592653589793,
         "to": [0.075, 0],
         "type": "valley"
       }
     ]
   }
   ```

6. **Printed lines are the lattice clipped to the flat sheet**, from
   printedLines(pattern): one `{ from, to, type: "plain" }` per lattice
   line with sheet on both sides of it, so the sheet's own edges are
   not printed, its ends on the sheet's edges, in sheet coordinates:
   the lines Decision 4 finds foldable on the flat sheet, in its order
   and orientation. The square
   patterns print 8 and 6 lines, the 2:1 patterns 14 and 10
   (measured). Nothing draws them until Plan 16.

   ```json
   { "from": [0, -0.075], "to": [0, 0.075], "type": "plain" }
   ```

7. **placedPolygons(sheet, stage)** is the engine's one new function,
   beside the existing helpers it exports (Decision 1):
   each face's polygon, in the order of `faces` and corner for corner,
   placed into the folded plane by the face's placement at that stage,
   as a new array, allocating; the lattice functions take polygons,
   not faces, so they never read a placement themselves. The flat
   square sheet at stage 0:

   ```json
   [[[-0.075, -0.075], [0.075, -0.075], [0.075, 0.075], [-0.075, 0.075]]]
   ```

8. **Reach checks.** Every state at rest fits the camera's sphere, and
   no reach mid-fold passes that sphere times main.js's `FRAME_MARGIN`
   of 1.1, so the paper never leaves the canvas (per the research's
   ruling on the camera). The sphere is the largest maxPaperRadius()
   over `DESIGNS`, as main.js works it out: 0.1189 m, the heart's, so
   the limit mid-fold is 0.1308 m (measured; the research's 0.1211 m
   is stale). The flat 2:1 sheet reaches 0.1186 m, inside the sphere
   by 0.3 mm. The Agent QA asserts both limits on the 2:1 sheet folded
   in half along `v0`, the first fold that reaches furthest: 0.1276 m
   mid-fold, as maxPaperRadius() samples it (measured; random walks of
   up to ten folds reached 0.1287 m in deeper states, and never passed
   0.1186 m at rest).

## Steps

### Step 1: Patterns, and the engine's placed polygons

- Adds `docs/src/sandbox/patterns.js` (Decision 2) and changes
  `docs/src/fold/engine.js` (placedPolygons(), Decision 7; its two
  tolerances exported, Decision 4; and clipPolygon(), crossingSegment()
  and signedArea() exported, Decision 1).
- It should export the four patterns, in the table's order
  (Agent QA 1).
- It should place a face's polygon at any stage, so a design's final
  faces come back as the engine lays them (Agent QA 2).
- It should leave every design's cut sheet exactly as it was
  (Agent QA 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; console.log(PATTERNS.map((p) => [p.id, p.aspect, p.spacingFraction, p.diagonals, p.colorId].join(":")).join(" "), Object.isFrozen(PATTERNS[0]));'`
   Expect: `square-half-diagonals:1:0.5:true:blue square-quarter:1:0.25:false:green oblong-half-diagonals:2:0.5:true:orange oblong-quarter:2:0.25:false:pink true`
2. Do: `node --input-type=module -e 'import { YACHT } from "./docs/src/designs/yacht.js"; import { cutSheet, placedPolygons } from "./docs/src/fold/engine.js"; const s = cutSheet(YACHT); const flat = placedPolygons(s, 0); const last = placedPolygons(s, s.folds.length).flat(); const mid = (vs) => (Math.min(...vs) + Math.max(...vs)) / 2; const [cx, cy] = s.centres.at(-1); console.log(flat.length, flat.every((poly, i) => poly.every(([x, y], j) => x === s.faces[i].polygon[j][0] && y === s.faces[i].polygon[j][1])), Math.abs(mid(last.map(([x]) => x)) - cx) < 1e-12 && Math.abs(mid(last.map(([, y]) => y)) - cy) < 1e-12);'`
   Expect: `6 true true` (the yacht's six faces; at stage 0 the
   placement is the identity; at the last stage the faces' bounding
   box is centred on the engine's last stage centre, which cutSheet()
   works out from the same placements; measured)
3. Do: `node --input-type=module -e 'import { createHash } from "node:crypto"; import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; console.log(createHash("sha256").update(JSON.stringify(DESIGNS.map(cutSheet))).digest("hex").slice(0, 16));'`
   Expect: `bf407103fc565b92` (the five designs' sheets at `9b63c96`,
   measured)

### Step 2: The session

- Adds `docs/src/sandbox/session.js`: createSession(), foldAt() and
  cutSession() (Decision 5).
- It should drop an undone tail when a fold is made part-way back
  (Agent QA 1).
- It should cut a session into a sheet that the paper can show: the
  blintz as five faces, four creases, two layers (Agent QA 2).
- It should freeze a session and never change one in place (Agent QA 1).
- It should refuse a position outside the session, leave the caller's
  fold ends unfrozen, and keep each fold's angle (Agent QA 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { createSession, foldAt } from "./docs/src/sandbox/session.js"; const f = (x) => ({ from: [x, -1], targetRadians: Math.PI, to: [x, 1], type: "valley" }); const a = foldAt(foldAt(foldAt(createSession(), 0, f(1)), 1, f(2)), 2, f(3)); const b = foldAt(a, 1, f(9)); console.log(a.folds.length, b.folds.map((fold) => fold.from[0]).join(), Object.isFrozen(b), Object.isFrozen(b.folds), Object.isFrozen(b.folds[1]));'`
   Expect: `3 1,9 true true true`
2. Do: `node --input-type=module -e 'import { createHash } from "node:crypto"; import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; const W = 0.15; const f = (from, to) => ({ from: [from[0] * W, from[1] * W], targetRadians: Math.PI, to: [to[0] * W, to[1] * W], type: "valley" }); let s = createSession(); for (const [from, to] of [[[0, 0.5], [0.5, 0]], [[0, -0.5], [-0.5, 0]], [[-0.5, 0], [0, 0.5]], [[0.5, 0], [0, -0.5]]]) s = foldAt(s, s.folds.length, f(from, to)); const sheet = cutSession(PATTERNS[0], s); console.log(sheet.faces.length, sheet.creaseLines.length, Math.max(...sheet.faces.map((x) => x.layers.at(-1))), sheet.designId, createHash("sha256").update(JSON.stringify([sheet.faces, sheet.creaseLines, sheet.centres, sheet.bridges])).digest("hex").slice(0, 16));'`
   Expect: `5 4 2 square-half-diagonals 9c554b19b654ceaa` (the blintz
   from its four corner lines' extents; measured)
3. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; const from = [0, -0.075]; const s = foldAt(createSession(), 0, { from, targetRadians: 1, to: [0, 0.075], type: "valley" }); const refuses = (position) => { try { foldAt(s, position, s.folds[0]); return false; } catch (error) { return error instanceof RangeError; } }; console.log(Object.isFrozen(from), [-1, 1.5, 2].every(refuses), refuses(1), cutSession(PATTERNS[0], s).folds[0].targetRadians);'`
   Expect: `false true false 1` (the caller's `from` is not frozen;
   positions −1, 1.5 and 2 are refused on a one-fold session, 1 is
   not; the cut sheet keeps the fold's 1 radian)

### Step 3: The lattice: printed lines, foldable lines, and the smaller side

- Adds `docs/src/sandbox/lattice.js`: printedLines(pattern) (Decision
  6) and foldableLines(pattern, polygons) (Decisions 3, 4), with the
  crossing extent and the clipped areas as private helpers.
- It should print 8, 6, 14 and 10 lines for the four patterns, each
  ending on the sheet's edges (Agent QA 1).
- It should list the same lines as foldable on the flat sheet, and
  fewer as folds use them up (Agent QA 2, 3).
- It should orient every line so the smaller side moves, and a tie by
  the family's direction (Agent QA 2, 3, 5).
- It should run each line's ends over its whole crossing extent, an
  edge that only touches the line included (Agent QA 6).
- It should make no crease off the lattice and leave no T-junction on
  the blintz, nor on a 2:1 fold in half (Agent QA 2, 4).
- It should keep the 2:1 sheet folded in half inside the camera's
  sphere at rest, and under the sphere times 1.1 mid-fold (Decision 8;
  Agent QA 4).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { printedLines } from "./docs/src/sandbox/lattice.js"; import { sheetSize } from "./docs/src/designs/sheet.js"; console.log(PATTERNS.map((p) => { const { heightMeters: h, widthMeters: w } = sheetSize(p.aspect); const onEdge = ([x, y]) => Math.abs(Math.abs(x) - w / 2) < 1e-9 || Math.abs(Math.abs(y) - h / 2) < 1e-9; const lines = printedLines(p); return lines.length + ":" + lines.every((l) => l.type === "plain" && onEdge(l.from) && onEdge(l.to)); }).join(" "));'`
   Expect: `8:true 6:true 14:true 10:true`
2. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const [p] = PATTERNS; let session = createSession(); const out = []; for (const key of ["a1", "a-1", "d1", "d-1", "v0"]) { const sheet = cutSession(p, session); const lines = foldableLines(p, placedPolygons(sheet, session.folds.length)); const line = lines.find((l) => l.family + l.index === key); session = foldAt(session, session.folds.length, { from: line.from, targetRadians: Math.PI, to: line.to, type: "valley" }); const next = cutSession(p, session); const after = foldableLines(p, placedPolygons(next, session.folds.length)); out.push(next.faces.length + "/" + after.map((l) => l.family + l.index).join(",") + "/" + [...line.from, ...line.to].map((v) => (v / 0.15).toFixed(2).replace("-0.00", "0.00")).join()); } console.log(out.join(" "));'`
   Expect: `2/d-1,a-1,v0,h0,d0,a0,d1/0.00,0.50,0.50,0.00 3/d-1,v0,h0,d0,a0,d1/0.00,-0.50,-0.50,0.00 4/d-1,v0,h0,d0,a0/-0.50,0.00,0.00,0.50 5/v0,h0,d0,a0/0.50,0.00,0.00,-0.50 6/h0,d0,a0/0.00,-0.50,0.00,0.50`
   (the blintz on the square 8-line pattern: faces after each fold,
   the lines still foldable, and each fold's oriented ends as fractions
   of the width, the corner to the line's left; then the centre line,
   whose equal sides take the family's +y; measured. An end a rounding
   error below zero would print `-0.00`, so the command prints it as
   `0.00`)
3. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { createSession, cutSession } from "./docs/src/sandbox/session.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const p = PATTERNS[3]; const lines = foldableLines(p, placedPolygons(cutSession(p, createSession()), 0)); const v3 = lines.find((l) => l.family + l.index === "v3"); console.log(lines.length, v3.from[1] > v3.to[1], (v3.from[0] / 0.2121).toFixed(3));'`
   Expect: `10 true 0.375` (on the 2:1 quarter lattice, the line three
   spacings right of centre runs downwards, so the narrow strip to its
   left, the right-hand end, moves)
4. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { writePaperPositions, maxPaperRadius } from "./docs/src/fold/pose.js"; const sphere = Math.max(...DESIGNS.map((d) => maxPaperRadius(cutSheet(d)))); const p = PATTERNS[2]; const session = foldAt(createSession(), 0, { from: [0, -0.053], targetRadians: Math.PI, to: [0, 0.053], type: "valley" }); const sheet = cutSession(p, session); const n = sheet.faces.reduce((c, f) => c + f.polygon.length, 0); const pos = new Float64Array(3 * n); const reach = (at) => { writePaperPositions(pos, at, sheet); let r = 0; for (let i = 0; i < pos.length; i += 3) r = Math.max(r, Math.hypot(pos[i], pos[i + 1], pos[i + 2])); return r; }; console.log(sphere.toFixed(4), [0, 1].map((at) => reach(at).toFixed(4)).join(" "), maxPaperRadius(sheet).toFixed(4), reach(0) < sphere && reach(1) < sphere && maxPaperRadius(sheet) < 1.1 * sphere, sheet.faces.length);'`
   Expect: `0.1189 0.1186 0.0750 0.1276 true 2` (the camera's sphere,
   as main.js works it out; then the 2:1 sheet folded in half across
   its long side: the reach at rest before and after, both inside the
   sphere, then the peak over the fold, about a third of the way
   through, under the sphere times 1.1, 0.1308 m; measured)
5. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const [p] = PATTERNS; let session = createSession(); const find = (key) => foldableLines(p, placedPolygons(cutSession(p, session), session.folds.length)).find((l) => l.family + l.index === key); const ends = (l) => l.family + l.index + ":" + [...l.from, ...l.to].map((v) => (v / 0.15).toFixed(2).replace("-0.00", "0.00")).join(); const out = [ends(find("d1"))]; for (const key of ["d0", "h0", "v0", "a0", "d-1"]) { const line = find(key); out.push(ends(line)); session = foldAt(session, session.folds.length, { from: line.from, targetRadians: Math.PI, to: line.to, type: "valley" }); } console.log(out.join(" "));'`
   Expect: `d1:-0.50,0.00,0.00,0.50 d0:-0.50,-0.50,0.50,0.50 h0:0.00,0.00,0.50,0.00 v0:0.00,-0.50,0.00,0.00 a0:0.00,0.00,0.50,-0.50 d-1:0.00,-0.50,0.25,-0.25`
   (on the square 8-line pattern: the flat sheet's `d1`, its corner
   to the left; then `d0`, `h0`, `v0` and `a0` folded in turn, and
   `d-1` after them. `d0`, `a0` and `d-1` have equal sides, so take the
   family's +x, though `d-1`'s left side measures 5e−18 m² larger, a
   tie only the tolerance makes; `h0` and `v0` move the smaller side;
   measured)
6. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const p = PATTERNS[2]; let session = createSession(); const at = () => foldableLines(p, placedPolygons(cutSession(p, session), session.folds.length)); for (const key of ["d1", "d0"]) { const line = at().find((l) => l.family + l.index === key); session = foldAt(session, session.folds.length, { from: line.from, targetRadians: Math.PI, to: line.to, type: "valley" }); } console.log(at().filter((l) => ["h-1", "d-1"].includes(l.family + l.index)).map((l) => l.family + l.index + ":" + [...l.from, ...l.to].map((v) => (v / 0.2121).toFixed(2).replace("-0.00", "0.00")).join()).join(" "));'`
   Expect: `h-1:0.50,-0.25,-0.25,-0.25 d-1:0.50,0.25,-0.25,-0.50` (the
   2:1 diagonal pattern with `d1` then `d0` folded, ends as fractions of
   the width: each line splits only some faces, and runs on along edges
   of others that lie on it, such as the sheet's old bottom edge for
   `h-1`; measured)
7. Do: `for f in docs/src/sandbox/patterns.js docs/src/sandbox/lattice.js docs/src/sandbox/session.js docs/src/fold/engine.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/sandbox/*.js docs/src/fold/engine.js`
   Expect: prints nothing.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and
the page at `http://localhost:1111/` looks and behaves exactly as
before: the hash in Step 1's Agent QA 3 proves that every design's
sheet, and so Presentation Mode, is untouched.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome, open the dev tools
console, and hard-reload (Shift+Cmd+R).

1. **Do:** look at the page.
   - **Expect:** the finished red pencil, no fold lines, no animation,
     and no errors or warnings in the console.
   - **Why:** the engine gained an export; a parse error in `engine.js`
     would stop the whole page.
2. **Do:** click "Heart", then "Paper Dart", and do the same on the
   live site, `https://richplastow.com/pureland-simulator/`, in a
   second tab.
   - **Expect:** each unfolds, stretches, turns and folds exactly as
     on the live site, with its lines showing while it moves and
     fading out when it is finished, and the console stays clear.
3. **Do:** open the Network panel, filter by `sandbox`, and hard-reload.
   - **Expect:** no file under `src/sandbox/` is requested: nothing on
     the page imports the new modules yet.
4. **Do:** in device mode, choose a phone such as iPhone 12 Pro
   (390 × 844), reload, and click "Heart".
   - **Expect:** the pencil shows finished on load and the heart folds
     as on the desktop, with no errors or warnings in the console.

## Audit

- **2026-11-14T14:05:33Z** — **drafted**: the four patterns as data, the
  lattice's printed and foldable lines with the smaller-side rule,
  placedPolygons() as the engine's one new export, and the session; Agent QA
  pins the designs' sheets by hash and the blintz by its faces.
- **2026-11-14T14:26:43Z** — **reviewed**: no Major finding; every Agent
  QA line run against a scratch prototype over the real engine, with random
  walks on all four patterns. Fixed: Decision 4 keeps a line only with paper
  on both sides (the extent test listed sheet and folded edges, which
  cutSheet() refuses), names the tie tolerance, layer-summed areas and the
  output order, and corrects "ends on lattice points" to half-spacing
  multiples (cell centres occur); the engine exports its two tolerances
  (Decisions 1, 4, 7); Decision 3 gives `h`/`v` equations; Decision 5 adds
  createSession(), freezing and A-Z keys, and keeps foldAt()'s order for
  Plans 17 to 20; JSON examples for a printed line and placed polygons;
  Decision 8 and Step 3 Agent QA 4 give the fold's real peak, 0.1276 m at
  about a third, not 0.1252 m at a quarter; Step 1 Agent QA 2 expected
  `4 true true` but the yacht has six faces outside the flat square, now
  checked against the engine's stage centre; Step 3 Agent QA 2 prints
  `-0.00` as `0.00`; Step 3 gains a reach criterion; `[P]` dropped from
  Steps 1 and 2 (Step 2's QA imports Step 1's patterns); Context says six
  plans; Manual QA 2 compares with the live site and step 4 adds a phone.
- **2026-11-14T14:35:03Z** — **reviewed**: round 2, no Major finding; a
  fresh prototype from the plan's words passes all nine Node Agent QA
  lines, and random walks found the foldable lines exactly the lattice
  lines whose fold moves part of the paper, ends on half-spacing
  multiples and no near-ties. Fixed: the camera's sphere is 0.1189 m
  (the heart's, as main.js works it out), not the research's stale
  0.1211 m, so Decision 8, Step 3 criterion 5 and Step 3 Agent QA 4
  now use it and its 0.1308 m limit, the QA computing the sphere from
  `DESIGNS` and expecting `0.1189 0.1186 0.0750 0.1276 true 2`;
  Decision 6 gives printed lines Decision 4's order and orientation.
- **2026-11-14T14:39:41Z** — **implemented**: Steps 1 to 3. Added
  `docs/src/sandbox/patterns.js`, `session.js` and `lattice.js`; changed
  `docs/src/fold/engine.js` (exports `MIN_AREA_SQUARE_METERS` and
  `TOLERANCE_METERS` unchanged, and adds placedPolygons() over the private
  place()). All nine Node Agent QA lines pass as written; each failed first
  for the expected reason (missing module or export), except Step 1 Agent
  QA 3, a regression guard that passes at HEAD by design. foldAt() also
  copies the fold's ends, so the caller's arrays are never frozen, and
  throws a RangeError for a position outside 0 to the fold count. A random
  walk of 1,249 states over all four patterns found no fold cutSheet()
  refuses, no T-junction, every end a half-spacing multiple, and the
  smaller side always moving. Manual QA unchanged: walked against
  `index.html` and the imports, still true.
- **2026-11-14T14:40:03Z** — **verified**: agent checks pass: 4 changed or
  new modules parse, no line over 80 columns, `/` and every changed file
  served with status 200 (a server started for the check, then stopped),
  vendored checksums match; browser not run.
- **2026-11-14T14:41:39Z** — **ruled**: by the orchestrator, `engine.js`
  also exports its clipPolygon(), pointBetween() and signedArea(),
  unchanged, and `lattice.js` imports them in place of private copies,
  for one source of truth; Decision 1's purpose, that applyFold() stays
  private and a session is cut through cutSheet(), still holds, as with
  the tolerances. Decisions 1 and 7 and Step 1's first bullet name the
  exports. The Lead Developer can overturn this ruling.
- **2026-11-14T14:42:11Z** — **verified**: after the ruling, all nine Node
  Agent QA lines pass unchanged, hash `bf407103fc565b92` included; agent
  checks pass: 4 changed or new modules parse, no line over 80 columns,
  `/` and every changed file served with status 200 (a server started for
  the check, then stopped), vendored checksums match; browser not run.
- **2026-11-14T14:50:25Z** — **quality-checked**: Fixed: under the
  orchestrator's ruling extended to it, `lattice.js`'s private
  meetingPoints(), line for line the engine's private crossingSegment(),
  is deleted, and `engine.js` exports crossingSegment(), body unchanged,
  placed A-Z among the exports, its doc comment noting the export and the
  touching and missing cases; pointBetween() then had no importer, so it
  is private again, back in its original place, and Decision 1 and Step
  1's first bullet name clipPolygon(), crossingSegment() and
  signedArea(); `lattice.js` constants put in A-Z order; Decision 5 now
  states foldAt()'s copying and RangeError. Mutation testing found five
  mutants no QA caught, each a defect a later plan would meet: a dropped
  tie tolerance (reverses `d-1` after `d0`, `h0`, `v0`, `a0`, whose sides
  differ by 5e−18 m²), flipped `h` and `d` sides, an extent taken only
  from split faces, and foldAt() freezing the caller's ends, skipping its
  range check or losing `targetRadians`; Step 2 gains criterion 4 and
  Agent QA 3, Step 3 gains criterion 4 (the extent) and Agent QA 5 and
  6, cites QA 5 in criterion 3, and its checks line becomes Agent QA 7. Deferred: the
  tolerance on foldableLines()' first and last index is redundant (a
  line on the bounding box never passes the area test; equivalent
  mutant), kept as it is the lattice's one direct use of
  `TOLERANCE_METERS` and its removal would reopen Decision 4's exports;
  an unnormalised diagonal side is an equivalent mutant (it only
  rescales the tolerance band); line ends are not snapped to half-spacing
  multiples, for Plan 19 to round; placedPolygons() given a stage past
  the fold count throws a TypeError, unguarded as no caller does so.
  Verified fine: all 13 Agent QA lines pass, hash `bf407103fc565b92`
  included; a random walk of 29,293 states over the four patterns found
  no foldable line cutSheet() refuses; no import of `src/sandbox/`
  outside it, so Manual QA 1 to 4 stand unchanged; no Three.js, scene,
  per-frame, disposal or resize code touched, so no Three.js sweep; agent
  checks pass (4 modules parse, no line over 80 columns, `/` and every
  changed file served with status 200 by a server started for the check
  and stopped, vendored checksums match); browser not run.
- **2026-11-14T15:05:18Z** — **done**: the patterns, session, lattice and
  placedPolygons() landed with every Agent QA line passing; the Lead
  Developer’s manual QA passed on desktop, beside the live site, and at a
  phone-sized viewport.
