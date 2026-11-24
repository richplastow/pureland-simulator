---
title: Folding a design in Gameplay Mode
description: Shows one Fold Button on every fold a design's sheet can make, folds it at the design's angle on a press, and adds Undo, Redo, Unfold, the keyboard and a status line naming each fold.
type: plan
---

## Context

- The third of the four Basic Gameplay Mode plans, after
  [Plan 23](./23-gameplay-mode.md), whose flat sheets it folds, and
  before [Plan 25](./25-gameplay-game.md), which turns the folding into
  a game. It delivers the folding: one Fold Button on every fold the
  sheet can make, a press that folds at the design's own angle, Undo,
  Redo and Unfold with their shortcuts, the keyboard, and each fold's
  name spoken through a status line. Nothing is judged yet: a wrong
  order simply runs out of Fold Buttons.
- It implements the brief's
  [Fold Buttons](../todo/14-gameplay-mode-research.md#fold-buttons) and
  [Undo, Redo and Unfold](../todo/14-gameplay-mode-research.md#undo-redo-and-unfold),
  and the research's
  [gameplay sheet](../todo/14-gameplay-mode-research.md#3-the-gameplay-sheet-one-sheet-cut-along-the-players-path),
  [finish](../todo/14-gameplay-mode-research.md#4-where-a-gameplay-sheet-finishes)
  and fold names
  ([the toolbar](../todo/14-gameplay-mode-research.md#7-the-toolbar)), by
  reusing Sandbox Mode's picking, lit lines and Fold Buttons
  ([Plan 17](./17-sandbox-folds.md),
  [Plan 18](./18-fast-fold.md)) over the graph of
  [Plan 22](./22-gameplay-graph.md). It takes up the one-button line
  that
  [Plan 18's Decision 18](./18-fast-fold.md#decisions) recorded
  for it.
- It departs from the research in two ways, both for a small first
  version:
  - **No fold is made by dragging.** The brief lets a mouse drag from a
    lit line preview a fold. Here every fold, the dart's 90° wings
    included, is made by one press of a button that looks like any
    other, and nothing folds live. The preview is a
    [backlog item](../todo/backlog/20261123-gameplay-drag-preview.md).
  - **No anchors.** The research places each button at an anchor, with
    a `buttonAt` per fold where two would collide
    ([Fold Buttons as DOM buttons](../todo/14-gameplay-mode-research.md#5-fold-buttons-as-dom-buttons-over-the-canvas)).
    The Sandbox's touch layout already keeps buttons on their lines and
    apart, so the design data needs no placement.
- It closes the backlog's
  [Boot mode, Fast Fold default and an early mouse reveal](./backlog/20261116-boot-mode-and-mouse-reveal.md):
  Plan 23 settled the boot mode, and Decision 5 here shows the same
  buttons to every pointer, so no mouse user meets a layout that then
  changes; "Fast Fold" stays ticked for Sandbox Mode. It leaves
  [Fold angles without dragging](../todo/backlog/20261118-single-pointer-fold-angle.md)
  as Sandbox Mode's alone, since Gameplay Mode reaches the dart's
  standing wings by a tap.
- Needed because Plan 23's sheets cannot be folded, and a design's
  folds, with layers, angles and an order to discover, are not the
  lattice folds the Sandbox's code makes.
- One glitch is accepted, on paths already lost. Ten of the dart's
  graph edges, each a wing folded after the centre fold came too early
  and a right-hand corner or edge then wrapped a flap over the front,
  carry the wing 2.7 to 8.9 mm through that flap for about a fifth of
  the fold (measured 2026-11-23). Real paper bends a little to let two
  parts pass, so the press stays available and folds as the engine
  poses it. Refusing those folds instead is a
  [backlog item](../todo/backlog/20261123-doomed-dart-wing-clash.md).
- Some straight printed lines show no Fold Button, such as the flat
  yacht's sail line: the printed rule offers only the design's own
  folds, each where its own creases lie. This is Basic Gameplay Mode;
  free folds along any printed line are
  [Advanced Gameplay Mode](../todo/backlog/20261124-advanced-gameplay-free-folds.md),
  a fold-engine upgrade the Lead Developer set aside on 2026-11-24.
- Browser behaviour it rests on: the
  [`status` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role),
  a polite live region, which
  [WCAG 2.2's Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
  (4.1.3, level AA) asks for; and the
  [`hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden)
  attribute. It names no new Three.js API.

## Decisions

1. **Each fold is named in the design data**
   ([the research](../todo/14-gameplay-mode-research.md#7-the-toolbar)).
   createFold()'s options take an optional `name`, a few plain words,
   and a design file's step takes an optional `name`, which
   readDesignFile() passes on; writeDesignFile() writes none, since a
   Sandbox session has none, and a person adds them by hand, as they
   add the file's note. A name says where the fold is as the player
   first sees the sheet in Gameplay Mode, from its starting side,
   before any turn, and stays the same however the paper is turned. So
   Mount Fuji's two slopes, which its file writes as seen after a
   turn-over, are named from the front. The names, in each design's own
   order:

   | Design | Fold names |
   | --- | --- |
   | Blintz | top right corner, bottom left corner, top left corner, bottom right corner |
   | Yacht | diagonal, sail, hull |
   | Mount Fuji | snow, middle, left slope, right slope |
   | Paper dart | left corner, right corner, left edge, right edge, centre, left wing, right wing |

   The pencil's and the heart's folds stay unnamed: Gameplay Mode
   never shows them.

   A step of `blintz.json`, named:

   ```json
   {
     "from": ["0", "1/2"],
     "halfTurns": "1",
     "name": "top right corner",
     "to": ["1/2", "0"],
     "type": "valley"
   }
   ```

2. **A game is its path, and the states along it.** The new
   `docs/src/gameplay/session.js`, pure, holds a game as a frozen
   `{ designId, nodeIds, path }`: `path`, the folds pressed, in order,
   with any undone tail kept for Redo; and `nodeIds`, the graph's node
   after each, starting with node 0, so one longer than `path`.
   - createGame(graph) returns the empty game.
   - foldAt(game, graph, position, fold) returns a new game that keeps
     the first `position` folds, then `fold`, as the Sandbox's foldAt()
     does, so a fold made after undoing drops the undone tail. It
     throws a RangeError for a `position` that is not a whole number
     from 0 to the game's fold count, or a `fold` that is not open at
     that position's node. Its arguments run as the call reads, as the
     Sandbox's foldAt()'s do, rather than A-Z.
   - The game, its `nodeIds` and its `path` are frozen; an old game is
     never changed.
   - openEdges(game, graph, position) returns that node's edges: the
     folds the paper can make there. Plan 25 leaves out the edges it
     closes.
   - The paper's position stays in the sequence target, as the
     Sandbox's does; the game holds no position of its own.

   The dart's game after its two corners and its left edge:

   ```json
   { "designId": "paper-dart", "nodeIds": [0, 1, 7, 21], "path": [0, 1, 2] }
   ```

3. **The sandbox bar becomes the fold bar**, since Gameplay Mode shows
   it too: `docs/src/ui/sandbox-bar.js` is renamed
   `docs/src/ui/fold-bar.js`, connectSandboxBar() connectFoldBar(),
   `main.js`'s `sandboxBar` and writeSandboxBar() `foldBar` and
   writeFoldBar(), and the class `.sandbox-bar` `.fold-bar`, in the
   HTML, the CSS and every comment. It gains setExportShown(), which shows the Export button in
   Sandbox Mode alone, by its `hidden` attribute. The bar shows in
   Sandbox Mode and Gameplay Mode, and its shortcuts answer while it
   shows, as now.
4. **At rest in Gameplay Mode, the Fold Lines are the game's open
   edges.** `main.js` finds a rest state per mode. In Gameplay Mode:
   - the lines are openEdges() at the paper's position, each edge the
     line itself, with its `from` and `to`
     ([Plan 22, Decision 8](./22-gameplay-graph.md#decisions)), in fold
     order;
   - a line's limits are its fold's `targetRadians` for its own `type`
     and 0 for the other, so its pair hides the other button, as a
     direction blocked at once is hidden in Sandbox Mode, and a press
     for it does nothing;
   - the faces, the lit segments, the fold spans and the stage's centre
     come from the gameplay sheet as they do from a sandbox sheet,
     through placedFaces(), litSegments() and pickSpans();
   - there is no lattice, no hinge rule and no sweep test:
     [Plan 22's standing rule](./22-gameplay-graph.md#decisions) already
     keeps every flat fold away from a standing flap.

   Sandbox Mode's rest state is unchanged, and Presentation Mode still
   has none.
5. **One Fold Button on every Fold Line that fits, for every pointer.**
   The brief gives every fold line its Fold Button, so Gameplay Mode
   lays them out with the touch layout
   ([Plan 18, Decision 11](./18-fast-fold.md#decisions)) whether
   or not a mouse has been detected, on each of that decision's layout
   events.
   - Each is a pair with one button hidden, so the other centres on its
     line ([Plan 18, Decision 18](./18-fast-fold.md#decisions)),
     and the layout's box is one button's: after measure(), `main.js`
     sets `space.pair.widthPx` to its `heightPx` in Gameplay Mode.
   - **Each button sits as near its line's middle as it can.** A line's
     middle is the middle of its longest fold span, where the keyboard's
     pick shows a button (Decision 8). Lines are still placed longest
     first, and of each line's sample points that are clear of the
     toolbar, the viewport's edge and the buttons already placed by the
     usual gap, the button takes the one nearest that middle whose box,
     at the button's measured size, crosses no other line's fold spans,
     so it is always clear which line a button belongs to. It moves
     towards an end only when its middle is blocked, and a line with no
     such point shows none. A line lying along the button's own, as the
     dart's two wings do, is not another line, since no box on the line
     could miss it. placePairs() takes this as an option, which `main.js`
     passes in Gameplay Mode alone: Sandbox Mode keeps the point furthest
     from other lines and pairs, exactly as now.
   - The button shows the fold as the player sees it, a valley's V or a
     mountain's chevron, in the colours of the side beneath it, and
     shows the other kind once a drag has brought the paper's other
     side round, since a layout follows every orbit.
   - "Fast Fold" stays hidden in Gameplay Mode and is not read there,
     and detecting a mouse hides and changes nothing there.
   - A line with no room for a button shows none until it is made
     active (Decision 8).
   - Two folds that share a line, the dart's wings, get a button each
     along it, a V and a chevron. A pointer on the line itself finds
     the first, the left wing; the right wing folds by its own button
     or the keyboard.
6. **A press folds the design's fold, at the design's angle.** In
   Gameplay Mode foldLine() replaces the game with
   foldAt(game, graph, position, fold), recuts the gameplay sheet with
   cutPath() along the game's whole path, finished if the path's last
   node is the goal, and sets the target one further, swapping the
   sheet in at rest as a sandbox fold does
   ([Plan 17](./17-sandbox-folds.md)). The dart's wings stand at
   90° from the same press as any flat fold, and their lines and
   buttons look like any other.
   - **Nothing folds live in Gameplay Mode**: no drag to an angle, and
     Shift with Up or Down does nothing. A mouse press on a lit line is
     still the line's, and never turns the paper
     ([Plan 18, Decision 1](./18-fast-fold.md#decisions));
     released on that same line, even after moving, it acts as a click,
     and released anywhere else it does nothing.
7. **With a mouse, a lit line stands in for its one button**
   ([Plan 18, Decisions 17 and 18](./18-fast-fold.md#decisions)).
   A hover lights the line a press would take and marks its button
   `data-proxied`; a click on the lit line presses that button,
   whichever side of the line it lands on. A lit line with no button
   shown is made active by the click instead.
8. **Making a line active keeps the layout.** A tap on a line, a click
   the proxy does not serve, or Left and Right make a line active: it
   is lit as the active line, and its button is emphasised in place
   among the others, as a keyboard pick is in the touch layout
   ([Plan 18, Decision 14](./18-fast-fold.md#decisions)); a line
   with no button placed shows its own at the pick, and the buttons
   within the gap of it fade until the next layout. A tap on a Fold
   Button folds at once; a tap on a bare line never folds, so nothing
   folds by touch without its button pressed. A mouse click on the
   active line itself, away from its button, folds nothing, as in
   Sandbox Mode (ruled by the Lead Developer, 2026-11-24).
9. **The keyboard**, with the paper focused: Left and Right step
   through the Fold Lines in fold order; Enter folds the active line;
   Up folds it if it is a mountain as the player sees it, and Down if a
   valley, the other doing nothing; Escape lets it go. The canvas's
   `aria-keyshortcuts` already names every one but Escape, which the
   whole page answers, as in Sandbox Mode.
10. **Undo, Redo and Unfold** move only the target, as in Sandbox Mode,
    between 0 and the game's fold count, and Ctrl+Z, Cmd+Z, Ctrl+Y,
    Ctrl+Shift+Z and Cmd+Shift+Z answer as there.
11. **At the goal the lines fade out**, as a finished design's do,
    since the goal's sheet is cut finished, and no Fold Line is left.
    Undo fades them back in. Plan 25 adds the message and the points.
12. **A game lasts one visit to one design.** Choosing a Gameplay
    design, even the one checked, or choosing Gameplay Mode, starts a
    new game and unfolds the paper, discarding the old game without a
    warning, as a pattern's choice discards a session
    ([Plan 17, Decision 13](./17-sandbox-folds.md#decisions)). The
    old sheet stays under its id while the paper unfolds on it; the
    next fold replaces it.
13. **A status line names the active fold.** A `<p class="status"
    role="status">`, a child of `.controls` fixed at the top centre of
    the viewport, `--controls-offset` from its top edge as the toolbar
    is from its bottom, which the pointer passes through and which
    fades with the toolbar on Escape. While it holds text it is one of
    the boxes the Fold Buttons' layout keeps clear of, as every child of
    the toolbar is. The new `docs/src/ui/status.js` returns
    say(text), which writes the text only when it changes. When a line
    becomes active in Gameplay Mode it reads the fold as the player
    sees it, then its name, such as "Valley fold: left corner", or the
    direction alone for a fold with no name; when no line is active it
    is empty. The name is that of the edge's `fold` in the design's own
    sheet, since the gameplay sheet's folds run in the path's order.
    The text takes the toolbar's own font and colour, adding no new
    size or colour. A hover says nothing, and Sandbox Mode says nothing, its
    lines having no names. Plan 25 adds the game's messages.
14. **A press recuts once; nothing new runs per frame.** cutPath() and
    the rest state run once per press, as the Sandbox's do, and a
    pointer move still reads lines found at rest. Manual QA 15
    measures a press against a Sandbox fold.

## Steps

### Step 1: The folds' names [P]

- Changes `docs/src/designs/steps.js` (createFold()'s `name`),
  `docs/src/designs/design-file.js` (readDesignFile() passes a step's
  `name` on), `docs/src/designs/blintz.json`,
  `docs/src/designs/yacht.js`, `docs/src/designs/mount-fuji.js` and
  `docs/src/designs/paper-dart.js`, per Decision 1.
- It should name every fold of the four Gameplay designs, carry each
  name through cutSheet() and cutPath(), read it from a design file's
  step, and write none from a Sandbox session (Agent QA 1, 2).

**Agent QA**

1. Do: `node --input-type=module -e 'import { DESIGNS, GAMEPLAY_DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { cutPath } from "./docs/src/gameplay/path.js"; for (const d of GAMEPLAY_DESIGNS) console.log(cutSheet(d).folds.map((f) => f.name).join(", ")); const dart = cutSheet(GAMEPLAY_DESIGNS[3]); console.log(cutPath(dart, [1, 0], false).folds.map((f) => f.name).join(", "), cutSheet(DESIGNS[0]).folds.every((f) => f.name === undefined));'`
   Expect: five lines:
   `top right corner, bottom left corner, top left corner, bottom right corner`,
   `diagonal, sail, hull`, `snow, middle, left slope, right slope`,
   `left corner, right corner, left edge, right edge, centre, left wing, right wing`
   and `right corner, left corner true` (the last: a path keeps each
   fold's name, and the pencil's folds have none)
2. Do: `node --input-type=module -e 'import { readDesignFile, writeDesignFile } from "./docs/src/designs/design-file.js"; import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, foldAt } from "./docs/src/sandbox/session.js"; const step = { from: ["0", "1/2"], halfTurns: "1", to: ["1/2", "0"], type: "valley" }; const design = readDesignFile({ aspect: 1, colorId: "blue", format: "pureland-design/1", id: "x", steps: [{ ...step, name: "top right corner" }, step] }); const text = writeDesignFile("id-1", PATTERNS[0], foldAt(createSession(), 0, { from: [0, 0.075], targetRadians: Math.PI, to: [0.075, 0], type: "valley" })); console.log(design.steps[0].name, design.steps[1].name, Object.keys(JSON.parse(text).steps[0]).join());'`
   Expect: `top right corner undefined from,halfTurns,to,type`
3. Do: `for f in docs/src/designs/*.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/designs/*.js docs/src/designs/blintz.json`
   Expect: prints nothing.

### Step 2: The game's path [P]

- Adds `docs/src/gameplay/session.js` (createGame(), foldAt() and
  openEdges()), per Decision 2.
- It should start a game at node 0 with every fold of the flat sheet
  open, follow the graph fold by fold, and drop the undone tail when a
  fold is made at an earlier position, leaving the old game as it was
  (Agent QA 1).
- It should refuse, with a RangeError, a position outside the game and
  a fold that is not open there (Agent QA 1).

**Agent QA**

1. Do: `node --input-type=module -e 'import { GAMEPLAY_DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { buildGraph } from "./docs/src/gameplay/graph.js"; import { createGame, foldAt, openEdges } from "./docs/src/gameplay/session.js"; const graph = buildGraph(cutSheet(GAMEPLAY_DESIGNS[3])); const isFrozen = (g) => [g, g.nodeIds, g.path].every((o) => Object.isFrozen(o)); let game = createGame(graph); console.log(game.designId, game.path.length, game.nodeIds.join(), openEdges(game, graph, 0).map((e) => e.fold).join(), isFrozen(game)); for (const [position, fold] of [[0, 0], [1, 1], [2, 2]]) game = foldAt(game, graph, position, fold); console.log(game.path.join(), game.nodeIds.join(), openEdges(game, graph, 3).map((e) => e.fold).join(), openEdges(game, graph, 1).map((e) => e.fold).join()); const next = foldAt(game, graph, 1, 2); console.log(next.designId, next.path.join(), next.nodeIds.join(), game.path.join(), isFrozen(next)); for (const [position, fold] of [[3, 5], [4, 0], [-1, 0], [0.5, 0], [0, 7]]) { try { foldAt(game, graph, position, fold); } catch (e) { console.log(e.name); } }'`
   Expect: eight lines: `paper-dart 0 0 0,1,2,3,4,6 true`,
   `0,1,2 0,1,7,21 3,4,6 1,2,3,4,6`, `paper-dart 0,2 0,1,8 0,1,2 true`,
   then `RangeError` five times (the left wing before the centre fold,
   a position past the game's end, a negative position, a position that
   is no whole number, and a fold the dart lacks)
2. Do: `node --check docs/src/gameplay/session.js; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/gameplay/session.js; grep -c "^import" docs/src/gameplay/session.js`
   Expect: nothing from the first two, then `0`: the module imports
   nothing, so it is pure.

### Step 3: The fold bar

- Renames `docs/src/ui/sandbox-bar.js` to `docs/src/ui/fold-bar.js`,
  and changes it (connectFoldBar(), setExportShown()),
  `docs/index.html` and `docs/styles/main.css` (`.fold-bar`), and
  `docs/src/main.js` (the bar's name, shown in both modes, Export in
  Sandbox Mode alone), per Decision 3.
- It should show Undo, Redo and Unfold in Gameplay Mode, greyed out on
  the flat sheet, with no Export, and all four in Sandbox Mode as
  before (Agent QA 1; Manual QA 1, 14). In Gameplay Mode the three
  move nothing until Step 4 gives them a game.

**Agent QA**

1. Do: `grep -rn "sandbox-bar\|sandbox bar\|SandboxBar\|sandboxBar" docs/src docs/styles docs/index.html | wc -l | tr -d ' '; ls docs/src/ui | grep -c "^fold-bar.js$\|^sandbox-bar.js$"; grep -c "setExportShown" docs/src/ui/fold-bar.js docs/src/main.js`
   Expect: `0`, then `1`, then a count of at least `1` for each of the
   two files (at `88101cc` the first prints `30`)
2. Do: `node --check docs/src/ui/fold-bar.js && node --check docs/src/main.js; awk 'length > 80 && !/data:image|aria-label="A sheet|aria-keyshortcuts=/ { print FILENAME ":" FNR }' docs/src/ui/fold-bar.js docs/src/main.js docs/styles/main.css docs/index.html`
   Expect: prints nothing.

### Step 4: Fold Buttons, and folding

- Changes `docs/src/main.js` (a rest state per mode; the game, started
  on every Gameplay choice; foldLine() per mode; the layout, the proxy,
  activation and the claimed press in Gameplay Mode; the fold bar's
  limits; the file's opening comment; the touch layout middle first in
  Gameplay Mode), `docs/src/ui/fold-button-layout.js` (placePairs()'s
  middle-first option) and `docs/src/ui/fast-fold.js` (layOutTouch()
  passes it on), per Decisions 4 to 8 and 10 to 12.
- It should show one Fold Button on every fold the sheet can make,
  with or without a mouse, as a V or a chevron as the player sees the
  fold, swapping when the paper is turned round (Manual QA 1, 7, 13).
- It should place each Fold Button at its line's middle, moving it
  towards an end only where the middle is blocked, with no button's box
  crossing another line, and leave Sandbox Mode's placement as it was
  (Agent QA 3; Manual QA 3, 14).
- It should fold a line on a press of its button, flat or, for the
  dart's wings, to 90°, then show the buttons of the folds the new
  sheet can make (Manual QA 3, 5, 8).
- It should, with a mouse, light a hovered line and fold it on a click
  anywhere on the lit line, and neither fold live nor turn the paper on
  a drag that starts there (Manual QA 2 to 4).
- It should, by touch, fold on a tap of a Fold Button, and only make a
  line active on a tap of the line (Manual QA 13).
- It should undo, redo and unfold by the bar's buttons and their
  shortcuts (Manual QA 6).
- It should fade the lines out at the goal and show no Fold Button
  there, and leave the lines showing where a wrong order runs out of
  folds (Agent QA 1; Manual QA 5, 9).
- It should start a new game on choosing a Gameplay design or Gameplay
  Mode (Manual QA 10).
- It should leave Sandbox Mode folding as before: pairs of buttons,
  Fast Fold, the live fold and its sweep limits (Manual QA 14).

**Agent QA**

1. Do: `node --input-type=module -e 'import { GAMEPLAY_DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { FADE_OUT_SECONDS, stepSequence } from "./docs/src/fold/stepper.js"; import { buildGraph } from "./docs/src/gameplay/graph.js"; import { cutPath, gameplaySheetId } from "./docs/src/gameplay/path.js"; import { createGame, foldAt } from "./docs/src/gameplay/session.js"; const sheet = cutSheet(GAMEPLAY_DESIGNS[1]); const graph = buildGraph(sheet); let game = createGame(graph); [0, 1, 2].forEach((fold, position) => { game = foldAt(game, graph, position, fold); }); const isGoal = game.nodeIds.at(-1) === graph.goalNodeId; const id = gameplaySheetId("yacht"); const sheets = { [id]: cutPath(sheet, game.path, isGoal) }; const state = { direction: 0, linesFade: 0, linesVisibility: 1, position: 3, sheetId: id, stretchFromId: id, stretchProgress: 1 }; const target = { linesOn: true, position: 3, sheetId: id }; stepSequence(FADE_OUT_SECONDS, sheets, state, target); console.log(isGoal, sheets[id].finishedPosition, state.linesVisibility); target.position = 2; stepSequence(10, sheets, state, target); console.log(state.position, state.linesVisibility);'`
   Expect: `true 3 0`, then `2 1` (the yacht's whole path is the goal, so
   its sheet is finished at 3 and its lines fade out; one Undo fades
   them back in and unfolds the hull)
2. Do: `grep -c 'from "./gameplay/session.js"' docs/src/main.js; grep -c "createGame(\|openEdges(" docs/src/main.js; node --check docs/src/main.js; for f in docs/src/ui/*.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/main.js docs/src/ui/*.js`
   Expect: `1`, then a count of at least `2`, then nothing (at
   `88101cc` the first two print `0`: the Sandbox's foldAt() and
   cutPath() are imported already, so neither proves the game is
   wired in).
3. Do: `node --input-type=module -e 'import { placePairs } from "./docs/src/ui/fold-button-layout.js"; const space = { exclusions: [], pair: { gapPx: 12, heightPx: 32, hitzonePx: 6, widthPx: 32 }, pointerClearancePx: 40, viewport: { height: 600, width: 800 } }; const line = (index, ...segments) => ({ index, lengthPx: Math.hypot(segments[2] - segments[0], segments[3] - segments[1]), segments }); const long = line(0, 100, 300, 700, 300); const cases = { clear: [long, line(1, 650, 100, 650, 250)], crossed: [long, line(1, 410, 310, 470, 310)], placed: [long, line(1, 400, 318, 400, 358)], shared: [long, line(1, 100, 300, 700, 300 + 1e-9)] }; for (const [name, lines] of Object.entries(cases)) console.log(name, [true, false].map((isMiddleFirst) => placePairs(lines, space, isMiddleFirst).map(({ x, y }) => Math.round(x) + "," + Math.round(y)).join(" ")).join(" | "));'; grep -c 'layOutTouch(screenLines, space, mode === "gameplay")' docs/src/main.js; grep -c "placePairs(lines, space, isMiddleFirst)" docs/src/ui/fast-fold.js`
   Expect: `clear 400,300 650,175 | 160,300 650,115`,
   `crossed 340,300 | 160,300 416,310`,
   `placed 400,300 400,346 | 160,300 400,354` and
   `shared 400,300 340,300 | 640,300 580,300`, then `1` and `1`. Before
   each `|`, middle first: a clear middle is taken; a middle whose box a
   short line crosses goes to the next nearest sample, and that short
   line, crossing the long one wherever it sits, gets none; a middle
   within the gap of a placed box goes to the nearest clear sample; and
   two lines along one another get a button each. After it, Sandbox
   Mode's furthest-clearance choice, unchanged from `88101cc`. The greps
   show `main.js` asks for middle first in Gameplay Mode alone and
   `fast-fold.js` passes it on.

### Step 5: The keyboard and the status line

- Changes `docs/index.html` (the status line), `docs/styles/main.css`
  (its place) and `docs/src/main.js`
  (Enter, Up and Down in Gameplay Mode, Shift's keys ignored there, and
  what the status says), and adds `docs/src/ui/status.js`, per
  Decisions 9 and 13.
- It should step through the Fold Lines with Left and Right, fold the
  active one on Enter, or on Up or Down when that is its direction,
  and do nothing on Shift with Up or Down (Manual QA 11).
- It should say the active fold's direction, as the player sees it,
  and its name in the status line, through a polite live region, and
  say nothing when no line is active (Agent QA 1; Manual QA 11, 12).

**Agent QA**

1. Do: `tr -s ' \n' ' ' < docs/index.html | grep -o '<p class="status" role="status">' | wc -l | tr -d ' '; grep -c "say" docs/src/ui/status.js; node --check docs/src/ui/status.js && node --check docs/src/main.js; awk 'length > 80 && !/data:image|aria-label="A sheet|aria-keyshortcuts=/ { print FILENAME ":" FNR }' docs/src/ui/status.js docs/src/main.js docs/styles/main.css docs/index.html`
   Expect: `1`, then a count of at least `1`, then nothing.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and
in the browser the paper dart can be folded from its flat sheet to the
finished dart by pressing Fold Buttons, the wings standing at 90° from
a plain press, then unfolded with Undo and Unfold.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome, open the dev tools
console, and hard-reload (Shift+Cmd+R). Keep the mouse still until
step 2.

1. **Do:** without moving the mouse, look at the page.
   - **Expect:** the blintz's blue sheet with a Fold Button on each of
     its four dashed lines: a single circle, centred on its line,
     showing a V under a dashed stroke. The toolbar now has "Undo",
     "Redo" and "Unfold", all greyed out, and no "Export" or "Fast
     Fold". The top of the page shows no text. The console is clear.
2. **Do:** move the mouse over one of the lines, away from its button,
   then off the paper.
   - **Expect:** the buttons stay where they are as the mouse first
     moves. Over the line, the line thickens, the cursor becomes a
     pointer and that line's button grows; off the paper, both return.
3. **Do:** click on the lit line between the top edge's middle and the
   right edge's middle, away from its button. Then click directly on
   another line's Fold Button.
   - **Expect:** each time the button bumps and its corner folds over
     to the centre, showing white; once the paper rests, a button shows
     at the middle of each line still unfolded, and "Undo" and "Unfold"
     are enabled.
4. **Do:** press the mouse on a lit line, drag 100 px off the paper and
   release. Press on a lit line, wobble a few pixels along it and
   release. Then press on bare paper between lines and drag, and
   double-click.
   - **Expect:** the first folds nothing and does not turn the paper;
     the second folds that line; the third turns the paper, the buttons
     gone while it turns and back once it stops, and the double-click
     eases it back.
   - **Why:** a press on a line is the line's, but in Gameplay Mode no
     drag folds live.
5. **Do:** fold the blintz's last corner. Then click "Yacht" and press
   its Fold Button three times, waiting for the paper to rest each
   time.
   - **Expect:** the finished blintz's lines fade out and no button
     shows. The yacht's sheet, white side up, shows one button at a
     time, each a V; the third press finishes the yacht, a white sail
     over a blue hull, and its lines fade out.
6. **Do:** on the finished yacht, click "Undo", then "Redo", then
   "Unfold"; then press Cmd+Shift+Z three times and Cmd+Z once.
   - **Expect:** Undo fades the lines in and unfolds the hull, whose
     button returns; Redo folds it and fades the lines out; Unfold
     returns the flat sheet, "Undo" and "Unfold" greyed out and "Redo"
     enabled; the three redos fold the yacht again one fold at a time;
     Cmd+Z unfolds the hull.
7. **Do:** click "Mount Fuji". Look at its two buttons, drag the paper
   round to its white side, and look again; double-click.
   - **Expect:** from the front, the line near the top carries a V and
     the line below the middle a chevron, both light green with black
     ink. From the back, the two swap kinds, the upper a chevron and
     the lower a V, in white with green ink.
   - **Why:** a fold towards the viewer from one side goes away from
     the viewer on the other; the button must say what the player
     sees.
8. **Do:** click "Paper Dart". Press the buttons on the two lines from
   the top's middle to the middles of the left and right edges; then on
   the two lines running to the bottom edge either side of centre; then
   on the upright centre line. Then press each of the two buttons that
   now share one line.
   - **Expect:** the flat sheet starts with six buttons, five V's and
     one chevron. The corners fold in, then the edges, and the sheet
     folds in half, left over right, lying flat. Two buttons then sit
     along one slanted line, a V and a chevron: the V stands the top
     layer's outer part up towards the viewer at a right angle, and the
     chevron stands the lower layer's away, each from one plain press.
     The lines fade out. A drag round shows a dart with both wings
     level.
9. **Do:** click "Unfold", wait, then press the button on the upright
   centre line first, and then every button that shows.
   - **Expect:** after the centre fold only the two wing buttons show;
     after both, no button shows, the lines stay printed, and nothing
     else happens.
   - **Why:** a wrong order runs out of folds; saying so, and its cost,
     is Plan 25's.
10. **Do:** click "Paper Dart" again, while it is still folded.
    - **Expect:** the paper unfolds to the flat sheet with its six
      buttons, and "Undo", "Redo" and "Unfold" are all greyed out: a
      new game, with nothing to redo.
11. **Do:** press Tab until the paper shows its focus ring. Press
    Right, then Right again, then Up, then Shift+Up, then Enter. Then
    Right, then Escape.
    - **Expect:** the first Right lights a line thickly, grows its
      button, and the top of the page reads "Valley fold: left corner";
      the second reads "Valley fold: right corner". Up and Shift+Up do
      nothing; Enter folds the right corner, and the text goes. The
      next Right names another fold, and Escape puts it out, leaving
      the toolbar showing.
12. **Do:** in the Elements panel, find the `<p class="status">`, then
    press Right on the focused paper once more.
    - **Expect:** it has `role="status"`, and its text changes as the
      line is picked.
13. **Do:** in the dev tools' device mode, choose a phone (iPhone 12
    Pro), reload, and click "Paper Dart". Tap a Fold Button. Tap a
    line away from its button, then tap that line's button. Drag from
    a line.
    - **Expect:** the buttons show at load with no mouse. The first
      tap folds. The tap on a line lights it and grows its button,
      folding nothing, and the status names it; the tap on the button
      folds it. The drag turns the paper. Every fold of the flat dart
      shows a button, or shows one when its line is tapped.
14. **Do:** back on the desktop, click "Sandbox". Hover a line, fold it
    with one of its two buttons, drag from another lit line and
    release half way, press Cmd+Z twice, and look at the toolbar.
    - **Expect:** Sandbox Mode as before: pairs of buttons near the
      mouse, a fold from a press, a live fold from the drag that stands
      where it is released, both undone by Cmd+Z, and "Export" and
      "Fast Fold" in the toolbar. The status line stays empty.
15. **Do:** click "Gameplay" and "Paper Dart". In the Performance
    panel, tick Memory, and record while pressing a corner's button,
    then making four more folds and five undos. Then record one fold
    in Sandbox Mode on "Square ½".
    - **Expect:** each Gameplay press's frame is the only long one, of
      the same order as the Sandbox press's; the frames at rest show
      only the animation loop's brief scripting; and the JS heap rises
      on each press and falls back after a collection, without
      climbing press after press.
    - **Why:** each press recuts the sheet and disposes of the old
      geometry. The measurement informs, and never gates.

**Looks wrong, but isn't:**

- The finished dart rests on its side, one wing towards the viewer,
  where Presentation Mode shows it from above: in Gameplay Mode the
  sheet folds in half as on a table
  ([Plan 22, Decision 3](./22-gameplay-graph.md#decisions)).
- A wrong order ends with no buttons and no message, and nothing says
  which folds are right: the game is Plan 25's.
- On a phone a crowded line may show its button off its middle, or none
  until it is tapped.

## Audit

- **2026-11-23T12:50:44Z** — **drafted**: folding in Gameplay Mode by
  the Sandbox's own lines and Fold Buttons over Plan 22's graph, with
  the session's and the goal sheet's Agent QA run against a prototype.
  From the Lead Developer's brief for this batch: one direction per
  line, and every fold, the dart's wings included, by a plain press
  with no drag to an angle. Proposed by the agent, for the Lead
  Developer to confirm or change: the fold names (Decision 1); the
  fold bar's rename (Decision 3); the touch layout for every pointer in
  place of anchors, with a one-button box (Decision 5); a moved press
  released on its line counting as a click (Decision 6); a tap on a
  line making it active, never folding (Decision 8); Enter, Up and Down
  (Decision 9); and the status line's wording and place (Decision 13).
- **2026-11-23T14:39:08Z** — **updated**: the Lead Developer accepted, through
  `/feed-me`, the wing that passes through a flap on ten lost dart
  paths; noted in the Context, with a backlog item for the fix.
- **2026-11-23T19:34:18Z** — **reviewed**: no Major finding; Steps 1,
  2 and 4's Agent QA run against a scratch build of the names and
  session.js, and every open edge of every node of the four graphs
  found to light both ways; Step 2 Agent QA 1 gains a negative and a
  fractional position and checks `nodeIds` frozen, after mutations it
  missed; Step 4 Agent QA 2's count, already 6 at `88101cc`, now greps
  the game's import and calls; Step 3 Agent QA 1 also greps
  `sandboxBar`, re-measured at `88101cc`; Decisions 2, 3, 9 and 13
  clarified (foldAt()'s bounds, order and freezing; the bar's names in
  `main.js`; Escape's shortcut; where the fold's name is read).
- **2026-11-23T19:45:32Z** — **implemented**: Steps 1 to 5. Names in
  `steps.js`, `design-file.js`, `blintz.json`, `yacht.js`,
  `mount-fuji.js` and `paper-dart.js`; new `gameplay/session.js` and
  `ui/status.js`; `ui/sandbox-bar.js` renamed `ui/fold-bar.js`, with
  setExportShown(); `index.html`, `main.css` and `main.js` (a rest state
  per mode, the game, foldLine() per mode, the touch layout, proxy,
  claimed press and keys in Gameplay Mode, the status line).
  `fast-fold.js` untouched. Every Agent QA block passes as written;
  Steps 1, 3 and 4 failed first as expected, Steps 2 and 5 were not run
  before their new files existed, and Step 4 Agent QA 1 passed before
  `main.js` changed, since it tests the stepper and session.js alone. Every game path of the four graphs also recuts, and
  lights each open edge both ways from its own cut. Manual QA unchanged.
- **2026-11-23T19:45:32Z** — **verified**: agent checks pass: 9 changed
  modules parse, no long lines beyond `index.html`'s three allowed ones,
  `/` and every changed file served 200 by a server started and stopped
  for the check, vendored checksums match; browser not run.
- **2026-11-23T19:53:43Z** — **quality-checked**: Fixed: the status line
  was `display: none` while empty, taking its live region out of the
  accessibility tree, so a screen reader could miss the fold named as it
  reappeared; the `:empty` rule is gone, as an empty `p` has a 0×0 box the
  layout already skips (`main.css`, `status.js`'s doc). `FOLD_WORDS` in
  `main.js` copied the Fold Buttons' labels; `fold-buttons.js`, in no
  Step's list, now exports `FOLD_BUTTON_LABELS`, which its buttons and
  statusOf() read. cycleLine()'s doc gains fold order in Gameplay Mode.
  Step 2 Agent QA 1 also prints the new game's `designId`, after a mutant
  dropping it from foldAt() survived. Deferred: a mouse click on the
  keyboard's active line folds nothing, as in Sandbox Mode, though
  Decision 7's proxy serves other lit lines; activating a line keeps the
  layout (Decision 8), so a button may sit under the status line until the
  next layout. Verified fine: session.js's ten mutants, nine caught before
  the QA change and all ten after; the claimed press, proxy and keys in
  Gameplay Mode; game and rest state kept in step across choices, modes
  and Undo; the one-button box re-measured per layout; `fit-content`
  centring and specificity of `.controls > .status`; recut sheets disposed
  of by setSheet(); the per-frame path, with nothing new on it; resize
  unchanged; no new Three.js API; agent checks pass (`/` and every changed
  file 200, by a server started and stopped); browser not run.
- **2026-11-24T13:28:50Z** — **qa-fix**: Manual QA 2 failed: in the
  corners of a Fold Button's square, outside its circle, the line stayed
  lit but the button did not grow, and a click there did nothing. Cause:
  the `.fold-buttons` box took the pointer where its round buttons do not,
  so the canvas's hover and press never saw it; the same dead box, the gap
  between the two buttons included, is in Sandbox Mode at `88101cc`.
  Fixed in `main.css`: the box passes the pointer through and only a shown
  pair's buttons take it, so the box is the paper's hitzone, as its margin
  already was (doc comments in `fold-buttons.js` and `main.js`). QA lines
  unchanged; browser not run.
- **2026-11-24T13:44:56Z** — **qa-fix**: Manual QA 2 failed: stepping the
  mouse off a Fold Button onto its lit line showed the grab cursor for
  100 to 200 ms before the pointer. Cause: entering a pair cleared the
  canvas's `data-over-line`, which only the canvas's next `pointermove`
  restored, and Chrome picks the cursor before dispatching that event; the
  same since Plan 18 in Sandbox Mode's Fast Fold pairs. Fixed in `main.js`:
  a mouse entering a pair whose line it lights keeps the canvas marked;
  `fold-buttons.js` passes the `pointerType` on (comment in `main.css`).
  QA lines unchanged; browser not run.
- **2026-11-24T14:32:27Z** — **updated**: in manual QA, the Lead
  Developer asked why the flat yacht's straight sail line has no Fold
  Button. Measured: the printed rule offers only the design's own folds,
  and no fold made early lands on that line. The Lead Developer kept the
  printed rule as Basic Gameplay Mode and set free folds aside as
  Advanced Gameplay Mode; noted in the Context, with a backlog item.
- **2026-11-24T14:52:12Z** — **ruled**: in manual QA, after one blintz
  fold, one Fold Button sat at its line's middle and two were pushed
  towards their lines' ends: placePairs() takes the sample furthest from
  other lines and pairs. The Lead Developer ruled: “Option 1 please,
  middle first in Gameplay Mode only”. Decision 5 gains the rule: the
  clear sample nearest the middle of the line’s longest span whose box
  crosses no other line, a line along its own excepted. Built as
  placePairs()’s option, passed by `main.js` through layOutTouch();
  Step 4’s file list and a criterion amended, Agent QA 3 added, Manual
  QA 3 and a “looks wrong” line reworded. Sandbox output identical to
  `88101cc` on 3,000 random layouts; browser not run.
- **2026-11-24T15:29:02Z** — **ruled**: in manual QA, the Lead
  Developer kept a mouse click on the active line, away from its
  button, folding nothing, as in Sandbox Mode ("It's fine as it is");
  added to Decision 8.
- **2026-11-24T15:38:26Z** — **done**: the Lead Developer’s manual QA passed, after
  two QA fixes (a button’s dead corners; the cursor leaving a button)
  and a ruling (middle-first placement in Gameplay Mode).
