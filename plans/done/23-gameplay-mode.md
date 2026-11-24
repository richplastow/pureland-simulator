---
title: Gameplay Mode shows a design's flat sheet
description: Adds Gameplay Mode to the mode radios with its own four design radios, cuts each design's flat sheet and maze at load, and boots the app in Gameplay Mode on the blintz.
type: plan
---

## Context

- The second of the four Basic Gameplay Mode plans, after
  [Plan 22](./22-gameplay-graph.md), whose designs, sheets and graphs it
  puts on the page, and before [Plan 24](./24-gameplay-folds.md), which
  folds them. It delivers the mode itself: a third mode radio, the
  Gameplay designs' own radios, each design's flat sheet printed with
  its whole crease pattern in its starting pose and colour, and the
  unfold, stretch and turn between that sheet and the other modes, all
  with the stepper as it is.
- It implements the research's
  [Entering Gameplay Mode](../todo/14-gameplay-mode-research.md#entering-gameplay-mode),
  [gameplay sheet](../todo/14-gameplay-mode-research.md#3-the-gameplay-sheet-one-sheet-cut-along-the-players-path)
  (flat, not yet folded) and
  [toolbar](../todo/14-gameplay-mode-research.md#7-the-toolbar), as
  [Plan 16](./16-sandbox-mode.md) did for Sandbox Mode.
- It departs from the research in two ways. The brief's
  [Modes](../todo/14-gameplay-mode-research.md#modes) keeps Presentation Mode
  the default, but the app now boots in Gameplay Mode, so the game is
  one reload away while it is built and QA'd. And the research's
  [toolbar](../todo/14-gameplay-mode-research.md#7-the-toolbar) shares one
  group of design radios between the modes, hiding "Flat" in Gameplay
  Mode, whereas Decision 3 gives Plan 22's four Gameplay designs their
  own radios, so Presentation Mode returns to its own checked design,
  not to the one last played.
- That settles the boot mode that the backlog's
  [Boot mode, Fast Fold default and an early mouse reveal](./backlog/20261116-boot-mode-and-mouse-reveal.md)
  left open; Plan 24 settles the rest of that item and closes it.
- Needed because nothing on the page yet knows Gameplay Mode, and a
  design's sheet in Presentation Mode cannot stand in for its flat
  gameplay sheet: the stepper tells sheets apart by id.
- It first gives a fold the rules refuse its own error, so
  buildGraph(), which runs at load from this plan on, tells a refused
  fold from a fault (Decision 11). That replaces the RangeError
  [Plan 22's Decision 2](./22-gameplay-graph.md#decisions) gives
  a `{ movedBy }` naming a fold not yet made, so Plan 22's Step 1
  Agent QA 4 no longer prints what it expects on its second line.
- Browser behaviour it rests on: the
  [`hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden)
  attribute, as the pattern group uses it. It names no new Three.js
  API.

## Decisions

1. **The mode radios are Presentation, Gameplay and Sandbox**, in that
   order, the new one `value="gameplay"`, labelled "Gameplay", drawn
   and keyboard-driven as the other two.
   `docs/src/ui/mode-radios.js` knows the three modes, shows the one
   group of choices the mode offers and hides the other two, and
   throws at once if the page lacks any of the three groups or the
   `gameplay` radio.
2. **The app boots in Gameplay Mode**: its radio is checked at load,
   whatever the browser restored, and the paper starts at rest on the
   first Gameplay design's flat gameplay sheet, the blintz's, in its
   blue, its lines showing, with nothing to animate, as it started on
   the first pattern's since
   [Plan 18](./18-fast-fold.md). Sandbox Mode and Presentation
   Mode are one click away, each as before.
3. **The Gameplay designs have their own radios**, `name="gameplay-design"`,
   in a `.choices.gameplay-designs` group after the mode group, a
   `role="radiogroup"` with `aria-label="Design"`, one per design in
   `GAMEPLAY_DESIGNS`'s order, each `value` the design's `id`, labelled
   "Blintz", "Yacht", "Mount Fuji" and "Paper Dart". The first is
   checked at load. The new `docs/src/ui/gameplay-radios.js` connects
   them as `pattern-radios.js` connects the patterns: each choice, the
   design's `colorId` and `designId` and a `target` at position 0 on
   its gameplay sheet, is frozen and passed on at both `change` and
   `click`, and connectGameplayRadios(colors, onChoose) returns
   checkedGameplayChoice(). It throws at once on a `value` that names
   no Gameplay design, a `colorId` that names no colour, or a missing
   first radio. The Presentation designs' group keeps its own checked
   radio, so each mode remembers its own design.

   The paper dart's choice:

   ```json
   {
     "colorId": "orange",
     "designId": "paper-dart",
     "target": { "position": 0, "sheetId": "gameplay:paper-dart" }
   }
   ```

4. **A gameplay sheet has its own id.** gameplaySheetId(designId), in
   `docs/src/gameplay/path.js`, returns `"gameplay:"` followed by the
   design's id, the sheet's key in `main.js`'s `sheets`. Each Gameplay
   design's flat gameplay sheet, cutPath(sheet, [], false), is cut once
   at load under that key, beside the designs' own sheets and the
   patterns'.
   - A separate id is what lets the stepper carry the paper from a
     finished design to that same design's flat gameplay sheet: it
     unfolds, fades the lines out, swaps sheets with no stretch, since
     the two share their shape, start and lean, and fades the lines
     back in (3.9 s for the dart, measured).
   - Plan 24 replaces the sheet under the same id at every fold, as a
     pattern's is replaced, since the paper swaps sheets by identity
     ([Plan 16, Decision 2](./16-sandbox-mode.md#decisions)).
   - A gameplay sheet's colour is its design's `colorId`, applied when
     the sheet takes over the flat paper, as a design's and a pattern's
     are. Its `designId` is the design's, so the printed lines, the
     same on both sheets, are not redrawn between the two.
5. **The four graphs are built at load**, by buildGraph() over each
   Gameplay design's own sheet, and kept by design id for Plans 24 and
   25. `paperRadiusMeters` becomes the largest of the designs' own
   sheets' radius and the graphs' `radiusMeters`: still 0.1189 m, the
   heart's, so the camera, the lights and the bounding sphere do not
   move ([Plan 22, Decision 10](./22-gameplay-graph.md#decisions)). The
   four build in about 50 ms in Node on the Lead Developer's Mac
   (measured 2026-11-23); Manual QA 9 measures the load in a browser.
6. **Choosing Gameplay Mode, or a Gameplay design, sets the target**
   to position 0 on that design's gameplay sheet, as choosing a pattern
   does: the stepper unfolds whatever is folded, fades its lines out,
   stretches and turns the flat sheet to the design's shape, starting
   pose and lean where they differ from the sheet's before, fades its
   colour in and its lines in, and rests.
   - The mode's choice passes on the checked Gameplay design's choice,
     as if that radio had been chosen; Presentation Mode still passes
     on its own checked design's, and Sandbox Mode its checked
     pattern's.
   - A choice that arrives twice does nothing the second time.
7. **In Gameplay Mode "Fold lines" is forced on**, as in Sandbox Mode
   ([Plan 16, Decision 7](./16-sandbox-mode.md#decisions)), since
   the game needs its lines; the sandbox bar and the "Fast Fold"
   checkbox are hidden; and nothing lights or folds yet. The rest
   state that finds Fold Lines stays Sandbox Mode's alone until
   Plan 24.
8. **`main.js` holds the mode as one value**, `"gameplay"`,
   `"presentation"` or `"sandbox"`, in place of `isSandbox`, so no pair
   of flags can disagree.
9. **Escape's focus follows the mode shown**: on hiding the toolbar
   with nothing focused, `docs/src/ui/controls-toggle.js` moves focus
   to the checked Gameplay design in Gameplay Mode, as it does to the
   checked pattern in Sandbox Mode
   ([Plan 16, Decision 8](./16-sandbox-mode.md#decisions)).
10. **The canvas's label stands**: "folds into designs or along a
    printed grid" covers Gameplay Mode too.
11. **A fold the rules refuse throws a FoldRefusal**, a subclass of
    Error that `docs/src/fold/engine.js` exports, whose `name` is
    `"FoldRefusal"`, so buildGraph() catches a refusal and nothing
    else.
    - The engine throws it where a fold moves nothing, where a fold
      moves the faces of one that stops short, and where a design
      leaves a T-junction. cutPath() throws it where a `{ movedBy }`
      names a fold not yet made.
    - A fold index repeated, unknown or not a whole number stays a
      RangeError, and every other throw in the engine stays a plain
      Error: each is a fault in the caller or the design, not a
      refusal.
    - cutIfAllowed() in `docs/src/gameplay/graph.js` returns null for
      a FoldRefusal only, and throws every other error on, a plain
      Error or a native RangeError, such as a stack overflow, included.
    - No figure changes: all six designs' graphs keep every figure in
      [Plan 22's Decision 1](./22-gameplay-graph.md#decisions)
      table, and the search over them meets only two of the refusals,
      a fold that moves nothing and a `{ movedBy }` not yet made
      (measured 2026-11-23 against a prototype).

The target the paper rests at when the page loads:

```json
{
  "linesOn": true,
  "position": 0,
  "sheetId": "gameplay:2f0a6b7e-3c1d-4e8f-9a2b-6c5d4e3f2a1b"
}
```

## Steps

### Step 1: A refused fold throws its own error

- Changes `docs/src/fold/engine.js` (FoldRefusal, thrown at its three
  refusals, and cutSheet()'s doc comment), `docs/src/gameplay/path.js`
  (the `{ movedBy }` refusal and cutPath()'s doc comment) and
  `docs/src/gameplay/graph.js` (cutIfAllowed() and its doc comment),
  per Decision 11. Nothing the page shows changes.
- It should throw a FoldRefusal for each of the four refusals, and keep
  a RangeError for a bad fold index and a plain Error for a fault in a
  design (Agent QA 1).
- It should let buildGraph() catch a FoldRefusal and nothing else,
  and find all six designs' graphs as before (Agent QA 2, 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; import { createFold } from "./docs/src/designs/steps.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { cutPath } from "./docs/src/gameplay/path.js"; const sheet = cutSheet(DESIGNS.find((d) => d.id === "paper-dart")); const halves = (targetRadians) => ({ aspect: 1, id: "halves", steps: [createFold([0, -0.075], "all", [0, 0.075], "valley", { targetRadians }), createFold([0.075, 0], { movedBy: 0 }, [-0.075, 0], "valley")] }); const tries = [() => cutPath(sheet, [5, 4], false), () => cutPath(sheet, [0, 0], false), () => cutPath(sheet, [7], false), () => cutSheet({ aspect: 1, id: "off", steps: [createFold([-0.2, -0.075], "all", [-0.2, 0.075], "valley")] }), () => cutSheet(halves(Math.PI / 2)), () => cutSheet(halves(Math.PI)), () => cutSheet({ aspect: 1, id: "odd", steps: [{ kind: "crease" }] })]; console.log(tries.map((t) => { try { t(); return "none"; } catch (e) { return e.name + (e instanceof Error ? "" : "!"); } }).join(" "));'`
   Expect: `FoldRefusal RangeError RangeError FoldRefusal FoldRefusal FoldRefusal Error`
   (the dart's left wing before its centre fold; a fold repeated; a
   fold the dart lacks; a fold whose line lies off the sheet, so moves
   nothing; a sheet folded in half to 90°, whose standing half alone a
   second fold then moves; the same folded flat, where that second
   fold leaves a T-junction; and a step of an unknown kind, a fault in
   the design. At `df5c970` it prints
   `RangeError RangeError RangeError Error Error Error Error`)
2. Do: `grep -o "instanceof [A-Za-z]*\|constructor ===\|\.name ===" docs/src/gameplay/graph.js; grep -c "throw error;" docs/src/gameplay/graph.js`
   Expect: `instanceof FoldRefusal`, then `1` (the file's one test of
   an error is for a FoldRefusal, and cutIfAllowed() throws every other
   error on)
3. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { buildGraph } from "./docs/src/gameplay/graph.js"; for (const design of DESIGNS) { const g = buildGraph(cutSheet(design)); const n = g.nodes; const count = (id) => (id === g.goalNodeId ? 1 : 0) + n[id].edges.reduce((sum, e) => sum + count(e.nodeId), 0); console.log(g.designId.slice(0, 10), g.foldCount, n.length, n.reduce((sum, { edges }) => sum + edges.length, 0), n.filter(({ isLive }) => isLive).length, n.filter(({ edges, id }) => edges.length === 0 && id !== g.goalNodeId).length, n.filter(({ isLive }) => isLive).flatMap(({ edges }) => edges).filter(({ nodeId }) => !n[nodeId].isLive).length, count(0), g.goalNodeId, g.radiusMeters.toFixed(4)); }'`
   Expect: six lines, each a design's id cut to ten characters, then
   its folds, states, edges, live states, dead ends, traps, orders,
   goal node and reach in metres:
   `pencil 6 161 192 9 39 9 4 121 0.1211`,
   `mount-fuji 4 15 17 7 3 2 4 11 0.1090`,
   `yacht 3 4 3 4 0 0 1 3 0.1069`,
   `paper-dart 7 86 103 13 29 23 12 83 0.1124`,
   `heart 11 65 145 65 0 0 2268 64 0.1189` and
   `2f0a6b7e-3 4 16 32 16 0 0 24 15 0.1061`
4. Do: `for f in docs/src/fold/engine.js docs/src/gameplay/path.js docs/src/gameplay/graph.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/fold/engine.js docs/src/gameplay/path.js docs/src/gameplay/graph.js`
   Expect: prints nothing.

### Step 2: The gameplay sheets and the graphs, at load

- Changes `docs/src/gameplay/path.js` (gameplaySheetId()) and
  `docs/src/main.js` (the four flat gameplay sheets in `sheets`, the
  four graphs, the radius over both, and a gameplay sheet's colour at
  takeover), per Decisions 4 and 5. The page still boots in Sandbox
  Mode after this step.
- It should give each Gameplay design's flat gameplay sheet its own id
  (Agent QA 1).
- It should let the stepper carry the paper from a finished design to
  that design's flat gameplay sheet without a stretch, and stretch and
  turn it between two gameplay sheets (Agent QA 2).
- It should build the four graphs at load and leave the camera's
  radius at 0.1189 m (Agent QA 3; Manual QA 9).

**Agent QA**

1. Do: `node --input-type=module -e 'import { gameplaySheetId } from "./docs/src/gameplay/path.js"; console.log(gameplaySheetId("yacht"));'`
   Expect: `gameplay:yacht`
2. Do: `node --input-type=module -e 'import { DESIGNS, GAMEPLAY_DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { stepSequence } from "./docs/src/fold/stepper.js"; import { cutPath, gameplaySheetId } from "./docs/src/gameplay/path.js"; const sheets = Object.fromEntries(DESIGNS.map((d) => [d.id, cutSheet(d)])); for (const d of GAMEPLAY_DESIGNS) sheets[gameplaySheetId(d.id)] = cutPath(sheets[d.id], [], false); const state = { direction: 0, linesFade: 0, linesVisibility: 0, position: 7, sheetId: "paper-dart", stretchFromId: "paper-dart", stretchProgress: 1 }; const target = { linesOn: true, position: 0, sheetId: "gameplay:paper-dart" }; let seconds = 0; while (stepSequence(0.05, sheets, state, target)) seconds += 0.05; console.log(state.sheetId, state.position, state.linesVisibility, state.stretchFromId, seconds.toFixed(1)); target.sheetId = "gameplay:yacht"; seconds = 0; while (stepSequence(0.05, sheets, state, target)) seconds += 0.05; console.log(state.sheetId, state.position, state.linesVisibility, state.stretchFromId, seconds.toFixed(1), Object.keys(sheets).filter((id) => id.startsWith("gameplay:")).length);'`
   Expect: `gameplay:paper-dart 0 1 paper-dart 3.9`, then
   `gameplay:yacht 0 1 gameplay:paper-dart 1.3 4` (from the finished
   dart: its lines fade in, seven folds unfold, the lines fade out, the
   sheets swap with no stretch, and the lines fade in; then to the
   yacht's: a fade out, the stretch and turn, and a fade in)
3. Do: `node --input-type=module -e 'import { DESIGNS, GAMEPLAY_DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius } from "./docs/src/fold/pose.js"; import { buildGraph } from "./docs/src/gameplay/graph.js"; const own = Math.max(...DESIGNS.map((d) => maxPaperRadius(cutSheet(d)))); const all = Math.max(own, ...GAMEPLAY_DESIGNS.map((d) => buildGraph(cutSheet(d)).radiusMeters)); console.log(own.toFixed(4), all.toFixed(4));'; for name in buildGraph cutPath gameplaySheetId; do grep -c "$name(" docs/src/main.js; done`
   Expect: `0.1189 0.1189`, then three counts, each at least `1` (the
   radius is the heart's with the graphs counted; `main.js` calls all
   three functions)
4. Do: `node --check docs/src/gameplay/path.js && node --check docs/src/main.js; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/gameplay/path.js docs/src/main.js`
   Expect: prints nothing.

### Step 3: The mode and the Gameplay designs in the toolbar

- Changes `docs/index.html` (the `gameplay` mode radio, checked in
  place of `sandbox`; the `.gameplay-designs` group; and the pattern
  group `hidden` at load, as the designs group, the sandbox bar and
  "Fast Fold" already are), `docs/src/ui/mode-radios.js` (three modes,
  the boot mode), `docs/src/ui/controls-toggle.js` (focus per mode),
  `docs/src/main.js` (the mode's value, its wiring, the boot state and
  the file's opening comment), and the comments that name two modes in
  `docs/styles/main.css` (the groups of choices) and
  `docs/src/ui/fold-lines-toggle.js` (setForcedOn()), and adds
  `docs/src/ui/gameplay-radios.js`, per Decisions 1 to 3 and 6 to 10.
- It should show the three mode radios, Gameplay checked at load, and
  the four Gameplay designs in place of the patterns and the
  Presentation designs (Agent QA 1; Manual QA 1).
- It should start at rest on the blintz's flat gameplay sheet, blue,
  coloured side up, its four creases printed, with no animation
  (Manual QA 1).
- It should bring the paper to each Gameplay design's flat sheet, in
  its shape, pose, lean and colour, with its whole crease pattern
  printed on both sides (Agent QA 2; Manual QA 2, 3).
- It should fold the checked Presentation design on choosing
  Presentation Mode, show the checked pattern on choosing Sandbox
  Mode, and return to the checked Gameplay design's flat sheet on
  choosing Gameplay Mode (Manual QA 4 to 6).
- It should force "Fold lines" on in Gameplay Mode, and show neither
  the sandbox bar nor "Fast Fold" there (Manual QA 1, 4).
- It should drive the mode and the Gameplay designs from the keyboard
  as the other groups are driven, and put Escape's focus on the checked
  Gameplay design (Manual QA 7, 8).
- It should leave Sandbox Mode and Presentation Mode behaving as
  before, apart from the boot (Manual QA 4, 5).
- It should hold the mode as one value (Agent QA 3).

**Agent QA**

1. Do: `tr -s ' \n' ' ' < docs/index.html | grep -o 'name="mode" value="[a-z]*"\( checked\)\?\|name="gameplay-design" value="[a-z0-9-]*"\( checked\)\?' | tr '\n' ' '`
   Expect: `name="mode" value="presentation" name="mode" value="gameplay" checked name="mode" value="sandbox" name="gameplay-design" value="2f0a6b7e-3c1d-4e8f-9a2b-6c5d4e3f2a1b" checked name="gameplay-design" value="yacht" name="gameplay-design" value="mount-fuji" name="gameplay-design" value="paper-dart" `
   (whitespace is squeezed first, so an `<input>` wrapped one attribute
   per line still matches)
2. Do: `node --input-type=module -e 'import { GAMEPLAY_DESIGNS } from "./docs/src/designs/list.js"; import { PAPER_COLORS } from "./docs/src/scene/paper-colors.js"; import { connectGameplayRadios } from "./docs/src/ui/gameplay-radios.js"; const fake = (value) => ({ checked: false, on: {}, value, addEventListener(type, listener) { this.on[type] = listener; } }); const ids = GAMEPLAY_DESIGNS.map(({ id }) => id); let radios = ids.map(fake); globalThis.document = { querySelectorAll: () => radios }; const chosen = []; const checkedChoice = connectGameplayRadios(PAPER_COLORS, (choice) => chosen.push(choice)); const atLoad = radios.map(({ checked }) => checked).join(); radios[3].on.click(); radios[1].on.change(); radios.forEach((radio, i) => { radio.checked = i === 1; }); console.log(atLoad, checkedChoice().designId, chosen.every((c) => Object.isFrozen(c) && Object.isFrozen(c.target))); console.log(JSON.stringify(chosen)); const tryWith = (colors, values) => { radios = values.map(fake); try { connectGameplayRadios(colors, () => {}); return "none"; } catch (e) { return e.name; } }; console.log(tryWith(PAPER_COLORS, [...ids, "heart"]), tryWith({}, ids), tryWith(PAPER_COLORS, ids.slice(1)), tryWith(PAPER_COLORS, ids));'`
   Expect: three lines:
   - `true,false,false,false yacht true` (the blintz checked at
     connection; the checked radio's choice read back; every choice
     frozen, its target too)
   - `[{"colorId":"orange","designId":"paper-dart","target":{"position":0,"sheetId":"gameplay:paper-dart"}},{"colorId":"blue","designId":"yacht","target":{"position":0,"sheetId":"gameplay:yacht"}}]`
     (a `click` on the dart's radio and a `change` on the yacht's)
   - `Error Error Error none` (a radio naming the heart, no colours, no
     blintz radio, then the four as on the page)

   Plain objects stand in for the page: connectGameplayRadios() reads
   only `document.querySelectorAll()` and each radio's `value`,
   `checked` and addEventListener(), as connectPatternRadios() does.
3. Do: `grep -c "isSandbox" docs/src/main.js; grep -c '"gameplay"\|^ *gameplay:' docs/src/main.js docs/src/ui/mode-radios.js docs/src/ui/controls-toggle.js`
   Expect: `0`, then a count of at least `1` for each of the three files,
   the mode named as a string or as an object's key (at `d710f9d` the
   first prints `7`)
4. Do: `for f in docs/src/ui/*.js docs/src/main.js; do node --check "$f"; done; awk 'length > 80 && !/data:image|aria-label="A sheet|aria-keyshortcuts=/ { print FILENAME ":" FNR }' docs/src/ui/*.js docs/src/main.js docs/styles/main.css docs/index.html`
   Expect: prints nothing (the favicon's data URL and the canvas's
   `aria-keyshortcuts` and `aria-label` are the three lines no wrap can
   shorten, so the `awk` skips them)

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and
in the browser the page loads in Gameplay Mode on the blintz's printed
flat sheet, each Gameplay design's radio brings the paper to that
design's flat sheet, and Presentation Mode and Sandbox Mode work as
before.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome, open the dev tools
console, and hard-reload (Shift+Cmd+R).

1. **Do:** look at the page.
   - **Expect:** the toolbar starts with "Presentation", "Gameplay" and
     "Sandbox", Gameplay ringed; then "Blintz", "Yacht", "Mount Fuji"
     and "Paper Dart", Blintz ringed; then "Fold lines", ticked and
     greyed out, and the swatches, blue ringed. No pattern buttons, no
     Undo, Redo, Unfold or Export, and no "Fast Fold". The paper is a
     flat blue square, coloured side up, with four dashed lines making
     a diamond between the middles of its edges. Nothing moves, and the
     console shows no errors or warnings.
2. **Do:** click "Yacht", then, once it rests, drag the paper round to
   see its other side, and double-click to bring it back.
   - **Expect:** the lines fade out, the square turns over to its white
     side and leans about 15° anticlockwise, and five printed line
     segments fade in, dashed and dash-dot-dot. The other side is blue,
     with the same five lines, each of the opposite kind.
3. **Do:** click "Mount Fuji", then, once it rests, "Paper Dart".
   - **Expect:** for Mount Fuji, the lines fade out, the sheet turns to
     its coloured side, upright, fades to green, and its level and
     slanted lines fade in. For the dart, the lines fade out, the
     sheet fades to orange with no stretch or turn, since the two
     sheets share their shape and pose, and its fan of lines from the
     middle of the top edge fades in. No Fold Buttons appear, and a
     hover lights no line.
   - **Why:** folding arrives with Plan 24; a button here would be
     Sandbox Mode's code running on a design.
4. **Do:** click "Presentation", wait for the paper to rest, then
   click "Gameplay".
   - **Expect:** in Presentation Mode the six designs and "Flat" show,
     Pencil ringed, "Fold lines" is enabled again, and the paper
     stretches, turns red and folds into the pencil. Back in Gameplay
     Mode, Paper Dart is still ringed, "Fold lines" is ticked and
     greyed out, and the pencil unfolds, stretches to a square, turns
     orange and shows the dart's crease pattern, flat.
5. **Do:** click "Sandbox", make one fold with a Fold Button, press
   Cmd+Z, then click "Gameplay".
   - **Expect:** Sandbox Mode works as before: the four pattern
     buttons, the Undo, Redo, Unfold and Export buttons, "Fast Fold",
     a blue square with eight plain lines and Fold Buttons; the fold
     folds and Cmd+Z unfolds it. Back in Gameplay Mode those controls
     go, and the dart's flat sheet returns.
6. **Do:** click "Presentation", click "Paper Dart" there, wait for the
   finished dart, then click "Gameplay".
   - **Expect:** the dart's lines fade in and it unfolds; at flat the
     lines fade out and back in with no stretch, turn or change of
     colour, and the flat dart sheet rests with its lines showing.
   - **Why:** the finished dart and its flat gameplay sheet are two
     sheets of one shape; a stretch or a flash of colour here would
     mean the swap is not seamless.
7. **Do:** hard-reload, press Tab twice, then Left, then Right, then
   Tab, then Right.
   - **Expect:** the first Tab rings the paper and the second
     "Gameplay"; Left chooses "Presentation" and the pencil starts to
     fold; Right chooses "Gameplay" and it unfolds again; the next Tab
     lands on "Blintz"; and Right chooses "Yacht".
8. **Do:** run `document.activeElement.blur()` in the console, click
   the paper once, press Escape, then Right, then Escape.
   - **Expect:** Escape fades the toolbar out; Right changes the paper
     to the next Gameplay design, "Mount Fuji"; Escape brings the
     toolbar back, Mount Fuji ringed.
   - **Why:** with nothing focused, Escape must move focus to the
     checked Gameplay design, not to a hidden group.
9. **Do:** in the Performance panel, set the CPU to 4× slowdown, click
   the reload-and-record button, and stop once the page rests. Find the
   longest task before the first frame, and note its length. Then
   record the same on the live site,
   `https://richplastow.com/pureland-simulator/`, which is `main`
   before this plan, and compare.
   - **Expect:** the longest task here is longer than the live site's
     by about the four graphs' build time at 4×, as the second run of
     [Plan 22's Manual QA 4](./22-gameplay-graph.md#manual-qa)
     prints it (run that snippet again here if its time was not
     noted), and the first frame here shows the blintz at rest.
   - **Why:** the graphs are built at load on every device; this is
     the cost every later Gameplay design adds to. The measurement
     informs, and never gates.
10. **Do:** in the dev tools' device mode, choose a phone (iPhone 12
    Pro), reload, and click each Gameplay design.
    - **Expect:** the toolbar wraps onto several lines without
      overflowing the screen, and each design's crease pattern reads
      clearly at the phone's size.
11. **Do:** resize the desktop window while the dart's sheet shows,
    then switch the operating system between light and dark.
    - **Expect:** the paper stays centred and sharp at every size, and
      the toolbar's text follows the colour scheme while the paper
      keeps its orange.

**Looks wrong, but isn't:** nothing can be folded in Gameplay Mode
yet, and no status, lives or Hint show: those arrive with Plans 24 and
25.

## Audit

- **2026-11-23T12:50:44Z** — **drafted**: the third mode radio and the
  boot into Gameplay Mode, as the Lead Developer asked; the Gameplay
  designs' radios; each design's flat gameplay sheet and graph at load,
  with the stepper's walk between sheets measured against a prototype.
  Proposed by the agent, for the Lead Developer to confirm or change:
  the radios' order and labels (Decisions 1 and 3), the `gameplay:`
  sheet id (Decision 4), and one `mode` value in place of `isSandbox`
  (Decision 8).
- **2026-11-23T14:22:05Z** — **updated**: the Lead Developer ruled, through
  `/feed-me`, that a refused fold throws its own error, so the graphs
  built at load tell a refusal from a fault: Decision 11 and a new
  Step 1 added, the steps after it renumbered. Every Agent QA
  expectation in Step 1 was measured against a throwaway prototype of
  the change; the agent proposed the name FoldRefusal and which throws
  count as refusals.
- **2026-11-23T15:54:34Z** — **reviewed**: no Major finding. Every
  Step 1 and Step 2 Agent QA line, and the new Step 3 Agent QA 2,
  passes as written against a throwaway prototype of FoldRefusal,
  cutIfAllowed(), gameplaySheetId() and gameplay-radios.js over the
  real engine; the search meets only the "moves nothing" and unmade
  `{ movedBy }` refusals (49 on the dart, 36 on the heart, 1 on the
  yacht). Mutation testing found five mutants the old Step 1 lines
  passed (the stops-short and T-junction refusals left plain Errors,
  every engine Error made a FoldRefusal, a catch that also takes a
  TypeError, the rethrow dropped), so Step 1 Agent QA 1 gains three
  cases and Agent QA 2 tests the catch exactly; all 13 now fail. Step 3
  gains Agent QA 2, the radios' choices over stand-in DOM objects,
  which catches all 14 of its mutants; the old 2 and 3 become 3 and 4,
  the mode grep also taking an object key. Also fixed: Context names
  the second departure from the research, Decision 3's own radios;
  Decision 3 names the choice's fields and connectGameplayRadios()'s
  arguments; Decision 6 stretches only where the sheets differ; Step 1
  lists the doc comments of cutSheet() and cutPath(); Step 2 Agent QA 3
  counts each function's call; Step 3's file list drops the sandbox
  bar, already `hidden`, and adds the two-mode comments in `main.css`
  and `fold-lines-toggle.js`; Step 1 criterion 1 reworded, Step 3
  criteria 3 and 8 re-pointed; Manual QA 3 split per design, Manual
  QA 9's Expect measures the longest task. No Three.js API named; no
  texture colouring added. Timings not re-measured: load average 450.
- **2026-11-23T16:05:50Z** — **implemented**: Steps 1 to 3, by
  `/orchestrate-plan` Stage 2. Step 1: FoldRefusal exported from
  `docs/src/fold/engine.js` and thrown at its three refusals,
  `docs/src/gameplay/path.js`'s `{ movedBy }` refusal made one, and
  cutIfAllowed() in `docs/src/gameplay/graph.js` catching it alone, with
  the doc comments of cutSheet(), cutPath(), buildGraph() and
  cutIfAllowed() to match. Step 2: gameplaySheetId() in `path.js`; in
  `docs/src/main.js`, the four flat gameplay sheets in `sheets`, the four
  graphs in `graphs`, the radius over both, and `sheetColorIds`, a colour
  lookup by sheet id that replaces the `designs` map, so
  writeSequenceState() colours a `gameplay:` sheet. Step 3: the
  `gameplay` mode radio, checked, and the `.gameplay-designs` group in
  `docs/index.html`, the pattern group `hidden`; three modes in
  `docs/src/ui/mode-radios.js` and `docs/src/ui/controls-toggle.js`; the
  new `docs/src/ui/gameplay-radios.js`; `mode` in place of `isSandbox` and
  the boot on the blintz's gameplay sheet in `main.js`; the two-mode
  comments in `docs/styles/main.css` and
  `docs/src/ui/fold-lines-toggle.js`. Every Agent QA line failed first
  for the expected reason, then passed as written; none edited. Manual
  QA walked against the code and unchanged.
- **2026-11-23T16:05:58Z** — **verified**: agent checks pass: 8 changed
  modules parse, no line over 80 columns beyond the favicon's data URL and
  the canvas's `aria-keyshortcuts` and `aria-label`, `/` and every changed
  file served with status 200 (a server started for the check, then
  stopped), vendored checksums match; browser not run.
- **2026-11-23T16:11:40Z** — **quality-checked**:
  Fixed: FoldRefusal's doc comment in
  `docs/src/fold/engine.js` said every other throw "stays" a plain
  Error, which describes the change rather than the code; it now says
  "is" (first-run polish, comment only). Deferred: the three modes are
  listed three times, in `MODE_GROUPS` (`mode-radios.js`),
  `MODE_CHOICE_NAMES` (`controls-toggle.js`) and chooseMode()'s
  switch, a structural choice to weigh when a fourth mode comes, not a
  defect; the boot mode is written in `main.js` (`let mode`,
  chooseMode("gameplay")) and in `mode-radios.js`, as Sandbox Mode's
  was before, within Decisions 1, 2 and 8; chooseMode() assigns `mode`
  before its `default: throw`, unreachable since connectModeRadios()
  rejects any other value; a Gameplay choice's `designId` and
  `graphs` are read by nothing yet, kept for Plans 24 and 25.
  Verified fine: every pick, hover, press, Fold Button and Fast Fold
  path in `main.js` is gated by canPick() or canLayOut(), both through
  isSequenceAtRest()'s `mode === "sandbox"`, and Undo, Redo, Unfold,
  Export and their shortcuts by the sandbox bar's `hidden`; `isSandbox`
  had seven uses, all replaced; graph.js's catch is the only one over
  the engine; the 14 sheet ids are distinct, so `sheetColorIds` loses
  no colour; `.gameplay-designs` matches no `.designs` rule; Three.js
  sweep: no geometry, material, texture or render target added, the
  per-frame path adds only a keyed lookup in writeSequenceState(), no
  motion or resize change, no Three.js API or addon added; mutation
  testing on the real files: four gameplay-radios.js mutants (target
  unfrozen, `change` listener dropped, first radio left unchecked,
  position 1) and two path.js mutants (the unmade `{ movedBy }` a
  RangeError again, a `gameplay-` prefix) each caught by Agent QA,
  both files restored and checked by `shasum`; Manual QA 1 to 11
  walked against the code, none drifted; agent checks pass; browser
  not run.
- **2026-11-23T19:20:25Z** — **done**: passed the Lead Developer’s manual
  QA; moved to `plans/done/`.
