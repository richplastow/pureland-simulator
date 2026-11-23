---
title: Gameplay Mode's maze, in pure maths
description: Adds the list of Gameplay designs, a path of a design's folds cut as a sheet, and each design's graph of states, all pure and checked in Node, changing nothing the page shows.
type: plan
---

## Context

- The first of the four plans, 22 to 25, that build Basic Gameplay
  Mode, the game the
  [Gameplay Mode research](./14-gameplay-mode-research.md) sets out and
  its [likely plans](./14-gameplay-mode-research.md#8-likely-plans)
  order. This one delivers the pure maths: which designs the mode
  offers, a path of a design's folds cut as a sheet, and each design's
  maze as a graph of states. [Plan 23](./23-gameplay-mode.md) puts the
  mode on the page, [Plan 24](./24-gameplay-folds.md) folds it, and
  [Plan 25](./25-gameplay-game.md) adds dead ends, lives, hints and
  points.
- Basic Gameplay Mode is the research's game at its smallest. Every
  fold line folds one way only, a mountain or a valley, so the order is
  the whole puzzle; plain lines and a choice of direction
  ([the brief](./14-gameplay-mode-research.md#plain-lines-and-a-choice-of-direction))
  wait for a later batch.
- Nothing visible changes: no page module imports the new files, which
  the Agent QA proves, so Presentation Mode and Sandbox Mode run
  exactly as at `d710f9d`.
- Needed because the game is a walk through a maze, and the maze must
  be known, state by state, before a Fold Button can be offered or a
  dead end judged.
- Its terms are the research's
  ([Results](./14-gameplay-mode-research.md#results)): a **live** state
  can still reach the goal and a **doomed** one cannot; a **dead end**
  is a state, not the goal, with no fold available; a **trap** is a fold
  from a live state into a doomed one.
- Figures marked "measured" were run on 2026-11-23, in Node 25.8.0 on
  the Lead Developer's Mac, against the engine as `d710f9d` leaves it.
  Every Agent QA expectation was run the same day against a throwaway
  prototype of this plan's functions over the real engine, kept at the
  repo root as `tmp-gameplay-mode-basic.mjs`, which git ignores:
  `node tmp-gameplay-mode-basic.mjs` prints each design's figures, and
  `detail` after it adds its traps and dead ends.

## Decisions

1. **Basic Gameplay Mode offers four designs, easiest first:** the
   blintz, the yacht, Mount Fuji and the paper dart. The pencil and the
   heart stay Presentation Mode's alone. `docs/src/designs/list.js`
   exports them as `GAMEPLAY_DESIGNS`, frozen, beside `DESIGNS`, whose
   entries they are. Measured, under Decisions 4 and 5:

   | Design | Folds | States | Edges | Live | Dead ends | Traps | Orderings | Build |
   | --- | --- | --- | --- | --- | --- | --- | --- | --- |
   | Blintz | 4 | 16 | 32 | 16 | 0 | 0 | 24 | 3 ms |
   | Yacht | 3 | 4 | 3 | 4 | 0 | 0 | 1 | 1 ms |
   | Mount Fuji | 4 | 15 | 17 | 7 | 3 | 2 | 4 | 4 ms |
   | Paper dart | 7 | 86 | 103 | 13 | 29 | 23 | 12 | 44 ms |
   | Pencil, left out | 6 | 161 | 192 | 9 | 39 | 9 | 4 | 149 ms |
   | Heart, left out | 11 | 65 | 145 | 65 | 0 | 0 | 2,268 | 220 ms |

   - **The blintz is the training level.** Its four corners fold in any
     order, so no press can be wrong, and all four Fold Buttons show at
     once.
   - **The yacht is the second lesson**: one order, one Fold Button at a
     time, so it shows that a fold can wait on another, and starts
     white side up.
   - **Mount Fuji is the first maze**: two traps, each a slope folded
     before the middle, and each exactly two folds from its dead end.
   - **The paper dart is the real maze**: four of the flat sheet's six
     folds are traps, and every trap's nearest dead end lies within two
     further folds, its furthest within four.
   - **The pencil is left out** as unfair: half the flat sheet's folds
     are traps, and all 39 dead ends arrive only at the sixth fold, up
     to five folds after the mistake, with nothing to say where it was.
   - **The heart is left out** as long and flat: eleven folds, 2,268
     orders and not one trap.
   - More playable designs are a
     [backlog item](./backlog/20261123-more-gameplay-designs.md).
2. **The engine stays closed; a path is a design.** As
   [Plan 15's Decision 1](../done/15-lattice-engine.md#decisions) has a
   session cut, cutPath(sheet, path, isFinished) in the new
   `docs/src/gameplay/path.js` builds a design of `{ aspect, id, steps }`
   with no `start` and no turn-overs, and cuts it with cutSheet().
   - `sheet` is the design's own, from cutSheet(design), whose `folds`
     are already in the front's terms, so nothing is read through a view
     frame twice. `path` lists indices in `sheet.folds`, each at most
     once, in the order folded.
   - A fold's `layers` name a fold by its index in the design; cutPath()
     renames it to that fold's place in the path. A `{ movedBy }` naming
     a fold not yet in the path throws a RangeError, since its paper is
     not there to move; a `{ heldBy }` naming one becomes `"all"`, since
     nothing is yet moved by it. A fold index repeated, or outside
     `sheet.folds`, throws a RangeError too.
   - The cut sheet then takes the design's `start` and `leanRadians`, so
     it sits in the design's starting pose; `printedLines`, the design's
     whole `creaseLines`, never the creases its path happens to make;
     and `finishedPosition`, `path.length` if `isFinished` and null
     otherwise, so the stepper fades its lines out only at the goal
     ([the research](./14-gameplay-mode-research.md#4-where-a-gameplay-sheet-finishes)).
     Its `designId` is the design's.
   - The stage centres come from the unrolled frame. That matches the
     design's own for a start that is only a side, as all four Gameplay
     designs' are; a rolled design's would differ slightly, and none is
     offered.

   What a gameplay sheet of the yacht, cut along its whole path, carries
   beside what cutSheet() returns, the first of its five printed lines
   shown and its lean rounded:

   ```json
   {
     "designId": "yacht",
     "finishedPosition": 3,
     "leanRadians": 0.2531,
     "printedLines": [
       { "from": [0.075, -0.075], "to": [-0.075, 0.075], "type": "mountain" }
     ],
     "start": { "rollRadians": 0, "side": "back" }
   }
   ```

3. **Every Gameplay fold turns its moving side only.** cutPath() gives
   each step `turns: "moving-side"`, whatever the design says. The paper
   dart's centre fold is `"both-sides"` in Presentation Mode, which
   stands the folded dart edge-on to the viewer, off the folded plane;
   but the Sandbox's picking, lit lines and Fold Buttons, which
   [Plan 24](./24-gameplay-folds.md) reuses, all read the paper in that
   plane (`docs/src/input/pick.js`: "At rest every flat fold lies in
   that plane", read 2026-11-23). So in Gameplay Mode the dart folds in half as on a
   table, its left half over its right, its wing lines facing the
   player. The finished dart then rests on its side, one wing towards
   the viewer, to be turned by a drag. The states and the goal are
   unchanged, since `turns` moves no face in the folded plane.
4. **A fold is available under the printed rule**
   ([working assumption 1](./14-gameplay-mode-research.md#working-assumptions)):
   it makes at least one crease, and every crease it makes lies, end to
   end, along the creases the design prints for that fold, which may be
   several collinear pieces. The creases printed for fold *f* are those
   the design's own order adds at *f*. A crease lies on a line within
   the engine's `TOLERANCE_METERS`. A path cutPath() throws on, because
   a fold moves nothing or a selection names a fold not yet made, is
   not available: the engine's refusal is the test, as it was for every
   figure the research measured.
5. **The standing rule: once a fold stands, only standing folds
   follow.** A fold that stops short of 180° (stopsShort() in
   `docs/src/fold/engine.js`), such as a dart's wing at 90°, is never
   followed by a flat fold. Real paper is not pressed flat round a
   standing flap, and the engine would leave the flap behind as the
   paper beside its hinge moved. Under it, a dart's wing folded before
   the centre fold is a dead end at once, and the dart's orders are the
   twelve the
   [brief's own description](./14-gameplay-mode-research.md#the-traps-design-by-design)
   gives: the corners either way, each edge after its corner, the
   centre, then the wings either way. Without it, ten more orders fold a
   wing before the centre (22 in all, measured).
6. **Two states are one when the engine could not tell them apart:**
   the same folds made, and faces that pair off one for one, each pair
   with the same corners in the folded plane, to within
   `TOLERANCE_METERS` and in the same cyclic order, the same layer, and
   the same folds having moved it. Compared, not rounded into a key: a
   rounding boundary falls on some binary fraction of the sheet at any
   precision, and would split one state into two, one of them wrongly
   not the goal. The research's notion of one state
   ([Measurements](./14-gameplay-mode-research.md#measurements)) plus
   the moving folds, which decide what a later `{ movedBy }` selects;
   adding them changes no figure (measured).
7. **The graph is the whole maze, doomed states included.**
   buildGraph(sheet), in the new `docs/src/gameplay/graph.js`, takes the
   design's own sheet and explores every available fold from the flat
   sheet, breadth first, trying folds in index order.
   - A node's `id` is assigned in the order it is found, so the flat
     sheet is node 0; its `path` is the first path found to it; its
     `edges` come in fold order.
   - The goal is the node the design's own order leads to;
     buildGraph() throws, naming the design and the fold, if that order
     cannot be made, so a design the rules break fails loudly at load.
   - A node `isLive` if it is the goal or has an edge to a live node.
   - `radiusMeters` is the furthest any point of the paper reaches at
     any state or during any fold of the graph: the largest
     maxPaperRadius() of every edge's cut.
   - The research proposed building only the live states and judging
     the rest as the player goes
     ([the live graph](./14-gameplay-mode-research.md#2-the-live-graph-and-availability-on-the-fly)),
     because a choice of direction would double every doomed subtree.
     With one-way lines the whole graph is at most 86 states and builds
     in 44 ms (measured), so every judgement is a lookup. It stays
     enumerable if a choice of direction arrives: a wrong direction is a
     dead end at once
     ([the research](./14-gameplay-mode-research.md#6-the-game-layer)),
     so it adds one leaf per edge, never a subtree.

   The paper dart's graph, its first node and the first two of that
   node's six edges shown, with coordinates and the radius rounded:

   ```json
   {
     "designId": "paper-dart",
     "foldCount": 7,
     "goalNodeId": 83,
     "nodes": [
       {
         "edges": [
           {
             "fold": 0,
             "from": [-0.075, 0],
             "nodeId": 1,
             "targetRadians": 3.141592653589793,
             "to": [0, 0.075],
             "type": "valley"
           },
           {
             "fold": 1,
             "from": [0, 0.075],
             "nodeId": 2,
             "targetRadians": 3.141592653589793,
             "to": [0.075, 0],
             "type": "valley"
           }
         ],
         "id": 0,
         "isLive": true,
         "path": []
       }
     ],
     "radiusMeters": 0.1124
   }
   ```

8. **An edge carries its Fold Line.** `from` and `to`, `[x, y]` in
   metres in the folded plane at the edge's node, are the ends of the
   fold's crossing of the faces it moves: the first and last points,
   along the fold's line, of every edge of a moved face that lies on
   the line once the fold is cut. They run the way the fold's own
   `from` and `to` run, so the side to the line's left moves, as
   foldableLines() orients a lattice line. With `type`, in the front's
   terms, and `targetRadians`, the design's angle, the edge is a line
   the Sandbox's code can light, pick and fold, as Plan 24 does.
9. **The graph and everything in it are frozen**, and both modules are
   pure: no DOM, no GPU, no `three`, so Node runs them.
10. **No graph outreaches the camera.** The four graphs' `radiusMeters`
    are 0.1061, 0.1069, 0.1090 and 0.1124 m, all inside the 0.1189 m the
    designs' own sheets set (the heart's), so Plan 23 can take the
    camera's radius from the graphs too and move nothing (measured).

## Steps

### Step 1: The Gameplay designs, and a path cut as a sheet [P]

- Changes `docs/src/designs/list.js` (`GAMEPLAY_DESIGNS`) and adds
  `docs/src/gameplay/path.js` (cutPath()), per Decisions 1 to 3.
- It should list the four Gameplay designs, in order, as frozen entries
  of `DESIGNS` (Agent QA 1).
- It should cut a path in any available order into a sheet in the
  design's starting pose and lean, printing the design's whole crease
  pattern, finished only when told so (Agent QA 2, 3).
- It should turn only the moving side of every fold, the dart's centre
  fold included, and leave the design's own sheet as it was
  (Agent QA 2).
- It should rename each fold's `layers` to the path's order, treat a
  `{ heldBy }` not yet made as `"all"`, and throw a RangeError for a
  `{ movedBy }` not yet made, a repeated fold or an unknown one
  (Agent QA 2, 4).

**Agent QA**

1. Do: `node --input-type=module -e 'import { DESIGNS, GAMEPLAY_DESIGNS } from "./docs/src/designs/list.js"; console.log(GAMEPLAY_DESIGNS.map((d) => d.id).join(" "), GAMEPLAY_DESIGNS.every((d) => DESIGNS.includes(d)), Object.isFrozen(GAMEPLAY_DESIGNS));'`
   Expect: `2f0a6b7e-3c1d-4e8f-9a2b-6c5d4e3f2a1b yacht mount-fuji paper-dart true true`
2. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { cutPath } from "./docs/src/gameplay/path.js"; const sheet = cutSheet(DESIGNS.find((d) => d.id === "paper-dart")); const cut = cutPath(sheet, [1, 0, 3, 2, 4, 6, 5], true); console.log(cut.finishedPosition, cut.steps.length, cut.faces.length, cut.designId, cut.folds.every((f) => f.turns === "moving-side"), sheet.folds[4].turns, cut.folds[5].layers.heldBy, cut.folds[6].layers.movedBy, cut.printedLines === sheet.creaseLines, cut.start === sheet.start, cut.leanRadians === sheet.leanRadians, cut.centres[5][0].toFixed(4), sheet.centres[5][0].toFixed(4));'`
   Expect: `7 7 16 paper-dart true both-sides 4 4 true true true 0.0311 0.0000`
   (the dart, right corner first and the right wing before the left:
   finished at 7, sixteen faces as the design's own; the wings' layers
   name the centre fold's place in the path; and after the centre fold
   the paper has slid 31.1 mm to stay centred, where the design's own
   sheet, turning both sides, keeps its centre)
3. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { cutPath } from "./docs/src/gameplay/path.js"; const sheet = cutSheet(DESIGNS.find((d) => d.id === "yacht")); const cut = cutPath(sheet, [], false); console.log(cut.finishedPosition, cut.folds.length, cut.faces.length, cut.printedLines.length, cut.start.side, cut.leanRadians.toFixed(4));'`
   Expect: `null 0 1 5 back 0.2531` (the yacht's flat gameplay sheet: never
   finished, no folds, one face, its five printed creases, white side
   up, leaning)
4. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { cutPath } from "./docs/src/gameplay/path.js"; const sheet = cutSheet(DESIGNS.find((d) => d.id === "paper-dart")); for (const path of [[6], [5], [0, 0], [7]]) { try { console.log(cutPath(sheet, path, false).folds.map((f) => JSON.stringify(f.layers)).join()); } catch (e) { console.log(e.name); } }'`
   Expect: four lines: `"all"`, `RangeError`, `RangeError`, `RangeError`
   (the right wing alone folds every layer; the left wing needs the
   centre fold first; a fold repeated; a fold the dart lacks)
5. Do: `node --check docs/src/gameplay/path.js && node --check docs/src/designs/list.js; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/gameplay/path.js docs/src/designs/list.js`
   Expect: prints nothing.

### Step 2: The graph of states

- Adds `docs/src/gameplay/graph.js` (buildGraph()), per Decisions 4 to
  10.
- It should find each design's states, edges, live states, dead ends,
  traps and orders exactly as Decision 1's table has them, with the
  goal where the design's own order leads (Agent QA 1).
- It should offer, at each state, only the folds the printed rule and
  the standing rule allow, so a wing folded before the dart's centre
  fold is a dead end at once (Agent QA 2).
- It should give each edge its Fold Line, its fold's type and angle,
  and the node it leads to (Agent QA 3).
- It should measure how far the paper reaches over the whole graph,
  inside the designs' own 0.1189 m, and freeze the graph through and
  through (Agent QA 4).
- It should throw, naming the design and the fold, when a design's own
  order cannot be made (Agent QA 5).
- It should change nothing the page loads (Agent QA 6; Manual QA 1 to
  3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { GAMEPLAY_DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { buildGraph } from "./docs/src/gameplay/graph.js"; for (const design of GAMEPLAY_DESIGNS) { const g = buildGraph(cutSheet(design)); const n = g.nodes; const count = (id) => (id === g.goalNodeId ? 1 : 0) + n[id].edges.reduce((sum, e) => sum + count(e.nodeId), 0); console.log(g.designId.slice(0, 10), g.foldCount, n.length, n.reduce((sum, { edges }) => sum + edges.length, 0), n.filter(({ isLive }) => isLive).length, n.filter(({ edges, id }) => edges.length === 0 && id !== g.goalNodeId).length, n.filter(({ isLive }) => isLive).flatMap(({ edges }) => edges).filter(({ nodeId }) => !n[nodeId].isLive).length, count(0), g.goalNodeId, n[g.goalNodeId].path.join("")); }'`
   Expect: four lines, each a design's id cut to ten characters, then
   its folds, states, edges, live states, dead ends, traps, orders,
   goal node and the goal's path:
   `2f0a6b7e-3 4 16 32 16 0 0 24 15 0123`,
   `yacht 3 4 3 4 0 0 1 3 012`,
   `mount-fuji 4 15 17 7 3 2 4 11 0123` and
   `paper-dart 7 86 103 13 29 23 12 83 0123456`
2. Do: `node --input-type=module -e 'import { GAMEPLAY_DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { buildGraph } from "./docs/src/gameplay/graph.js"; const show = (g, id) => g.nodes[id].edges.map((e) => e.fold + (g.nodes[e.nodeId].isLive ? "" : "x")).join(","); const at = (g, path) => path.reduce((id, f) => g.nodes[id].edges.find((e) => e.fold === f).nodeId, 0); const [, , fuji, dart] = GAMEPLAY_DESIGNS.map((d) => buildGraph(cutSheet(d))); console.log(show(dart, 0), "|", show(dart, at(dart, [0, 1, 2, 3])), "|", show(dart, at(dart, [0, 1, 2, 3, 4])), "|", show(dart, at(dart, [6])), "|", show(dart, at(dart, [4])), "|", show(fuji, 0), "|", show(fuji, at(fuji, [0])), "|", show(fuji, at(fuji, [1])));'`
   Expect: `0,1,2x,3x,4x,6x | 4,6x | 5,6 |  | 5x,6x | 0,1 | 1,2x,3x | 0`
   (each state's folds, `x` marking a trap or a doomed fold: the flat
   dart; the dart before its centre fold, where the right wing is a
   trap; after it, where both wings are right; after a wing first, a
   dead end; after the centre first; then the flat Mount Fuji, Fuji
   after the snow, and after the middle)
3. Do: `node --input-type=module -e 'import { GAMEPLAY_DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { buildGraph } from "./docs/src/gameplay/graph.js"; const g = buildGraph(cutSheet(GAMEPLAY_DESIGNS[3])); const at = (path) => path.reduce((id, f) => g.nodes[id].edges.find((e) => e.fold === f).nodeId, 0); const mm = ([x, y]) => [x, y].map((v) => (Math.round(v * 1e4) / 10 + 0).toFixed(1)).join(); for (const e of [...g.nodes[at([0, 1, 2, 3, 4])].edges, g.nodes[at([0])].edges[1]]) console.log(e.fold, e.type, (e.targetRadians / Math.PI).toFixed(2), mm(e.from), mm(e.to), e.nodeId, Object.keys(e).join());'`
   Expect: three lines:
   `5 valley 0.50 0.0,75.0 29.8,-75.0 73 fold,from,nodeId,targetRadians,to,type`,
   `6 mountain 0.50 0.0,75.0 29.8,-75.0 74 fold,from,nodeId,targetRadians,to,type`
   and
   `2 valley 1.00 -62.1,-75.0 0.0,75.0 8 fold,from,nodeId,targetRadians,to,type`
   (the two wings share one line once the dart is folded in half, a
   valley and a mountain, each a quarter turn; the left edge's line
   runs the sheet's height, in millimetres)
4. Do: `node --input-type=module -e 'import { DESIGNS, GAMEPLAY_DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius } from "./docs/src/fold/pose.js"; import { buildGraph } from "./docs/src/gameplay/graph.js"; const graphs = GAMEPLAY_DESIGNS.map((d) => buildGraph(cutSheet(d))); const g = graphs[3]; console.log(graphs.map((x) => x.radiusMeters.toFixed(4)).join(" "), Math.max(...DESIGNS.map((d) => maxPaperRadius(cutSheet(d)))).toFixed(4), [g, g.nodes, g.nodes[0], g.nodes[0].edges, g.nodes[0].edges[0], g.nodes[0].edges[0].from, g.nodes[1].path].every(Object.isFrozen), Object.keys(g).join(), Object.keys(g.nodes[0]).join());'`
   Expect: `0.1061 0.1069 0.1090 0.1124 0.1189 true designId,foldCount,goalNodeId,nodes,radiusMeters edges,id,isLive,path`
5. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { buildGraph } from "./docs/src/gameplay/graph.js"; const sheet = cutSheet(DESIGNS.find((d) => d.id === "paper-dart")); try { buildGraph({ ...sheet, creaseLines: sheet.creaseLines.slice(0, 2) }); } catch (e) { console.log(e.message.includes("paper-dart"), /\b2\b/.test(e.message)); }'`
   Expect: `true true` (with the dart's printed creases cut to its two
   corners', its own order stops at fold 2, the left edge, and the
   error names both)
6. Do: `git status --porcelain docs | sort; node --check docs/src/gameplay/graph.js; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/gameplay/graph.js; grep -rln "gameplay/" docs/src docs/index.html | grep -v "^docs/src/gameplay/"`
   Expect: ` M docs/src/designs/list.js` and `?? docs/src/gameplay/`, then
   nothing more: no module outside `docs/src/gameplay/` imports the new
   files, so the page loads none of them.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and
the page at `http://localhost:1111/` looks and behaves exactly as
before, since nothing it loads imports the new modules.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome, open the dev tools
console, and hard-reload (Shift+Cmd+R).

1. **Do:** look at the page.
   - **Expect:** Sandbox Mode's blue square with its eight plain lines
     and its Fold Buttons, as before, and no errors or warnings in the
     console.
   - **Why:** `list.js` gained an export; a parse error there would
     stop the whole page.
2. **Do:** click "Presentation", then "Paper Dart", then "Heart".
   - **Expect:** each unfolds, stretches, turns and folds exactly as on
     the live site, `https://richplastow.com/pureland-simulator/`, the
     dart still standing edge-on as it folds in half, and the console
     stays clear.
   - **Why:** Decision 3 changes how the dart folds in Gameplay Mode
     only; Presentation Mode's must not move.
3. **Do:** open the Network panel, filter by `gameplay`, and
   hard-reload.
   - **Expect:** no file under `src/gameplay/` is requested.
4. **Do:** in the console, paste
   `const t = performance.now(); const [{ GAMEPLAY_DESIGNS }, { cutSheet }, { buildGraph }] = await Promise.all([import("./src/designs/list.js"), import("./src/fold/engine.js"), import("./src/gameplay/graph.js")]); const graphs = GAMEPLAY_DESIGNS.map((d) => buildGraph(cutSheet(d))); console.log(graphs.map((g) => g.nodes.length).join(" "), Math.round(performance.now() - t), "ms");`
   and note the time. Then, in the Performance panel's settings, set
   the CPU to 4× slowdown, run it again, and note that time too.
   - **Expect:** `16 4 15 86`, then a time. In Node on this Mac the four
     graphs build in about 50 ms; a first run in the browser also pays
     to fetch the modules.
   - **Why:** Plan 23 builds these four graphs at load, on every
     device, so this is the baseline its load time is judged against.
     The measurement informs, and never gates.

## Audit

- **2026-11-23T12:50:44Z** — **drafted**: the four Gameplay designs,
  cutPath() and buildGraph(), with every figure measured against a
  prototype over the real engine. Proposed by the agent, for the Lead
  Developer to confirm or change: the choice of four designs, the
  pencil and heart left out (Decision 1); every Gameplay fold turning
  its moving side only, so the finished dart rests on its side
  (Decision 3); the standing rule (Decision 5); states compared within
  a tolerance, with the moving folds (Decision 6); and the whole graph
  built, not the live states alone (Decision 7).
