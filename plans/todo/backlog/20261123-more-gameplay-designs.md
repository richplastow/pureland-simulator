---
title: More playable Gameplay designs
description: Adds designs to Gameplay Mode that make good mazes, each judged by its graph's figures before it is built for the page, since Basic Gameplay Mode has only two.
type: backlog
---

## Problem

Basic Gameplay Mode offers four designs
([Plan 22, Decision 1](../22-gameplay-graph.md#decisions)), and only two
of them are mazes: the blintz and the yacht are lessons with no wrong
press, Mount Fuji has two traps, and the paper dart alone is a full
maze. A player finishes all four in a few minutes. The
[Gameplay Mode research](../14-gameplay-mode-research.md#designs-in-scope)
already expects more playable designs to be picked.

## Current position

The pencil and the heart were left out of Gameplay Mode, measured on
2026-11-23: every one of the pencil's 39 dead ends arrives at its last
fold, up to five folds after the mistake, and the heart's eleven folds
have 2,268 orders and no trap. Nothing replaced them, to keep the first
version small. It should not last: two mazes are a demonstration, not a
game.

## Recommended fix: pick designs by their graph's figures, then build them

A design's maze can be measured before its page work is done: once its
folds are written as a design file, buildGraph() over its sheet gives
its states, traps and dead ends in milliseconds, as
[Plan 22](../22-gameplay-graph.md) measures the first four. A good
maze, by the paper dart's example, has five to eight folds, traps at
several states, and every trap's nearest dead end within two further
folds, so a mistake is felt while it can still be remembered.

The untried candidates are the simple-fold designs of the
[design research's shortlist](../../done/07-design-research.md#the-shortlist):
the rice ball and the rocket (seven folds each), the penguin (seven),
the cicada and the cat face (nine each), and the fox face (four). Not
verified: any candidate's figures, which need its folds written first;
and whether a design that ends an odd number of turn-overs from its
start, showing its back, needs a closing turn in Gameplay Mode, which
the research left open.

## Other options

- **Plain lines on the yacht and the heart**: a choice of direction
  makes every fold a decision
  ([the research](../14-gameplay-mode-research.md#plain-lines-and-a-choice-of-direction)),
  which would turn both into puzzles without a new design.
- **Bring the pencil back with a kinder report**, saying at its dead
  end how far back the wrong turn was, which the research
  [considered and set aside](../14-gameplay-mode-briefs.md#q12).
- **Invent designs for the maze**, rather than adapt traditional ones:
  free of a source's limits, but each needs a model worth finishing.

## When to pick it up

- After [Plan 25](../25-gameplay-game.md) is done, so candidates can be
  played, not only measured.
- When the four designs feel too few in play.

## Audit

- **2026-11-23T12:49:10Z** — **raised**: while drafting Plans 22 to 25,
  where the agent, asked by the Lead Developer to choose between
  cutting weak designs and finding better ones, cut the pencil and the
  heart for the first version.
