---
title: Dead ends, lives, hints and points
description: Makes the folding a game: a press into a dead end costs a life and closes that way, a Hint points to a right fold or back to the wrong turn, and the goal scores points.
type: plan
---

## Context

- The last of the four Basic Gameplay Mode plans, after
  [Plan 24](./24-gameplay-folds.md), whose folding it judges. It
  delivers the game: dead ends that cost a life and close behind the
  player, three lives and one hint per design, a Hint button, points at
  the goal, and a Next button to the next design, with every outcome
  said through Plan 24's status line.
- It implements the brief's
  [Dead ends and lives](./14-gameplay-mode-research.md#dead-ends-and-lives),
  [Hints](./14-gameplay-mode-research.md#hints) and
  [maze](./14-gameplay-mode-research.md#the-maze), as the research's
  [game layer](./14-gameplay-mode-research.md#6-the-game-layer) worked
  them out, under two of its rulings: every dead end is reported alike
  ([Q12](./14-gameplay-mode-briefs.md#q12)), and lives, hints and points
  are all per design, three lives and one hint to start, with the
  design starting afresh when the lives run out
  ([Q15](./14-gameplay-mode-briefs.md#q15)).
- It judges by lookup in the graph of
  [Plan 22](./22-gameplay-graph.md), which knows every state a design
  can reach and whether the goal can still be reached from it.
- Needed because Plan 24's folding has no stakes: a wrong order ends
  in silence, and nothing rewards the right one.
- Browser behaviour it rests on: the
  [`<output>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/output)
  element, for a readout the page computes; the
  [`animationend`](https://developer.mozilla.org/en-US/docs/Web/API/Element/animationend_event)
  event;
  [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion);
  and
  [`HTMLElement.click()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/click),
  which fires a radio's `click` and `change` as a pointer does. It
  names no new Three.js API.

## Decisions

1. **The rules live in the session, in pure maths.** A game, in
   `docs/src/gameplay/session.js`, gains `closedNodeIds`, the states
   proven dead; `hints` and `lives`, those left; and `pressCount`, the
   folds pressed so far, undone ones included. The DOM reads it; no
   rule touches the DOM or the GPU, so Node runs every one.

   The dart's game after the right wing is pressed first, a dead end at
   once:

   ```json
   {
     "closedNodeIds": [6],
     "designId": "paper-dart",
     "hints": 1,
     "lives": 2,
     "nodeIds": [0, 6],
     "path": [6],
     "pressCount": 1
   }
   ```

2. **A dead end is a state, not the goal, with no open edge**, and an
   edge is open unless it leads to a closed state.
   - A press, foldAt(), that lands on a dead end costs one life and
     closes that state. Then, back along the path, each state now left
     with no open edge is closed too, at no further cost.
   - openEdges() leaves out every edge into a closed state, from any
     state, so "a dead end once reached becomes unreachable", as the
     brief puts it. The research's sketch closed the one edge pressed;
     closing the state is the same thing unless two folds lead to one
     dead end, and then spares a life on a state already proven dead.
   - A press that lands on a state whose every way on is already closed
     is a dead end like any other, and costs a life.
   - A live state always has an edge to a live state, and no live state
     is ever closed, so closing never cuts the goal off.
   - Undo, Redo and Unfold only move the position: they cost nothing
     and close nothing, and a Redo may walk back into a closed state.
3. **Every number is a named constant**, exported from `session.js`,
   each a first guess open to tuning:

   | Constant | Value | Meaning |
   | --- | --- | --- |
   | `START_LIVES` | 3 | lives at the start of a game |
   | `START_HINTS` | 1 | hints at the start of a game |
   | `POINTS_FOR_GOAL` | 100 | points for reaching the goal, and the least a game scores |
   | `POINTS_PER_LIFE` | 50 | points for each life left |
   | `POINTS_PER_HINT` | 50 | points for each hint left |
   | `POINTS_PER_EXTRA_FOLD` | 10 | points lost for each fold pressed beyond the design's fold count |

4. **Points are scored at the goal alone.** pointsOf(game, graph)
   returns `POINTS_FOR_GOAL`, plus `POINTS_PER_LIFE` for each life
   left, plus `POINTS_PER_HINT` for each hint left, less
   `POINTS_PER_EXTRA_FOLD` for each press beyond the design's fold
   count, and never less than `POINTS_FOR_GOAL`: from 100 to 300, and
   300 for a design folded straight through. Nothing is scored per
   fold, since a score that rose on every right press would say which
   presses are right.
5. **A hint points along a right path, or back to the wrong turn.**
   hintAt(game, graph, position) returns `{ fold, foldsBack }`:
   - from a live state, `fold` is the first open edge's, in fold
     order, that leads to a live state, so it follows the design's own
     order where it can, and `foldsBack` is 0;
   - from a doomed state, `fold` is null and `foldsBack` is how many
     folds back along the path the last live state lies.

   spendHint(game) returns the game with one hint fewer, and throws a
   RangeError with none left. No hint is earned: a hint awarded for a
   run of right folds would say the run was right.
6. **A closed fold is not offered.** `main.js`'s rest state already
   reads openEdges()
   ([Plan 24, Decision 4](./24-gameplay-folds.md#decisions)), so a fold
   into a closed state shows no Fold Button, lights nothing and is
   skipped by Left and Right. Its printed line stays on the paper.
7. **The gameplay bar** is a `<div class="gameplay-bar" role="group"
   aria-label="Game">` after the fold bar, shown in Gameplay Mode
   alone by its `hidden` attribute. It holds `<output data-lives>`,
   which reads "Lives: 3"; `<button type="button" data-hint>`, "Hint";
   and `<button type="button" data-next>`, "Next", hidden until the
   goal. The new `docs/src/ui/gameplay-bar.js` connects it, and its
   buttons are drawn as the fold bar's are.
   - When the lives drop, the readout is marked `data-lost`, which the
     CSS plays as one pulse, growing to `--lives-pulse-scale: 1.4` and
     back over `--lives-pulse-duration: 0.4s`, both first guesses open
     to tuning; the mark is cleared on `animationend`, so the next loss
     plays again. Under reduced motion the CSS plays nothing.
8. **The bar and the status are written when a game starts, and each
   time the paper comes to rest**, so a dead end's message and its
   lost life arrive as the fold lands, not as the button is pressed.
   What the status line says at rest:

   | The paper rests at | Status |
   | --- | --- |
   | the goal | "Folded! 300 points.", with the game's own points |
   | a dead end, with the lives at 0 | "Out of lives. Starting again." |
   | a dead end, with lives left | "Dead end. Undo and try another way." |
   | any other state | empty |

   A dead end reached by Undo or Redo says the same as one just
   pressed into. An active line's name
   ([Plan 24, Decision 13](./24-gameplay-folds.md#decisions)) and a
   hint's words (Decision 10) replace the text until the paper next
   comes to rest.
9. **Out of lives, the design starts afresh.** When the paper rests
   with no life left, the status says so, the game is replaced by a
   new one, and the target is set to 0: the paper unfolds the losing
   path, and at the flat sheet the bar reads "Lives: 3" again and
   every fold is open. No timer is involved; the old sheet stays under
   its id until the next fold replaces it, as on any new game.
10. **The Hint button** is enabled while the game has a hint and is
    not at the goal. A press while the paper is moving does nothing
    and spends nothing. At rest it spends the hint, and:
    - from a live state, makes the hinted fold's line active, as a
      keyboard pick does: lit, its button emphasised, and the status
      reading "Hint." before the fold's own words, such as "Hint.
      Valley fold: left corner";
    - from a doomed state, the status reads "Hint. The wrong turn was
      3 folds back.", or "1 fold back.", and the Undo button is marked
      `data-hinted`, which the CSS pulses, growing to
      `--hint-pulse-scale: 1.1` and back every
      `--hint-pulse-duration: 0.8s`, first guesses open to tuning and
      not played under reduced motion, until the next fold, Undo, Redo,
      Unfold or new game clears it, through a setUndoHinted() on the
      fold bar.
11. **Next takes the player to the next design.** At the goal, unless
    the design is the last of `GAMEPLAY_DESIGNS`, the Next button
    shows; a press clicks the next Gameplay design's radio, which
    checks it and starts its game as a pointer's click would.
    `docs/src/ui/gameplay-radios.js` returns chooseNext() and
    hasNext() for it.
12. **A new game resets everything**: the lives, the hint, the closed
    states and the press count, whenever a Gameplay design or Gameplay
    Mode is chosen
    ([Plan 24, Decision 12](./24-gameplay-folds.md#decisions)). Nothing
    carries from one design to the next or survives a reload.
13. **No performance step.** Every rule is a lookup in a graph built
    at load, run once per press, and nothing here runs per frame, per
    pointer move or per vertex; Plan 24's Manual QA 15 already
    measures the press.

## Steps

### Step 1: The rules, in pure maths [P]

- Changes `docs/src/gameplay/session.js` (the constants; the game's
  new fields; foldAt()'s judgement; openEdges()'s closed edges; and
  hintAt(), pointsOf() and spendHint()), per Decisions 1 to 5.
- It should cost a life for a press that lands on a dead end, close
  that state and each state behind it left with no way on, and leave
  every other press, and the old game, as they were (Agent QA 1, 2).
- It should leave a closed state's folds out of every state's open
  edges, refuse a press of one with a RangeError, and never close a
  live state (Agent QA 1, 2).
- It should hint the first right fold from a live state, and the
  number of folds back to the last live state from a doomed one
  (Agent QA 1, 2).
- It should score a game by lives and hints left and extra presses,
  never below `POINTS_FOR_GOAL`, and spend a hint only while one is
  left (Agent QA 1).

**Agent QA**

1. Do: `node --input-type=module -e 'import { GAMEPLAY_DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { buildGraph } from "./docs/src/gameplay/graph.js"; import { createGame, foldAt, hintAt, openEdges, pointsOf, spendHint } from "./docs/src/gameplay/session.js"; const graph = buildGraph(cutSheet(GAMEPLAY_DESIGNS[3])); const play = (game, folds, from = 0) => folds.reduce((g, fold, i) => foldAt(g, graph, from + i, fold), game); const open = (game, position) => openEdges(game, graph, position).map((e) => e.fold).join(""); const fresh = createGame(graph); console.log(JSON.stringify(fresh)); const wing = play(fresh, [6]); console.log(JSON.stringify(wing), open(wing, 1) === "", open(wing, 0)); const half = play(fresh, [4, 5, 6]); console.log(half.lives, half.closedNodeIds.length, [0, 1, 2, 3].map((p) => open(half, p)).join("|"), JSON.stringify(hintAt(half, graph, 3)), JSON.stringify(hintAt(half, graph, 0))); const again = play(half, [6], 1); console.log(again.lives, again.closedNodeIds.length, open(again, 0), again.pressCount); const won = play(fresh, [1, 0, 3, 2, 4, 6, 5]); console.log(won.lives, won.closedNodeIds.length, won.nodeIds.at(-1) === graph.goalNodeId, pointsOf(won, graph), pointsOf(spendHint(won), graph), pointsOf({ ...won, hints: 0, lives: 1, pressCount: 12 }, graph), pointsOf({ ...won, hints: 0, lives: 1, pressCount: 40 }, graph), spendHint(won).hints, Object.isFrozen(spendHint(won))); for (const attempt of [() => spendHint(spendHint(won)), () => foldAt(wing, graph, 0, 6)]) { try { attempt(); } catch (e) { console.log(e.name); } }'`
   Expect: seven lines, the paper dart's:
   - `{"closedNodeIds":[],"designId":"paper-dart","hints":1,"lives":3,"nodeIds":[0],"path":[],"pressCount":0}`
   - `{"closedNodeIds":[6],"designId":"paper-dart","hints":1,"lives":2,"nodeIds":[0,6],"path":[6],"pressCount":1} true 01234`
     (the right wing first: a life gone, its state closed, nothing
     open there, and the wing no longer open on the flat sheet)
   - `2 2 012346|6|| {"fold":null,"foldsBack":3} {"fold":0,"foldsBack":0}`
     (the centre fold, then both wings: one life gone, the dead end
     and the state before it closed; a hint there says three folds
     back, and on the flat sheet says the left corner)
   - `1 4 01236 4` (back at the centre fold, the right wing leads only
     to that closed dead end, so it is one itself: a second life, and
     the centre fold closes on the flat sheet)
   - `3 0 true 300 250 100 100 0 true` (a right order: no life lost,
     nothing closed, the goal; 300 points, 250 with the hint spent,
     and 100 at the least)
   - `RangeError`, twice (a hint spent with none left; the closed wing
     pressed again)
2. Do: `node --input-type=module -e 'import { GAMEPLAY_DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { buildGraph } from "./docs/src/gameplay/graph.js"; import { createGame, foldAt, hintAt, openEdges } from "./docs/src/gameplay/session.js"; const graph = buildGraph(cutSheet(GAMEPLAY_DESIGNS[2])); const play = (game, folds, from = 0) => folds.reduce((g, fold, i) => foldAt(g, graph, from + i, fold), game); const open = (game, position) => openEdges(game, graph, position).map((e) => e.fold).join(""); let game = play(createGame(graph), [0, 2, 1, 3]); console.log(game.lives, game.closedNodeIds.length, [4, 3, 2, 1].map((p) => open(game, p)).join("|"), hintAt(game, graph, 4).foldsBack, hintAt(game, graph, 2).foldsBack, hintAt(game, graph, 1).fold); game = play(game, [3], 2); console.log(game.lives, game.closedNodeIds.length, game.path.join("")); game = play(game, [1], 3); console.log(game.lives, game.closedNodeIds.length, [3, 2, 1].map((p) => open(game, p)).join("|")); game = play(game, [3, 1, 2], 1); console.log(game.lives, game.closedNodeIds.length, open(game, 1), game.pressCount);'`
   Expect: four lines, Mount Fuji's: `2 2 ||3|123 3 1 1` (the snow, a
   slope, the middle, the other slope: a dead end at the fourth fold,
   closing it and the state before; the hint counts three folds back
   from it and one from the slope, and on the snow says the middle);
   `2 2 023` (the other slope from two folds in: no life lost yet);
   `1 5 ||13` (its dead end: a second life, and the first slope closes
   after the snow); and `0 8 1 9` (the other slope first: the last
   life, in nine presses)
3. Do: `node --check docs/src/gameplay/session.js; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/gameplay/session.js; grep -c "^import" docs/src/gameplay/session.js`
   Expect: nothing from the first two, then `0`: the module still
   imports nothing.

### Step 2: Dead ends and lives on the page

- Changes `docs/index.html` (the gameplay bar), `docs/styles/main.css`
  (the bar, and the readout's pulse, its length and size as custom
  properties, off under reduced motion) and `docs/src/main.js` (the
  bar's wiring, what it and the status say at rest, and the restart),
  and adds `docs/src/ui/gameplay-bar.js`, per Decisions 6 to 9 and 12.
- It should show no Fold Button, and light nothing, on a fold into a
  closed state (Manual QA 5, 9).
- It should, as the paper lands in a dead end, drop the lives readout
  with one pulse and say "Dead end. Undo and try another way."
  (Manual QA 4).
- It should cost nothing for Undo, Redo and Unfold, and say the same
  at a dead end reached by them (Manual QA 5, 11).
- It should, out of lives, say so, unfold the paper and start the
  design afresh with three lives and every fold open (Manual QA 10).
- It should show the bar in Gameplay Mode alone, and start every new
  game with three lives and a hint (Agent QA 1; Manual QA 1, 13).

**Agent QA**

1. Do: `tr -s ' \n' ' ' < docs/index.html | grep -o 'class="gameplay-bar"\|data-lives\|data-hint\|data-next' | tr '\n' ' '; grep -c "data-lost" docs/styles/main.css docs/src/ui/gameplay-bar.js`
   Expect: `class="gameplay-bar" data-lives data-hint data-next `, then
   a count of at least `1` for each of the two files
2. Do: `node --check docs/src/ui/gameplay-bar.js && node --check docs/src/main.js; awk 'length > 80 && !/data:image|aria-label="A sheet|aria-keyshortcuts=/ { print FILENAME ":" FNR }' docs/src/ui/gameplay-bar.js docs/src/main.js docs/styles/main.css docs/index.html; grep -c "setTimeout" docs/src/ui/gameplay-bar.js docs/src/main.js`
   Expect: nothing, then `0` for each of the two files: no timer.

### Step 3: The Hint button

- Changes `docs/src/main.js` (the hint's press), `docs/src/ui/fold-bar.js`
  (setUndoHinted()), `docs/src/ui/gameplay-bar.js` (the button's
  enabled state) and `docs/styles/main.css` (Undo's pulse, off under
  reduced motion), per Decision 10.
- It should, from a state that can still reach the goal, light a right
  fold's line, grow its button, say "Hint." and the fold's name, and
  spend the hint (Manual QA 8).
- It should, from a state that cannot, say how many folds back the
  wrong turn was and pulse Undo until the next move, spending the hint
  (Manual QA 6).
- It should grey the button out with no hint left and at the goal, and
  do nothing, spending nothing, while the paper moves
  (Manual QA 2, 6, 8).

**Agent QA**

1. Do: `grep -c "setUndoHinted" docs/src/ui/fold-bar.js docs/src/main.js; grep -c "data-hinted" docs/styles/main.css; for f in docs/src/ui/*.js docs/src/main.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/ui/*.js docs/src/main.js docs/styles/main.css`
   Expect: a count of at least `1` for each of the two files, a count
   of at least `1`, then nothing.

### Step 4: The goal: points, and Next

- Changes `docs/src/main.js` (the goal's message and the Next
  button's wiring), `docs/src/ui/gameplay-radios.js` (chooseNext() and
  hasNext()) and `docs/src/ui/gameplay-bar.js` (the Next button), per
  Decisions 4, 8 and 11.
- It should say "Folded!" and the game's points as the paper rests at
  the goal, by Decision 4's sum (Manual QA 2, 7).
- It should show Next at the goal, which chooses the next design and
  starts its game, and show none on the last design (Manual QA 3, 12).

**Agent QA**

1. Do: `grep -c "chooseNext\|hasNext" docs/src/ui/gameplay-radios.js docs/src/main.js; grep -c "pointsOf" docs/src/main.js; for f in docs/src/ui/*.js docs/src/main.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/ui/*.js docs/src/main.js`
   Expect: a count of at least `2` for the radios' file and `1` for
   `main.js`, a count of at least `1`, then nothing.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and
in the browser a wrong order on the paper dart costs a life at its dead
end and closes that way, the Hint finds a way on, and folding the dart
to the end says "Folded!" with its points.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome, open the dev tools
console, and hard-reload (Shift+Cmd+R).

1. **Do:** look at the page.
   - **Expect:** after "Undo", "Redo" and "Unfold" the toolbar reads
     "Lives: 3" and has a "Hint" button, enabled. No "Next" shows, the
     top of the page shows no text, and the console is clear.
2. **Do:** press one of the blintz's Fold Buttons and click "Hint" at
   once, while the corner is still folding. Then press the other three
   buttons, in any order.
   - **Expect:** the click on "Hint" does nothing, and it stays
     enabled. Nothing is said until the fourth fold lands; then the
     lines fade out, the top of the page reads "Folded! 300 points.",
     "Hint" greys out and "Next" appears.
3. **Do:** click "Next". Fold the yacht with its three buttons, then
   click "Next" again.
   - **Expect:** "Yacht" is ringed, the text goes, "Next" goes, "Hint"
     is enabled and the lives read 3. The finished yacht says "Folded!
     300 points.", and "Next" brings Mount Fuji's flat sheet.
4. **Do:** on Mount Fuji, press the V on the line near the top (the
   snow); then the chevron on the slanted line at the left; then the
   chevron on the level line; then the one button left.
   - **Expect:** nothing is said for three folds. As the fourth lands,
     "Lives: 3" becomes "Lives: 2" with a brief pulse, the top of the
     page reads "Dead end. Undo and try another way.", no Fold Button
     shows, and the lines stay printed.
   - **Why:** the slope was folded before the middle, and the game
     says so only when no fold is left, like every dead end.
5. **Do:** click "Undo", wait for the paper to rest, and click "Undo"
   again.
   - **Expect:** after the first, still no button and the same
     message, the lives still 2: that state is closed too. After the
     second, the text goes and one button shows, on the slanted line at
     the right; the level line, whose fold led to the dead end, has
     none, and a hover over it lights nothing.
6. **Do:** click "Hint". Then click "Undo".
   - **Expect:** the text reads "Hint. The wrong turn was 1 fold
     back.", "Hint" greys out, and "Undo" pulses. Undo stops pulsing as
     it is pressed, the slope unfolds, the text goes, and three buttons
     show again.
7. **Do:** press the chevron on the level line, then both slopes'.
   - **Expect:** as the last lands the lines fade out and the text
     reads "Folded! 170 points.": 100, and 100 for two lives, none for
     the spent hint, less 30 for three presses beyond Mount Fuji's
     four folds.
8. **Do:** click "Next", and on the paper dart's flat sheet click
   "Hint". Then press the button the hint shows.
   - **Expect:** the line from the top's middle to the left edge's
     middle lights thickly, its button grows, the text reads "Hint.
     Valley fold: left corner", and "Hint" greys out. The press folds
     the left corner.
9. **Do:** press the chevron, on the slanted line just right of the
   centre line. Once the paper rests, click "Undo".
   - **Expect:** the sheet's right part stands at a right angle, away
     from the viewer; as it lands the lives read 2 and the text reads
     "Dead end. Undo and try another way.". After Undo, four buttons
     show, all V's: that chevron is gone, and its line lights no
     longer.
10. **Do:** press the V on the outermost line to the bottom edge on the
    right, then the one button left. Click "Undo" twice. Press the V
    on the upright centre line, then the V and the chevron that share
    one slanted line.
    - **Expect:** the second press is a dead end: "Lives: 1". After
      the two Undos, three buttons show. As the last press lands, the
      lives read 0 and the text reads "Out of lives. Starting again.";
      the paper unfolds by itself to the flat sheet, where the lives
      read 3, "Hint" is enabled, the text has gone, and all six
      buttons, the chevron included, are back.
11. **Do:** press the chevron again, then click "Undo", "Redo" and
    "Undo".
    - **Expect:** the press costs a life: "Lives: 2". Redo folds back
      into the dead end, which says "Dead end. Undo and try another
      way." again, and the lives stay at 2 throughout.
12. **Do:** fold the dart to the end: the two lines from the top's
    middle to the side edges' middles, the two outermost lines to the
    bottom edge, the centre line, then the two buttons on one line.
    - **Expect:** "Folded! 240 points." if the folds since step 10's
      restart were exactly the chevron and these seven: 100, and 100
      for two lives, 50 for the hint, less 10 for one extra press. No
      "Next" shows: the dart is the last design.
13. **Do:** click "Sandbox", then "Presentation", then "Gameplay".
    - **Expect:** neither other mode shows "Lives", "Hint" or "Next",
      and both work as before. Back in Gameplay Mode the dart is flat,
      the lives read 3 and "Hint" is enabled.
14. **Do:** press Tab until "Hint" shows a focus ring and press Enter;
    then, in the Rendering panel, set "Emulate CSS media feature
    prefers-reduced-motion" to "reduce", and press the dart's chevron.
    - **Expect:** Enter works as the click did. With reduced motion
      the lives drop to 2 with no pulse, and the message still shows.
15. **Do:** in the dev tools' device mode, choose a phone (iPhone 12
    Pro), reload, click "Mount Fuji" and repeat step 4 by tapping.
    - **Expect:** the toolbar wraps without overflowing; the message
      at the top is readable in one or two lines and covers no Fold
      Button; and the dead end costs a life as on the desktop.

**Looks wrong, but isn't:**

- A wrong fold is not marked when it is made: the game says nothing
  until no fold is left, by
  [the research's ruling](./14-gameplay-mode-briefs.md#q12).
- A closed fold's button simply does not show; its printed line stays.
- Points show only at the goal, and are not kept from one design to
  the next.

## Audit

- **2026-11-23T12:50:44Z** — **drafted**: the game's rules in the
  session, the gameplay bar, the Hint and Next buttons and the status
  messages, with every rule's Agent QA and the Manual QA's two walks
  run against a prototype. Ruled earlier by the Lead Developer, via
  /feed-me on 2026-11-17: every dead end reported alike, and three
  lives and one hint per design, out of lives starting the design
  afresh. Proposed by the agent, for the Lead Developer to confirm or
  change: closing a dead end by its state, not the one edge pressed
  (Decision 2); the points' constants and sum (Decisions 3 and 4); a
  doomed hint saying how many folds back, and a live one picking the
  line as the keyboard does (Decisions 5 and 10); the bar's and the
  status line's wording, written as the paper comes to rest
  (Decisions 7 and 8); and the Next button (Decision 11).
