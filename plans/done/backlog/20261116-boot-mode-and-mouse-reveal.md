---
title: Boot mode, Fast Fold default and an early mouse reveal
description: Settles which mode the app starts in and whether Fast Fold starts ticked, and makes players reveal a mouse before any Fold Buttons show.
type: backlog
---

## Problem

Fast Fold picks its layout by whether a mouse has moved over the window
since load ([Plan 18](../../done/18-fast-fold.md)). A player with a mouse that
has not yet moved sees the touch layout, a Fold Button pair on every
line, which switches to the nearby layout on the first move.

## Current position

Plan 18 starts the app in Sandbox Mode with Fast Fold ticked, so the
Lead Developer can see the touch layout at load and the switch. That
shows a mouse user the wrong layout first.

## Recommended fix: show no Fold Buttons until the mouse has had a chance

Start where no Fold Buttons show at load, such as Presentation Mode or
an intro, so a mouse user moves the mouse, and is detected, before any
pair appears. Not verified: it depends on the final boot flow.

## Other options

- Wait a short while after load before showing the touch layout.
- Start with Fast Fold unticked.

## When to pick it up

In the app's final polish, or when Gameplay Mode settles the boot flow.

## Audit

- **2026-11-16T12:54:16Z** — **raised**: while drafting Plan 18, which
  boots into Sandbox Mode with Fast Fold ticked for its manual QA.
- **2026-11-24T15:38:26Z** — **done**: resolved by
  [Plan 24](../24-gameplay-folds.md), which shows the same buttons to
  every pointer in Gameplay Mode, after Plan 23 settled the boot mode.
