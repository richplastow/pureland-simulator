---
title: Fold angles without dragging
description: Step buttons in the sandbox bar that fold a picked line to an angle with taps alone, so touch screens and pointers that cannot drag reach standing folds.
type: backlog
---

## Problem

In Sandbox Mode a fold short of flat, such as a corner stood up at 90°,
is reached by a mouse drag from a lit Fold Line or by Shift+Up and
Shift+Down on the canvas
([Plan 19, Decisions 1 and 6](../../done/19-fold-angle.md#decisions)). Neither
works on a touch screen, where a drag from a line always turns the
paper ([Plan 18, Decision 1](../../done/18-fast-fold.md#decisions)), nor
for anyone whose pointer can click but not drag, such as a head pointer
or a hand with a tremor. They can fold flat, but never to an angle, so
the standing folds of [Plan 21](../21-standing-folds.md) are out of
their reach too.

[WCAG 2.2, Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
(2.5.7, level AA) asks that anything done by dragging can be done with
single clicks or taps. Its guidance says a keyboard equivalent “does not
automatically meet this success criterion”, and gives tap-to-select then
“adjacent controls” as an acceptable alternative (read 2026-11-18).

## Current position

Plan 19 makes angles mouse and keyboard only, to keep that plan to the
drag, the keyboard and the standing fold. The gap is stated in its
Context and its Decision 7. It should not last: the app misses a level
AA criterion, and phones get no standing folds at all.

## Recommended fix: step buttons in the sandbox bar

While a line is picked, the sandbox bar shows three more buttons: one
stepping the fold one `SNAP_RADIANS` step towards mountain, one towards
valley, and one confirming the fold. They are the touch equivalents of
Shift+Up, Shift+Down and Enter, and call the same code path, so the
paper folds live at each tap exactly as it does from the keyboard, and
stepping back to flat cancels. A tap anywhere else, or picking another
line, eases a shown angle back to flat. Not verified: whether three
more buttons fit the bar at phone width beside Undo and Redo, which a
mock-up at 390 px should settle first.

## Other options

- **Buttons beside the picked line's Fold Buttons**, in the scene:
  closer to the line, but they move with the paper and crowd a pair
  that already sits on its line by slant.
- **Tap on a ring round a Fold Button**, as Plan 19 first proposed: the
  ring went when the paper became the only readout
  ([Plan 19, Decision 3](../../done/19-fold-angle.md#decisions)).
- **Never**: angles stay mouse and keyboard only, and the level AA gap
  stays open.

## When to pick it up

- After Plan 19 is done, since the buttons reuse its keyboard path.
- Before or with Plan 21, if standing folds should work on phones from
  the start.
- Before Gameplay Mode, if any design asks for a fold short of flat.

## Audit

- **2026-11-18T11:15:39Z** — **raised**: from Plan 19’s open questions,
  where the Lead Developer deferred a single-pointer route to an angle
  rather than build it in that plan.
