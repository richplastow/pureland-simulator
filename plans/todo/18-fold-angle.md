---
title: Dragging a Fold Button to an angle
description: Lets a drag on a Fold Button choose the fold's angle in 15° steps, shown by a ring round the button, so a last fold can stand up short of flat, with a keyboard and a single-tap way to the same angles.
type: plan
---

## Context

- The fourth of the five Basic Sandbox Mode plans, on
  [Plan 17](../done/17-sandbox-folds.md)'s Fold Buttons, and before
  [Plan 19](./19-export-design.md), which writes the angle into the
  export. It delivers the drag the research's ruling put in the first
  folding plan: a click folds flat, a drag chooses an angle, a ring
  round the button follows the drag, snapping to 15°, and on release
  the paper animates to that angle.
- With the engine as it stands a fold short of flat is a finishing
  fold, after which only Undo works
  ([A 90° fold in the engine as it stands](./13-sandbox-mode-research.md#a-90-fold-in-the-engine-as-it-stands)
  and
  [Angles](./13-sandbox-mode-research.md#7-angles-several-standing-folds-a-stepping-stone-to-the-fold-tree)).
  Plan 17 already shows no buttons where no line is foldable, so after
  a standing fold nothing lights and nothing is offered, which is the
  grey-out the research asks for. [Plan 20](./20-standing-folds.md)
  lifts the limit to several standing folds.
- The ghost, a translucent preview of the fold during the drag, is
  left out as the ruling says, and may follow once this plan's Manual
  QA says whether the ring alone is enough to judge an angle by.
- Browser behaviour it rests on:
  [`stroke-dasharray`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-dasharray)
  on an SVG circle, which draws the ring's arc;
  [pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)
  on the button; and
  [WCAG 2.2, Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html),
  which asks that what a drag does can be done with a single pointer
  without dragging.

## Decisions

1. **A drag on a Fold Button chooses the angle by its distance.** A
   press on a button captures the pointer; the pointer's distance from
   the press point, in any direction, sets the angle at
   `DRAG_DEGREES_PER_PIXEL = 1.5`, so a half turn is 120 px, snapped
   down to the nearest 15°; a press that moves less than the drag
   threshold, `DRAG_THRESHOLD_PX = 4`, is a click and folds flat. On
   release at 15° or more the fold is made at that angle; below 15°
   the drag cancels and nothing folds. Both constants are open to
   retuning by eye.
2. **Snapping keeps angles exact.** snapAngleRadians(radians) in
   `docs/src/sandbox/angle.js` rounds down to a multiple of
   `SNAP_RADIANS = π / 12` and clamps to 0 to π, so every angle is a
   whole number of twelfths of a half turn, which Plan 19 writes as a
   fraction.
3. **The ring is an SVG circle** round the button being dragged, of
   `RING_RADIUS_PX = 22` with a stroke of `RING_WIDTH_PX = 4`, whose
   `stroke-dasharray` shows the angle as an arc from the top, clockwise:
   a full ring at 180°. It is drawn in the button's ink colour, appears
   on the press and goes on release, and its attribute is rewritten
   only when the snapped angle changes. Below 180° a small label inside
   the ring shows the angle in degrees, so a 90° wall is unmistakable.
   Sizes are open to retuning by eye.
4. **The angle goes to the fold** as its `targetRadians`, which
   createFold() takes and cutSession() passes; the stepper animates it
   as it animates the dart's wings, and the pose leaves the flap
   standing. The lines on a standing flap stay printed; no new
   rendering is needed.
5. **After a standing fold nothing is foldable**, since cutSheet()
   refuses any fold after one that stops short: Plan 15's
   foldableLines() does not know that, so main.js asks the engine by
   trying each line, catching the refusal, and keeps only the lines
   that cut; after a standing fold that is none. The pointer lights
   nothing, a click picks nothing, and the sandbox bar's Undo is the
   way back. Plan 20 replaces this trial with its own rules.
6. **Two ways to an angle without dragging.** With a Fold Button
   focused, Up and Down step the angle by 15° between 15° and 180°,
   showing the ring, and Enter or Space folds at the shown angle; and,
   for a single pointer, the ring is shown on hover or focus and its
   stroke is a target: a tap on the ring at a point sets the angle that
   point's bearing from the top gives, snapped, and folds. Which of
   the two players reach for is Manual QA 7's and 8's to tell.

## Steps

### Step 1: The snapping [P]

- Adds `docs/src/sandbox/angle.js`: snapAngleRadians() and
  angleFromDragPixels() (Decisions 1, 2).
- It should snap any angle down to a multiple of 15° within 0 to 180°
  (Agent QA 1).
- It should turn a drag's distance into a snapped angle, 0 below the
  threshold (Agent QA 1).

**Agent QA**

1. Do: `node --input-type=module -e 'import { angleFromDragPixels, snapAngleRadians } from "./docs/src/sandbox/angle.js"; const deg = (r) => Math.round((r * 180) / Math.PI); console.log([0.1, Math.PI / 2 + 0.2, Math.PI, 4, -1].map((r) => deg(snapAngleRadians(r))).join(","), [0, 3, 4, 10, 60, 119, 120, 500].map((px) => deg(angleFromDragPixels(px))).join(","));'`
   Expect: `0,90,180,180,0 0,0,0,15,90,165,180,180`

### Step 2: The drag, the ring and the standing fold

- Changes `docs/src/ui/fold-buttons.js` (the press, capture, drag and
  release; the ring and its label; the hover and focus ring, the tap
  on it, and Up and Down; Decisions 1, 3, 6), `docs/styles/main.css`
  (the ring) and `docs/src/main.js` (the angle on the fold, the trial
  of each line after a standing fold; Decisions 4, 5).
- It should fold flat on a click and to the ring's angle on a drag,
  cancelling below 15° (Manual QA 1, 2, 3).
- It should leave a standing flap standing, with nothing foldable
  after it and Undo the way back (Manual QA 2, 4).
- It should reach any angle by Up and Down with Enter, and by a tap on
  the ring (Manual QA 7, 8).
- It should rewrite the ring only when the snapped angle changes, and
  allocate nothing per pointer move (Agent QA 1).

**Agent QA**

1. Do: `sed -n '/pointermove/,/^  }/p' docs/src/ui/fold-buttons.js | grep -cE "new [A-Z]|\[\]|\{\}|\.\.\."`
   Expect: `0`
2. Do: `grep -c "stroke-dasharray\|setAttribute(\"stroke-dasharray\"" docs/src/ui/fold-buttons.js; grep -c "snapAngleRadians\|angleFromDragPixels" docs/src/ui/fold-buttons.js`
   Expect: a count of at least `1`, then at least `1`
3. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const [p] = PATTERNS; const s = foldAt(createSession(), 0, { from: [0, 0.075], targetRadians: Math.PI / 2, to: [0.075, 0], type: "valley" }); const sheet = cutSession(p, s); const lines = foldableLines(p, placedPolygons(sheet, 1)); let cuts = 0; for (const l of lines) for (const type of ["valley", "mountain"]) { try { cutSession(p, foldAt(s, 1, { from: l.from, targetRadians: Math.PI, to: l.to, type })); cuts++; } catch {} } console.log(sheet.faces.length, lines.length, cuts);'`
   Expect: `2 7 0` (a corner stood at 90°: the lattice still lists seven lines across the flat paper, and the engine refuses every one of them)
4. Do: `node --check docs/src/ui/fold-buttons.js && node --check docs/src/main.js && node --check docs/src/sandbox/angle.js; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/ui/fold-buttons.js docs/src/sandbox/angle.js docs/src/main.js docs/styles/main.css`
   Expect: prints nothing.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser a corner of the square pattern can be stood up at 90° by a
drag, left standing, and undone, from the mouse, a touch screen and the
keyboard.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome, open the dev tools
console, hard-reload (Shift+Cmd+R), and click "Sandbox". Wait for the
blue square with its eight lines.

1. **Do:** click the diagonal from the top-left corner, then click the
   V button without moving.
   - **Expect:** the corner folds flat, as in Plan 17. Click "Undo".
2. **Do:** click the same line, press on the V button and, holding,
   drag away about 60 px, then release.
   - **Expect:** as the drag grows, a ring draws round the button from
     the top, clockwise, in steps, with the angle inside it: 15°, 30°,
     … to 90° at about 60 px; it never moves smoothly between steps.
     On release the corner lifts to stand upright at a right angle and
     stays there. The pointer then lights no line, and a click on the
     paper shows no buttons; "Undo" is enabled.
3. **Do:** click "Undo", click the line again, press on the chevron,
   drag 2 px and release; then press again, drag 40 px, drag back to
   the start and release.
   - **Expect:** the 2 px press counts as a click and folds flat, away
     from the camera; after Undo, the second drag shows the ring rise
     and fall back to nothing, and releasing folds nothing.
4. **Do:** click "Undo" if needed, then drag a corner's button to 180°
   (about 120 px or more).
   - **Expect:** the ring closes fully and the corner folds flat, just
     as a click does; lines light again afterwards.
5. **Do:** stand a corner at 45°, then drag the paper round to look
   along the standing flap.
   - **Expect:** the flap stands at 45° from the sheet, its printed
     lines still on it, with no gap or seam at the hinge.
6. **Do:** press Cmd+Z.
   - **Expect:** the flap lies back down over 0.35 s, and lines light
     again.
7. **Do:** click the canvas on empty space, press Right until a line
   lights, Tab to the V button, press Up six times, then Enter.
   - **Expect:** each Up grows the ring by 15°, to 90°; Enter stands
     the flap at 90°.
8. **Do:** click "Undo", click a line, hover over the V button without
   pressing, then click on the ring at its right-hand side, three
   o'clock.
   - **Expect:** the ring appears faintly on hover; the click on it
     folds the flap to 90°, since three o'clock is a quarter turn from
     the top.
   - **Why:** WCAG 2.2's Dragging Movements: a single pointer must
     reach every angle without dragging.
9. **Do:** in device mode (iPhone 12 Pro), tap a line, then press and
   drag a button with a finger.
   - **Expect:** the ring follows the finger's distance as it does the
     mouse, and the page neither scrolls nor zooms during the drag.
10. **Do:** judge, after steps 2 to 9, whether the ring and its label
    were enough to choose an angle by.
    - **Expect:** a note for the Lead Developer either way; if not, the
      ghost preview the research describes is the next backlog item.

## Audit

- **2026-11-14T14:05:33Z** — **drafted**: the drag to a snapped angle with a
  ring and a degree label, the standing fold left standing with nothing
  foldable after it, and the keyboard and tap alternatives to the drag.
