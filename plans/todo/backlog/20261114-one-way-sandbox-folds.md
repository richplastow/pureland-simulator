---
title: One-way folds in Sandbox Mode
description: Guided Sandbox patterns that fix some lines as a mountain or a valley, each showing one Fold Button, between free folding and Gameplay Mode.
type: backlog
---

## Problem

Basic Sandbox Mode prints its patterns as plain lines, and every line
folds either way, so each picked line shows two Fold Buttons, a mountain
and a valley
([Fold Buttons](../13-sandbox-mode-research.md#fold-buttons)). A pattern
could instead fix some lines' directions, as an origami crease pattern
does, and show one Fold Button there: a guided Sandbox, folding with a
hand to follow but no score, halfway to Gameplay Mode.

## Current position

Every Sandbox line folds either way, and pattern data has no direction
per line. Nothing forces a direction today: the fold engine stacks moved
paper above for a valley and below for a mountain, and never checks that
paper passes through paper, so a one-way line would be a design choice,
not physics. No pattern needs one yet, so it was left out of the first
Sandbox plans.

## Recommended fix: a direction per line in pattern data, after Gameplay Mode

Once Gameplay Mode has built one-way Fold Buttons and typed printing
([Gameplay Mode research](../14-gameplay-mode-research.md#fold-buttons)),
a guided pattern costs only its data: an optional mountain or valley per
lattice line, printed with its dash pattern and offered by its one Fold
Button. Not verified: whether a lattice line that paper later carries
elsewhere keeps its type, which the reflections in
[the closure argument](../13-sandbox-mode-research.md#why-the-pattern-must-be-closed-under-its-own-reflections)
suggest it must, flipped when its layer is turned over.

## Other options

- **Build it with the first Sandbox plans**: brings single Fold Buttons
  and typed printing forward, before any pattern needs them.
- **Never**: Gameplay Mode covers guided folding, with a score.

## When to pick it up

- After Gameplay Mode's Fold Buttons and typed printing are built.
- When a guided pattern is wanted, such as a crease pattern to explore
  without a score, or a Sandbox tutorial.

## Audit

- **2026-11-14T12:14:25Z** — **raised**: from the Sandbox Mode research's
  open questions, where the Lead Developer ruled one-way Sandbox folds out
  for now.
