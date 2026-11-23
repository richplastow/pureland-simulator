---
title: Dragging a Fold Line to an angle
description: Lets a mouse drag from a lit Fold Line, or Shift and the arrow keys, fold the paper live to an angle that snaps to 15°, so a last fold can stand up short of flat.
type: plan
---

## Context

- The fourth of the five Basic Sandbox Mode plans, on
  [Plan 17](./17-sandbox-folds.md)'s Fold Buttons and
  [Plan 18](./18-fast-fold.md)'s claimed press and keyboard, and
  before [Plan 20](./20-export-design.md), which writes the angle into
  the export. It delivers the drag the research's ruling put in the
  first folding plan: a click folds flat, and a drag chooses an angle,
  snapping to 15° on release.
- With the engine as it stands a fold short of flat is a finishing
  fold for the paper it stood up
  ([A 90° fold in the engine as it stands](../todo/13-sandbox-mode-research.md#a-90-fold-in-the-engine-as-it-stands)
  and
  [Angles](../todo/13-sandbox-mode-research.md#7-angles-several-standing-folds-a-stepping-stone-to-the-fold-tree)).
  This plan lets nothing fold after a standing fold but Undo
  (Decision 5); [Plan 21](./21-standing-folds.md) lifts the limit to
  several standing folds.
- The drag starts from the line, not a Fold Button, and the paper
  itself folds live as the pointer moves, so nothing else shows the
  angle (Decision 3), and no ghost, a translucent copy of the fold,
  is built. The keyboard reaches the same angles with Shift and the
  arrows (Decision 6).
- **Angles are mouse and keyboard only in this plan.** A touch screen,
  or any pointer that cannot drag, folds flat but reaches no angle, so
  the app falls short of
  [WCAG 2.2, Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
  (level AA), which a keyboard route does not meet on its own. The
  backlog item
  [Fold angles without dragging](../todo/backlog/20261118-single-pointer-fold-angle.md)
  holds the fix (Decision 7).
- Browser behaviour it rests on:
  [pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture),
  which connectDrag() in `docs/src/input/drag.js` already sets on every
  press, so a drag's moves keep reaching the canvas over the toolbar;
  and
  [`KeyboardEvent.shiftKey`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/shiftKey).
  Nothing new from Three.js.

## Decisions

1. **A mouse drag from a lit Fold Line folds it live, its angle the
   pointer's distance from the line.** Mouse only: a touch drag
   always orbits ([Plan 18](./18-fast-fold.md#decisions),
   Decision 1), and the drag relies on the mouse's precision and
   hover. The press is the one Plan 18 claims for the line, so never
   the active line's own kept zone, and the paper follows the pointer
   as it moves, easing quickly to each new angle (Decision 8):
   - **Direction by side.** Each line has a Mountain side and a
     Valley side on screen, the sides its pair's buttons sit on
     (Plan 18, Decision 15), as sideOf() in
     `docs/src/ui/fold-button-layout.js` finds them. The pointer on
     the Mountain side folds mountain, on the Valley side valley, as
     seen; crossing the line bends the fold back through flat to the
     other direction.
   - **Angle by distance.** The angle is the pointer's distance from
     the line, measured square to it: 0° on the line, 180° at a reach
     set once per side when the drag starts. Each side's reach is the
     distance from the line, along the square line through the press
     point, to `EDGE_MARGIN_PX = 40` inside the viewport's edge on
     that side, and never less than `MIN_REACH_PX = 40`, so a line
     near or beyond an edge still has room to fold. Both reaches hold
     for the whole drag, so the angle depends on the distance from the
     line alone, whatever the line's slant, and sliding the pointer
     along the line leaves it unchanged. Beyond the reach the angle
     stays 180°; dragging back to the line brings it back to 0°.
   - **Release.** Wherever the pointer is released, over the toolbar
     included, the fold settles at the snapped angle (Decision 2). It
     is cancelled, and the paper eases back to flat, when the angle
     released is below `CANCEL_RADIANS`, 4°, or snaps to 0°: with
     15° steps, anything below 7.5° folds nothing.
   - A press that moves no more than `DRAG_THRESHOLD_PX`, 4 px, is a
     click, as Plan 18 sets out: it picks the line, or presses the
     Fast Fold button its side stands in for. `EDGE_MARGIN_PX`,
     `MIN_REACH_PX` and `CANCEL_RADIANS` are first guesses, open to
     retuning by eye.
2. **Snapping keeps angles exact, on release only.** While the drag
   lasts the paper follows the pointer's exact angle; on release,
   snapAngleRadians(radians) in `docs/src/sandbox/angle.js` rounds it
   to the nearest multiple of `SNAP_RADIANS = π / 12` (15°), clamped
   to 0 to π, and the paper eases there, so every fold made is a whole
   number of steps, which Plan 20 writes as a fraction of a half turn.
   15° is today's step; it may later shrink to 10° or 5°, so nothing
   outside `SNAP_RADIANS` assumes twelfths, and every angle stays a
   whole number of 36ths of a half turn.
3. **The paper is the only readout.** No ring, label or other element
   shows the angle during a drag: the paper folding live shows it, and
   the release shows where the fold settles. Nothing is added to the
   DOM or the CSS for the drag.
4. **The angle goes to the fold** as its `targetRadians`, which
   createFold() takes and cutSession() passes, and the pose leaves the
   flap standing. Undo and Redo animate it through the stepper as they
   animate the dart's wings. The lines on a standing flap stay printed.
   - **The flap turns clear of the stack at its hinge.** A fold that
     stops short turns its moving faces as one block about its line,
     raised for a valley or lowered for a mountain to a height that
     pivotLayers() in `docs/src/fold/pose.js` finds. Today it reads the
     moving faces alone, so where held layers at the hinge stand taller
     than the moving ones, a valley flap turned past 90° passes through
     them: measured over the real modules, up to 0.6 mm deep, in
     sessions of two to four flat folds and a last fold short of flat.
     So pivotLayers() reads every face with a point on the fold's line,
     a corner or an edge, at the stage before the fold, held faces
     included: the highest for a valley, the lowest for a mountain. It
     still allocates nothing, as the per-frame path needs, and is
     exported so Step 2's Agent QA can read it. Counting only faces
     with an edge on the line is not enough: a held face that meets the
     line at a corner still gets cut, by up to 0.4 mm.
   - **Measured with that pivot**, over 360 random sessions of two to
     four flat folds of every pattern, each followed by every foldable
     line as a last fold, valley and mountain, at every 15° from 15° to
     165°, about 37,000 cases, each posed at a quarter, a half, three
     quarters and the whole of the fold: no face passes
     through another, and no two faces overlap in one plane. A design
     whose held faces at the line sit no higher (valley) or lower
     (mountain) than its moving ones keeps its pivot: the paper dart's
     wings keep 7 and 0, its only folds that stop short among the
     Presentation Mode designs, so its pose is unchanged.
5. **After a standing fold nothing is foldable.** Of a standing flap,
   cutSheet() checks only that no later fold moves the faces it moved
   (`docs/src/fold/engine.js`), so after a corner stands, folds
   across the flat paper still cut, and nothing checks yet whether they
   would swing paper through the flap: that is Plan 21's sweep test.
   Until then, hasStandingFold(session, position) in
   `docs/src/sandbox/session.js` reports whether any of the first
   `position` folds stops short, and while it does, the rest state has
   no Fold Lines: the pointer lights nothing, a click picks nothing,
   Fast Fold shows no pairs, and the sandbox bar's Undo is the way
   back. Plan 21 replaces this rule with its own.
6. **The keyboard moves the angle live with Shift and the arrows.**
   With the canvas focused and a line active
   ([Plan 18](./18-fast-fold.md#decisions), Decision 7),
   Shift+Up moves the fold one `SNAP_RADIANS` step towards mountain
   and Shift+Down one step towards valley, as seen, along the drag's
   own axis: from 180° mountain through flat to 180° valley, clamped
   at both ends. The paper folds live at each step, as it does under a
   drag, and Enter folds at the angle shown; stepping back to flat
   cancels at once, as a drag's release on the line does (a drag that
   only reaches the line goes on). Plain Up and Down still
   fold flat at once, replacing any angle shown, and Left or Right, a
   mouse press or a loss of focus first eases a shown angle back to
   flat. The active line stays active throughout, its pair hidden
   while an angle shows and back once the paper is flat again. Escape
   eases a shown angle back to flat, as Left and Right do, then does
   its usual job, clearing the active line; during a mouse drag it
   keeps its usual job and leaves the drag to its release. A held
   Shift+Up or Shift+Down repeats, one step per key repeat, up to the
   clamp, where a held plain Up or Down folds once; a held Enter
   commits once. The canvas's `aria-keyshortcuts` adds
   `Shift+ArrowUp Shift+ArrowDown Enter`.
7. **No single-pointer route to an angle yet.** A tap picks a line and
   its Fold Buttons fold flat, as in Plan 18; a touch drag turns the
   paper. Step buttons for an angle, the touch equivalents of
   Decision 6's keys, wait in the backlog item
   [Fold angles without dragging](../todo/backlog/20261118-single-pointer-fold-angle.md).
8. **The live fold is posed from a half-turn cut, and committed once it
   settles.** One mechanism serves the drag and the keys:
   - **The cut.** On the drag's first move past the threshold, or the
     first Shift and arrow, `docs/src/main.js` cuts the session with
     the line folded a half turn, once per direction as seen, and
     shows the cut for the side the angle is on, posed at the rest
     position plus unsmoothstep(|angle| / π), so the pose's own
     smoothstep() gives exactly that angle. unsmoothstep() is the
     inverse of smoothstep() in `docs/src/fold/easing.js`. Cutting,
     and swapping the paper's geometry with setSheet(), happen on the
     first move and on crossing the line only; the per-frame path
     allocates nothing.
   - **The rest holds.** The sequence state and target do not move
     while a live fold shows, so the stepper rests. Its start puts the
     lit line out and hides every pair, as an orbit's start does in
     the `onDrag` that main.js gives connectDrag(), though a keyboard
     angle keeps its line active (Decision 6); while it shows,
     canLayOut() and canPick() are false, so no layout runs and a
     hover lights nothing.
   - **The ease.** Each frame, stepLiveAngle() in
     `docs/src/sandbox/angle.js` eases the angle shown towards the
     angle wanted, exponentially, with a time constant of
     `LIVE_FOLD_SECONDS = 0.05` s, a first guess, and lands on it
     exactly once within `SETTLE_RADIANS = 0.001`, about 0.06°.
     stepLiveCentre(), beside it, eases the shown centre the same way,
     with the same time constant, and lands on its target exactly once
     within `SETTLE_METERS = 0.000001`, 1 µm, a first guess.
   - **The commit.** Once a release or Enter's angle and the shown
     centre have both landed, a non-zero angle is made as foldLine()
     makes a flat fold, with
     `targetRadians` the snapped angle, and the sequence state and
     target both move to the next position, so the stepper has nothing
     left to animate. The frame loop then never sees the paper leave
     rest, so the commit finds the new rest state itself, as
     enterRest() does. A zero angle restores the rest sheet, with no
     change to the session.
   - **No jump.** The paper does not slide while the angle is live, so
     the line stays where it was pressed: the half-turn cut is shown
     with the stage centres at both ends of the live fold replaced by
     the shown centre, a scratch `[x, y]` set once per cut, so the
     pose's slide, which blends the two, puts the paper exactly there.
     Until the release or Enter, the shown centre is the rest centre,
     as a fold that stops short keeps it (stageCentres() in the
     engine). From the release or Enter, it eases on its own, with
     stepLiveCentre(), towards the committed fold's last stage centre:
     the rest centre for a fold that stops short, and the flat fold's
     own for 180°, independently of the angle. So a release already at
     180°, such as a fold in half, slides smoothly by a quarter of the
     paper rather than jumping 37.5 mm.
   - **At the commit the moving layers shift a little**, since the
     live pose turns them as a flat fold does, about the back of the
     stack with their heights blended, and the committed pose about
     Decision 4's pivot. Measured over the real modules with that
     pivot: under 0.1 mm for a fold of the flat sheet, 0.37 mm for a
     diagonal of a square folded in quarters, and growing with the
     stack, to about 1 mm after three flat folds and 2.3 mm after five.
   - **A known crossing while live.** The live pose is a flat fold's
     pose part-way, so it shares that pose's transient, which Plan 02a
     measured at up to 0.35 mm on the dart and deferred as moving and
     short-lived ([Plan 02a](./02a-paper-dart.md#audit)): near
     the hinge, the moving layers pass through held layers. Measured,
     for valley and mountain folds alike: none on the flat sheet, up to
     0.07 mm for a diagonal of a square folded in quarters, about 0.4
     to 0.7 mm in stacks of six to eight layers, and up to 1.2 mm in
     one of fourteen. A drag or a keyboard angle can now hold it; the
     commit clears it, since the committed pose crosses nothing
     (Decision 4).
   - **Both effects are accepted at these sizes.** The live fold keeps
     the half-turn cut; Manual QA 8 shows both by eye, and they are
     tuned by feel afterwards only if they show.
   - **Interrupted.** A choice, Undo, Redo or Unfold made while an
     angle shows drops it at once, restoring the rest sheet before the
     choice acts.

## Steps

### Step 1: The angle maths [P]

- Adds `docs/src/sandbox/angle.js`: `SNAP_RADIANS`, `EDGE_MARGIN_PX`,
  `MIN_REACH_PX`, `CANCEL_RADIANS`, `LIVE_FOLD_SECONDS`,
  `SETTLE_RADIANS` and `SETTLE_METERS`; snapAngleRadians(radians);
  reachesPx(line, viewport, x, y), each side's reach from a press, as
  `{ mountainPx, valleyPx }`; dragAngleRadians(line, reaches, x, y),
  the signed angle, positive towards mountain as seen, its side from
  sideOf(); stepLiveAngle(deltaSeconds, live), which eases
  `live.radians` towards `live.targetRadians`, a negative delta
  counting as zero, as in stepSequence(), and returns true if it
  changed it; and stepLiveCentre(deltaSeconds, live), which eases
  `live.centre` towards `live.targetCentre`, each `[x, y]` in metres,
  writing `live.centre` in place, in the same way (Decisions 1, 2,
  8). All pure: `line` is a line on
  screen as `docs/src/ui/fold-button-layout.js` defines it, whose
  `segments` alone are read, and `viewport` the canvas's
  `{ height, width }` in CSS pixels, as main.js's `space.viewport`
  holds it.
- Changes `docs/src/fold/easing.js`: adds unsmoothstep(eased), the
  inverse of smoothstep() (Decision 8).
- It should snap any angle to the nearest 15°, clamped to 0 to 180°
  (Agent QA 1).
- It should give each side's reach from the press, never under 40 px,
  and an angle that depends on the distance from the line alone,
  whatever its slant, signed by side (Agent QA 2).
- It should invert smoothstep(), and ease the live angle and centre
  frame-rate independently, each landing exactly on its target (Agent
  QA 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { snapAngleRadians } from "./docs/src/sandbox/angle.js"; const deg = (r) => Math.round((r * 180) / Math.PI); console.log([0.1, Math.PI / 2 + 0.1, Math.PI / 2 + 0.2, Math.PI, 4, -1].map((r) => deg(snapAngleRadians(r))).join(","));'`
   Expect: `0,90,105,180,180,0`
2. Do: `node --input-type=module -e 'import { dragAngleRadians, reachesPx } from "./docs/src/sandbox/angle.js"; const deg = (r) => Math.round((r * 180) / Math.PI); const viewport = { height: 600, width: 800 }; const run = (segments, [px, py], pts) => { const line = { segments }; const r = reachesPx(line, viewport, px, py); console.log(Math.round(r.mountainPx), Math.round(r.valleyPx), pts.map(([x, y]) => deg(dragAngleRadians(line, r, x, y))).join(",")); }; run([100, 200, 700, 200], [400, 200], [[400, 120], [650, 120], [400, 380], [400, 10], [400, 200]]); run([100, 100, 500, 500], [300, 300], [[400, 200], [500, 300], [200, 400]]); run([100, 30, 700, 30], [400, 30], []); run([700, 450, 100, 450], [400, 450], [[400, 370], [400, 530]]);'`
   Expect: four lines, `160 360 90,90,-90,180,0`, then `368 368 69,69,-69`, then `40 530 `, then `410 110 35,-131` (a shallow line, Mountain above, in an 800 × 600 viewport; a diagonal, where sliding along the line keeps 69°; a line 30 px from the top, its Mountain reach held at 40; and a shallow line given right to left, whose Mountain side is still above)
3. Do: `node --input-type=module -e 'import { smoothstep, unsmoothstep } from "./docs/src/fold/easing.js"; import { stepLiveAngle, stepLiveCentre } from "./docs/src/sandbox/angle.js"; console.log([0, 0.25, 0.5, 0.9, 1].map((v) => smoothstep(unsmoothstep(v)).toFixed(6)).join(",")); const live = { radians: 0, targetRadians: Math.PI / 2 }; console.log([0.05, 0.05, -1, 0.5].map((dt) => `${stepLiveAngle(dt, live)}:${Math.round((live.radians * 180) / Math.PI)}`).join(","), live.radians === Math.PI / 2); const slide = { centre: [0, 0], targetCentre: [0.0375, 0.0375] }; console.log([0.05, 0.05, -1, 0.5].map((dt) => `${stepLiveCentre(dt, slide)}:${(slide.centre[1] * 1000).toFixed(1)}`).join(","), slide.centre[0] === 0.0375 && slide.centre[1] === 0.0375);'`
   Expect: `0.000000,0.250000,0.500000,0.900000,1.000000`, then `true:57,true:78,false:78,true:90 true`, then `true:23.7,true:32.4,false:32.4,true:37.5 true` (the centre's y, in millimetres, sliding the 37.5 mm of a fold in half, its x easing alongside)
4. Do: `node --check docs/src/sandbox/angle.js && node --check docs/src/fold/easing.js; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/sandbox/angle.js docs/src/fold/easing.js`
   Expect: prints nothing.

### Step 2: The mouse drag folds live

- Changes `docs/src/input/drag.js`: a claimed press that moves past
  `DRAG_THRESHOLD_PX` reports its moves and its release to new
  handlers, with the pointer in CSS pixels, while one that does not
  stays a click for `onClaimedPress` (Decision 1).
- Changes `docs/src/sandbox/session.js`: adds hasStandingFold(session,
  position), its arguments in foldAt()'s order (Decision 5).
- Changes `docs/src/fold/pose.js`: pivotLayers(faces, fold, foldIndex)
  reads every face with a point on the fold's line, held faces
  included, and is exported, among the exported functions, with its
  doc comment and writePaperPositions()'s bullet on folds that stop
  short updated to match (Decision 4).
- Changes `docs/src/main.js`: the reaches at the drag's start, the
  half-turn cuts, the live pose and its shown centre, stepLiveAngle()
  and stepLiveCentre() on the frame loop, the release, the commit once
  both have landed, and the cancel, the guard on canLayOut() and
  canPick(), and no Fold Lines after a standing fold (Decisions 1, 2,
  4, 5, 8).
- It should fold the paper live as a mouse drags from a lit line, by
  side and distance, with nothing else showing, and the line staying
  under the press (Manual QA 2, 4, 5, 8).
- It should settle on release at the nearest 15°, wherever released,
  folding flat at 180° and nothing below 7.5°, the paper sliding
  smoothly to its new centre (Manual QA 2, 4, 6).
- It should leave a standing flap standing, its lines printed, with
  nothing foldable after it and Undo the way back (Agent QA 1, 2;
  Manual QA 2, 3, 7).
- It should stand a flap clear of every layer at its hinge, part-way
  and once stood, count no layer away from the line, and leave every
  Presentation Mode design's pivots as they are (Agent QA 3, 4, 5).
- It should keep a click a click, a Fast Fold side press included
  (Manual QA 1, 9).
- It should allocate nothing per pointer move in connectDrag()
  (Agent QA 6).

**Agent QA**

1. Do: `node --input-type=module -e 'import { createSession, foldAt, hasStandingFold } from "./docs/src/sandbox/session.js"; const corner = { from: [0, 0.075], to: [0.075, 0], type: "valley" }; const stood = foldAt(createSession(), 0, { ...corner, targetRadians: Math.PI / 2 }); const flat = foldAt(createSession(), 0, { ...corner, targetRadians: Math.PI }); console.log(hasStandingFold(stood, 1), hasStandingFold(stood, 0), hasStandingFold(flat, 1));'`
   Expect: `true false false`
2. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { foldableLines } from "./docs/src/sandbox/lattice.js"; import { placedPolygons } from "./docs/src/fold/engine.js"; const [p] = PATTERNS; const s = foldAt(createSession(), 0, { from: [0, 0.075], targetRadians: Math.PI / 2, to: [0.075, 0], type: "valley" }); const sheet = cutSession(p, s); const lines = foldableLines(p, placedPolygons(sheet, 1)); let cuts = 0; for (const l of lines) for (const type of ["valley", "mountain"]) { try { cutSession(p, foldAt(s, 1, { from: l.from, targetRadians: Math.PI, to: l.to, type })); cuts++; } catch {} } console.log(sheet.faces.length, lines.length, cuts);'`
   Expect: `2 7 8` (a corner stood at 90°: the lattice lists seven lines across the flat paper, and the engine still cuts eight of their fourteen folds, which is why Decision 5 asks hasStandingFold() rather than the engine)
3. Do: from the repo root, run this check, which poses a session of
   three flat folds and a valley stood at 165° at a quarter, a half,
   three quarters and the whole of that fold, and prints the faces
   counted and the deepest any face's edge passes through another
   face, in µm:

   ```sh
   node --input-type=module <<'EOF'
   import { PATTERNS } from "./docs/src/sandbox/patterns.js";
   import {
     createSession,
     cutSession,
     foldAt,
   } from "./docs/src/sandbox/session.js";
   import { writePaperPositions } from "./docs/src/fold/pose.js";
   const [p] = PATTERNS;
   const H = 0.075;
   const STOOD = (11 * Math.PI) / 12; // 165°
   const session = [
     [[H, 0], [0, -H], "valley", Math.PI],
     [[-H, 0], [0, H], "mountain", Math.PI],
     [[0, -H], [-H, 0], "mountain", Math.PI],
     [[-H / 2, -H / 2], [H, H], "valley", STOOD],
   ].reduce(
     (s, [from, to, type, targetRadians], i) =>
       foldAt(s, i, { from, targetRadians, to, type }),
     createSession(),
   );
   const sheet = cutSession(p, session);
   const sub = (a, b) => a.map((v, i) => v - b[i]);
   const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
   const cross = (a, b) => [
     a[1] * b[2] - a[2] * b[1],
     a[2] * b[0] - a[0] * b[2],
     a[0] * b[1] - a[1] * b[0],
   ];
   const facesAt = (position) => {
     const count = sheet.faces.reduce((n, f) => n + f.polygon.length, 0);
     const xyz = new Float64Array(3 * count);
     writePaperPositions(xyz, position, sheet);
     let v = 0;
     return sheet.faces.map(({ polygon }) => {
       const pts = polygon.map(() => [...xyz.subarray(3 * v, 3 * ++v)]);
       const n = cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]));
       return { n: n.map((c) => c / Math.hypot(...n)), pts };
     });
   };
   const inside = (x, { n, pts }) =>
     pts.every((a, i) => {
       const edge = sub(pts[(i + 1) % pts.length], a);
       return dot(cross(edge, sub(x, a)), n) / Math.hypot(...edge) > 1e-7;
     });
   let deepest = 0;
   for (const position of [3.25, 3.5, 3.75, 4]) {
     const faces = facesAt(position);
     for (const a of faces) {
       for (const b of faces) {
         if (a === b) continue;
         a.pts.forEach((p0, i) => {
           const p1 = a.pts[(i + 1) % a.pts.length];
           const d0 = dot(sub(p0, b.pts[0]), b.n);
           const d1 = dot(sub(p1, b.pts[0]), b.n);
           const depth = Math.min(Math.abs(d0), Math.abs(d1));
           if (d0 * d1 >= 0 || depth < 1e-8) return;
           const x = p0.map((c, k) => c + (d0 / (d0 - d1)) * (p1[k] - c));
           if (inside(x, b)) deepest = Math.max(deepest, depth);
         });
       }
     }
   }
   console.log(sheet.faces.length, Math.round(deepest * 1e6));
   EOF
   ```

   Expect: `6 0`. Before this step the same check prints `6 97`: a held
   layer meets the line at a corner, 0.1 mm above the flap's pivot,
   and the flap cuts it 97 µm deep; a pivot counting only faces with
   an edge on the line prints `6 97` too.
4. Do: `node --input-type=module -e 'import { cutSheet, stopsShort } from "./docs/src/fold/engine.js"; import { pivotLayers } from "./docs/src/fold/pose.js"; import { DESIGNS } from "./docs/src/designs/list.js"; const out = []; for (const design of DESIGNS) { const { faces, folds } = cutSheet(design); folds.forEach((fold, i) => { if (stopsShort(fold)) out.push(`${design.id}:${i}:${pivotLayers(faces, fold, i)}`); }); } console.log(out.join(" "));'`
   Expect: `paper-dart:5:7 paper-dart:6:0`, exactly what today's
   pivotLayers() gives: every fold that stops short among the
   Presentation Mode designs, the dart's two wings, keeps its pivot.
5. Do: `node --input-type=module -e 'import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, cutSession, foldAt } from "./docs/src/sandbox/session.js"; import { pivotLayers } from "./docs/src/fold/pose.js"; const [p] = PATTERNS; const H = 0.075; const flat = foldAt(createSession(), 0, { from: [0, H], targetRadians: Math.PI, to: [H, 0], type: "valley" }); console.log([[[0, -H], [-H, 0]], [[-H, 0], [0, -H]]].map(([from, to]) => { const { faces, folds } = cutSession(p, foldAt(flat, 1, { from, targetRadians: Math.PI / 2, to, type: "valley" })); return pivotLayers(faces, folds[1], 1); }).join(","));'`
   Expect: `0,0` (a corner folded flat over, then the opposite corner
   stood at 90° valley, its line given either way round: the doubled
   corner, away from the line, raises neither pivot; a pivot counting
   every face on one side of the line prints `1` for one of them)
6. Do: `sed -n '/"pointermove"/,/^  });/p' docs/src/input/drag.js | grep -cE "new [A-Z]|\[\]|\{\}|\.\.\."`
   Expect: `0`
7. Do: `node --check docs/src/input/drag.js && node --check docs/src/sandbox/session.js && node --check docs/src/fold/pose.js && node --check docs/src/main.js; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/input/drag.js docs/src/sandbox/session.js docs/src/fold/pose.js docs/src/main.js`
   Expect: prints nothing.

### Step 3: Shift and the arrows fold live

- Changes `docs/src/input/pick.js`: Shift+Up and Shift+Down report a
  step towards mountain or valley, a held key repeating, and Enter a
  commit, ignoring a held key's repeats, each with `preventDefault()`;
  plain Up and Down are unchanged (Decision 6).
- Changes `docs/index.html`: the canvas's `aria-keyshortcuts`
  (Decision 6).
- Changes `docs/src/main.js`: the steps on the active line through the
  live fold of Step 2, Enter's commit, and the ease back to flat on
  Left, Right, Escape, a mouse press and blur, Escape's through the
  `onEscape` that main.js gives connectControlsToggle() (Decisions 6,
  8).
- It should step the active line's fold live in 15° steps along one
  axis, from mountain through flat to valley, and fold at the angle
  shown on Enter (Manual QA 10).
- It should cancel on stepping back to flat, step on while Shift and
  an arrow are held, ease back to flat on Left, Right, Escape, a press
  or blur, and leave plain Up and Down folding flat (Manual QA 11).
- It should declare the new keys (Agent QA 1).

**Agent QA**

1. Do: `grep -o 'aria-keyshortcuts="[^"]*"' docs/index.html`
   Expect: `aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowUp Shift+ArrowDown Enter"`
2. Do: `grep -c "shiftKey" docs/src/input/pick.js; grep -c '"Enter"' docs/src/input/pick.js`
   Expect: a count of at least `1`, then at least `1`
3. Do: `node --check docs/src/input/pick.js && node --check docs/src/main.js; awk 'length > 80 && !/data:image|aria-label="A sheet|aria-keyshortcuts=/ { print FILENAME ":" FNR }' docs/src/input/pick.js docs/src/main.js docs/index.html`
   Expect: prints nothing. The `awk` skips three lines of
   `docs/index.html` that no wrap can shorten, as Plan 16's check did:
   the favicon's `data:` URL, and the canvas's `aria-label` and
   `aria-keyshortcuts`, each one attribute value, the last kept on one
   line for Agent QA 1.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser a corner of the square pattern can be stood up at 90° by a
mouse drag and by the keyboard, left standing, and undone, while a touch
screen still folds flat.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome with a mouse, open the
dev tools console, hard-reload (Shift+Cmd+R), and click "Sandbox".
Wait for the blue square with its eight lines, then untick "Fast
Fold", which starts ticked, and leave it unticked until step 9.

### The mouse drag

1. **Do:** click the diagonal across the top-left corner, then click
   one of its Fold Buttons. Click "Undo"; then press on the same
   diagonal, nudge the mouse 2 px and release.
   - **Expect:** the click folds the corner flat, as in Plan 18. The
     nudged press picks the line, showing its pair, and folds nothing.
2. **Do:** press Escape to clear the pick, press on the diagonal and,
   holding, drag slowly away from it towards the top-left corner of
   the window until the flap stands upright, then release.
   - **Expect:** as soon as the pointer moves, the corner turns and
     follows it smoothly, further the further it goes; no ring, label
     or button shows, the lit line goes out, and the paper does not
     slide. On release the flap settles at the nearest 15°, upright
     at 90°, and stays standing. The pointer then lights no line, a
     click on the paper shows no buttons, and "Undo" is enabled.
3. **Do:** press Cmd+Z.
   - **Expect:** the flap lies back down over 0.35 s, and a hover
     lights lines again.
4. **Do:** press on the diagonal, drag out until the flap stands at
   about 45°, then drag back across the line and on, a little way into
   the other side; then back to the line, and release on it.
   - **Expect:** the flap lowers to flat as the pointer reaches the
     line, then bends the other way as it crosses; on release on the
     line the paper eases flat and nothing is folded: "Undo" is as it
     was before the press.
5. **Do:** press on the diagonal, drag out to about 45°, then move the
   pointer parallel to the line, keeping its distance; then back onto
   the line, and release there.
   - **Expect:** the flap's angle does not change while the pointer
     slides along the line; the release on the line folds nothing.
   - **Why:** each side's reach is fixed at the drag's start, so the
     angle depends on the distance from the line alone.
6. **Do:** press on the level line through the middle of the paper and
   drag straight down, past the window's bottom edge and over the
   toolbar, then release there.
   - **Expect:** the top half folds towards you, reaching flat just
     before the window's edge and staying flat over the toolbar. On
     release it settles as a flat fold, and the paper slides smoothly
     up, by a quarter of its height, to recentre, with no jump; a
     hover lights lines again afterwards. Click "Undo".
   - **Why:** a fold in half moves the paper's centre, where a corner
     folded flat does not, so this release shows the slide.
7. **Do:** stand the corner at 45°, then drag the background to turn
   the paper and look along the standing flap.
   - **Expect:** the flap stands at 45° from the sheet, its printed
     lines still on it, with no gap or seam at the hinge. Click
     "Undo".
8. **Do:** fold the paper in half along the level line, in half again
   along the upright line, then in half again along a diagonal of the
   small square, each with a click on the line and then its valley
   Fold Button. Click the one line left on the triangle, note the side
   its valley Fold Button shows on, and press Escape. Press on the
   line, drag out on that side until the flap rises towards you to
   about 45°, and hold it there while looking closely along the hinge;
   then drag on until the flap stands upright, and release.
   - **Expect:** the flap turns from a stack of eight layers, as in
     step 2. On release it settles upright, clear of the stack, and
     stays standing.
   - **Looks wrong, but isn't:** while the drag holds, the edges of
     the turning layers poke through the layers beside them along the
     hinge, by up to about 0.7 mm here, as every flat fold's animation
     does part-way; and as the fold commits on release, the flap jumps
     once, by up to about 1 mm after three flat folds, then stays put
     (Decision 8). Click "Undo" four times.
9. **Do:** tick "Fast Fold". Point at a lit line beside its shown
   pair and click; click "Undo"; then press on the same line, drag
   away from it and back onto it, and release there.
   - **Expect:** the click folds flat by the side pointed at, as in
     Plan 18; the drag folds the paper live, as in step 2, with every
     pair hidden while it lasts, and the nearby pairs back at the first
     mouse move once the paper is flat again. Untick "Fast Fold".

### The keyboard

10. **Do:** press Tab until the paper shows its focus ring (a click on
    the canvas leaves focus where it was), press Right until a line is
    active, then press Shift+Up six times, Shift+Down twelve times, and
    Enter.
    - **Expect:** each Shift+Up turns the flap 15° further towards
      mountain, away from you, live, to 90°; Shift+Down brings it back
      through flat and on to 90° valley, towards you; the pair hides
      while an angle shows. Enter leaves the flap standing at 90°
      valley. Click "Undo".
11. **Do:** press Shift+Tab until the paper shows its focus ring again,
    and Right until a line is active; then press Shift+Up three times,
    then Right; then Shift+Up once and Shift+Down once; then hold
    Shift+Up for about two seconds, and press Escape; then press Right,
    and Up.
    - **Expect:** Right eases the flap back to flat and makes the next
      line active; Shift+Up then Shift+Down folds nothing. Held,
      Shift+Up keeps turning the flap away from you, 15° a step, until
      it lies flat behind the paper; Escape eases it back to flat and
      clears the active line, hiding its pair. Right makes a line
      active again, and Up folds it flat, mountain, at once.

### Regressions

12. **Do:** in device mode (iPhone 12 Pro), drag from a line with a
    finger; then tap the line and tap one of its Fold Buttons.
    - **Expect:** the drag turns the paper and folds nothing; the tap
      folds the line flat, as in Plan 18. No angle is offered on touch.
13. **Do:** look over the console after steps 1 to 12.
    - **Expect:** no errors or warnings.

## Audit

- **2026-11-14T14:05:33Z** — **drafted**: the drag to a snapped angle with a
  ring and a degree label, the standing fold left standing with nothing
  foldable after it, and the keyboard and tap alternatives to the drag.
- **2026-11-17T17:49:15Z** — **ruled**: the angle drag starts from a lit Fold Line,
  mouse only, and folds the paper live: the side of the line sets the
  direction, crossing it bends the fold back, the distance from the
  line sets the angle, 180° at 40 px inside the viewport edge, and a
  release below 4° cancels (Decision 1); ruled by the Lead Developer
  via /feed-me. The agent added, as inferred: the distance to the edge
  is measured along the square line through the pointer. Decisions 2,
  3 and 6, the Steps and the Manual QA left for this plan’s review.
- **2026-11-17T18:11:45Z** — **ruled**: the drag is continuous and the release snaps to
  the nearest 15°, easing there; the step may later shrink to 10° or 5°
  (Decision 2); ruled by the Lead Developer via /feed-me.
- **2026-11-17T21:30:41Z** — **recorded**: the /feed-me briefs behind
  Decisions 1 and 2 kept in
  [14-gameplay-mode-briefs.md](../todo/14-gameplay-mode-briefs.md).
- **2026-11-18T10:51:54Z** — **ruled**: the ghost preview dropped, since the
  paper folds live during the drag; Manual QA 10, which judged whether it
  was needed, removed; ruled by the Lead Developer via /feed-me.
- **2026-11-18T10:54:21Z** — **ruled**: each side’s reach to 180° is fixed
  at the press, measured square to the line through the press point to
  40 px inside the viewport’s edge, so the angle depends on the distance
  from the line alone, replacing the inferred per-move measure
  (Decision 1); ruled by the Lead Developer via /feed-me.
- **2026-11-18T11:02:43Z** — **ruled**: no readout during a drag, neither ring nor degree
  label; the paper alone shows the angle (Decision 3). Step 2, its Agent
  QA 2 and Manual QA 2 to 4, 7 and 8 still name the ring, and are
  reworked at review; ruled by the Lead Developer via /feed-me.
- **2026-11-18T11:05:25Z** — **ruled**: Shift+Up and Shift+Down move the active line’s
  fold live in 15° steps along the drag’s axis, Enter folds, back to
  flat cancels, and plain Up and Down still fold flat (Decision 6);
  ruled by the Lead Developer via /feed-me. The agent added: Left,
  Right, a mouse press or a loss of focus eases a shown angle back to
  flat, and the canvas declares the new keys. The single-pointer route
  split out as Decision 7, still open.
- **2026-11-18T11:15:19Z** — **ruled**: angles are mouse and keyboard only in this plan;
  touch and other single pointers fold flat, and step buttons for an
  angle are deferred to the backlog item
  [Fold angles without dragging](../todo/backlog/20261118-single-pointer-fold-angle.md)
  (Decision 7); “Done when” and Manual QA 9 corrected to match; ruled
  by the Lead Developer via /feed-me.
- **2026-11-18T11:24:31Z** — **changed**: Steps, Agent QA, Done when and Manual QA
  rewritten to the rulings, at the Lead Developer’s request: three
  steps (the angle maths, the mouse drag, the keyboard). Decision 5
  corrected: the engine still cuts eight of fourteen folds after a
  corner stands, so a session rule, hasStandingFold(), keeps nothing
  foldable, its outcome unchanged. The agent added, for the Lead
  Developer to confirm: Decision 8, the live fold’s mechanism (a
  half-turn cut posed by unsmoothstep(), the rest centre held during
  the drag, a commit once settled, a drop on any choice), with
  `LIVE_FOLD_SECONDS = 0.05` and `SETTLE_RADIANS = 0.001`;
  `MIN_REACH_PX = 40`; `CANCEL_DEGREES` renamed `CANCEL_RADIANS`,
  with a release that snaps to 0° cancelling too; the drag never
  starting on the active line’s kept zone; and the active line’s pair
  hidden while a keyboard angle shows.
- **2026-11-18T11:25:31Z** — **recorded**: the /feed-me briefs behind Decisions 1, 3, 6
  and 7 and the ghost’s removal kept in
  [14-gameplay-mode-briefs.md](../todo/14-gameplay-mode-briefs.md#q16), as Q16
  to Q20.
- **2026-11-18T12:04:18Z** — **ruled**: Decision 5’s hasStandingFold() rule and Decision 8’s
  live fold, with its constants, confirmed as written, open to retuning
  by feel after implementation; ruled by the Lead Developer.
- **2026-11-18T12:22:23Z** — **reviewed**: one major issue, open for a
  ruling: tested over the real engine, the committed pose of a valley
  fold stopping short past 90° passes the flap through held layers
  taller than it at the hinge, up to 0.3 mm deep over a band about
  1.1 mm wide at 165° (Decision 4); the live pose crosses by up to
  0.05 mm in stacks of four or more layers, a flat fold’s existing
  transient, now held; and a release or Enter already at 180° has no
  settle for the centre to ease along, so a fold in half would jump
  37.5 mm (Decision 8). Minor fixes: Step 1’s signatures A-Z
  (reachesPx(line, viewport, x, y), dragAngleRadians(line, reaches,
  x, y)) and stepLiveAngle()’s negative delta, Agent QA 2 to match;
  Decision 5’s refusal; Decision 8’s rest, the commit’s fresh rest
  state and the measured height differences; Step 3 Agent QA 3’s long
  lines; Manual QA preconditions (Fast Fold starts ticked), 2, 3, 5,
  6 (a fold in half, which slides), 8, 9 and 10 (focus by Tab).
  Unsmoothstep posing, Step 1 and Step 2 Agent QA values re-derived
  and confirmed.
- **2026-11-18T12:38:23Z** — **ruled**: the orchestrator’s rulings on
  round 1’s three major issues, made by default under the run’s “What
  is Major” rule, open to the Lead Developer’s overturning: (1)
  pivotLayers() counts held faces on the fold’s line, so a standing
  flap clears a taller held stack at its hinge (Decision 4; Step 2
  gains `docs/src/fold/pose.js` and Agent QA 3 and 4); (2) the live
  pose’s crossing of held layers, a flat fold’s existing transient, is
  accepted as a known, bounded effect (Decision 8; Manual QA 8); (3)
  from the release or Enter the shown centre eases on its own, with
  `LIVE_FOLD_SECONDS`, and the commit waits for the angle and the
  centre (Decision 8; stepLiveCentre() and `SETTLE_METERS`, 1 µm, a
  first guess, in Step 1).
- **2026-11-18T12:38:23Z** — **reviewed**: round 2; one major issue,
  open for a ruling: measured over the real modules, the live pose
  crosses held layers by far more than ruling 2 assumed (0.05 mm):
  up to 0.07 mm on a square folded in quarters, about 0.4 mm in stacks
  of six to eight layers and 1.2 mm in one of fourteen, valley and
  mountain alike; and at the commit the moving layers shift by up to
  about 1 mm after three flat folds and 2.3 mm after five, not the
  0.4 mm Decision 8 stated. Both are stated as measured in Decision 8.
  Ruling 1 made precise: a face counts with a corner on the line, not
  only an edge, since an edge-only pivot still crossed by up to
  0.4 mm; none crossed in about 37,000 cases; the dart keeps 7 and
  0. Escape and held Shift+arrows read conservatively (Decision 6;
  Step 3; Manual QA 11). Criteria: Step 1’s third and Step 2’s first,
  second, fifth and sixth reworded or renumbered, Step 2 gains one,
  Step 3’s first renumbered and second reworded (12 in all); Manual QA gains step 8 and
  renumbers 9 to 13, step 11 reworked.
- **2026-11-18T12:49:05Z** — **ruled**: ruling A: the measured figures
  are accepted and the plan is built now; mid-drag the live pose’s
  moving layers cross held layers by about 0.07 mm (square in
  quarters), about 0.4 mm (six to eight layers) and up to 1.2 mm
  (fourteen), valley and mountain alike, and at the commit they shift
  by about 1 mm after three flat folds and 2.3 mm after five; both are
  judged by eye at Manual QA and tuned by feel afterwards if they show.
  Posing the live fold from a cut stopping short at π·(1 − 1e-9) is
  declined (Decision 8); ruled by the Lead Developer.
- **2026-11-18T12:49:05Z** — **reviewed**: round 3; no major issue.
  Ruling A applied: Decision 8 states both effects as settled and
  accepted. Manual QA 8 reworked to a third flat fold, so one step
  shows both effects at an eight-layer hinge, with sizes: measured
  over the real modules, that drag crosses by up to 0.66 mm valley
  and none mountain, so Decision 8’s six-to-eight-layer figure reads
  0.4 to 0.7 mm. Decision 6’s “as dragging back to the line does”
  corrected to a release on the line, since a drag that reaches the
  line goes on. Criteria unchanged (12); Manual QA 13 steps.
- **2026-11-18T13:02:37Z** — **implemented**: Steps 1 to 3. Added
  `docs/src/sandbox/angle.js`; changed `docs/src/fold/easing.js`
  (unsmoothstep(), in closed form, and a file overview),
  `docs/src/input/drag.js` (a claimed press that moves reports
  `onClaimedDrag` and `onClaimedDragEnd`, and `onClaimedDragCancel` on a
  browser cancel, which eases the fold back to flat),
  `docs/src/sandbox/session.js` (hasStandingFold()),
  `docs/src/fold/pose.js` (pivotLayers() exported, counting every face
  that touches or crosses the fold's whole line within
  `TOLERANCE_METERS`), `docs/src/main.js`, `docs/src/input/pick.js` and
  `docs/index.html`. Agent QA: Step 1, 1 to 4 pass; Step 2, 1 to 6 pass
  (3 printed `6 97` before the work and `6 0` after; 2 passes before the
  work too, as it measures the engine, which this plan leaves alone);
  Step 3, 1 to 3 pass. Readings where the plan is silent: Enter puts the
  active line out as it releases the fold, as a flat fold’s press does,
  since a half turn slides the paper from under its strip; Escape and a
  loss of focus clear or put away the pick at once while the angle eases
  back, and Left or Right take their step once it is flat; any press on
  the canvas, not only a mouse’s, eases a keyboard angle back; plain Up
  or Down after Enter does nothing until the fold is made. Manual QA 9
  corrected: with a mouse, Fast Fold’s nearby pairs return at the first
  mouse move after the drag, not at once; the rest unchanged.
- **2026-11-18T13:03:05Z** — **verified**: agent checks pass: the 7 changed modules
  parse; no line passes 80 columns but three in `docs/index.html` no wrap
  can shorten (the favicon's `data:` URL, the canvas's
  `aria-keyshortcuts` and `aria-label`); `/` and each changed module
  served with status 200 by a server started for the check and stopped;
  vendored checksums match; browser not run.
- **2026-11-18T13:10:55Z** — **quality-checked**: Fixed: no fix-tier
  finding; first-run polish only: three doc comments re-wrapped where a
  line broke mid-sentence (connectDrag()'s press bullet and `handlers`,
  connectPick()'s `onHover`), and the `lostpointercapture` comment in
  `docs/src/input/drag.js` reworded to say why a still-moved claimed
  press means a cancel. Checks hardened after mutation testing: Step 1
  Agent QA 2 gains a line given right to left (a reachesPx() without
  sideOf()'s orientation flip passed every check), Step 1 Agent QA 3
  eases the centre's x too (a stepLiveCentre() that never moved x
  passed), and Step 2 gains Agent QA 5, a corner doubled away from the
  stood line (a pivotLayers() counting every face on one side of the
  line passed); old Step 2 Agent QA 5 and 6 renumbered 6 and 7, two
  criteria updated to match. Deferred: plain Up or Down during a
  keyboard angle drops the angle at once, so the paper snaps flat before
  the 0.35 s flat fold starts (Decision 6 says “replacing”; judge at
  Manual QA 11); focus returning to the canvas before a blurred
  keyboard angle has eased flat leaves the line put away until the next
  focus; a resize mid-drag keeps the press's screen line and reaches,
  as Decision 1 fixes them; `CANCEL_RADIANS` changes nothing while
  `SNAP_RADIANS` is 15°, since anything under 7.5° snaps to 0 (an
  equivalent mutant until the step shrinks); unsmoothstep()'s clamps
  are equivalent mutants on 0 to 1, its only domain. Verified fine:
  the commit (state and target moved together, no rest transition, so
  commitLive()'s own enterRest() is the only one; the next stepSequence()
  finds nothing to do; a half turn reuses its unshown cut, whose last
  centre the shown centre landed on); the shown cut's two centres
  aliasing `live.centre`, never the rest sheet's; every target move
  (choose(), Undo, Redo, Unfold) dropping the live fold first, and the
  fold-lines fade unreachable in Sandbox Mode, where the lines are
  forced on; the keyboard state machine (onAngleKey(), onCycle()'s
  deferred `cycleStep`, onCommitKey(), onFoldKey(), Escape, blur, any
  press), with no frame where the pair shows before the ease back
  settles, and the hidden pair reshown by the next layOut(); the claimed
  drag's press, move, end and cancel in `docs/src/input/drag.js`; the
  per-frame path (stepLive(), stepLiveAngle(), stepLiveCentre(),
  writeLivePose(), pivotLayers()) allocating nothing but the
  setSheet() swap on crossing flat and the once-per-fold commit or end;
  geometry disposal (setSheet() disposes of the old geometry on every
  swap, one geometry shown at a time); the strips, kept across
  setSheet(); resize and pixel ratio unchanged; no new Three.js API or
  addon; every Agent QA block passes; agent checks pass, with a server
  started and stopped for the check; browser not run.
- **2026-11-18T16:42:42Z** — **done**: the Lead Developer’s manual QA
  passed in full (desktop D1 to D14, device mode P1 and P2, diff review
  R1 to R3); moved to `plans/done/`.
