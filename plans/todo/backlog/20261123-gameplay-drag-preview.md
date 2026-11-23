---
title: A drag preview of a fold in Gameplay Mode
description: Lets a mouse drag from a lit Fold Line fold the paper live in Gameplay Mode, as in Sandbox Mode, settling at the design's own angle on release, which Basic Gameplay Mode leaves out.
type: backlog
---

## Problem

The Gameplay Mode research rules that a mouse drag from a lit Fold
Line works in Gameplay Mode as it does in Sandbox Mode: the paper
folds live, following the pointer, and returning to the line cancels;
but it is only a preview, and any other release settles at the
design's own angle, so the game never judges an angle
([Fold Buttons](../14-gameplay-mode-research.md#fold-buttons),
[Q10](../14-gameplay-mode-briefs.md#q10)). One gesture would then work
in both modes.

## Current position

Basic Gameplay Mode folds only by a press
([Plan 24, Decision 6](../24-gameplay-folds.md#decisions)): every fold,
the paper dart's 90° wings included, is made by one press of a Fold
Button or a click on its lit line, and nothing folds live. A mouse
press on a lit line that moves and is released on that line counts as
a click; released elsewhere it does nothing. That kept the first
version small, and made a fold short of flat no different from any
other. It leaves a player who learned the drag in Sandbox Mode with a
gesture that does nothing in the game.

## Recommended fix: reuse the Sandbox's live fold over the design's fold

Sandbox Mode's live fold
([Plan 19](../../done/19-fold-angle.md)) cuts the session with the
picked line folded a half turn and poses it at the pointer's angle. In
Gameplay Mode the same code would cut the game's path with the picked
fold, through cutPath(), and a release anywhere but the line would
settle at the fold's `targetRadians` and then make the fold, as a
press does. Not verified: how much of the live fold in `main.js`,
which reads a lattice line and its sweep limits, generalises to a
design's fold with its own layers; and which of two folds that share a
line, the dart's wings, a drag from that line folds.

## Other options

- **Never**: the press alone is simple, and works on every pointer.
- **With a choice of direction**: once plain lines arrive
  ([the research](../14-gameplay-mode-research.md#plain-lines-and-a-choice-of-direction)),
  the side of the line dragged to could choose the direction, as it
  does in Sandbox Mode, which gives the drag a job a press cannot do.

## When to pick it up

- After [Plan 25](../25-gameplay-game.md) is done.
- With the plan that brings plain lines and a choice of direction to
  Gameplay Mode, if the drag is to choose the direction.

## Audit

- **2026-11-23T12:49:10Z** — **raised**: while drafting Plan 24, where
  the Lead Developer asked that folds short of flat be made by a press
  alone in this batch, with no dragging to an angle.
