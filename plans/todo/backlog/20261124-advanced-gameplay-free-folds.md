---
title: Advanced Gameplay Mode, with free folds along any printed line
description: Lets a player fold along any straight printed line, choosing the side and layers, where Basic Gameplay Mode offers only the design's own folds under the printed rule; a hefty upgrade to the fold engine.
type: backlog
---

## Problem

Gameplay Mode turns a design into a maze: the player makes the design's
own folds in any order the paper allows, and a wrong order runs into a
dead end. Which folds the paper allows is set by the printed rule
([Plan 22, Decision 4](../../done/22-gameplay-graph.md#decisions), from
[working assumption 1](../14-gameplay-mode-research.md#working-assumptions)
of the research, agreed on 2026-11-11). A design fold *f* is available
when the engine makes it without a FoldRefusal, it makes at least one
crease, and every crease lies along the creases the design's own order
adds at *f*. The graph only ever tries the design's own folds, each
with its own layer selection. A printed line that no available design
fold creases along therefore carries no Fold Button.

On 24 November 2026, during manual QA of
[Plan 24](../../done/24-gameplay-folds.md) (folding in Gameplay Mode), the Lead
Developer saw a second straight printed line on the yacht's flat sheet,
with no Fold Button, and expected it to fold, into a dead end. A player
who sees a straight line on paper expects to fold along it.

## Why the yacht's second line has no button

A read-only research stage measured the cause the same day, over the
real engine.

- **Which line it is (Code, Measured).** It is the crease of fold 1,
  the "sail": one piece, from (0.075, 0.0129) to (−0.075, 0.075) on the
  sheet, from the diagonal's corner to the far edge.
- **Why no button offers it at node 0 (Code, Measured).** Two things
  stop it. The sail selects `{ movedBy: 0 }`, the flap the diagonal
  laid over, so layersAt() in `docs/src/gameplay/path.js` refuses it on
  the flat sheet before the printed rule is tested. And even with all
  layers selected, the sail's line, defined on the folded paper,
  creases (−0.0129, −0.075) to (−0.075, 0.075) on the flat sheet: the
  printed line's reflection across the diagonal, not the line seen.
- **No design fold lands on it (Measured).** No design fold, made
  early, creases along that line.
- **Not a code fault.** Step 5 of Plan 24's
  [Manual QA](../../done/24-gameplay-folds.md#manual-qa), "one button at a
  time", describes the printed rule faithfully; the yacht's graph has 4
  states and 3 edges.

The yacht is not alone. Straight printed lines with no button on each
flat sheet (Measured):

- **The blintz:** 0 of 4.
- **The yacht:** 1 of 2, the sail's.
- **Mount Fuji:** 2 of 4, two short corner lines: the slopes' third
  pieces, reflected across the middle fold.
- **The paper dart:** 9 of 15: the edges' mountain pieces, the left
  wing's four and the right wing's other three.

Over every node of the printed rule's graphs, as upper bounds: the
blintz 0, the yacht 4 (in 4 of 4 nodes), Mount Fuji 28 (13 of 15) and
the paper dart 345 (74 of 86).

## Three rules compared

The same stage built each design's graph under three availability rules
(Measured). "Printed" is Plan 22's rule. "Any" lets a fold through when
every crease lies along any fold's printed creases, not only its own.
"Loose" lets through any fold that makes a crease.

| Design | Rule | States | Live | Doomed | Dead ends | Traps | Orderings | Build | Flat buttons |
|---|---|---|---|---|---|---|---|---|---|
| Blintz | all three | 16 | 16 | 0 | 0 | 0 | 24 | 5–7 ms | 4 |
| Yacht | printed = any | 4 | 4 | 0 | 0 | 0 | 1 | 1 ms | 1 |
| | loose | 9 | 4 | 5 | 2 | 2 | 1 | 1 ms | 2 (diagonal, hull) |
| Fuji | printed = any | 15 | 7 | 8 | 3 | 2 | 4 | 4–6 ms | 2 |
| | loose | 51 | 7 | 44 | 15 | 6 | 4 | 12 ms | 4 |
| Dart | printed | 86 | 13 | 73 | 29 | 23 | 12 | 46 ms | 6 |
| | any = loose | 222 | 13 | 209 | 66 | 23 | 12 | 126 ms | 6 |

- "Any" changes nothing on the yacht or Mount Fuji, and equals "loose"
  on the paper dart, where 76 of its 269 edges fold a valley where only
  a mountain is printed, or the reverse.
- "Loose" gives the yacht a second flat button, for the hull, not for
  the line the Lead Developer saw.
- Faces passing through one another were not checked: the engine has
  no test for it (compare
  [the dart wing clash](./20261123-doomed-dart-wing-clash.md#problem)).

No rule over the design's own folds gives the button the Lead
Developer expected. Only a new kind of fold does.

## Current position

The Lead Developer, on 24 November 2026, on hearing the findings:

> OK makes sense — yes I remember that discussion about 'loose' folds
> etc, and I remember thinking it was hard to picture exactly how it
> would feel in the UI. So now I am presented with it really working,
> yes I agree we can call this 'Basic Gameplay', and that 'Advanced
> Gameplay' would be a fairly hefty upgrade to the fold-engine, adding
> fetures such as "free folds along any straight printed line".

So **Basic Gameplay Mode** (Plans 22 to 25) keeps the printed rule:
every Fold Button is a design fold, in the design's own layers, and a
printed line no available design fold creases along has no button.
Plan 24 and [Plan 25](../25-gameplay-game.md) go ahead as written. Free
folds are **Advanced Gameplay Mode**, for a later plan.

## Recommended fix: free folds, in a plan of their own

A new kind of fold, free along any straight printed line, with the
player choosing which side moves and which layers it carries. What the
research found about it:

- **Its states fall outside today's graph (Derived).** Plan 22's graph
  keys states and edges by design fold indices; a free fold is no
  design fold, so the states it reaches have no place in it.
- **It is not always a dead end (Measured).** Along the yacht's second
  line, on one choice of side, the diagonal still creases along printed
  lines afterwards.
- **A sheet can get crowded (Measured).** The flat paper dart could
  show up to 15 buttons, against its 6 today.

What Advanced Gameplay Mode would reopen (Derived):

- **[Plan 22](../../done/22-gameplay-graph.md#decisions):** Decision 4,
  the printed rule; Decision 6, two states as one, which compares the
  folds by their index in the design; Decision 8, an edge's Fold Line,
  taken from a design fold; and the Agent QA in its
  [Steps](../../done/22-gameplay-graph.md#steps).
- **[Plan 24](../../done/24-gameplay-folds.md#decisions):** Decision 1, each
  fold named in the design data; Decision 2, a game as its path;
  Decision 4, the Fold Lines at rest as the game's open edges; Decision
  5, one Fold Button per line; Decision 6, a press folding the design's
  fold at the design's angle; and steps 5, 8 and 9 of its
  [Manual QA](../../done/24-gameplay-folds.md#manual-qa).
- **[Plan 25](../25-gameplay-game.md#decisions):** its traps, hints and
  points for extra folds, all read off a graph of design folds.

What the plan must decide:

1. Which side of the line moves, and which layers move with it.
2. How a player chooses them in the UI.
3. How states are identified when the folds are not the design's.
4. How many buttons a crowded sheet can show, and what happens past
   that.

## Other options

- **The loose rule over the design's own folds.** Cheap, since the
  graph already tries every design fold, but it multiplies doomed
  states (the yacht 0 to 5, Mount Fuji 8 to 44, the paper dart 73 to
  209) and never gives the line the Lead Developer saw.
- **The "any" rule.** No change on the yacht or Mount Fuji; on the
  paper dart it equals loose, letting 76 edges fold against the printed
  direction.
- **Never.** The printed rule keeps each maze small and every button a
  step of the design; the player learns that a line with no button
  cannot be folded yet.

## When to pick it up

- After Plan 25 is done and Basic Gameplay Mode has been play-tested.
- When play-testing shows players expect every straight line to fold.
- With, or after, the plan that brings plain lines and a choice of
  direction
  ([the research](../14-gameplay-mode-research.md#plain-lines-and-a-choice-of-direction)),
  since both let the player choose more than the order.

## Audit

- **2026-11-24T14:31:18Z** — **raised**: during Plan 24's manual QA,
  the Lead Developer saw the yacht's second printed line with no Fold
  Button; a read-only research stage measured the cause and the three
  rules, and the Lead Developer agreed to keep the printed rule for
  Basic Gameplay Mode and treat free folds as Advanced Gameplay Mode.
