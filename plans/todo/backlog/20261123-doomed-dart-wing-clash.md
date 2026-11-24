---
title: A dart wing that passes through a flap on a lost path
description: Ten of the paper dart's graph edges, all on paths that can no longer reach the goal, fold a wing through a flap part-way; accepted for now, with a cheap test that would refuse them.
type: backlog
---

## Problem

In Gameplay Mode the paper dart's maze
([Plan 22](../../done/22-gameplay-graph.md)) lets the centre fold come
before the corners and edges: a trap. If a right-hand corner or edge
then folds, it wraps a flap over the front half, and a wing folded
after that passes through the flap part-way through its fold. Wing 5
rises through it; wing 6 carries it down through the other half.

Measured on 2026-11-23 over the real engine, posing every edge of the
four Gameplay mazes at 63 samples per fold:

- Exactly ten edges clash, all the dart's, all wing folds from a
  doomed state, at the 4th to 6th press, one or two presses after the
  trap. The blintz, the yacht and Mount Fuji, and every live path,
  have none.
- The wing passes 2.7 to 8.9 mm through a flap of 6 to 37 cm² (the
  sheet is 225 cm²) for about a fifth of the fold, then grows out of
  the flap near its hinge until rest.
- The cause is the engine's layer selection, which goes by history
  alone: a `{ movedBy }` or `{ heldBy }` fold moves the faces an earlier
  fold moved (`docs/src/fold/engine.js`, selectsFace() and
  applyFold()), whatever lies on them now. In a design's own order
  history and geometry agree, so Presentation Mode never shows it.
  Turning both sides or the moving side only makes no difference.

## Current position

Accepted: real paper bends a little to let two parts pass, so the
folds stay available and are posed as the engine poses them
([Plan 24's Context](../../done/24-gameplay-folds.md#context)).

## Recommended fix: refuse the fold in buildGraph()

A flat test, with no posing: a fold is not available if a face it
holds overlaps a face it moves on the side the move turns towards,
above for a valley and below for a mountain. It flags exactly the ten
edges, at about 10 µs per edge, in about ten lines of
`docs/src/gameplay/graph.js`, and leaves the engine as it is.

The dart's maze then falls from 86 states and 103 edges to 71 and 83,
and its dead ends from 29 to 28; its live states, traps and orders
(13, 23, 12), the other three mazes and the camera's radius are
unchanged. Every trap's furthest dead end then lies within two folds,
not four. Every quoted dart figure, goal node and node id in the plans
then in flight needs measuring again.

## Other options

- **Fix the engine's layer selection**, so a fold also carries a flap
  lying on the paper it moves. All six designs' sheets come out the
  same, and the dart's maze becomes exactly the recommended fix's,
  since the printed rule then refuses those folds; but it reopens the
  engine for no difference in play.

## When to pick it up

- When play-testing finds the glitch distracting.
- When a new Gameplay design turns up the same clash on a live path,
  where it could not be waved away as a lost game.

## Audit

- **2026-11-23T14:39:08Z** — **raised**: through `/feed-me`, the Lead
  Developer accepted the glitch for now, since real paper bends to let
  two parts pass; the measurements and the fix are a research agent's,
  from the same day.
