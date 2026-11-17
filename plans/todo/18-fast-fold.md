---
title: Fast Fold, and sharper pointer and keyboard folding
description: Makes Fold Lines take the pointer reliably, keeps other lines hoverable while a pick stands, folds from the keyboard with Up and Down, and adds a Fast Fold mode that shows Fold Buttons without a pick, where a mouse over either side of a Fold Line stands in for that side's button. Fold Button pairs are arranged by their line's slant.
type: plan
---

## Context

- Inserted after [Plan 17](../done/17-sandbox-folds.md), whose picking
  and Fold Buttons it refines, and before
  [Plan 19](./19-fold-angle.md), which will add a mouse drag from a lit
  Fold Line to fold straight to an angle. That is why a mouse press on
  a lit line here never turns the paper, while a touch drag turns it
  from anywhere.
- Four refinements, found in Plan 17's manual QA: a lit line takes the
  pointer, with a `pointer` cursor and no orbit from it; other lines
  stay hoverable while a pick stands; Up and Down fold the keyboard's
  pick; and Fast Fold, a toolbar checkbox in Sandbox Mode (and later
  Gameplay Mode) that shows Fold Buttons without a pick, for a fold in
  one touch at the cost of a busier scene.
- A fifth, for players who have become expert: in Fast Fold with a
  mouse, each side of a Fold Line stands in for one of its Fold Buttons,
  so pointing at one side and clicking folds the line without waiting
  for its pair to appear. For that to be learnable, every pair, in every
  mode, now sits on its line with each button on the side it stands in
  for.
- **Clicks that fail to pick.** Plan 17's Audit (2026-11-15) left
  presses that now and then show no Fold Buttons as a `@TODO` on
  connectDrag() in `docs/src/input/drag.js`, cause not found. This plan
  removes three fragile points, found by reading the code, not by
  reproducing the fault, so Manual QA 4 is the test of whether they were
  the cause:
  - the line is chosen afresh at `pointerup`, from the release point,
    not from what the hover lit, so a release up to the 4 px slop away
    from a line lit at the edge of its reach picks nothing;
  - a press that strays past the slop becomes an orbit and clears the
    pick, so a click with a nudge turns the paper by a hair instead;
  - `.controls` in `docs/styles/main.css` is `position: fixed` with
    `inset-inline: 0`, so its box spans the viewport's whole width, and
    its empty sides beside the centred controls take the pointer from
    the canvas: a line under them can be neither lit nor picked.
- **Why Left and Right make the buttons jump.** Cycling the keyboard's
  pick moves the one `.fold-buttons` container without hiding it
  (`docs/src/main.js`, the `onCycle` handler), so its `@starting-style`
  fade never plays (checked in code, 2026-11-16).
- **A consequence for Plan 19.** Its Decision 6 steps the angle with Up
  and Down on a focused Fold Button; this plan takes the buttons out of
  the Tab order and gives Up and Down to the canvas, so Plan 19's
  keyboard route needs revisiting at its review. Plan 19's mouse drag
  from a lit line starts from the press Decision 1 claims, folds by
  the side of the line the pointer is on, as the proxy (Decision 17)
  reads it, and takes its angle from the pointer's distance from the
  line ([Plan 19, Decision 1](./19-fold-angle.md#decisions)).
- **No rule for the sides can avoid one flip.** A line on screen has no
  direction, so any rule that names one side Mountain must swap sides
  at one slant as the paper turns. Decision 15 puts that flip on the
  bottom-left-to-top-right diagonal, where the pair's arrangement
  visibly changes too.
- Three.js r187: `Vector3.project()`
  ([Vector3.js](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/math/Vector3.js),
  line 499), as Plan 17 read it on 2026-11-14, carries the fold spans
  to the screen. Nothing new from Three.js.
- Browser behaviour it rests on:
  [`PointerEvent.pointerType`](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerType),
  `"mouse"` for a mouse or trackpad, an iPad's included;
  [`pointer-events`](https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events);
  [`tabindex="-1"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex),
  focusable by script but out of the Tab order;
  [`aria-keyshortcuts`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-keyshortcuts);
  and [WCAG 2.2, Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html),
  which Up and Down on the canvas keep met once the buttons leave the
  Tab order.

## Definitions

- **Fold Line**: a lattice line with at least one fold span at rest,
  as Plan 17's
  [Decision 3](../done/17-sandbox-folds.md#decisions) finds them.
- **Pair**: a Fold Line's two Fold Buttons, Valley and Mountain, which
  always show, hide and move together, arranged by their line's slant
  (Decision 15).
- **Slant**: a Fold Line's direction on screen. A line is **shallow**
  when it runs within 45° of horizontal, 45° included, and **steep**
  otherwise.
- **Mountain side** and **Valley side**: the two sides of a Fold Line
  on screen, each the side its pair's button of that name sits on:
  above and below for a shallow line, right and left for a steep one.
- **Proxy**: in Fast Fold with a mouse, a Fold Line's hitzone standing
  in for its pair, each side for the button on that side
  (Decision 17).
- **Active line**: Plan 17's pick, made by a click, a tap or Left and
  Right; at most one, lit, with its pair over it.
- **Hitzone**: where the pointer lights a Fold Line, within
  `PICK_DISTANCE_METERS` of its fold spans on the paper, as now; and,
  round a pair, its box on screen grown by `PAIR_HITZONE_PX`.
- **Kept zone**: while a line is active, the union of its hitzone and
  its pair's. In it, the paper orbits and no other line lights.
- **Slow Fold**: Plan 17's behaviour, a pair only for the active line;
  what the app does with Fast Fold unticked.
- **Fast Fold**: pairs shown for Fold Lines with no line active, in one
  of two layouts by whether a mouse has been detected.
- **Mouse detected**: a `pointermove` or `pointerdown` with
  `pointerType` `"mouse"` has reached the window since the page loaded.

## Decisions

1. **A mouse press on a lit Fold Line belongs to the line, decided at
   `pointerdown`.** connectDrag() asks main.js, through a new
   `claimsPress` callback given the press point and `pointerType`,
   whether the press is a line's: true when the `pointerType` is
   `"mouse"`, a Fold Line's hitzone holds the point and the kept zone
   does not. A touch is never claimed: a finger is less precise than a
   mouse, and with no hover the player cannot see where a line's wide
   hitzone ends, so a touch drag orbits wherever it starts, exactly as
   one between lines does, and a line's hitzone only finds the line a
   tap picks, a press released within the slop, as in Plan 17. A
   finger wobbles more than a mouse, so a touch's slop is its own,
   `TOUCH_DRAG_THRESHOLD_PX = 10` in `docs/src/input/drag.js`, beside
   the mouse's `DRAG_THRESHOLD_PX = 4`, and an orbit by touch starts
   that much later. Ten CSS pixels is about 1.7 mm on an iPhone 12
   Pro's screen (derived: 390 CSS pixels across a screen about 65 mm
   wide); browsers expose no physical screen size, so the allowance
   is in CSS pixels, a first guess to tune on a real phone. A pen is
   treated as touch (inferred). Plan 19's drag from a lit line to
   choose a fold's angle is therefore for the mouse only, whose
   precision and hover state that drag relies on. A claimed press captures the
   pointer but never orbits, sets no `data-dragging`, and on
   `pointerup` activates the line found at `pointerdown`, or, where the
   proxy serves it (Decision 17), presses the button on the side found
   at `pointerdown`, however far the pointer has moved, since Plan 19
   gives that movement a meaning; `pointercancel` drops it. Every other
   press is the orbit press, slop and all, as now. What lit is what
   activates, and no nudge can turn a line's click into an orbit.
2. **The `pointer` cursor marks a press the line would claim.** While a
   mouse hovers where Decision 1 would claim a press, the canvas
   carries `data-over-line`, and `.scene[data-over-line]` sets
   `cursor: pointer`; `data-dragging`'s `grabbing` still wins, and
   during an orbit nothing lights, as now. Written only on change.
3. **Other lines light while a line is active.** Outside the kept zone
   a hover lights the nearest Fold Line, as with no line active, and a
   press activates it, moving the pair. Inside it, nothing else
   lights, the cursor is `grab`, a drag orbits and clears the active
   line, as now, and a press that does not move leaves the active line
   and its pair where they are.
4. **Three lit strips, not two.** The active line keeps its strip while
   a hovered line grows and the last hovered one shrinks, so
   `docs/src/scene/paper.js` holds three strips from createLitLine():
   one for the active line, and two that swap for the hover, as Plan
   17's two do. Created once, never disposed of.
5. **The toolbar's empty sides pass the pointer through.** `.controls`
   takes `pointer-events: none` and its direct children `auto`, but only
   while it is not `data-hidden`, which keeps its own pass-through.
6. **Pairs are placed in JavaScript, and measured from the DOM.** The
   pair's clamp into the viewport moves from CSS into the pure layout
   module, `docs/src/ui/fold-button-layout.js`, so the hitzone and the
   layouts test the boxes the player sees. The pair's width and height
   are read from a laid-out pair once at connection and on resize, so
   `--fold-button-size` and `--controls-gap` stay the one source of the
   size; `space.pair` holds them side by side, and a stacked pair's box
   is the same with width and height swapped, since its buttons are
   square. fold-buttons.js keeps a pool of pairs, each its own
   `.fold-buttons` container, made on demand and kept for the page's
   life, so one can fade out while the next fades in.
7. **Up and Down fold the active line from the keyboard.** With the
   canvas focused and a line active, Up presses its Mountain button and
   Down its Valley button, bump included, each with `preventDefault()`
   and ignoring a held key's repeats; with none active they do nothing.
   The buttons get `tabindex="-1"`, so Tab from the canvas goes
   straight to the mode radios. The canvas gains
   `aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"`.
8. **The keyboard's pair shows as hovered, and lingers.** A pair whose
   line was activated by Left or Right carries `data-emphasised`, which
   the CSS draws as `:hover` is drawn, with no focus ring, since no
   button holds focus. When the line stops being active, the pair drops
   the mark and only then fades, after
   `--fold-button-linger-duration: 0.15s`, as long as the hover change.
   When the canvas loses focus, a pick made by the keyboard is put
   away, not cleared: its line's strip narrows and its pair fades, as
   when a line stops being active, but the canvas remembers the line.
   When focus returns, that same line's strip widens again and its pair
   fades back in, emphasised, so the paper restores whichever Fold Line
   had focus last. A pointer press that lands on the pair does not put
   the pick away, since the press moves focus before its click lands,
   and Safari moves it off the canvas without focusing the button
   (inferred). The remembered line is forgotten when the foldable lines
   are found afresh, after a fold, an undo, a redo or a change of
   pattern, or when a pointer pick or Escape replaces it; and focus
   that returns by a pointer press on the canvas takes that press's
   pick instead (inferred).
9. **The app starts in Sandbox Mode, with Fast Fold ticked.** So the
   no-mouse layout is seen at load. mode-radios.js checks `sandbox` at
   connection, and main.js starts its sequence state and target at
   rest on the checked pattern's flat sheet, position 0, in its colour,
   with no animation. The Fast Fold checkbox, `input[data-fast-fold]`,
   sits after "Fold lines", ticked at connection whatever the browser
   restored, shown in Sandbox Mode only through its label's `hidden`,
   which needs a rule as `.choices[hidden]` has. The boot mode, the
   default and revealing the mouse early are
   [a backlog item](./backlog/20261116-boot-mode-and-mouse-reveal.md)
   for the final polish.
10. **Mouse detection is one-way per load.** A window listener sets it
    on the first `pointermove` or `pointerdown` with `pointerType`
    `"mouse"`, then removes itself. A switch fades the touch layout out
    and the nearby layout in.
11. **No mouse: the touch layout.** Every Fold Line that fits gets a
    pair, centred on a point of its own fold spans on screen, so the
    line visibly runs under its pair. placePairs(lines, space) lays
    them out, greedily, longest on-screen fold first, ties in the
    lattice's order; for each line it tries `LAYOUT_SAMPLES = 9` points
    evenly from 0.1 to 0.9 of each span, keeps those whose box lies in
    the viewport, clear of every exclusion (each visible toolbar
    control's box) and at least `PAIR_GAP_PX = 12` from every placed
    box, and takes the one furthest from other lines and placed pairs.
    A line with no such point gets no pair, so the subset shown is the
    longest lines, and pairs never overlap. It runs, allocating, only
    when the scene comes to rest: a fold ends, an orbit is released, a
    spin reset ends, the canvas resizes, a line stops being active, or
    Fast Fold is ticked.
12. **Mouse: the nearby layout.** On each mouse move, with no line
    active, a shown pair whose box lies more than
    `NEARBY_KEEP_RADIUS_PX = 200` from the pointer fades out; then,
    while fewer than `NEARBY_PAIR_COUNT = 3` show, the nearest Fold
    Line without a pair whose fold spans come within
    `NEARBY_RADIUS_PX = 120` gets one, from
    placeNearbyPair(line, out, pointer, shown, shownCount, space):
    centred on its own spans, as near the pointer as keeps its box
    `POINTER_CLEARANCE_PX = 40` from it, and clear of shown pairs and
    exclusions as Decision 11 has them; no room, no pair. A pair never
    moves once shown. The screen-space spans are projected once per
    rest state, as Decision 11's events; the per-move path allocates
    nothing. All four constants are first guesses, open to tuning, and
    may later follow the design and the view.
13. **Activation suspends Fast Fold.** A line activated by a tap, or by
    a click the proxy does not serve (Decision 17), fades every Fast
    Fold pair, its own included, and its Slow Fold
    pair fades in; when it stops being active, Fast Fold resumes, by
    the touch layout at once or the nearby layout on the next move. A
    press on a Fast Fold pair folds its line straight away, with no
    activation, as the facing side was at layout. Every pair fades out
    as an orbit's first move or a fold starts, and Decision 11's events
    bring them back.
14. **The keyboard with Fast Fold.** With a mouse detected, Left and
    Right activate as in Slow Fold, so one pair shows. With none, they
    leave the touch layout in place and emphasise the active line's
    pair (Decision 8); a line with no pair placed shows its Slow Fold
    pair over the middle of its longest span, arranged by its slant
    (Decision 15), and the touch pairs it overlaps fade until the next
    layout. So every line stays reachable from the keyboard, and the
    layout is never reshuffled by Left or Right.
15. **The pair's arrangement follows its line's slant, in every
    mode.** On a shallow line the pair is stacked, Mountain above
    Valley; on a steep line it sits side by side, Valley left and
    Mountain right, as now. A stacked pair's container carries
    `data-stacked`, which the CSS lays out as
    `flex-direction: column-reverse`, so the DOM keeps Valley then
    Mountain while Mountain shows on top. Either way the pair centres
    on a point of its own line, so the line runs between its two
    buttons and each sits on its own side: the Mountain side is above
    a shallow line and right of a steep one. This holds in Slow Fold
    and Fast Fold, with a mouse or without, and for the keyboard's
    pair. The slant is read
    from the line's projected spans (Decision 12), which lie on one
    straight line on screen, since at rest every fold span of a Fold
    Line lies in the paper's plane (Plan 17,
    [Decision 2](../done/17-sandbox-folds.md#decisions)). A pair keeps
    its arrangement while shown; the next layout reads the slant
    afresh. So the sides stay put across horizontal, vertical and the
    top-left-to-bottom-right diagonal, and flip only on the
    bottom-left-to-top-right diagonal, where the pair's arrangement
    changes with them. Up for Mountain and Down for Valley
    (Decision 7) match the stacked pair on screen. A pair stacked at
    every slant was rejected: its sides would flip at vertical, and on
    a steep line the line would run through both buttons, so they
    could not show the sides.
16. **Slow Fold places its pair on its line, beside the click.** The
    pair replaces Plan 17's, centred `FOLD_BUTTON_OFFSET_PX` above the
    pick point, which goes. It slides along its line from the pick
    point towards the viewport's nearer edge, away from the middle of
    the paper, where most lines cross: on a shallow line, leftwards
    for a click on the left half of the viewport and rightwards for
    the right half; on a steep line, the same rule turned a quarter,
    upwards for a click on the upper half and downwards for the lower,
    since sliding left or right along a steep line barely moves the
    pair sideways. It stops as near the click as keeps its box
    `POINTER_CLEARANCE_PX` from it, as placeNearbyPair() places,
    inside the viewport and clear of the exclusions; with no room that
    way, which a click low on a steep line often meets at the toolbar,
    it tries the other way, and with none either way, it is clamped
    into the viewport over the pick point. The keyboard's pair, with
    no click, centres on the middle of the line's longest span, from
    writeFoldMiddle().
17. **In Fast Fold with a mouse, a lit line's hitzone is the proxy for
    its pair.** Only for `pointerType` `"mouse"`, never touch or pen,
    and the keyboard has Up and Down. While the pointer is over a lit
    Fold Line whose Fast Fold pair is shown, but over neither of that
    pair's buttons:
    - the button on the pointer's side of the line carries
      `data-proxied`, which the CSS draws as `:hover` is drawn, grown
      and lightened; the other button, and the line, react no
      differently, the line lit and the cursor `pointer`, as now;
    - a press there is claimed (Decision 1), and on release presses
      the button for the side found at `pointerdown`: its bump, then
      its fold, exactly as a press on the button, with no activation
      and no suspension of Fast Fold;
    - over a button, the button behaves as now, and the proxy marks
      nothing.

    The side is the sign of the cross product of the line's direction
    on screen and the pointer's offset from it, taken from the
    projected spans by sideOf(line, x, y) in the layout module, which
    allocates nothing; a pointer exactly on the centre counts as the
    Mountain side. A lit line with no pair shown gets one first: the
    nearby layout (Decision 12) places the lit line's pair before any
    other, and counts towards `NEARBY_PAIR_COUNT`: when three already
    show, the one furthest from the pointer fades, as the least likely
    to be wanted next, matching the layout's fade by distance. The lit
    line's pair ignores the pairs
    shown on other lines, and any it would come within the gap of
    fades, since the line under the pointer is the one being aimed
    at; placeNearbyPair() takes it with a `shownCount` of 0. Only a
    line with no room of its own, too short to clear the pointer,
    off-screen or beside the toolbar, gets no pair: the proxy does not
    serve it, and a click activates it as in Slow Fold (Decision 13),
    so nothing ever folds without a button on screen. Short lines meet
    this most, late in a model: on a desktop, a line needs about 76 px,
    some 22 mm of paper, on one side of the pointer.
18. **A line that folds one way gets one button, centred on it
    (recorded for later).** Gameplay Mode's printed dashed and
    dash-dot-dot lines
    ([Fold Buttons](./14-gameplay-mode-research.md#fold-buttons)) each
    fold one way, so each gets a single Fold Button, centred on its
    line, and both sides of its hitzone are the proxy for that button.
    Not built here: the plan that brings Fold Buttons to Gameplay Mode
    takes it up, giving a placement a one-button box.

The layout's data, in CSS pixels from the viewport's top-left, a line
with one fold span, `segments` holding four numbers per span. A
placement's `isStacked` copies its line's slant when placed
(Decision 15), so a shown pair's box is known without its line:

```json
{
  "line": { "index": 3, "lengthPx": 565.7, "segments": [600, 100, 200, 500] },
  "placement": { "isStacked": true, "lineIndex": 3, "x": 480, "y": 220 },
  "space": {
    "exclusions": [{ "bottom": 600, "left": 250, "right": 550, "top": 560 }],
    "pair": { "gapPx": 12, "heightPx": 32, "widthPx": 72 },
    "pointerClearancePx": 40,
    "viewport": { "height": 600, "width": 800 }
  }
}
```

## Steps

### Step 1: The layout maths [P]

- Adds `docs/src/ui/fold-button-layout.js`, pure, importing nothing:
  placePairs(), placeNearbyPair(), isSteep(line), sideOf(line, x, y),
  and the box and distance tests the hitzone uses (Decisions 6, 11,
  12, 15, 17).
- It should place pairs for the longest lines first, each centred on
  its own line and arranged by its slant, inside the viewport, clear
  of exclusions and of each other by the gap (Agent QA 1).
- It should drop the lines that do not fit (Agent QA 2).
- It should place a nearby pair on its line, clear of the pointer and
  the shown pairs, or report no room, allocating nothing (Agent QA 3,
  5).
- It should name the Mountain side above a shallow line and right of a
  steep one, flipping only on the bottom-left-to-top-right diagonal
  (Agent QA 4).

**Agent QA** (commands 1 to 3 build a square's eight lines, 400 px
across, on an 800 by 600 viewport; a side-by-side pair is 72 by 32 px,
a stacked one 32 by 72)

1. Do: `node --input-type=module -e 'import { placePairs } from "./docs/src/ui/fold-button-layout.js"; const seg = [[400,100,400,500],[200,300,600,300],[200,100,600,500],[600,100,200,500],[400,100,200,300],[400,100,600,300],[200,300,400,500],[600,300,400,500]]; const lines = seg.map((s, index) => ({ index, lengthPx: Math.hypot(s[2]-s[0], s[3]-s[1]), segments: s })); const space = { exclusions: [{ bottom: 600, left: 250, right: 550, top: 560 }], pair: { gapPx: 12, heightPx: 32, widthPx: 72 }, pointerClearancePx: 40, viewport: { height: 600, width: 800 } }; const d = (x1,y1,x2,y2,x,y) => { const dx = x2-x1, dy = y2-y1, t = Math.max(0, Math.min(1, ((x-x1)*dx + (y-y1)*dy) / (dx*dx + dy*dy))); return Math.hypot(x1+t*dx-x, y1+t*dy-y); }; const p = placePairs(lines, space); const b = (q) => q.isStacked ? [q.x-16, q.y-36, q.x+16, q.y+36] : [q.x-36, q.y-16, q.x+36, q.y+16]; const apart = (a, c) => a[0] >= c[2]+12 || c[0] >= a[2]+12 || a[1] >= c[3]+12 || c[1] >= a[3]+12; const shallow = (s) => Math.abs(s[3]-s[1]) <= Math.abs(s[2]-s[0]); console.log(p.every((q) => { const [l,t,r,u] = b(q); return l >= 0 && t >= 0 && r <= 800 && u <= 600; }), p.every((q, i) => p.every((o, j) => i === j || apart(b(q), b(o)))), p.every((q) => { const [l,t,r,u] = b(q); return r <= 250 || l >= 550 || u <= 560; }), p.every((q) => d(...seg[q.lineIndex], q.x, q.y) < 0.5), new Set(p.map((q) => q.lineIndex)).size === p.length, p.length >= 4 && [2, 3].includes(p[0].lineIndex), p.every((q) => q.isStacked === shallow(seg[q.lineIndex])));'`
   Expect: `true true true true true true true` (in the viewport, apart by the gap, clear of the toolbar, on their own lines, one per line, a longest line first, and stacked exactly on the shallow lines)
2. Do: `node --input-type=module -e 'import { placePairs } from "./docs/src/ui/fold-button-layout.js"; const seg = [[400,100,400,500],[200,300,600,300],[200,100,600,500],[600,100,200,500],[400,100,200,300],[400,100,600,300],[200,300,400,500],[600,300,400,500]]; const lines = seg.map((s, index) => ({ index, lengthPx: Math.hypot(s[2]-s[0], s[3]-s[1]), segments: s })); const space = { exclusions: [], pair: { gapPx: 12, heightPx: 200, widthPx: 300 }, pointerClearancePx: 40, viewport: { height: 600, width: 800 } }; const p = placePairs(lines, space); const b = (q) => q.isStacked ? [q.x-100, q.y-150, q.x+100, q.y+150] : [q.x-150, q.y-100, q.x+150, q.y+100]; const apart = (a, c) => a[0] >= c[2]+12 || c[0] >= a[2]+12 || a[1] >= c[3]+12 || c[1] >= a[3]+12; console.log(p.length < 8, p.length >= 1 && [2, 3].includes(p[0].lineIndex), p.every((q, i) => p.every((o, j) => i === j || apart(b(q), b(o)))));'`
   Expect: `true true true` (pairs too big for every line: some dropped, a longest line kept, none overlapping)
3. Do: `node --input-type=module -e 'import { placeNearbyPair } from "./docs/src/ui/fold-button-layout.js"; const line = { index: 0, lengthPx: 400, segments: [400,100,400,500] }; const space = { exclusions: [], pair: { gapPx: 12, heightPx: 32, widthPx: 72 }, pointerClearancePx: 40, viewport: { height: 600, width: 800 } }; const shown = [{ isStacked: true, lineIndex: 1, x: 350, y: 250 }]; const out = { isStacked: true, lineIndex: -1, x: 0, y: 0 }; const ok = placeNearbyPair(line, out, { x: 400, y: 250 }, shown, 1, space); const b = (q) => q.isStacked ? [q.x-16, q.y-36, q.x+16, q.y+36] : [q.x-36, q.y-16, q.x+36, q.y+16]; const apart = (a, c) => a[0] >= c[2]+12 || c[0] >= a[2]+12 || a[1] >= c[3]+12 || c[1] >= a[3]+12; const gap = Math.max(Math.abs(out.y - 250) - 16, Math.abs(out.x - 400) - 36); const none = placeNearbyPair(line, out, { x: 400, y: 250 }, shown, 1, { ...space, viewport: { height: 100, width: 100 } }); console.log(ok, Math.abs(out.x - 400) < 0.5 && out.y >= 100 && out.y <= 500, gap >= 40, apart(b(out), b(shown[0])), out.isStacked === false, none);'`
   Expect: `true true true true true false` (on its steep line, clear of the pointer and of the stacked pair beside it, side by side; then no room)
4. Do: `node --input-type=module -e 'import { isSteep, sideOf } from "./docs/src/ui/fold-button-layout.js"; const line = (...segments) => ({ index: 0, lengthPx: 0, segments }); const flat = line(200,300,600,300), back = line(600,300,200,300), upright = line(400,100,400,500), fall = line(200,100,600,500), rise = line(600,200,200,300), climb = line(500,100,400,500); console.log(sideOf(flat, 400, 250), sideOf(flat, 400, 350), sideOf(back, 400, 250), sideOf(upright, 450, 300), sideOf(upright, 350, 300), sideOf(fall, 500, 200), sideOf(fall, 300, 400), sideOf(line(600,100,200,500), 300, 300), sideOf(rise, 400, 200), sideOf(climb, 400, 200), sideOf(climb, 500, 400), isSteep(fall), isSteep(upright));'`
   Expect: `mountain valley mountain mountain valley mountain valley mountain mountain valley mountain false true` (above a horizontal line, either way round; right of a vertical one; upper-right of a falling diagonal; upper-left of a rising one at 45° or shallower, lower-right of a steeper one; 45° counts as shallow)
5. Do: `sed -n -e '/^export const placeNearbyPair/,/^};/p' -e '/^export const sideOf/,/^};/p' docs/src/ui/fold-button-layout.js | grep -cE "new [A-Z]|\[\]|\{\}|\.\.\.|\.(map|filter|slice|concat)\("`
   Expect: `0`

### Step 2: Lines that take the pointer

- Changes `docs/src/input/drag.js` (`claimsPress`, the claimed press,
  `TOUCH_DRAG_THRESHOLD_PX`;
  the `@TODO` removed once Manual QA 4 passes, kept and updated if
  not), `docs/src/input/pick.js`, `docs/src/main.js` (the kept zone,
  hover while active, the cursor), `docs/src/scene/paper.js` (three
  strips), `docs/src/ui/fold-buttons.js` (the pool, placement in JS,
  the pair's box, its arrangement, `FOLD_BUTTON_OFFSET_PX` removed)
  and `docs/styles/main.css` (cursor, toolbar pass-through, the clamp
  removed, `data-stacked`) (Decisions 1 to 6, 15, 16).
- It should arrange every pair by its line's slant, the line running
  between its buttons, and place Slow Fold's pair on its line beside
  the click, towards the viewport's nearer edge (Manual QA 4).
- It should show a `pointer` cursor over a lit line and never orbit
  from a press there, leaving orbits that pass over lines unchanged
  (Manual QA 3).
- It should activate the lit line on every click, however nudged, and
  light lines under the toolbar's empty sides (Manual QA 4, 5).
- It should keep the kept zone for orbiting while other lines light and
  activate outside it (Manual QA 6).
- It should allocate nothing per pointer move (Agent QA 1; Manual QA
  15).

**Agent QA**

1. Do: `for f in drag pick; do sed -n -E '/addEventListener\("pointer(move|down)"/,/^  }\);/p' docs/src/input/$f.js; done | grep -cE "new [A-Z]|\[\]|\{\}|\.\.\."`
   Expect: `0`, with the sed printing both handlers when run alone
   (macOS sed reads `\|` literally in a basic regular expression, so
   the `-E` form is needed for the check to see any code)
2. Do: `grep -c '\.scene\[data-over-line\]' docs/styles/main.css; grep -c "claimsPress" docs/src/input/drag.js; grep -c "createLitLine(radiusMeters)" docs/src/scene/paper.js; grep -c "FOLD_BUTTON_OFFSET_PX" docs/src/ui/fold-buttons.js; grep -c "data-stacked" docs/styles/main.css`
   Expect: `1`, then at least `2`, then `3`, then `0`, then at least
   `1`
3. Do: `for f in docs/src/input/drag.js docs/src/input/pick.js docs/src/main.js docs/src/scene/paper.js docs/src/ui/fold-buttons.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/input/*.js docs/src/main.js docs/src/scene/paper.js docs/src/ui/*.js docs/styles/main.css`
   Expect: prints nothing.

### Step 3: The keyboard

- Changes `docs/src/input/pick.js` (Up and Down, blur and focus, the
  remembered line),
  `docs/src/ui/fold-buttons.js` (`tabindex="-1"`, `data-emphasised`,
  the linger), `docs/src/main.js`, `docs/index.html`
  (`aria-keyshortcuts`) and `docs/styles/main.css` (Decisions 7, 8).
- It should fold the keyboard's line mountain on Up and valley on Down,
  with the bump, and Tab from it to the mode radios (Manual QA 7, 8).
- It should fade pairs in and out on Left and Right, the outgoing pair
  shrinking back first, the active one drawn as hovered with no focus
  ring (Manual QA 7).
- It should put the keyboard's line away when focus leaves the paper
  and restore the same line and pair when focus returns (Manual QA 8).

**Agent QA**

1. Do: `grep -c '"ArrowUp"\|"ArrowDown"' docs/src/input/pick.js; grep -o 'aria-keyshortcuts="[^"]*"' docs/index.html; grep -c "fold-button-linger-duration" docs/styles/main.css`
   Expect: at least `2`, then
   `aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"`, then
   at least `2`
2. Do: `node --check docs/src/input/pick.js && node --check docs/src/ui/fold-buttons.js && node --check docs/src/main.js; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/input/pick.js docs/src/ui/fold-buttons.js docs/src/main.js docs/styles/main.css`
   Expect: prints nothing.

### Step 4: Fast Fold

- Adds `docs/src/input/mouse.js` (Decision 10) and
  `docs/src/ui/fast-fold.js` (the checkbox, and which pairs show in
  which layout, the lit line's pair first; Decisions 11 to 14, 17);
  changes `docs/index.html` (the checkbox, Sandbox checked),
  `docs/src/ui/mode-radios.js`, `docs/src/main.js` (the boot state,
  suspension, fades, the proxy's side and its claimed press),
  `docs/src/ui/fold-buttons.js` (`data-proxied`) and
  `docs/styles/main.css` (Decisions 9, 17).
- It should start in Sandbox Mode at rest with Fast Fold ticked and
  shown, hidden in Presentation Mode (Agent QA 1; Manual QA 1, 14).
- It should show the touch layout until a mouse is detected, fading
  out as an orbit or a fold starts and back in, laid out afresh, once
  it ends (Manual QA 1, 12).
- It should switch to the nearby layout on the first mouse move, its
  pairs staying put and fading by distance (Manual QA 2).
- It should suspend for an active line and resume after it, and fold
  in one press from a Fast Fold pair (Manual QA 10, 13).
- It should, with a mouse, make each side of a lit line the proxy for
  the button on that side, hovering and pressing it, and never for
  touch (Manual QA 9, 13, 16).
- It should emphasise the keyboard's line's pair within the touch
  layout, and show one pair with a mouse detected (Manual QA 11).

**Agent QA**

1. Do: `grep -o 'value="sandbox" checked\|data-fast-fold' docs/index.html | sort -u | tr '\n' ' '; grep -c 'pointerType === "mouse"' docs/src/input/mouse.js`
   Expect: `data-fast-fold value="sandbox" checked `, then at least `1`
2. Do: `grep -c "data-proxied" docs/styles/main.css; grep -c "data-proxied" docs/src/ui/fold-buttons.js; grep -l "sideOf(" docs/src/main.js docs/src/ui/fast-fold.js | wc -l | tr -d ' '`
   Expect: at least `1`, at least `1`, then at least `1`
3. Do: `for f in docs/src/input/mouse.js docs/src/ui/fast-fold.js docs/src/ui/mode-radios.js docs/src/ui/fold-buttons.js docs/src/main.js; do node --check "$f"; done; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/input/mouse.js docs/src/ui/*.js docs/src/main.js docs/styles/main.css`
   Expect: prints nothing.
4. Do: `shasum -a 256 docs/vendor/three/build/*.js`
   Expect: the "as stored" checksums in `docs/vendor/three/README.md`.

## Open questions

None.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser every click on a lit line activates it, Up and Down fold
from the keyboard, every pair sits on its line with each button on its
own side, and Fast Fold folds the square in single presses, by mouse
and by touch, a mouse pointing to either side of a line folding it
that way, with no console errors.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`.
Open `http://localhost:1111/` in desktop Chrome with the dev tools
console open, then take a hand off the mouse and hard-reload with the
keyboard (Shift+Cmd+R).

### Fast Fold at load, and the pointer

1. **Do:** without touching the mouse, look at the page.
   - **Expect:** Sandbox Mode, "Square ½", with "Fast Fold" ticked
     after "Fold lines"; pairs fade in over the lines, each centred on
     its own line, none touching another or the toolbar, the longest
     lines served first. The console is empty.
2. **Do:** move the mouse onto the window, then slowly about the paper.
   - **Expect:** the pairs fade away; up to three pairs fade in on the
     lines nearest the pointer, never under it, and stay where they
     appeared; moving off one way fades the far ones as new near ones
     appear. Lines still grow as the pointer nears them.
3. **Do:** untick "Fast Fold". Hover a line until it grows, then press
   and drag; release, then press on bare paper and drag across lines.
   - **Expect:** over the grown line the cursor is a pointing hand, and
     the drag from it turns nothing; from bare paper the cursor is a
     closed hand and the paper turns, lighting no line on the way.
4. **Do:** click 30 lit lines, at their middles, ends and the edge of
   their reach, some with a deliberate small nudge while pressed.
   - **Expect:** every click shows the pair; none turns the paper. The
     pair sits on the line, the line running between its buttons,
     beside the click towards the window's nearer side: stacked,
     Mountain on top, on a line nearer horizontal, and side by side,
     Mountain on the right, on a steeper one.
   - **Why:** the failing clicks Plan 17 left as a `@TODO`.
5. **Do:** narrow the window until the toolbar wraps, turn the paper so
   a line runs beside the toolbar's controls, and hover it there.
   - **Expect:** the line lights and takes a click.
6. **Do:** click a line, then move the pointer along it and round its
   pair; then further off, onto another line, and click it.
   - **Expect:** near the active line and its pair nothing else lights
     and the cursor is an open hand; a drag there turns the paper and
     clears the pick. Further off, another line lights beside the
     active one, with the pointing hand, and a click moves the pair
     to it.

### The keyboard

7. **Do:** press Tab until the paper shows its focus ring, then Right,
   Right.
   - **Expect:** a pair fades in already grown and lightened, with no
     blue ring on either button; on the second Right it shrinks back,
     then fades, as the next line's pair fades in grown.
8. **Do:** press Up; once the paper rests, Right then Down; then Right,
   Tab, and Shift+Tab.
   - **Expect:** Up folds mountain, Down valley, each button bumping
     first. Tab moves focus straight to "Presentation"/"Sandbox", and
     the line narrows as the pair shrinks back and fades; Shift+Tab
     back to the paper widens the same line again and fades the same
     pair back in, grown, and Up folds it.

### Fast Fold with a mouse

9. **Do:** tick "Fast Fold". Turn the paper so a line runs nearly
   horizontal, then hover just above it, just below it, and onto its
   pair's Valley button; then click just below the line.
   - **Expect:** the line lights with the pointing hand, and its pair,
     stacked on it, fades in if it was not shown. Above the line the
     Mountain button grows and lightens as when hovered, below it the
     Valley button, and on the Valley button that button alone, as
     before; the line itself changes in no new way. The click bumps
     the Valley button and folds the line valley, with no other pair
     shown first; all pairs fade as the fold starts.
10. **Do:** press a nearby pair's V.
    - **Expect:** it bumps and the line folds valley; all pairs fade as
      the fold starts, and nearby pairs return on the next move once
      it rests.
11. **Do:** focus the paper and press Right, then hard-reload by
    keyboard, hands off the mouse, Tab to the paper and press Right.
    - **Expect:** with the mouse detected, one pair shows, as with Fast
      Fold off. Without it, the touch layout stays and the line's own
      pair grows and lightens among them; Up folds that line.

### Touch and regressions

12. **Do:** in device mode (iPhone 12 Pro), reload; drag to turn the
    paper, release; then fold corners to the centre until the paper is
    small, and try landscape.
    - **Expect:** pairs on lines, none overlapping; they fade as the
      drag or a fold starts and fade back, laid out afresh, after;
      fewer show as the paper shrinks or turns edge-on, never touching.
13. **Do:** still in device mode, tap just to one side of a line that
    has a pair, then tap bare paper; then press with a finger right on
    a line and drag.
    - **Expect:** the tap folds nothing, whichever side it lands on: it
      fades all pairs and shows the line's own; the tap on bare paper
      clears it and the layout returns. The drag from the line turns
      the paper exactly as a drag from bare paper does.
    - **Then, on a real phone:** tap 20 lines with a natural, unhurried
      finger. Every tap picks its line; if some turn the paper by a
      hair instead, `TOUCH_DRAG_THRESHOLD_PX` needs raising.
14. **Do:** click "Presentation", choose "Yacht", then "Sandbox".
    - **Expect:** "Fast Fold" is hidden in Presentation Mode, which
      folds the yacht as before; back in Sandbox it shows, still
      ticked.
15. **Do:** in the Performance panel with Memory ticked, record while
    moving the mouse about the paper for ten seconds with Fast Fold on.
    - **Expect:** no garbage collection tied to the moves; the heap
      flat.

### The proxy at every slant

16. **Do:** close device mode and reload, with Fast Fold ticked. Turn
    the paper so a line runs nearly vertical, and hover right of it,
    then left. Then turn it so a line rises from bottom left to top
    right, a little shallower than 45°, and hover above-left of it;
    turn it on until that line is a little steeper, and hover
    above-left of it again.
    - **Expect:** on the near-vertical line the pair sits side by side,
      Valley left and Mountain right, the line between them; right of
      the line the Mountain button grows, left the Valley. Above-left
      of the shallow rising line, Mountain grows over a stacked pair;
      above-left of the steeper one, Valley grows over a side-by-side
      pair. That diagonal is the only slant where the sides swap.

**Looks wrong, but isn't:** a hard-reload made with the mouse still
shows the touch layout until the mouse first moves; a mouse that never
moves keeps it. A phone in landscape may fit fewer pairs than portrait.

## Audit

- **2026-11-16T12:54:16Z** — **drafted**: lines claim their press at
  `pointerdown` with a pointer cursor, hover beside an active line
  outside its kept zone, Up and Down fold, pairs fade and linger, and
  Fast Fold's touch and nearby layouts, starting in Sandbox Mode;
  inserted before the fold-angle plan, renumbering 18 to 20 as 19 to
  21.
- **2026-11-16T18:35:59Z** — **revised**: added the Lead Developer’s
  proxy, each side of a lit line standing in for its button in Fast
  Fold with a mouse (Decision 17); pairs arranged by slant in every
  mode, stacked on shallow lines and side by side on steep ones, with
  the one flip on the rising diagonal, as the Lead Developer chose
  (Decision 15); Slow Fold’s pair placed on its line beside the click
  (Decision 16); one-button lines recorded for Gameplay Mode
  (Decision 18). Step 2’s allocation check rewritten with `sed -E`,
  since macOS sed matched nothing and passed it vacuously.
- **2026-11-16T19:12:27Z** — **ruled**: on a steep line, Slow Fold’s
  pair slides up for a click on the upper half and down for the lower,
  falling back the other way and then over the pick point (Decision
  16), as the agent proposed; ruled by the Lead Developer via
  /feed-me. Provenance moved out of the body of Decisions 15 and 16
  and the Context.
- **2026-11-16T19:16:14Z** — **ruled**: the lit line’s pair ignores
  other lines’ shown pairs, fading any it would crowd, and only a line
  with no room of its own falls back to activation (Decision 17), as
  the agent proposed; ruled by the Lead Developer via /feed-me.
- **2026-11-16T19:20:04Z** — **ruled**: the lit line’s pair counts
  towards the three, and the shown pair furthest from the pointer makes
  way for it (Decision 17), as the agent proposed; ruled by the Lead
  Developer via /feed-me.
- **2026-11-16T19:31:40Z** — **ruled**: losing focus puts the keyboard’s
  pick away, narrowing its line and fading its pair, and focus returning
  restores the same line and pair (Decision 8; Manual QA 8), ruled by
  the Lead Developer via /feed-me in place of clearing the pick. The
  agent added, as inferred: a press on the pair does not put it away,
  and the remembered line is forgotten when the lines are found afresh
  or another pick replaces it.
- **2026-11-16T19:34:35Z** — **ruled**: in the touch layout, a keyboard
  pick with no pair placed shows its own pair over its middle, fading
  the touch pairs it overlaps (Decision 14), as drafted; ruled by the
  Lead Developer via /feed-me.
- **2026-11-17T09:54:40Z** — **ruled**: only a mouse press is claimed by a line; a
  touch drag orbits wherever it starts, and a line's hitzone serves
  touch only to find a tap's line; Plan 19's drag from a line is for
  the mouse only (Decision 1, Context, Manual QA 13). Open question 1
  closed; ruled by the Lead Developer via /feed-me. The agent added,
  as inferred: a pen is treated as touch.
- **2026-11-17T09:59:06Z** — **ruled**: a touch has its own slop,
  `TOUCH_DRAG_THRESHOLD_PX = 10` CSS pixels, a first guess to tune on
  a real phone, since browsers expose no physical screen size
  (Decision 1, Step 2, Manual QA 13), as the agent proposed; ruled by
  the Lead Developer via /feed-me.
- **2026-11-17T17:49:15Z** — **revised**: the Context records Plan 19’s ruled drag, by
  side and distance from the line, in place of the question for its
  review.
- **2026-11-17T21:30:41Z** — **recorded**: the /feed-me briefs behind
  Decisions 1, 8, 14, 16 and 17 kept in
  [14-gameplay-mode-briefs.md](./14-gameplay-mode-briefs.md).
