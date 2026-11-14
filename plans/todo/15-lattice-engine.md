---
title: Lattice patterns and the sandbox sheet, in pure maths
description: Adds the four lattice patterns as data, the lattice lines paper crosses at any state with the smaller-side rule, and a session cut as a sheet, all pure and checked in Node, changing nothing the page shows.
type: plan
---

## Context

- The first of five plans that build Basic Sandbox Mode, as the
  [Basic Sandbox Mode research](./13-sandbox-mode-research.md) lays it
  out and its [likely plans](./13-sandbox-mode-research.md#9-the-plans)
  order them. This one delivers the pure maths the mode needs: a
  pattern as data, the lattice lines that paper crosses at a state,
  oriented so the smaller side moves, a session's folds cut into a
  sheet, and the first shape of the JSON design file's coordinates.
- Nothing visible changes: Presentation Mode renders exactly as at
  `9b63c96`, which the Agent QA proves by hashing every design's cut
  sheet. [Plan 16](./16-sandbox-mode.md) then puts a pattern on the page,
  and [Plan 17](./17-sandbox-folds.md) folds it.
- The rulings it builds on, all in the research: a pattern is a square
  lattice on a square or 2:1 sheet
  ([A pattern is a lattice](./13-sandbox-mode-research.md#1-a-pattern-is-a-lattice-and-a-fold-is-a-lattice-line-through-every-layer)),
  the smaller side moves
  ([Which side moves](./13-sandbox-mode-research.md#2-which-side-moves)),
  and the measurements those rest on
  ([Four patterns on a square sheet](./13-sandbox-mode-research.md#four-patterns-on-a-square-sheet),
  [The same four patterns on a 2:1 sheet](./13-sandbox-mode-research.md#the-same-four-patterns-on-a-21-sheet)).
- Figures marked "measured" were run on 2026-11-14 against the engine
  as `9b63c96` leaves it, through synthetic designs, as the research's
  scripts measure.

## Decisions

1. **The engine does not open up; a session is a design.** cutSheet()
   already cuts a sheet from any fold list, through a design of
   `{ aspect, id, steps }` with no `start` and no turn-overs, which is
   how the research measured every figure. So applyFold() stays
   private, and a session is cut by building that design. The one
   engine change is a new export, placedPolygons(), below.
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
   `"d"` (y = x + c), `"h"` or `"v"`, and its `index`, the whole number
   `k` with c = k × spacing; the pair is a transient key for picking,
   never written to a session or a file. A session records a fold by
   its oriented line, as a design's steps do.
4. **A foldable line is a lattice line that paper crosses**, found
   over the faces placed at the sequence position's stage: the lattice
   lines of each family within the placed faces' bounding box, kept if
   their crossing extent over the faces is longer than the engine's
   tolerance. Each carries `family`, `index`, `from` and `to`, the
   extent's two ends on the paper, oriented so that the side to the
   line's left, the moving side, is the smaller by clipped area; equal
   areas take the family's own direction (+y for `"v"`, +x for the
   others). The ends lie on lattice points, since every face edge lies
   on a lattice line or the sheet's edge, which is why
   [Plan 19](./19-export-design.md) can write them as exact fractions.

   ```json
   {
     "family": "a",
     "from": [0, 0.075],
     "index": 1,
     "to": [0.075, 0]
   }
   ```

5. **A session is its fold list**, frozen, in
   `docs/src/sandbox/session.js`: `folds`, each `{ from, to, type,
   targetRadians }` in metres and radians in the folded plane, which is
   the front's frame since a session starts front up and never turns
   over. foldAt(session, position, fold) returns a new session whose
   folds are the first `position` of the old one's, then the new fold:
   an undone tail is dropped. cutSession(pattern, session) returns
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
   line that crosses the sheet, its ends on the sheet's edges, in sheet
   coordinates. The square patterns print 8 and 6 lines, the 2:1
   patterns 14 and 10 (measured). Nothing draws them until Plan 16.
7. **placedPolygons(sheet, stage)** is the engine's one new export: each
   face's polygon placed into the folded plane at a stage, as a new
   array, allocating; the lattice functions take polygons, not faces,
   so they never read a placement themselves.
8. **Reach checks.** Every state at rest fits the camera's sphere,
   0.1211 m, and no reach mid-fold passes 0.1332 m, the sphere with its
   `FRAME_MARGIN` of 1.1, so the paper never leaves the canvas (per the
   research's ruling on the camera). The Agent QA asserts both on the
   2:1 sheet's worst measured fold.

## Steps

### Step 1: Patterns, and the engine's placed polygons [P]

- Adds `docs/src/sandbox/patterns.js` (Decision 2) and changes
  `docs/src/fold/engine.js` (placedPolygons(), Decision 7).
- It should export the four patterns, in the table's order
  (Agent QA 1).
- It should place a face's polygon at any stage, so a design's final
  faces come back as the engine lays them (Agent QA 2).
- It should leave every design's cut sheet exactly as it was
  (Agent QA 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; console.log(PATTERNS.map((p) => [p.id, p.aspect, p.spacingFraction, p.diagonals, p.colorId].join(":")).join(" "), Object.isFrozen(PATTERNS[0]));'`
   Expect: `square-half-diagonals:1:0.5:true:blue square-quarter:1:0.25:false:green oblong-half-diagonals:2:0.5:true:orange oblong-quarter:2:0.25:false:pink true`
2. Do: `node --input-type=module -e 'import { YACHT } from "./docs/src/designs/yacht.js"; import { cutSheet, placedPolygons } from "./docs/src/fold/engine.js"; const s = cutSheet(YACHT); const flat = placedPolygons(s, 0); const last = placedPolygons(s, s.folds.length); console.log(flat.length, flat.every((poly, i) => poly.every(([x, y], j) => x === s.faces[i].polygon[j][0] && y === s.faces[i].polygon[j][1])), last.flat().every(([x, y]) => Math.abs(x) <= 0.0751 && Math.abs(y) <= 0.0751));'`
   Expect: `4 true true` (at stage 0 the placement is the identity; at
   the last stage every corner lies within the flat square)
3. Do: `node --input-type=module -e 'import { createHash } from "node:crypto"; import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; console.log(createHash("sha256").update(JSON.stringify(DESIGNS.map(cutSheet))).digest("hex").slice(0, 16));'`
   Expect: `bf407103fc565b92` (the five designs' sheets at `9b63c96`,
   measured)

### Step 2: The session [P]

- Adds `docs/src/sandbox/session.js`: createSession(), foldAt() and
  cutSession() (Decision 5).
- It should drop an undone tail when a fold is made part-way back
  (Agent QA 1).
- It should cut a session into a sheet that the paper can show: the
  blintz as five faces, four creases, two layers (Agent QA 2).
- It should freeze a session and never change one in place (Agent QA 1).

**Agent QA**

1. Do: `node --input-type=module -e 'import { createSession, foldAt } from "./docs/src/sandbox/session.js"; const f = (x) => ({ from: [x, -1], targetRadians: Math.PI, to: [x, 1], type: "valley" }); const a = foldAt(foldAt(foldAt(createSession(), 0, f(1)), 1, f(2)), 2, f(3)); const b = foldAt(a, 1, f(9)); console.log(a.folds.length, b.folds.map((fold) => fold.from[0]).join(), Object.isFrozen(b), Object.isFrozen(b.folds), Object.isFrozen(b.folds[1]));'`
   Expect: `3 1,9 true true true`
2. Do: `node --input-type=module -e 'import { createHash } from "node:crypto"; import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; const W = 0.15; const f = (from, to) => ({ from: [from[0] * W, from[1] * W], targetRadians: Math.PI, to: [to[0] * W, to[1] * W], type: "valley" }); let s = createSession(); for (const [from, to] of [[[0, 0.5], [0.5, 0]], [[0, -0.5], [-0.5, 0]], [[-0.5, 0], [0, 0.5]], [[0.5, 0], [0, -0.5]]]) s = foldAt(s, s.folds.length, f(from, to)); const sheet = cutSession(PATTERNS[0], s); console.log(sheet.faces.length, sheet.creaseLines.length, Math.max(...sheet.faces.map((x) => x.layers.at(-1))), sheet.designId, createHash("sha256").update(JSON.stringify([sheet.faces, sheet.creaseLines, sheet.centres, sheet.bridges])).digest("hex").slice(0, 16));'`
   Expect: `5 4 2 square-half-diagonals 9c554b19b654ceaa` (the blintz
   from its four corner lines' extents; measured)

### Step 3: The lattice: printed lines, foldable lines, and the smaller side

- Adds `docs/src/sandbox/lattice.js`: printedLines(pattern) (Decision
  6) and foldableLines(pattern, polygons) (Decisions 3, 4), with the
  crossing extent and the clipped areas as private helpers.
- It should print 8, 6, 14 and 10 lines for the four patterns, each
  ending on the sheet's edges (Agent QA 1).
- It should list the same lines as foldable on the flat sheet, and
  fewer as folds use them up (Agent QA 2).
- It should orient every line so the smaller side moves, and a tie by
  the family's direction (Agent QA 2, 3).
- It should make no crease off the lattice and leave no T-junction on
  the blintz, nor on a 2:1 fold in half (Agent QA 2, 4).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { printedLines } from "./docs/src/sandbox/lattice.js"; import { sheetSize } from "./docs/src/designs/sheet.js"; console.log(PATTERNS.map((p) => { const { heightMeters: h, widthMeters: w } = sheetSize(p.aspect); const onEdge = ([x, y]) => Math.abs(Math.abs(x) - w / 2) < 1e-9 || Math.abs(Math.abs(y) - h / 2) < 1e-9; const lines = printedLines(p); return lines.length + ":" + lines.every((l) => l.type === "plain" && onEdge(l.from) && onEdge(l.to)); }).join(" "));'`
   Expect: `8:true 6:true 14:true 10:true`
2. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const [p] = PATTERNS; let session = createSession(); const out = []; for (const key of ["a1", "a-1", "d1", "d-1", "v0"]) { const sheet = cutSession(p, session); const lines = foldableLines(p, placedPolygons(sheet, session.folds.length)); const line = lines.find((l) => l.family + l.index === key); session = foldAt(session, session.folds.length, { from: line.from, targetRadians: Math.PI, to: line.to, type: "valley" }); const next = cutSession(p, session); const after = foldableLines(p, placedPolygons(next, session.folds.length)); out.push(next.faces.length + "/" + after.map((l) => l.family + l.index).join(",") + "/" + [...line.from, ...line.to].map((v) => (v / 0.15).toFixed(2)).join()); } console.log(out.join(" "));'`
   Expect: `2/d-1,a-1,v0,h0,d0,a0,d1/0.00,0.50,0.50,0.00 3/d-1,v0,h0,d0,a0,d1/0.00,-0.50,-0.50,0.00 4/d-1,v0,h0,d0,a0/-0.50,0.00,0.00,0.50 5/v0,h0,d0,a0/0.50,0.00,0.00,-0.50 6/h0,d0,a0/0.00,-0.50,0.00,0.50`
   (the blintz on the square 8-line pattern: faces after each fold,
   the lines still foldable, and each fold's oriented ends as fractions
   of the width, the corner to the line's left; then the centre line,
   whose equal sides take the family's +y; measured)
3. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { createSession, cutSession } from "./docs/src/sandbox/session.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const p = PATTERNS[3]; const lines = foldableLines(p, placedPolygons(cutSession(p, createSession()), 0)); const v3 = lines.find((l) => l.family + l.index === "v3"); console.log(lines.length, v3.from[1] > v3.to[1], (v3.from[0] / 0.2121).toFixed(3));'`
   Expect: `10 true 0.375` (on the 2:1 quarter lattice, the line three
   spacings right of centre runs downwards, so the narrow strip to its
   left, the right-hand end, moves)
4. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { writePaperPositions, maxPaperRadius } from "./docs/src/fold/pose.js"; const p = PATTERNS[2]; const session = foldAt(createSession(), 0, { from: [0, -0.053], targetRadians: Math.PI, to: [0, 0.053], type: "valley" }); const sheet = cutSession(p, session); const n = sheet.faces.reduce((c, f) => c + f.polygon.length, 0); const pos = new Float64Array(3 * n); const reach = (at) => { writePaperPositions(pos, at, sheet); let r = 0; for (let i = 0; i < pos.length; i += 3) r = Math.max(r, Math.hypot(pos[i], pos[i + 1], pos[i + 2])); return r; }; console.log([0, 0.25, 1].map((at) => reach(at).toFixed(4)).join(" "), maxPaperRadius(sheet) < 0.1332, sheet.faces.length);'`
   Expect: `0.1186 0.1252 0.0750 true 2` (the 2:1 sheet folded in half
   across its long side: the reach at rest before and after, its peak a
   quarter of the way through, every reach under 0.1332 m; measured)
5. Do: `for f in docs/src/sandbox/patterns.js docs/src/sandbox/lattice.js docs/src/sandbox/session.js docs/src/fold/engine.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/sandbox/*.js docs/src/fold/engine.js`
   Expect: prints nothing.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and
the page at `http://localhost:1111/` looks and behaves exactly as
before: the hash in Step 1's Agent QA 3 is the visible proof that
Presentation Mode is untouched.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome, open the dev tools
console, and hard-reload (Shift+Cmd+R).

1. **Do:** look at the page.
   - **Expect:** the finished red pencil, no fold lines, no animation,
     and no errors or warnings in the console.
   - **Why:** the engine gained an export; a parse error in `engine.js`
     would stop the whole page.
2. **Do:** click "Heart", then "Paper Dart".
   - **Expect:** each unfolds, stretches, turns and folds exactly as
     before, with its lines showing while it moves and fading out when
     it is finished.
3. **Do:** open the Network panel, filter by `sandbox`, and hard-reload.
   - **Expect:** no file under `src/sandbox/` is requested: nothing on
     the page imports the new modules yet.

## Audit

- **2026-11-14T14:05:33Z** — **drafted**: the four patterns as data, the
  lattice's printed and foldable lines with the smaller-side rule,
  placedPolygons() as the engine's one new export, and the session; Agent QA
  pins the designs' sheets by hash and the blintz by its faces.
