---
title: Sandbox Mode folds
description: Lets the player pick a lattice line with the pointer or keyboard, fold it either way with a pair of icon Fold Buttons, and undo, redo and unfold, with the sandbox sheet recut on every fold.
type: plan
---

## Context

- The third of the five Basic Sandbox Mode plans, on
  [Plan 16](./16-sandbox-mode.md)'s printed lattice, and before
  [Plan 18](./18-fold-angle.md), which adds the drag to an angle. It
  delivers the toy: pick a line, press a Fold Button, and the paper
  folds flat along it; Undo, Redo and Unfold walk back and forth.
- It implements the research's
  [picking a line](./13-sandbox-mode-research.md#3-picking-a-line-with-the-pointer),
  [Fold Buttons](./13-sandbox-mode-research.md#fold-buttons) and
  [the sandbox sheet, Undo, Redo and Unfold](./13-sandbox-mode-research.md#4-the-sandbox-sheet-undo-redo-and-unfold),
  and the rulings behind them: icon-only circular buttons, mountain and
  valley as the player sees the paper, graphic colours over the
  photorealistic paper, and every Sandbox line foldable either way.
- Three.js r187 source it rests on, read on 2026-11-14:
  [`Raycaster.setFromCamera()`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/core/Raycaster.js)
  (line 119),
  [`Ray.intersectPlane()`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/math/Ray.js)
  (line 395),
  [`Plane.setFromNormalAndCoplanarPoint()`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/math/Plane.js)
  (line 92) and `distanceToPoint()` (line 175),
  [`Object3D.localToWorld()`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/core/Object3D.js)
  (line 670), `worldToLocal()` (line 684) and `getWorldDirection()`
  (line 1049),
  [`Vector3.project()`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/math/Vector3.js)
  (line 499), and
  [`Line`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/objects/Line.js)
  with
  [`LineBasicMaterial`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/materials/LineBasicMaterial.js),
  whose `linewidth` WebGL ignores, so the lit line is one pixel wide.
- Browser behaviour it rests on:
  [pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture),
  as `drag.js` uses it;
  [WCAG 2.2, Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html),
  3:1 for an icon against its button; and
  [WCAG 2.2, Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  the swatches' 24 px.
- The contrast figures were computed on 2026-11-14 by the WCAG formula
  from the hex values.

## Definitions

- **A pick**: the foldable line the player has chosen, lit along its
  crossing extent, with its two Fold Buttons showing. There is at most
  one pick, and only at rest.
- **The facing side**: the side of the paper's plane the camera lies
  on, front or back, which says which fold a valley is as the player
  sees it.

## Decisions

1. **A pick is made by a click or a tap, not by hovering.** A press on
   the canvas that does not move is a pick: the pointer's ray meets the
   paper's plane, and the nearest foldable line within
   `PICK_DISTANCE_METERS = 0.008` (8 mm on the sheet, about 12 px on a
   phone and 27 px on a desktop) becomes the pick; further than that,
   or with no line, the pick clears. Hovering lights the nearest line
   within reach as a preview, without buttons. A press that moves is
   the spin drag, as today, and makes no pick. So the Fold Buttons stay
   where they are put until a press elsewhere, another pick, Escape, a
   fold, or a step moves them, which lets the pointer travel to them,
   and gives touch the same behaviour as the mouse. The research's
   outline had the buttons follow the hover; this is the departure.
2. **The hit point is found in the paper's own plane**, allocating
   nothing per move: a Raycaster, a Plane and three Vector3 scratch
   objects created once. The plane is set from `stretchGroup`'s world
   position and its world +Z through `getWorldDirection()`; the hit is
   taken into `stretchGroup`'s local frame with `worldToLocal()`, and
   the stage's centre, which the pose slides the paper by, added back,
   which gives a point of the folded plane that Plan 15's lines are in.
   Scale, start pose, lean and spin all fall out of the world matrix.
   No raycast against the mesh is needed, since at rest every flat
   fold lies in that plane; Plan 18's standing folds come after the
   pick is cleared.
3. **The foldable lines are found once per rest state**, not per
   move: when the stepper comes to rest in Sandbox Mode, main.js
   computes foldableLines() over placedPolygons() at the position's
   stage and keeps them until the next step. A move then compares the
   hit point with at most a few tens of segments. pickLine(point,
   lines, maxDistance) in `docs/src/sandbox/pick.js` is pure: the
   nearest line by distance from the point to its extent, or null.
4. **The lit line is a `Line` of two vertices** in `stretchGroup`, its
   positions written on each pick or preview and `needsUpdate` set,
   `visible` only while something is lit, with `depthTest` off and a
   high `renderOrder` so it draws over every layer. Its colour is the
   facing side's icon ink: black on the coloured side, the paper
   colour's deeper shade on the white side (Decision 7).
5. **Mountain and valley as seen.** The facing side is the sign of
   `Plane.distanceToPoint(camera.position)` for the paper's plane. On
   the front, the valley button makes a `"valley"` fold in the front's
   terms and the mountain button a `"mountain"`; on the back the two
   swap. seenType(type, isFrontFacing) in `pick.js` is the pure map.
   The pick is cleared when a drag starts and remade only at rest, so
   the facing side cannot flip under the buttons.
6. **The Fold Buttons are two `<button>`s** in `.fold-buttons`, a
   container over the canvas, each a 32 px circle (above the 24 px
   minimum, since a fingertip must land on one of two neighbours)
   holding an inline SVG icon: the fold's dash pattern, dashed for a
   valley and dash-dot-dot for a mountain, as the paper prints them,
   below a V for a valley or a chevron for a mountain. Their
   `aria-label`s are "Valley fold" and "Mountain fold". They sit side
   by side, the pair centred `FOLD_BUTTON_OFFSET_PX = 28` above the
   pick point on screen, carried there by `localToWorld()` and
   `Vector3.project()` after the frame's render, and rewritten only on
   frames where the spin, the pose or the canvas size changed, as the
   research sets out. Hidden, with the `hidden` attribute, while
   anything moves, and shown again at rest with the pick cleared.
   Sizes and the offset are open to retuning by eye.
7. **Graphic colours.** `docs/src/scene/paper-colors.js` gains
   `PAPER_COLOR_SHADES`, two shades per colour at full saturation:
   `lighter`, the button's background on the coloured side behind a
   pure black icon, and `deeper`, the icon's ink on a pure white
   background on the white side. Initial values, open to retuning by
   eye against the rendered paper, every pair clearing WCAG's 3:1:

   | `id`     | `lighter`  | black on it | `deeper`   | on white |
   | -------- | ---------- | ----------- | ---------- | -------- |
   | `red`    | `0xff7870` | 8.15:1      | `0xff0d00` | 3.95:1   |
   | `green`  | `0x70ff81` | 16.31:1     | `0x009c12` | 3.64:1   |
   | `blue`   | `0x70bbff` | 10.27:1     | `0x0086ff` | 3.59:1   |
   | `orange` | `0xffb170` | 11.76:1     | `0xdb6300` | 3.61:1   |
   | `pink`   | `0xff70ac` | 8.17:1      | `0xf30066` | 4.20:1   |

   The buttons read them through two custom properties on
   `.fold-buttons`, `--fold-button-background` and `--fold-button-ink`,
   which main.js sets when the paper colour or the facing side changes.
   `PAPER_BACK_COLOR` is not darkened in this plan: whether the lit
   white side reads too close to the buttons' pure white is Manual QA
   5's judgement, and a 5% darkening would take blue's back lines from
   3.04:1 to 2.72:1 against it.

   ```json
   { "deeper": 34559, "lighter": 7388159 }
   ```

8. **A press on a Fold Button folds.** The fold is the pick's line,
   `from` and `to` as Plan 15 oriented them, the pressed button's type
   in the front's terms, flat. main.js replaces the session with
   foldAt(session, position, fold), recuts it with cutSession(), stores
   the sheet under the pattern's id, and sets the target's position to
   one more; writeSequenceState() swaps the geometry at rest, before
   the step starts, and the swap is invisible since the new sheet posed
   at the old position puts every vertex where the old one was. The
   session lives in main.js, one per pattern, reset to empty when a
   pattern or Sandbox Mode is chosen.
9. **The geometry swap and the line redraw are separate.**
   paper.setSheet() keeps swapping the geometry and disposing of the
   old one, but no longer redraws the fold-line canvases; a new
   paper.setPrintedLines(sheet) does that. main.js calls both when the
   sheet's `printedLines` changed, which a design or pattern change
   does, and only setSheet() on a sandbox fold, whose lattice is
   unchanged. That saves two 2,048 px canvas redraws and texture
   uploads per fold; Manual QA 11 measures what the press costs.
10. **Undo, Redo and Unfold move the target.** A sandbox bar,
    `.sandbox-bar`, shown only in Sandbox Mode, holds three
    `<button>`s. Undo sets the target's position to one less, no lower
    than 0; Redo to one more, no higher than the session's fold count;
    Unfold to 0. Each press changes only the target, so a step under
    way finishes first and repeated presses queue, as design choices
    do today. Undo and Unfold are disabled at position 0, Redo at the
    fold count, written only when the state changes.
11. **Shortcuts**: Ctrl+Z and Cmd+Z undo; Ctrl+Y, Ctrl+Shift+Z and
    Cmd+Shift+Z redo; each with `preventDefault()`, in Sandbox Mode
    only, ignoring a held key's repeats as Escape does. Escape clears
    the pick if there is one, and otherwise hides the toolbar as
    before.
12. **Keyboard picking.** With the canvas focused (it gains
    `tabindex="0"` and a focus ring), the Left and Right arrow keys
    cycle the foldable lines in Plan 15's order, lighting each and
    showing its buttons; Tab then reaches the Valley and Mountain
    buttons, where Enter or Space folds. Up and Down are left for
    Plan 18's ring.
13. **A switch of pattern or mode discards the session** without a
    warning, as the open question below leaves it.

## Steps

### Step 1: Pure picking, and the shades [P]

- Adds `docs/src/sandbox/pick.js` (pickLine(), seenType(); Decisions
  3, 5) and changes `docs/src/scene/paper-colors.js`
  (`PAPER_COLOR_SHADES`; Decision 7).
- It should pick the nearest line within reach, measured to the
  extent, not the infinite line, and none beyond it (Agent QA 1).
- It should swap valley and mountain for the back (Agent QA 1).
- It should give every colour two shades clearing 3:1 (Agent QA 2).

**Agent QA**

1. Do: `node --input-type=module -e 'import { pickLine, seenType } from "./docs/src/sandbox/pick.js"; const lines = [{ family: "v", index: 0, from: [0, -0.05], to: [0, 0.05] }, { family: "h", index: 0, from: [-0.05, 0], to: [0.05, 0] }]; const k = (l) => (l ? l.family + l.index : "none"); console.log(k(pickLine([0.003, 0.02], lines, 0.008)), k(pickLine([0.02, -0.002], lines, 0.008)), k(pickLine([0.0, 0.07], lines, 0.008)), k(pickLine([0.1, 0.1], lines, 0.008)), seenType("valley", true), seenType("valley", false), seenType("mountain", false));'`
   Expect: `v0 h0 none none valley mountain valley` (a point 20 mm past the vertical line's end is 20 mm from its extent)
2. Do: `node --input-type=module -e 'import { PAPER_COLORS, PAPER_COLOR_SHADES } from "./docs/src/scene/paper-colors.js"; const lum = (hex) => { const c = [16, 8, 0].map((s) => ((hex >> s) & 255) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }; const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }; console.log(Object.keys(PAPER_COLORS).map((id) => { const { deeper, lighter } = PAPER_COLOR_SHADES[id]; return id + ":" + lighter.toString(16) + ":" + contrast(lighter, 0).toFixed(2) + ":" + deeper.toString(16) + ":" + contrast(deeper, 0xffffff).toFixed(2); }).join(" "));'`
   Expect: `red:ff7870:8.15:ff0d00:3.95 green:70ff81:16.31:9c12:3.64 blue:70bbff:10.27:86ff:3.59 orange:ffb170:11.76:db6300:3.61 pink:ff70ac:8.17:f30066:4.20` (every ratio at least 3.00; the values are open to retuning, and a retune updates this line)

### Step 2: The pick, the lit line and the Fold Buttons

- Adds `docs/src/input/pick.js` (the press that does not move, the
  hover preview, the ray and the plane; Decisions 1, 2),
  `docs/src/ui/fold-buttons.js` (the two buttons, their icons,
  placement and colours; Decisions 6, 7), and the `.fold-buttons` rules
  in `docs/styles/main.css`; changes `docs/src/input/drag.js` (reports
  a press that ends without moving), `docs/src/scene/paper.js` (the lit
  line; Decision 4) and `docs/src/main.js` (foldable lines per rest
  state, the pick, the facing side; Decisions 3, 5).
- It should light the nearest line under the hovering pointer, and
  pick it on a click or tap, showing two circular icon buttons above
  the point (Manual QA 1, 2, 8).
- It should clear the pick on a press away from every line, on Escape,
  and when a drag starts (Manual QA 3, 6).
- It should keep the buttons over the pick point as the paper spins,
  swapping their icons, labels and colours when the other side comes
  to face the camera (Manual QA 4, 5).
- It should allocate nothing per pointer move or per frame at rest
  (Agent QA 1; Manual QA 11).

**Agent QA**

1. Do: `sed -n '/^export const connectPick/,/^};/p' docs/src/input/pick.js | grep -cE "new [A-Z]|\[\]|\{\}|\.\.\."`
   Expect: `0` (every scratch object is created at module level or at connection, none inside the pointer handlers; a count above 0 names a line to read)
2. Do: `grep -o 'aria-label="[A-Za-z ]*fold"' docs/src/ui/fold-buttons.js | sort | tr '\n' ' '; grep -c "<button" docs/index.html`
   Expect: `aria-label="Mountain fold" aria-label="Valley fold" ` then `0` (the buttons are created by code, not in the page)
3. Do: `for f in docs/src/input/pick.js docs/src/ui/fold-buttons.js docs/src/input/drag.js docs/src/scene/paper.js docs/src/main.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/input/*.js docs/src/ui/*.js docs/src/scene/paper.js docs/src/main.js docs/styles/main.css`
   Expect: prints nothing.

### Step 3: Folding, and the sandbox sheet swap

- Changes `docs/src/scene/paper.js` (setSheet() without the redraw,
  setPrintedLines(); Decision 9) and `docs/src/main.js` (the session,
  the fold on a button press, the recut and the swap; Decision 8).
- It should fold the picked line flat the way the pressed button
  says, over `FOLD_SECONDS`, with no visible jump at the swap
  (Manual QA 2, 3).
- It should fold a line again once paper comes back across it, and
  run out of lines gracefully, showing no buttons (Manual QA 7).
- It should free the old geometry on every swap, so the geometry count
  holds steady (Manual QA 10).

**Agent QA**

1. Do: `grep -c "drawFoldLines" docs/src/scene/paper.js; sed -n '/const setSheet = /,/^  };/p' docs/src/scene/paper.js | grep -c "drawFoldLines\|createLinesTexture"`
   Expect: a count of at least `3`, then `0` (the redraw lives in
   setPrintedLines(), not in setSheet())
2. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { writePaperPositions } from "./docs/src/fold/pose.js"; const [p] = PATTERNS; const a = foldAt(createSession(), 0, { from: [0, 0.075], targetRadians: Math.PI, to: [0.075, 0], type: "valley" }); const b = foldAt(a, 1, { from: [0, -0.075], targetRadians: Math.PI, to: [-0.075, 0], type: "valley" }); const [sa, sb] = [cutSession(p, a), cutSession(p, b)]; const pos = (s, at) => { const n = s.faces.reduce((c, f) => c + f.polygon.length, 0); const out = new Float64Array(3 * n); writePaperPositions(out, at, s); return out; }; const pa = pos(sa, 1); const pb = pos(sb, 1); const pts = (arr) => new Set(Array.from({ length: arr.length / 3 }, (_, i) => [0, 1, 2].map((k) => arr[3 * i + k].toFixed(6)).join()))); const A = pts(pa); console.log([...pts(pb)].every((v) => A.has(v)), sa.faces.length, sb.faces.length);'`
   Expect: `true 2 3` (every vertex of the recut sheet posed at position 1 lies where a vertex of the old sheet does: the swap moves nothing the eye can see)

### Step 4: Undo, Redo, Unfold, the shortcuts and the keyboard

- Adds `docs/src/ui/sandbox-bar.js` and the `.sandbox-bar` markup in
  `docs/index.html` and rules in `docs/styles/main.css` (Decision 10),
  the shortcuts (Decision 11) and the keyboard pick (Decision 12);
  changes `docs/src/ui/controls-toggle.js` (Escape clears a pick
  first) and `docs/src/main.js`.
- It should undo, redo and unfold as target moves, queueing repeated
  presses, with each button disabled at its limit (Manual QA 3, 6).
- It should answer Ctrl+Z, Cmd+Z, Ctrl+Y, Ctrl+Shift+Z and
  Cmd+Shift+Z in Sandbox Mode only, without the browser's own undo
  (Manual QA 6, 9).
- It should pick and fold from the keyboard alone (Manual QA 8).

**Agent QA**

1. Do: `grep -o 'class="sandbox-bar"\|data-undo\|data-redo\|data-unfold\|tabindex="0"' docs/index.html | sort -u | tr '\n' ' '`
   Expect: `class="sandbox-bar" data-redo data-undo data-unfold tabindex="0" `
2. Do: `grep -c "preventDefault" docs/src/ui/sandbox-bar.js; grep -c "event.repeat" docs/src/ui/sandbox-bar.js`
   Expect: a count of at least `1`, then at least `1`
3. Do: `for f in docs/src/ui/sandbox-bar.js docs/src/ui/controls-toggle.js docs/src/main.js; do node --check "$f"; done`
   Expect: prints nothing.

## Open questions

1. **Should switching pattern or mode ask before discarding a session
   with folds in it?** Decision 13 discards silently: the basic
   Sandbox saves nothing, and a confirm dialog would be the app's first
   modal. Owner: the Lead Developer, by 2026-11-21, at review.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser the eight-line square pattern can be folded into a blintz
by hand, undone and redone, from the mouse, a touch screen and the
keyboard, with no console errors.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome, open the dev tools
console, hard-reload (Shift+Cmd+R), and click "Sandbox". Wait for the
blue square with its eight plain lines.

1. **Do:** move the pointer slowly across the paper without pressing.
   - **Expect:** as it nears each line, that line lights up in black
     along its length; between lines, nothing is lit. No buttons yet.
2. **Do:** click on the diagonal running from the top-left corner.
   - **Expect:** the diagonal stays lit and two round buttons appear
     just above the click point, side by side, each blue-tinted with a
     black icon: a dashed line over a V, and a dash-dot-dot line over a
     chevron. Hovering one shows the pointer cursor. Click the V.
   - **Expect:** the top-left corner folds up and over onto the centre
     over about 0.7 s, towards the camera; the buttons vanish as it
     moves; the paper comes to rest with no jump, and the pointer
     lights lines again.
3. **Do:** click the line through the midpoints of the top and right
   edges, and press the chevron; then click "Undo".
   - **Expect:** the top-right corner folds away from the camera,
     behind the paper. Undo unfolds it twice as fast, 0.35 s, back to
     the first fold; "Redo" is now enabled.
4. **Do:** with a line picked, drag the paper a quarter turn.
   - **Expect:** the drag clears the pick as it starts: the lit line
     and the buttons go. Release, click a line again, then drag the
     paper slowly all the way round to its white side.
   - **Expect:** the pick clears again on the drag; nothing follows the
     paper round. Click a line on the white side.
   - **Expect:** the buttons are now pure white discs with icons in a
     deep blue, and the lit line is deep blue. Press the V.
   - **Expect:** the flap folds towards the camera, which from this
     side is a mountain in the paper's own terms.
   - **Why:** the buttons mean what the player sees, from either side.
5. **Do:** look at the white side's buttons against the paper.
   - **Expect:** the button's white is plainly whiter than the lit
     paper beside it. If it is not, note it: Decision 7 leaves
     `PAPER_BACK_COLOR` for a retune by eye.
6. **Do:** double-click to reset the spin, press Cmd+Z three times
   quickly, then Cmd+Shift+Z twice, then click "Unfold".
   - **Expect:** three undos queue and play one after another; two
     redos follow; Unfold returns the sheet to flat. "Undo" and
     "Unfold" are greyed out at flat, "Redo" when nothing is undone.
     The page itself never shows a browser undo or a selection.
7. **Do:** fold all four corners to the centre (the four lines through
   the edges' midpoints), then the vertical centre line, then keep
   folding whatever lights until nothing does.
   - **Expect:** the blintz, then a kite shape; after the centre fold
     the lines that paper came back across light again; after about
     seven folds no line lights and a click shows no buttons, with Undo
     the only way back.
8. **Do:** click "Unfold", click the canvas once on empty space, then
   press Right three times, Tab, and Enter.
   - **Expect:** the canvas shows a focus ring; each Right lights the
     next line and shows its buttons; Tab moves focus to the Valley
     button, with a focus ring; Enter folds it.
9. **Do:** click "Presentation", then press Cmd+Z.
   - **Expect:** the sandbox bar is gone; Cmd+Z does nothing to the
     paper.
10. **Do:** in the Performance panel, tick Memory, record while making
    five folds and five undos, then stop.
    - **Expect:** the JS heap rises on each press and falls back after
      a collection; it does not climb press after press.
    - **Why:** each recut disposes of the old geometry.
11. **Do:** in the Performance panel, record while pressing a Fold
    Button on the 14-line oblong after six folds, then stop.
    - **Expect:** the press's frame is the only long one; the frames
      at rest after it show no scripting.
    - **Why:** the recut and swap allocate on the press, never per
      frame.
12. **Do:** in device mode (iPhone 12 Pro), tap a line, then tap a
    button.
    - **Expect:** the tap picks as a click does; the two buttons are
      big enough to tell apart with a fingertip and do not overlap
      each other.

## Audit

- **2026-11-14T14:05:33Z** — **drafted**: picking by click or tap with a
  hover preview, the lit line, the two icon Fold Buttons coloured by the
  facing side, folding with an invisible sheet swap, Undo, Redo, Unfold, the
  shortcuts and keyboard picking; one open question on discarding a session.
