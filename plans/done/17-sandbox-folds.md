---
title: Sandbox Mode folds
description: Lets the player pick a lattice line with the pointer or keyboard, fold it either way with a pair of icon Fold Buttons, and undo, redo and unfold, with the sandbox sheet recut on every fold.
type: plan
---

## Context

- The third of the five Basic Sandbox Mode plans, on
  [Plan 16](./16-sandbox-mode.md)'s printed lattice, and before
  [Plan 19](./19-fold-angle.md), which adds the drag to an angle. It
  delivers the toy: pick a line, press a Fold Button, and the paper
  folds flat along it; Undo, Redo and Unfold walk back and forth.
- It implements the research's
  [picking a line](../todo/13-sandbox-mode-research.md#3-picking-a-line-with-the-pointer),
  [Fold Buttons](../todo/13-sandbox-mode-research.md#fold-buttons) and
  [the sandbox sheet, Undo, Redo and Unfold](../todo/13-sandbox-mode-research.md#4-the-sandbox-sheet-undo-redo-and-unfold),
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
  (line 499).
- The lit strip (Decision 4) rests on r187 source read on 2026-11-15:
  [`Mesh`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/objects/Mesh.js)
  (line 39) with
  [`MeshBasicMaterial`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/materials/MeshBasicMaterial.js)
  (line 14);
  [`Material`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/materials/Material.js)'s
  `side` (line 88), `transparent` (line 124), `depthTest` (line 220)
  and `depthWrite` (line 231); `Object3D`'s `castShadow` (line 299,
  false by default) and `renderOrder` (line 327, 0 by default, which
  the fold-line meshes in `docs/src/scene/paper.js` keep);
  [`WebGLRenderLists.js`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/renderers/webgl/WebGLRenderLists.js),
  which puts a `transparent` material in the transparent list (line
  134) and sorts that list by `renderOrder` before depth (lines 31–39);
  [`WebGLRenderer.js`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/renderers/WebGLRenderer.js),
  which draws every opaque object before every transparent one (lines
  2001–2003), so an opaque line under the transparent fold-line meshes
  would be painted over whatever its `renderOrder`;
  [`BufferAttribute`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/core/BufferAttribute.js)'s
  `needsUpdate` (line 163);
  [`Frustum.intersectsObject()`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/math/Frustum.js)
  (line 146), which computes a geometry's bounding sphere only while it
  is null (line 158); and
  [`Color.setHex()`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/math/Color.js)
  (line 204). The renderer's tone mapping is r187's default,
  `NoToneMapping`, so the strip shows its hex exactly.
- Browser behaviour it rests on:
  [pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture),
  as `drag.js` uses it;
  [`@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)
  and
  [`transition-behavior: allow-discrete`](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior),
  which fade the Fold Buttons in and out of `display: none`, where a
  browser without them shows and hides the pair at once;
  [WCAG 2.2, Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html),
  3:1 for an icon against its button; and
  [WCAG 2.2, Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  the swatches' 24 px.
- The contrast figures were computed on 2026-11-14 by the WCAG formula
  from the hex values.

## Definitions

- **At rest**: the sequence state at its target's `sheetId` and
  `position`, with no step, stretch, fade or spin reset under way and
  no drag held.
- **A pick**: the foldable line the player has chosen, lit along its
  crossing extent, with its two Fold Buttons showing. There is at most
  one pick, and only at rest.
- **The facing side**: the side of the paper's plane the camera lies
  on, front or back, which says which fold a valley is as the player
  sees it.

## Decisions

1. **A pick is made by a click or a tap, not by hovering.** A press on
   the canvas that does not move, beyond a slop of
   `DRAG_THRESHOLD_PX = 4` CSS pixels from where it went down, is a
   pick: the pointer's ray meets the
   paper's plane, and the foldable line whose nearest fold span, a piece
   of it with paper on both sides (Decision 4), lies within
   `PICK_DISTANCE_METERS = 0.008` (8 mm on the sheet, about 12 px on a
   phone and 27 px on a desktop) becomes the pick. A piece of a line
   that only runs along the paper's outline, its apparent edge, is no
   fold, and a press near it alone picks nothing; a later plan that
   picks folds to unfold or re-angle them may relax that for apparent
   edges, never for the sheet's own. Further than that,
   with no line, or with the ray missing the plane (`intersectPlane()`
   returns null when the paper is edge-on), the pick clears. Hovering,
   at rest and with no pick standing, lights the nearest line within
   reach as a preview, without buttons; while a pick stands, hovering
   lights nothing else, so the pointer can travel to the buttons
   across other lines. A press that moves further is the spin drag, as
   today, its first move reporting the whole way from the press, and
   makes no pick. So the Fold Buttons stay
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
   fold lies in that plane; Plan 19's standing folds come after the
   pick is cleared.
3. **The foldable lines are found once per rest state**, not per
   move: when the stepper comes to rest in Sandbox Mode, main.js
   computes foldableLines() over placedPolygons() at the position's
   stage and keeps them until the next step. A move then compares the
   hit point with at most a few tens of spans. pickLine(lines,
   maxDistanceMeters, point) in `docs/src/sandbox/line-pick.js` is
   pure: the nearest item by distance from the point to its extent, or
   null; main.js gives it the lines' fold spans, from pickSpans(), and
   the arrow keys cycle only the lines that have one, landing on the
   middle of the longest, from writeFoldMiddle(). (Named apart from
   `docs/src/input/pick.js`, the pointer's
   module, since main.js imports both.)
4. **The lit line is a flat strip**, a `Mesh` of two triangles in
   `stretchGroup`, created once with the paper, so it reads as a bold
   band over the printed line beneath it, which is 0.5 mm wide
   (`FOLD_LINE_WIDTH_MM` in `fold-lines.js`) and black on the front.
   It is `LIT_LINE_WIDTH_METERS = 0.003` wide at full width (3 mm on
   the sheet, six times the printed line; open to retuning by eye) and
   lies in
   the paper's plane, local z = 0, along the line's crossing extent, in
   the frame Decision 2 takes the hit into: its corners are the
   extent's ends less the stage's centre that Decision 2 adds back,
   offset half the width either way across the line. The pure
   writeStripPositions(centre, line, positions, widthMeters) in
   `line-pick.js` writes them, corners 0 and 1 straddling `from` and 2
   and 3 straddling `to`, into the strip's position buffer, created
   once with its six-entry index, on each pick or preview, and
   `needsUpdate` is set; nothing is allocated per move. The strip's
   bounding sphere is set once to the paper's `radiusMeters`, as
   createSheetGeometry() sets the paper's, since frustum culling
   computes a sphere only while it is null, and a rewritten strip would
   otherwise keep the first one. Its material is a `MeshBasicMaterial`,
   unlit and graphic like the Fold Buttons, created with
   `side: DoubleSide`, so it shows from the back; `transparent: true`,
   so it joins the transparent list, where
   `LIT_LINE_RENDER_ORDER = 1`, above the fold-line meshes' default 0,
   draws it after them; and `depthTest: false` and `depthWrite: false`,
   so it draws over every layer and hides nothing drawn after it. It
   casts and receives no shadow, and is `visible` only while something
   is lit. It is one strip per segment of the line, up to
   `LIT_LINE_MAX_SEGMENTS = 32`, in one mesh, each segment in the ink
   of the printed line it covers, as vertex colours
   (`vertexColors: true`, each ink converted to the working colour
   space by `Color.setHex()`, r187 `Color.js` line 204), with the draw
   range (`BufferGeometry.setDrawRange()`) covering the segments lit:
   black where the paper there shows its front, whose lines are black;
   the paper colour's deeper shade (Decision 7) where it shows only its
   back, whose lines take the paper's colour; and black again where the
   line runs along a border between the two sides, as along a folded
   flap's edge, since the deeper shade there would all but vanish
   against the coloured side beside it. So the printed line seems to
   swell, segment by segment. Which side shows at a point is the face
   nearest the camera there, the highest layer from the front's side of
   the plane and the lowest from the back's, and whether it lies face
   up; the pure placedFaces(), showsFrontAt() and litSegments() in
   `line-pick.js` work it out, the segments once per rest state, from
   each side, beside the foldable lines (Decision 3). litSegments()
   looks 1 µm either side of the line, not on it, so a line along a
   face's edge sees both faces beside it. Only a piece with paper on
   both sides is a fold and is lit; a piece along the paper's outline,
   paper on one side only, and a piece over a gap are not. A segment's
   end where the line runs off the paper is capped: it runs on by half
   the band's width, a square cap, which closes the sliver left where
   the outline meets the line at 45°, the shallowest angle any lattice
   line and paper edge meet at. The paper's materials write 1 into the
   stencil buffer wherever they draw (`stencilWrite`,
   `stencilZPass: ReplaceStencilOp`), and the band draws only where it
   finds 1 (`stencilFunc: EqualStencilFunc`), so caps and corners are
   clipped to the paper's outline on screen, as a thicker printed line
   would be. The renderer is created with `stencil: true`, which r187
   leaves off (`WebGLRenderer.js` line 77) and clears each frame
   (`autoClearStencil`, line 234); the stencil properties are
   Material's, which acts on them only with `stencilWrite` set. Its
   geometry
   and material live for the
   page's life, as the paper's materials and grain texture do, so they
   are never disposed of. A line lit grows from no width to full width
   over `LIT_LINE_GROW_SECONDS = 0.15`, eased, and a line put out
   shrinks back to none, written each frame by paper.stepLitLines() only
   while a width changes. So that one line can shrink while the next
   grows, there are two such meshes, which swap roles as lines are lit.
5. **Mountain and valley as seen.** The facing side is the sign of
   `Plane.distanceToPoint(camera.position)` for the paper's plane. On
   the front, the valley button makes a `"valley"` fold in the front's
   terms and the mountain button a `"mountain"`; on the back the two
   swap. seenType(isFrontFacing, type) in `line-pick.js` is the pure
   map. The pick is cleared when a drag starts and remade only at
   rest, so the facing side cannot flip under the buttons.
6. **The Fold Buttons are two `<button>`s** in `.fold-buttons`, a
   container over the canvas, which `fold-buttons.js` inserts directly
   after the canvas, so Tab runs from the canvas to the Valley button,
   then the Mountain button, then the toolbar. Each is a 32 px circle
   (above the 24 px minimum, since a fingertip must land on one of two
   neighbours) holding an inline SVG icon: the fold's dash pattern,
   dashed for a valley and dash-dot-dot for a mountain, as the paper
   prints them, below a V for a valley or a chevron for a mountain.
   Each button keeps its icon and its `aria-label`, "Valley fold" or
   "Mountain fold", as the player sees the fold; the type it makes in
   the front's terms (Decision 5) follows the facing side, and its
   colours follow the side of the paper under the pick: the click's
   point, or a keyboard pick's line's midpoint, by showsFrontAt(), and
   the facing side's where no paper lies there. Where white and colour
   meet exactly at the point, either theme will do. They sit side by
   side, `--controls-gap` apart, the
   pair centred `FOLD_BUTTON_OFFSET_PX = 28` above the pick point on
   screen, carried there by `localToWorld()` and
   `Vector3.project()` after the frame's render, and rewritten only on
   frames where the spin, the pose or the canvas size changed, as the
   research sets out. Hidden, with the `hidden` attribute, while
   anything moves; since anything that moves clears the pick, they
   show again only on the next pick. `.fold-buttons` sets a `display`,
   so it needs a `.fold-buttons[hidden] { display: none; }` rule, as
   `.choices[hidden]` has. The pair fades in and out over 0.15 s, in
   CSS alone, through `@starting-style` and a `display` transition with
   `allow-discrete`. A button hovered or keyboard-focused grows by 10%
   and a white veil over its background, under its icon, fades to 30%
   opacity; a press, by pointer, Enter or Space, marks it
   `data-bumped`, and a 0.2 s keyframe bump takes it to 140% and the
   veil to 60% and back; the pair then holds for 0.2 s before it fades.
   The veil lightens by opacity because a transitioned `color-mix()`
   background flickered between its two colours in Chrome as the
   pointer rested on a button. Under reduced motion the
   buttons lighten but never grow. Each
   of these is a custom property in `main.css`. Sizes, the offset and
   the timings are open to retuning by eye.
7. **Graphic colours.** `docs/src/scene/paper-colors.js` gains
   `PAPER_COLOR_SHADES`, two shades per colour at full saturation:
   `lighter`, the button's background on the coloured side behind a
   pure black icon, and `deeper`, the icon's ink on a pure white
   background on the white side. On the light page a pure white button
   would lose its circle against a white page, so the page itself is a
   light grey there, `--page-color: light-dark(#f0f0f0, Canvas)` in
   `main.css`, which the transparent canvas shows through and the
   chosen choices' and swatch's ring gap shares; the dark page keeps the
   system's `Canvas`. Initial values, open to retuning by eye against
   the rendered paper, every pair clearing WCAG's 3:1:

   | `id`     | `lighter`  | black on it | `deeper`   | on white |
   | -------- | ---------- | ----------- | ---------- | -------- |
   | `red`    | `0xff7870` | 8.17:1      | `0xff0d00` | 3.96:1   |
   | `green`  | `0x70ff81` | 16.31:1     | `0x009c12` | 3.64:1   |
   | `blue`   | `0x70bbff` | 10.24:1     | `0x0086ff` | 3.59:1   |
   | `orange` | `0xffb170` | 11.77:1     | `0xdb6300` | 3.62:1   |
   | `pink`   | `0xff70ac` | 8.17:1      | `0xf30066` | 4.20:1   |

   main.js passes both shades to fold-buttons.js, which writes them as
   `--fold-button-deeper` and `--fold-button-lighter` on `.fold-buttons`
   when the paper colour changes, and marks the pair `data-over-white`
   when the paper under the pick shows its white side; the CSS draws the
   two themes from those.
   `PAPER_BACK_COLOR` is not darkened in this plan: whether the lit
   white side reads too close to the buttons' pure white is Manual QA
   5's judgement, and a 5% darkening would take blue's back lines from
   3.04:1 to 2.72:1 against it. Blue's entry, as JSON:

   ```json
   { "deeper": 34559, "lighter": 7388159 }
   ```

8. **A press on a Fold Button folds.** The fold is the pick's line,
   `from` and `to` as Plan 15 oriented them, the pressed button's type
   in the front's terms, flat. main.js replaces the session with
   foldAt(session, k, fold), where k is the rest position, recuts it
   with cutSession(), stores the sheet under the pattern's id, and sets
   the target's position to k + 1; writeSequenceState() swaps the
   geometry at rest, before the step starts. The swap moves nothing
   sideways: both sheets are cut along the same first k folds, so the
   new sheet posed at k covers the same paper, with every stack's
   layers in the same order. Only heights can change, where the new
   fold's creases split a face that spanned stacks of different
   depths: by at most 0.1 mm after one fold and 0.3 mm after two, and
   up to 1.8 mm in the deepest stacks, measured over 2,489 swaps in
   300 random sessions on 2026-11-14; Manual QA 7 watches for that
   settle. The session lives in main.js, one per pattern, reset to
   empty when a pattern or Sandbox Mode is chosen. A reset leaves the
   pattern's sheet in `sheets` as it is, since the paper may still be
   unfolding on it towards the choice's position 0; the next fold,
   made at position 0, replaces it.
9. **The geometry swap and the line redraw are separate.**
   paper.setSheet() keeps swapping the geometry and disposing of the
   old one, but no longer redraws the fold-line canvases; a new
   paper.setPrintedLines(sheet) does that, and disposes of the old
   textures. main.js calls both when the swapped-in sheet's `designId`
   differs from the shown sheet's, which a design or pattern change
   brings, and only setSheet() on a sandbox fold, which keeps the
   `designId` and the lattice. Identity of `printedLines` is no test:
   cutSession() builds a fresh, equal array on every cut, so it would
   redraw on every fold. setSheet() is then called with the lines
   showing, which is safe, since the new geometry carries the same
   sheet-coordinate UVs; its doc comment drops "with the fold lines
   hidden". That saves two 2,048 px canvas redraws and texture
   uploads per fold; Manual QA 11 measures what the press costs.
10. **Undo, Redo and Unfold move the target.** A sandbox bar,
    `.sandbox-bar`, shown only in Sandbox Mode (hidden otherwise by
    its `hidden` attribute, with a `.sandbox-bar[hidden]` rule as
    `.choices[hidden]` has), holds three `<button>`s. Undo sets the
    target's position to one less, no lower than 0; Redo to one more,
    no higher than the session's fold count; Unfold to 0. Each press
    changes only the target, so a step under way finishes first, as
    with a design choice, and repeated presses add up, each playing in
    turn. Undo and Unfold are disabled while the target's position is
    0, Redo while it equals the fold count, written only when the
    state changes.
11. **Shortcuts**: Ctrl+Z and Cmd+Z undo; Ctrl+Y, Ctrl+Shift+Z and
    Cmd+Shift+Z redo; each with `preventDefault()`, in Sandbox Mode
    only, ignoring a held key's repeats as Escape does. Escape clears
    the pick if there is one, and otherwise hides or shows the toolbar
    as before.
12. **Keyboard picking.** With the canvas focused (it gains
    `tabindex="0"` and a focus ring, and is reached by Tab, since a
    press on it keeps focus where it was, as `drag.js` has it), the
    Left and Right arrow keys cycle the foldable lines in Plan 15's
    order, lighting each and showing its buttons over the line's
    midpoint; Tab then reaches the Valley and Mountain buttons, where
    Enter or Space folds. Up and Down are left for Plan 19's ring.
13. **A switch of pattern or mode discards the session** without a
    warning, as the open question below leaves it.

## Steps

### Step 1: Pure picking, and the shades [P]

- Adds `docs/src/sandbox/line-pick.js` (pickLine(), seenType(),
  writeStripPositions(), placedFaces(), showsFrontAt(), litSegments();
  Decisions 3 to 6) and changes
  `docs/src/scene/paper-colors.js` (`PAPER_COLOR_SHADES`; Decision 7).
- It should pick the nearest line within reach, measured to the
  extent, not the infinite line, and none beyond it (Agent QA 1).
- It should swap valley and mountain for the back (Agent QA 1).
- It should give every colour two shades clearing 3:1 (Agent QA 2).
- It should write the lit strip's corners centred on the line's ends,
  less the stage's centre, the strip's width apart, at z = 0
  (Agent QA 3).
- It should tell which side of the paper shows at a point, from either
  side of its plane, and split a line into segments by the ink their
  printed line takes, black along a border between white and colour
  (Agent QA 4).
- It should treat only a line's pieces with paper on both sides as
  folds, lit and picked, capping a segment's end only where the line
  runs off the paper (Agent QA 5).

**Agent QA**

1. Do: `node --input-type=module -e 'import { pickLine, seenType } from "./docs/src/sandbox/line-pick.js"; const lines = [{ family: "v", index: 0, from: [0, -0.05], to: [0, 0.05] }, { family: "h", index: 0, from: [-0.05, 0], to: [0.05, 0] }]; const k = (l) => (l ? l.family + l.index : "none"); const at = (x, y) => k(pickLine(lines, 0.008, [x, y])); console.log(at(0.003, 0.02), at(0.02, -0.002), at(0.003, 0.005), at(0.005, 0.003), at(0, 0.07), at(0, -0.07), at(0.1, 0.1), seenType(true, "valley"), seenType(false, "valley"), seenType(false, "mountain"));'`
   Expect: `v0 h0 v0 h0 none none none valley mountain valley` (with both lines within reach, the nearer wins, whichever comes first; a point 20 mm past either end of the vertical line is 20 mm from its extent)
2. Do: `node --input-type=module -e 'import { PAPER_COLORS, PAPER_COLOR_SHADES } from "./docs/src/scene/paper-colors.js"; const lum = (hex) => { const c = [16, 8, 0].map((s) => ((hex >> s) & 255) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }; const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }; console.log(Object.keys(PAPER_COLORS).map((id) => { const { deeper, lighter } = PAPER_COLOR_SHADES[id]; return id + ":" + lighter.toString(16) + ":" + contrast(lighter, 0).toFixed(2) + ":" + deeper.toString(16) + ":" + contrast(deeper, 0xffffff).toFixed(2); }).join(" "));'`
   Expect: `red:ff7870:8.17:ff0d00:3.96 green:70ff81:16.31:9c12:3.64 blue:70bbff:10.24:86ff:3.59 orange:ffb170:11.77:db6300:3.62 pink:ff70ac:8.17:f30066:4.20` (every ratio at least 3.00; the values are open to retuning, and a retune updates this line)
3. Do: `node --input-type=module -e 'import { writeStripPositions } from "./docs/src/sandbox/line-pick.js"; const p = new Float32Array(12); writeStripPositions([0.01, 0], { family: "v", index: 0, from: [0, -0.05], to: [0, 0.05] }, p, 0.0015); const c = (i) => [p[3 * i], p[3 * i + 1], p[3 * i + 2]]; const mid = (a, b) => c(a).map((v, j) => (v + c(b)[j]) / 2); const gap = (a, b) => c(a).map((v, j) => v - c(b)[j]); const f = (v) => +v.toFixed(5); console.log(...mid(0, 1).map(f), ...mid(2, 3).map(f), ...gap(0, 1).map(f), ...gap(2, 3).map(f));'`
   Expect: `-0.01 -0.05 0 -0.01 0.05 0 -0.0015 0 0 -0.0015 0 0` (corners 0 and 1 straddle `from` less the centre, 2 and 3 straddle `to`, all at z = 0; each pair lies 1.5 mm apart across the line, corners 0 and 2 to its left)
4. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { litSegments, placedFaces, showsFrontAt } from "./docs/src/sandbox/line-pick.js"; const [p] = PATTERNS; const faces = (fold) => placedFaces(cutSession(p, foldAt(createSession(), 0, { ...fold, targetRadians: Math.PI, type: "valley" })), 1); const half = faces({ from: [0, -0.075], to: [0, 0.075] }); const corner = faces({ from: [0, 0.075], to: [0.075, 0] }); const lines = foldableLines(p, corner.map((f) => f.polygon)); const line = (id) => lines.find((l) => l.family + l.index === id); const show = (s) => s.map((g) => (g.takesFrontInk ? "F" : "B") + g.fromFraction.toFixed(3) + "-" + g.toFraction.toFixed(3)).join(","); console.log(showsFrontAt(half, true, [0.03, 0.01]), showsFrontAt(half, false, [0.03, 0.01]), showsFrontAt(half, true, [-0.03, 0.01]), show(litSegments(corner, true, line("d0"))), show(litSegments(corner, false, line("d0"))), show(litSegments(corner, true, line("h0"))), show(litSegments(corner, false, line("h0"))));'`
   Expect: `false false null F0.000-0.667,B0.667-1.000 B0.000-1.000 F0.000-1.000 B0.000-1.000` (folded in half, the paper shows white from both sides, and nothing where the moved half was; with the top-right corner folded in, the main diagonal from the front takes black over the coloured side for two-thirds of its length, then the colour over the white flap, and from the back only the colour; the horizontal centre line, half of which runs along the flap's edge, a border between white and colour, takes black all along from the front)
5. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { litSegments, pickLine, pickSpans, placedFaces } from "./docs/src/sandbox/line-pick.js"; const p = PATTERNS.find((q) => q.id === "oblong-half-diagonals"); const lineIn = (faces, id) => foldableLines(p, faces.map((f) => f.polygon)).find((l) => l.family + l.index === id); const fold = (s, at, id) => { const l = lineIn(placedFaces(cutSession(p, s), at), id); return foldAt(s, at, { from: l.from, to: l.to, targetRadians: Math.PI, type: "valley" }); }; const s2 = fold(fold(createSession(), 0, "d-2"), 1, "d0"); const faces = placedFaces(cutSession(p, s2), 2); const lines = foldableLines(p, faces.map((f) => f.polygon)); const segs = lines.map((l) => litSegments(faces, true, l)); const spans = pickSpans(lines, segs); const v1 = lines.find((l) => l.family + l.index === "v1"); const near = (t) => [v1.from[0] + t * (v1.to[0] - v1.from[0]) + 0.001, v1.from[1] + t * (v1.to[1] - v1.from[1])]; const k = (s) => (s ? s.line.family + s.line.index : "none"); const show = (s) => s.map((g) => (g.capsFrom ? "|" : "") + (g.takesFrontInk ? "F" : "B") + g.fromFraction.toFixed(3) + "-" + g.toFraction.toFixed(3) + (g.capsTo ? "|" : "")).join(","); console.log(show(segs[lines.indexOf(v1)]), k(pickLine(spans, 0.008, near(0.85))), k(pickLine(spans, 0.008, near(0.2))));'`
   Expect: `|F0.000-0.333,B0.333-0.667 none v1` (on the 2:1 diagonal pattern after two folds, a vertical line runs along the paper's outline for its last third: that piece is dropped, the segments are capped only where the line runs off the paper, at its start, not where the edge carries on; and a press near the edge picks nothing, while one near the fold picks the line)

### Step 2: The pick, the lit line and the Fold Buttons

- Adds `docs/src/input/pick.js` (connectPick(): the press that does
  not move, the hover preview, the ray and the plane; Decisions 1, 2),
  `docs/src/ui/fold-buttons.js` (the two buttons, their icons,
  placement and colours; Decisions 6, 7), and the `.fold-buttons` rules
  in `docs/styles/main.css`; changes `docs/src/input/drag.js` (reports
  a press that ends without moving), `docs/src/scene/paper.js` (the lit
  strip, written by writeStripPositions(); Decision 4) and
  `docs/src/main.js` (foldable lines per rest state, the pick, the
  facing side; Decisions 3, 5).
- It should light the nearest line under the hovering pointer as a
  bold band in the ink of the printed line beneath it, segment by
  segment, wider than that line, and pick it on a click or tap,
  showing two circular icon buttons above the point (Agent QA 4;
  Manual QA 1, 2, 8).
- It should clear the pick on a press away from every line, on Escape,
  and when a drag starts (Manual QA 4).
- It should show the buttons in the colours of the side of the paper
  under the pick, from either side, with each button's icon and label
  still as the player sees the fold (Manual QA 2, 4, 5).
- It should allocate nothing per pointer move or per frame at rest
  (Agent QA 1; Manual QA 11).

**Agent QA**

1. Do: `sed -n '/^export const connectPick/,/^};/p' docs/src/input/pick.js | grep -cE "new [A-Z]|\[\]|\{\}|\.\.\."`
   Expect: `0` (every scratch object, the Raycaster, the Plane and the Vector3s, is created once at module level, none inside connectPick() or its pointer handlers; a count above 0 names a line to read)
2. Do: `grep -o '"\(Valley\|Mountain\) fold"' docs/src/ui/fold-buttons.js | sort -u | tr '\n' ' '; grep -c "Valley fold\|Mountain fold" docs/index.html`
   Expect: `"Mountain fold" "Valley fold" ` then `0` (the Fold Buttons are made by code, not written in the page, which holds the sandbox bar's buttons from Step 4 on)
3. Do: `for f in docs/src/input/pick.js docs/src/ui/fold-buttons.js docs/src/input/drag.js docs/src/scene/paper.js docs/src/main.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/input/*.js docs/src/ui/*.js docs/src/scene/paper.js docs/src/main.js docs/styles/main.css`
   Expect: prints nothing.
4. Do: `grep -oE "LIT_LINE_(RENDER_ORDER = 1|WIDTH_METERS = 0\.003)|depthTest: false|depthWrite: false" docs/src/scene/paper.js | LC_ALL=C sort -u | tr '\n' ' '`
   Expect: `LIT_LINE_RENDER_ORDER = 1 LIT_LINE_WIDTH_METERS = 0.003 depthTest: false depthWrite: false ` (the strip's width and draw order are named constants, and its material is created with depth testing and writing off)

### Step 3: Folding, and the sandbox sheet swap

- Changes `docs/src/scene/paper.js` (setSheet() without the redraw,
  setPrintedLines(); Decision 9) and `docs/src/main.js` (the session,
  the fold on a button press, the recut and the swap; Decision 8).
- It should fold the picked line flat the way the pressed button
  says, over `FOLD_SECONDS`, with the paper holding its place at the
  swap, bar a settle of at most 1.8 mm in the heights of the deepest
  stacks (Decision 8) (Agent QA 2; Manual QA 2, 3, 7).
- It should fold a line again once paper comes back across it, and
  run out of lines gracefully, showing no buttons (Manual QA 7).
- It should free the old geometry on every swap, and the old line
  textures on every redraw, so memory holds steady over repeated folds
  (Agent QA 1; Manual QA 10).

**Agent QA**

1. Do: `grep -c "drawFoldLines" docs/src/scene/paper.js; sed -n '/const setSheet = /,/^  };/p' docs/src/scene/paper.js | grep -c "drawFoldLines\|createLinesTexture"; sed -n '/const setSheet = /,/^  };/p' docs/src/scene/paper.js | grep -c "dispose()"; sed -n '/const setPrintedLines = /,/^  };/p' docs/src/scene/paper.js | grep -c "dispose()"`
   Expect: a count of at least `3`, then `0`, then at least `1`, then
   at least `2` (the redraw lives in setPrintedLines(), not in
   setSheet(); each disposes of what it replaces)
2. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { writePaperPositions } from "./docs/src/fold/pose.js"; const [p] = PATTERNS; const a = foldAt(createSession(), 0, { from: [0, 0.075], targetRadians: Math.PI, to: [0.075, 0], type: "valley" }); const b = foldAt(a, 1, { from: [0, -0.075], targetRadians: Math.PI, to: [-0.075, 0], type: "valley" }); const [sa, sb] = [cutSession(p, a), cutSession(p, b)]; const faces = (s) => { const n = s.faces.reduce((c, f) => c + f.polygon.length, 0); const out = new Float64Array(3 * n); writePaperPositions(out, 1, s); let i = 0; return s.faces.map((f) => f.polygon.map(() => [out[3 * i], out[3 * i + 1], out[3 * i++ + 2]])); }; const [fa, fb] = [faces(sa), faces(sb)]; const d = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]); const on = (fs) => { const edges = fs.flatMap((f) => f.map((u, i) => [u, f[(i + 1) % f.length]])); return (v) => edges.some(([u, w]) => d(u, v) + d(v, w) - d(u, w) < 1e-9); }; console.log(fb.flat().every(on(fa)), fa.flat().every(on(fb)), sa.faces.length, sb.faces.length);'`
   Expect: `true true 2 3` (posed at position 1, every vertex of each sheet lies on an edge of the other, at the same height: in this shallow case the recut covers the same paper and the swap moves nothing; deeper stacks can settle by up to 1.8 mm, which Manual QA 7 watches for; posed at 2, the new sheet prints `false false`)

### Step 4: Undo, Redo, Unfold, the shortcuts and the keyboard

- Adds `docs/src/ui/sandbox-bar.js` (the bar, Decision 10, and the
  shortcuts, Decision 11) and the `.sandbox-bar` markup in
  `docs/index.html` and rules in `docs/styles/main.css`; changes
  `docs/src/input/pick.js` (the keyboard pick, Decision 12),
  `docs/index.html` (the canvas's `tabindex`), `docs/styles/main.css`
  (its focus ring), `docs/src/ui/controls-toggle.js` (Escape clears a
  pick first) and `docs/src/main.js`.
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
3. Do: `for f in docs/src/ui/sandbox-bar.js docs/src/ui/controls-toggle.js docs/src/input/pick.js docs/src/main.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/ui/sandbox-bar.js docs/src/ui/controls-toggle.js docs/src/input/pick.js docs/src/main.js docs/styles/main.css`
   Expect: prints nothing.

## Open questions

1. **Should switching pattern or mode ask before discarding a session
   with folds in it?** Decision 13 discards silently: the basic
   Sandbox saves nothing, and a confirm dialog would be the app's first
   modal. Owner: the Lead Developer, by 2026-11-21, at review.
2. **Should a press that moves a pixel or two still pick?** Answered
   2026-11-15 by the Lead Developer, in favour: clicks were found
   turning the paper imperceptibly instead of picking. `drag.js` now
   treats a press as a drag only once the pointer strays more than
   `DRAG_THRESHOLD_PX = 4` from where it went down (Decision 1), the
   value Plan 19 proposes for a press on a Fold Button, which can
   import it. Whether 4 px is enough for a fingertip is still Manual
   QA 12's to judge on a real touch screen.

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
   - **Expect:** as it nears each line, that line grows into a bold
     black band along its length, about six times as wide as the
     printed line beneath it, and shrinks away again as the pointer
     leaves it; between lines, nothing is lit. No buttons yet.
2. **Do:** click on the short diagonal across the top-left corner, the
   line joining the midpoints of the top and left edges.
   - **Expect:** the diagonal stays lit and two round buttons fade in
     just above the click point, side by side, each blue-tinted with a
     black icon: a dashed line over a V, and a dash-dot-dot line over a
     chevron. Hovering one shows the pointer cursor, and the button
     grows slightly and lightens. Click the V.
   - **Expect:** the V bumps, briefly bigger and lighter still, and the
     pair fades out; the top-left corner folds up and over onto the
     centre over about 0.7 s, towards the camera; the lit line shrinks
     away as it moves; the paper comes to rest with no jump, and the
     pointer lights lines again.
   - **Do:** hover the long diagonal from the top-left corner, which
     now runs across the folded corner, then click it once on the
     folded corner and once on the blue paper, pressing Escape after
     each.
   - **Expect:** the band is black over the blue paper and deep blue
     over the white flap, each part swelling from the printed line
     beneath it. A click on the flap shows white buttons with deep-blue
     icons; a click on the blue paper, blue-tinted buttons with black
     icons.
3. **Do:** click the line through the midpoints of the top and right
   edges, and press the chevron; then click "Undo".
   - **Expect:** the top-right corner folds away from the camera,
     behind the paper. Undo unfolds it twice as fast, 0.35 s, back to
     the first fold; "Redo" is now enabled.
4. **Do:** click a line, then click empty paper well away from every
   line; click a line again and press Escape twice, then once more.
   - **Expect:** the click on empty paper clears the lit line and the
     buttons; the first Escape clears the pick with the toolbar still
     shown, the second hides the toolbar, and the third shows it
     again. Click a line, then drag the paper a quarter turn.
   - **Expect:** the drag clears the pick as it starts: the lit line
     and the buttons go. Release, click a line again, then drag the
     paper slowly all the way round to its white side.
   - **Expect:** the pick clears again on the drag; nothing follows the
     paper round. Click a line on the white side.
   - **Expect:** the buttons are now pure white discs with icons in a
     deep blue, and the picked line is a bold deep-blue band over the
     thinner printed blue line, as plain as the black band on the
     coloured side. Press the V.
   - **Expect:** the flap folds towards the camera, which from this
     side is a mountain in the paper's own terms.
   - **Why:** the buttons mean what the player sees, from either side.
5. **Do:** look at the white side's buttons against the paper.
   - **Expect:** the button's white is plainly whiter than the lit
     paper beside it. If it is not, note it: Decision 7 leaves
     `PAPER_BACK_COLOR` for a retune by eye.
6. **Do:** double-click to reset the spin, then press Cmd+Z twice
   quickly, then Cmd+Shift+Z twice, then click "Unfold".
   - **Expect:** the two undos queue and play one after another, back
     to flat; the two redos follow; Unfold returns the sheet to flat.
     "Undo" and "Unfold" are greyed out at flat, "Redo" when nothing
     is undone. The page itself never shows a browser undo or a
     selection.
7. **Do:** fold both bottom corners to the centre (the short
   diagonals through the bottom edge's midpoint), then fold along the
   horizontal centre line.
   - **Expect:** after the two corner folds, neither short diagonal
     lights; the centre-line fold brings the top corners down over
     them, and both light again. As each fold starts, the paper
     beside the moving flap holds still. Click "Unfold".
   - **Do:** fold all four corners to the centre (the four short
     diagonals), then keep folding whatever lights until nothing does.
   - **Expect:** the blintz, a smaller square turned 45°; each fold
     after it halves the shape; after seven or eight folds in all no
     line lights and a click shows no buttons, with Undo the only way
     back. As each of these deeper folds starts, the stack may settle
     slightly, its layers closing up or parting by a millimetre or two
     (Decision 8), but nothing slides sideways and no flap changes
     place. Note any settle you see, and at which fold.
8. **Do:** click "Unfold", wait for the paper to lie flat, then press
   Tab or Shift+Tab until the paper shows a focus ring; then press
   Right three times, Tab, and Enter.
   - **Expect:** a click on the canvas does not focus it, but Tab
     does; each Right lights the next line and shows its buttons; Tab
     moves focus to the Valley button, with a focus ring; Enter folds
     it, and focus returns to the paper, with its focus ring, so Right
     picks again once the fold comes to rest. The focused Valley button
     shows grown and lightened, and bumps on Enter, as a click does.
   - **Do:** once it rests, press Right, then Escape twice, then Right.
   - **Expect:** the first Escape clears the pick; the second hides the
     toolbar with the focus ring still on the paper; Right then lights a
     line and shows its buttons, and the pattern stays "Square ½".
     Press Escape to show the toolbar again.
9. **Do:** click "Presentation", then press Cmd+Z.
   - **Expect:** the sandbox bar is gone; Cmd+Z does nothing to the
     paper.
10. **Do:** in the Performance panel, tick Memory, record while making
    five folds and five undos, then stop.
    - **Expect:** the JS heap rises on each press and falls back after
      a collection; it does not climb press after press.
    - **Why:** each recut disposes of the old geometry.
11. **Do:** in the Performance panel, record while pressing a Fold
    Button on "Oblong ½", the 14-line oblong, after six folds, then
    stop.
    - **Expect:** the press's frame is the only long one; the frames
      at rest after it show only the animation loop's brief scripting,
      with no garbage collection.
    - **Why:** the recut and swap allocate on the press, never per
      frame.
12. **Do:** in device mode (iPhone 12 Pro), tap a line, then tap a
    button; then tap a line where it comes nearest the screen's left
    or right edge; then, on a real phone if one is to hand, tap a
    few lines.
    - **Expect:** the tap picks as a click does; the two buttons are
      big enough to tell apart with a fingertip and do not overlap
      each other. Near the screen's edge, the pair stays wholly on
      screen, shifted inwards if need be. Note whether real taps pick
      reliably, for Open question 2. Throughout steps 1 to 12, the
      console shows no errors or warnings.

## Audit

- **2026-11-14T14:05:33Z** — **drafted**: picking by click or tap with a
  hover preview, the lit line, the two icon Fold Buttons coloured by the
  facing side, folding with an invisible sheet swap, Undo, Redo, Unfold, the
  shortcuts and keyboard picking; one open question on discarding a session.
- **2026-11-14T23:21:03Z** — **reviewed**: one Major finding left for
  a ruling: Decision 4's lit line, one device pixel in the icon ink,
  sits inside the printed lattice line beneath it, 0.5 mm wide and
  black on the front, so it shows no change there (and, opaque, it
  draws before the transparent fold-line meshes whatever its
  `renderOrder`); Decision 4, Manual QA 1 and 4's lit-line colours
  untouched. Fixed (Minor): Definitions gain "At rest"; Decision 1
  handles a missed plane and holds the hover while a pick stands;
  `sandbox/pick.js` renamed `line-pick.js`, its signatures A-Z;
  Decision 6 places the buttons after the canvas, fixes their labels
  to the seen fold, adds the `[hidden]` rule; Decision 7's ratios
  recomputed; Decision 8 names k, the swap's measured height settle
  and the sheet kept on a reset; Decision 9 tests `designId`, not
  `printedLines` identity; Decisions 10 to 12 clarified; Step 2
  criteria 2 and 3 and Agent QA 1 and 2, Step 3 criteria 1 and 3 and
  Agent QA 1 and 2 (a syntax error, and a test of the wrong
  direction), Step 4 file list and Agent QA 3 corrected; Open
  question 2 added; Manual QA 2, 4, 6 to 8, 11 and 12 corrected.
- **2026-11-15T00:31:20Z** — **ruled**: the orchestrator ruled on round
  1's Major finding, standing in for the Lead Developer during an
  unattended run, who may overturn it: the lit line becomes a flat
  strip `Mesh`, 1.5 mm wide (`LIT_LINE_WIDTH_METERS`), in a
  `MeshBasicMaterial` in the icon ink, double-sided, transparent with
  `LIT_LINE_RENDER_ORDER = 1` so it draws after the transparent
  fold-line meshes, depth test and write off; the `Line2` addon was
  rejected, as the plan names no addon, and a 1 px line, whatever its
  colour, is thinner than the 0.5 mm printed line. Changed Decision 4,
  Context's Three.js citations, Step 2 criterion 1, and Manual QA 1
  and 4.
- **2026-11-15T00:31:20Z** — **reviewed**: round 2; applied the ruling
  above, each API checked against r187. Fixed (Minor): the strip's
  corners come from a pure writeStripPositions() in `line-pick.js`
  (Step 1 criterion 4 and Agent QA 3 added); its bounding sphere is set
  once to `radiusMeters`, as frustum culling never recomputes a
  non-null one; Step 2 Agent QA 4 added; Decision 8 says the swap
  moves nothing sideways, not "no jump"; Step 3 criterion 1, Agent QA
  2 and Manual QA 7 now name the measured settle of up to 1.8 mm.
- **2026-11-15T00:47:40Z** — **implemented**: Steps 1 to 4. Added
  `docs/src/sandbox/line-pick.js`, `docs/src/input/pick.js`,
  `docs/src/ui/fold-buttons.js` and `docs/src/ui/sandbox-bar.js`;
  changed `docs/src/scene/paper-colors.js`, `docs/src/scene/paper.js`
  (lit strip; setSheet() split from setPrintedLines()),
  `docs/src/input/drag.js` (reports a press that does not move),
  `docs/src/ui/controls-toggle.js`, `docs/src/main.js`,
  `docs/index.html` and `docs/styles/main.css`. Every Agent QA block
  passes; each failed first for the expected reason, Step 3 Agent QA 1
  against the committed paper.js, except Step 3 Agent QA 2, which tests
  the engine's premise and so passes before and after. The keyboard
  pick landed in pick.js with Step 2. A Fold Button holding keyboard
  focus hands it back to the canvas as the buttons hide, so Manual QA
  8 gains that expectation; Manual QA otherwise unchanged.
- **2026-11-15T00:47:40Z** — **verified**: agent checks pass: 9
  modules parse, no new long lines (`docs/index.html` lines 10 and 28
  predate the work), every changed file served with 200, vendored
  checksums match; browser not run.
- **2026-11-15T00:57:22Z** — **quality-checked**: Fixed: a Fold Button
  press between a pattern, mode, Undo or Redo choice and the next frame
  folded at the old position, overriding the move or throwing a
  RangeError from foldAt() on an emptied session, now ignored unless
  canPick() (`docs/src/main.js` foldPick()); with the canvas focused, the
  Escape that hid the toolbar moved focus to the pattern radio, so the
  next Right chose another pattern and discarded the session, now focus
  moves only when nothing holds it (`docs/src/ui/controls-toggle.js`);
  a pick within about 44 px of the viewport's top, or 36 px of a side,
  put Fold Buttons off screen, now clamped in the viewport by CSS
  (`docs/styles/main.css`, doc in `docs/src/ui/fold-buttons.js`);
  createLitLine() moved into A-Z place in `docs/src/scene/paper.js`.
  Step 1 Agent QA 1 gains three points and Agent QA 3 the gap's
  direction, as mutants of pickLine() (nearest dropped either way, lower
  clamp dropped) and writeStripPositions() (offset along the line)
  passed the old lines; Manual QA 8 gains Escape from the canvas, Manual
  QA 12 a pick at the screen's edge. Deferred: buttons can sit under
  the toolbar near the bottom; the canvas, `role="img"` and now
  focusable, names no arrow keys; re-choosing the checked pattern or
  mode empties the session (Decision 8's letter, Open question 1);
  arrow keys are cancelled on the canvas in Presentation Mode too,
  harmlessly. Verified fine: per-frame path (isSequenceAtRest(),
  clearPick(), light(), showAt() once per pick or resize) and pointer
  handlers allocate nothing; strip geometry and material live for the
  page, setSheet() and setPrintedLines() dispose of what they replace;
  resize re-places the buttons; `pointerup` still holds capture;
  r187 Object3D, Raycaster, Ray, Plane, Vector3.project(),
  BufferGeometry.setIndex() and BufferAttribute.setUsage() checked;
  degenerate pickLine() input; a single re-choice mid-step only retargets
  to 0 and throws nothing.
- **2026-11-15T10:24:21Z** — **amended**: at the Lead Developer’s word
  during QA, the Fold Buttons fade in and out, grow 10% and lighten on
  hover or keyboard focus, and bump to 120% on a press before the pair
  fades (Decision 6, CSS only, no growth under reduced motion); the lit
  line doubles to 3 mm, six times the printed line, and grows in from
  no width and shrinks out over 0.15 s on two strips that swap roles
  (Decision 4, paper.stepLitLines() from main.js’s loop). Step 2 Agent
  QA 4 expects `0.003`; Manual QA 1, 2 and 8 describe the motion.
- **2026-11-15T10:38:34Z** — **amended**: at the Lead Developer’s word
  after a look in the browser, the bump peaks at 140%, the pressed pair
  holds 0.2 s after it before fading, and the buttons keep their own
  compositor layer against a hover flicker (Decision 6).
- **2026-11-15T11:12:20Z** — **amended**: at the Lead Developer’s word
  after a look in the browser, the lit line takes the ink of the
  printed line beneath it segment by segment, black over the coloured
  side and the deeper shade over the white, by which side of the paper
  shows there (Decision 4; placedFaces(), showsFrontAt() and
  litSegments() in `line-pick.js`, worked out once per rest state); the
  Fold Buttons’ colours follow the paper under the pick, not the side
  facing the camera (Decisions 6, 7); and the hover flicker, which the
  layer fix did not cure, is met by a white veil’s opacity in place of
  a transitioned `color-mix()` (Decision 6). Step 1 gains criterion 5
  and Agent QA 4; Step 2 criteria 1 and 3 reworded; Manual QA 2 gains
  the mixed band and both button themes.
- **2026-11-15T11:35:51Z** — **fixed**: from the Lead Developer’s report
  that clicks on a line showed the Fold Buttons only some of the time,
  in runs: two clicks on one spot make a double-click, whose spin reset
  ran its 0.3 s even with the spin already at the view at load, clearing
  the pick each frame and refusing new ones. startSpinReset() in
  `input/spin.js` now does nothing when the spin already shows that
  view; a double-click on a spun paper still turns it back and clears
  the pick. Inferred from the code, not reproduced in a browser.
- **2026-11-15T11:41:18Z** — **fixed**: the double-click fix helped but
  did not cure it; at the Lead Developer’s direction, a press now counts
  as a drag only once it strays more than `DRAG_THRESHOLD_PX = 4` CSS
  pixels from where it went down, so a click that nudges the pointer
  picks instead of turning the paper imperceptibly (Decision 1,
  `input/drag.js`). Open question 2 answered.
- **2026-11-15T12:01:31Z** — **amended**: at the Lead Developer’s word,
  a lit segment along a border between white and colour, such as a
  folded flap’s edge, takes black, since the deeper shade there all but
  vanished against the coloured side beside it; litSegments() now looks
  1 µm either side of the line and marks `takesFrontInk` (Decision 4;
  Step 1 criterion 5 and Agent QA 4, which gains the horizontal centre
  line along a flap’s edge). Presses that still now and then fail to
  pick are left as a JSDoc `@TODO` on connectDrag() in `input/drag.js`,
  cause not found.
- **2026-11-15T12:40:22Z** — **amended**: at the Lead Developer’s word,
  after concave outlines showed a band along the paper’s apparent edge:
  only a line’s pieces with paper on both sides are folds, lit and
  picked, so a press near an edge picks nothing and the arrow keys cycle
  only lines with a fold, landing on its longest span (Decisions 1, 3,
  4; pickSpans() and writeFoldMiddle() in `line-pick.js`); the band is
  clipped to the paper’s outline by the stencil buffer, which the
  renderer now has, and capped where it runs off the paper, so it reads
  as the printed line drawn thicker (Decision 4); and the Fold Buttons’
  white is `#f0f0f0` on the light page, their two themes now drawn in
  CSS from the paper colour’s shades and `data-over-white` (Decisions 6,
  7). Step 1 gains criterion 6 and Agent QA 5. Not seen in a browser.
- **2026-11-15T15:05:38Z** — **amended**: at the Lead Developer’s word,
  the Fold Buttons over the white side are pure white again on both
  pages, and the light page itself is `#f0f0f0` instead, through
  `--page-color: light-dark(#f0f0f0, Canvas)`, which the ring gap of
  the chosen choices and swatch shares; the dark page is unchanged
  (Decision 7; `--fold-button-white` removed).
- **2026-11-15T17:19:11Z** — **done**: the Lead Developer passed every group
  of the manual QA walk (desktop pointer, shortcuts, long folding run,
  keyboard, performance, phone, reduced motion, light mode, diff review);
  moved to `plans/done/`.
