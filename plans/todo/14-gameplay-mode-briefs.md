---
title: Gameplay Mode, Fast Fold and fold angle briefs, 16 to 18 November 2026
description: The twenty briefs put to the Lead Developer via /feed-me on Plan 14's open questions and the decisions Plans 18 and 19 raised, each with its background, options, recommendation and the answer given.
type: note
---

# Gameplay Mode, Fast Fold and fold angle briefs, 16 to 18 November 2026

These are the twenty briefs put to the Lead Developer via /feed-me on
[Plan 14's open questions](./14-gameplay-mode-research.md#open-questions)
and on the decisions that
[Plan 18](../done/18-fast-fold.md#decisions) and
[Plan 19](../done/19-fold-angle.md#decisions) raised along the way. Each is
kept as it was given, so the reasoning survives beside the rulings, which
are folded into the plans themselves. Two briefs were followed by a
narrower question when the answer left a detail open; those follow-ups
sit under their brief. "Row N" in a brief means question N of this list,
and links point at the plans as they stood when the brief was written.

## Contents

| Q | Answer | Recorded in |
| --- | --- | --- |
| [Q1](#q1) | A: both places updated to the arrangement by slant | [Plan 14](./14-gameplay-mode-research.md#5-fold-buttons-as-dom-buttons-over-the-canvas) |
| [Q2](#q2) | A: steep lines slide up or down by screen half | [Plan 18, Decision 16](../done/18-fast-fold.md#decisions) |
| [Q3](#q3) | B: other pairs give way; no room of its own, a click activates | [Plan 18, Decision 17](../done/18-fast-fold.md#decisions) |
| [Q4](#q4) | A: the lit line's pair counts; the furthest fades | [Plan 18, Decision 17](../done/18-fast-fold.md#decisions) |
| [Q5](#q5) | Own answer: the pick is put away on blur, restored on return | [Plan 18, Decision 8](../done/18-fast-fold.md#decisions) |
| [Q6](#q6) | A: an unplaced line shows its own pair; neighbours fade | [Plan 18, Decision 14](../done/18-fast-fold.md#decisions) |
| [Q7](#q7) | A: finished means the design's own stacking | [Plan 14](./14-gameplay-mode-research.md#results) |
| [Q8](#q8) | Own answer: a touch drag always orbits; then B, a 10 px touch allowance | [Plan 18, Decision 1](../done/18-fast-fold.md#decisions) |
| [Q9](#q9) | Own answer: side sets direction, distance sets angle; then B, snap on release | [Plan 19, Decisions 1 and 2](../done/19-fold-angle.md#decisions), [Plan 20](../done/20-export-design.md) |
| [Q10](#q10) | C: a mouse drag previews, then settles at the design's angle | [Plan 14](./14-gameplay-mode-research.md#fold-buttons) |
| [Q11](#q11) | A: each fold named in the design data, announced on pick | [Plan 14](./14-gameplay-mode-research.md#7-the-toolbar) |
| [Q12](#q12) | A: reported like any other dead end; better designs expected | [Plan 14](./14-gameplay-mode-research.md#6-the-game-layer) |
| [Q13](#q13) | B, with some plain lines on some designs | [Plan 14](./14-gameplay-mode-research.md#plain-lines-and-a-choice-of-direction) |
| [Q14](#q14) | B: a wrong-direction fold is a dead end at once | [Plan 14](./14-gameplay-mode-research.md#6-the-game-layer) |
| [Q15](#q15) | A: lives, points and hints all per design | [Plan 14](./14-gameplay-mode-research.md#6-the-game-layer) |
| [Q16](#q16) | A: the ghost preview dropped | [Plan 19, Context](../done/19-fold-angle.md#context) |
| [Q17](#q17) | B: each side's reach fixed at the press | [Plan 19, Decision 1](../done/19-fold-angle.md#decisions) |
| [Q18](#q18) | A: no readout; the paper alone shows the angle | [Plan 19, Decision 3](../done/19-fold-angle.md#decisions) |
| [Q19](#q19) | B: Shift+Up and Shift+Down move the angle live, Enter folds | [Plan 19, Decision 6](../done/19-fold-angle.md#decisions) |
| [Q20](#q20) | C: mouse and keyboard only; step buttons deferred | [Plan 19, Decision 7](../done/19-fold-angle.md#decisions), [backlog](./backlog/20261118-single-pointer-fold-angle.md) |

## Q1

**Should the Gameplay Mode research stop saying a plain line's two Fold Buttons
sit "side by side"?** (put on 2026-11-16)

**Background.**
- [14-gameplay-mode-research.md](./14-gameplay-mode-research.md) is the
  reference for Gameplay Mode's future plans. It isn't a plan itself. Gameplay
  Mode may print some lines plain, so the player chooses the direction as well
  as the order. That choice is still open (row 13).
- It describes a plain line's two buttons in two places, and both now contradict
  Plan 18:
  - **Your brief**, [Plain lines and a choice of
    direction](./14-gameplay-mode-research.md#plain-lines-and-a-choice-of-direction):
    each line "would then carry two Fold Buttons side by side". The brief is
    your notes from 2026-11-11, reworded. One earlier ruling has already been
    written into it (Fold Buttons, 2026-11-12), so it has been edited after the
    fact before.
  - **The outline**, [§5 Fold Buttons as DOM
    buttons](./14-gameplay-mode-research.md#5-fold-buttons-as-dom-buttons-over-the-canvas):
    "the two buttons of a fold sit either side of the anchor along the line, … a
    button's width apart". That puts both buttons on the line itself, one after
    the other, so the line doesn't run between them.
- Plan 18 now rules the opposite, for every mode:
  - The pair straddles its line: stacked on lines within 45° of horizontal, side
    by side on steeper ones (Decision 15).
  - With a mouse in Fast Fold, each side of the line stands in for its button
    (Decision 17).
  - A line that folds one way gets one button, centred on it (Decision 18).
- Plan 14's other statements still hold. One button per one-way fold and two
  with a choice is unchanged, and so is the measurement that every anchor needs
  room for two buttons.
- **Why it matters now:** nothing is blocked. But whoever drafts Gameplay plan 2
  will start from Plan 14, and Plan 18 will have moved to `plans/done/` by then.
  Uncorrected, the old layout could come back in.

**Options.**
- **A. Update both places.** Rewrite the brief's sentence and §5's placement
  sentence to match the arrangement by slant. Add one sentence to §5 linking
  Plan 18's Decisions 15, 17 and 18, so the proxy and the single-button rule are
  on record where Gameplay planning starts. Log it in Plan 14's Audit. Cost: a
  few lines, and your brief's wording changes.
- **B. Update §5 only.** Correct the outline and add the link, but leave your
  brief in your words with "side by side". Cost: the brief and the outline
  disagree, and a reader has to know that the outline is newer.
- **C. Leave Plan 14 as it is.** The Gameplay plan reconciles it with Plan 18
  when it's drafted. Cost: nothing now. The risk is the old layout being copied
  in.

**Recommendation: A.** The brief has been updated by a ruling once before, and
one consistent reference is cheaper than relying on whoever drafts plan 2 to
spot the conflict.

**Answer** (2026-11-16):

> A

## Q2

**On a steep line, which way should Slow Fold's pair slide from the click?**
(put on 2026-11-16)

**Background.**
- **What this is:** in Slow Fold, clicking a line shows its pair of Fold
  Buttons. Plan 18 moves that pair from 28 px above the click onto the line
  itself, slid along the line until it is 40 px clear of the pointer (Decision
  16).
- **Your rule:** slide left for a click on the left half of the window, right
  for the right half. That moves the pair towards the nearer edge, away from the
  middle of the paper, where most lines cross.
- **Why steep lines need their own rule:** on a near-vertical line, sliding
  "left" barely moves the pair sideways at all. The pair ends up above or below
  the click, decided by which way the line leans, not by where you clicked. On
  an exactly vertical line, "left" doesn't exist.
- **What I wrote, marked as inferred:** the same rule turned a quarter. On a
  steep line, slide up for a click on the upper half and down for the lower
  half. If there's no room that way, try the other way. If there's no room
  either way, the pair is pulled into the window over the click.
- **One wrinkle:** the toolbar sits at the bottom of the window, and pairs avoid
  it. A click low on a steep line will often have no room below, and so get its
  pair above the click.
- **Why it matters now:** this sets the placement code and Manual QA 4's
  expectation in Plan 18, so it's needed before Plan 18 is implemented.

**Options.**
- **A. Turn the rule a quarter, as written.** Shallow lines go left or right by
  the half of the window clicked; steep lines go up or down by the half clicked.
  It's predictable, and the pair always moves towards the nearer edge along the
  line's main direction.
- **B. Keep left/right on every line.** On a steep line, slide whichever way
  along it heads left (left half) or right (right half), and go up on an exactly
  vertical line. It's one rule as you stated it, but whether the pair lands
  above or below the click depends on the line's lean, which is hard to predict.
- **C. Always slide up on a steep line**, whatever the half. Up is never blocked
  by the toolbar, and the pair never sits under the hand on a phone. But it
  ignores the "nearer edge" idea for steep lines.

**Recommendation: A.** It keeps your "towards the nearer edge" intent on every
line, and the fallback already deals with the toolbar.

**Answer** (2026-11-16):

> A

## Q3

**When the hovered line has no room for its pair, what should a mouse click on
it do in Fast Fold?** (put on 2026-11-16)

**Background.**
- **What this is:** in Fast Fold with a mouse, each side of a lit line stands in
  for the button on that side (Plan 18, Decision 17). That only works while the
  line's pair is showing, because the hovered button is what you see before you
  click.
- **How a pair is placed:** the nearby layout puts it on its own line, inside
  the window, clear of the toolbar, 12 px clear of other shown pairs, and with
  its box 40 px clear of the pointer.
- **When there's no room:** the commonest case is a short line. Its box must
  clear the pointer by 40 px and is itself 36 px from centre to end, so the line
  needs about 76 px on one side of the pointer. On a desktop that's about 22 mm
  of paper, and small flaps late in a fold sequence are often shorter. The other
  cases are a line mostly off-screen or beside the toolbar, and a line crowded
  by pairs already shown on nearby lines.
- **What I wrote, marked as inferred:** with no room, the proxy doesn't work for
  that line. A click activates the line as in Slow Fold: every Fast Fold pair
  fades and the line's own pair appears beside the click.
- **Why it matters now:** it sets how the hover and click code branch in Plan
  18, so it's needed before Plan 18 is implemented.

**Options.**
- **A. As written.** No room means no proxy, and a click activates the line.
  It's safe, because nothing folds without a button on screen. The cost is that
  the expert's one-click fold quietly becomes two clicks on short lines, often
  late in a model, just when the lines get short.
- **B. Clear other pairs out of the way first, then A.** The hovered line's pair
  ignores pairs shown on other lines, and any pair it would overlap fades. Only
  a line with no room of its own (too short, off-screen or beside the toolbar)
  falls back to A. The crowded case then works, at the cost of a few extra fades
  near the pointer.
- **C. Let the proxy fold with no button shown.** A click on either side folds
  that way, with no hover cue and no bump. One click always works, but nothing
  confirms the direction before the paper moves.

**Recommendation: B.** The line under the pointer is the one being aimed at, so
the pairs on other lines should give way to it. Keeping A's fallback means
nothing ever folds without a button on screen.

**Answer** (2026-11-16):

> B

## Q4

**When the hovered line has no pair yet and three pairs already show, which pair
makes way?** (put on 2026-11-16)

**Background.**
- **The nearby layout** (Fast Fold with a mouse, Plan 18, Decision 12) shows up
  to three pairs near the pointer, on the nearest lines within 120 px. A shown
  pair never moves, and it fades once the pointer is more than 200 px from it.
- **Why the hovered line can miss out:** the stand-in sides need the hovered
  line's own pair on screen. But the pointer can reach a line while three pairs
  already show on lines it passed earlier, all still within 200 px.
- **What I wrote, marked as inferred:** the hovered line's pair is placed before
  any other, and if three already show, the one furthest from the pointer fades.
  Q3's ruling adds that any pair it would crowd also fades.
- **Why it matters now:** it sets the nearby layout's update order in Plan 18,
  so it's needed before Plan 18 is implemented.

**Options.**
- **A. As written.** The hovered line's pair counts towards the three, and the
  furthest pair makes way. The cap stays at three, and the pair that goes is the
  one least likely to be wanted next.
- **B. Don't count the hovered line's pair.** Up to four pairs show while a line
  is hovered, and none fades just to make room. The cost is a busier scene near
  the pointer, and the cap no longer means what it says.
- **C. Show only the hovered line's pair.** Hovering a line fades every other
  pair, and they return once the pointer leaves it. It's the cleanest view, but
  moving the pointer across the paper lights one line after another, so pairs
  would fade in and out constantly.

**Recommendation: A.** It keeps three as a real limit, and dropping the furthest
pair matches the layout's existing rule of fading pairs by distance.

**Answer** (2026-11-16):

> A

## Q5

**Should a line picked with the arrow keys be let go when focus leaves the
paper?** (put on 2026-11-16)

**Background.**
- **The keyboard route:** with the paper (the canvas) focused, Left and Right
  pick a line, and its pair of Fold Buttons appears, drawn as if hovered. Up
  folds it mountain and Down valley (Plan 18, Decisions 7 and 8).
- **What changes in Plan 18:** today, Tab moves from the paper into the Valley
  and Mountain buttons. Plan 18 takes them out of the Tab order, so Tab now goes
  straight to the mode radios, and the keyboard can no longer reach the pair
  once focus has left the paper.
- **Today's code** does nothing when the paper loses focus. A pick stays until
  Escape, a click elsewhere or a fold.
- **What the plan says, marked as inferred when drafted:** clear a keyboard pick
  when the paper loses focus, so the pair shrinks back and fades. Manual QA 8
  expects this.
- **A catch I found while checking:** a mouse press on one of the pair's buttons
  also takes focus from the paper, and that happens on the press, before the
  click lands. Clearing on that would hide the pair under the pointer, and the
  click would fold nothing. Safari makes this worse: it doesn't focus a button
  when it's clicked, so focus simply leaves the paper.
- **Why it matters now:** this is part of Plan 18's keyboard step.

**Options.**
- **A. Clear on focus loss, except for a press on the pair.** Tab away, or a
  click on the toolbar, lets the line go. A pointer press that lands on the pair
  keeps it until the click. It's tidy: what's lit always belongs to whatever has
  focus. The cost is one guard in the code.
- **B. Keep the pick when focus leaves.** The pair stays until Escape, a click
  elsewhere or a fold. Tabbing to a swatch and back keeps the line, and Up and
  Down still work on return. The cost is a pair left drawn as hovered while
  focus is in the toolbar, with no focus ring to say why. Manual QA 8 would
  change.
- **C. Clear on focus loss with no exception.** It's the simplest code, but
  clicking the keyboard's pair with a mouse would fold nothing.

**Recommendation: A.** It keeps the plan's behaviour and Manual QA 8 as they
are, and the guard fixes the one case where clearing would break a click.

**Answer** (2026-11-16):

> When focus leaves, the Fold Line should no longer be thick and the Fold
> Buttons should fade away. But when focus returns, that same Fold Line should
> transition thick again, and the same Fold Buttons should fade in. In other
> words, the paper restores whichever Fold Line had focus last.

## Q6

**In Fast Fold with no mouse, what shows when the arrow keys pick a line that
has no pair in the layout?** (put on 2026-11-16)

**Background.**
- **The touch layout** is what Fast Fold shows until a mouse is detected (Plan
  18, Decision 11). It gives a pair to as many lines as fit, longest first, with
  no two pairs overlapping. A short line, or one crowded by others, gets none.
- **The keyboard in this layout** (Decision 14): Left and Right leave the layout
  in place and mark the picked line's pair as hovered.
- **The gap, marked as inferred when drafted:** a line with no pair placed shows
  its own Slow Fold pair over the middle of its longest span, arranged by its
  slant. Any layout pairs it would overlap fade until the next layout.
- **Who meets this:** a player using only a keyboard, or a tablet with a
  keyboard but no trackpad. A trackpad counts as a mouse.
- **Why it matters now:** it's part of Plan 18's Fast Fold step, and Manual QA
  11 tests the keyboard in the touch layout.

**Options.**
- **A. As written.** Every line can be reached and folded with Up or Down. The
  layout stays put apart from the few pairs that fade to make room. The cost is
  a small, local change in the scene for the lines that missed out.
- **B. Redo the layout with the picked line first.** It always gets a pair, and
  the rest are placed around it. The scene stays tidy, but pairs can move around
  the paper on every Left or Right press.
- **C. Let Left and Right reach only lines that have a pair.** The keyboard
  follows the layout exactly. The cost: some lines can't be reached by keyboard
  while Fast Fold is ticked, a gap in keyboard access, unless the player unticks
  Fast Fold.

**Recommendation: A.** It keeps every line reachable without shuffling the
layout, and only pairs right beside the picked line are disturbed.

**Answer** (2026-11-16):

> A

## Q7

**Should a paper dart that ends with its flaps stacked the other way count as
finished?** (put on 2026-11-16)

**Background.**
- **The goal test:** Gameplay Mode decides a design is finished by comparing the
  paper with that design's final state. As measured, that compares where each
  piece of paper lies and which layer it's on, so stacking order counts.
- **What the measurements found**
  ([Results](./14-gameplay-mode-research.md#results)): with no availability rule
  at all, 35 fold orders reach the dart's final shape. Only 22 of them reach its
  final stacking. The other 13 fold the sheet in half first, then fold both
  corners through two layers, and end with the flaps stacked as a mirror image.
- **Why that can't happen today:** the agreed working rule (2026-11-11) only
  allows a fold whose creases all lie on the lines printed for it. Folding in
  half first is then a trap: the corner fold afterwards creases the other layer,
  where that crease is printed for the other corner. So the 13 mirror orders are
  already unreachable.
- **So the question is moot unless that rule is ever loosened.** It decides how
  strict Gameplay plan 1's goal test is written, which is its real deadline.

**Options.**
- **A. No: finished means the design's own stacking.** The goal test compares
  places and layers, as measured. It's the simplest test, and it matches what
  Presentation Mode folds. If the printed-crease rule were ever loosened, a
  mirror-stacked dart would be a dead end.
- **B. Yes: the shape is enough.** The goal test compares places only, so a
  mirror-stacked dart counts as finished. It changes nothing under today's rule,
  but it's more forgiving if the rule is ever loosened. The cost is a second,
  weaker notion of "same state" beside the one the live graph uses.
- **C. Hold.** Record it as moot under the printed-crease rule, to be raised
  again only if that rule is loosened. Gameplay plan 1 writes the strict test
  for now.

**Recommendation: A.** It costs nothing under today's rule, keeps one definition
of "same state" for the whole game, and settles the question rather than leaving
it open.

**Answer** (2026-11-16):

> A

## Q8

**On a touch screen, should a drag that starts on a Fold Line turn the paper?**
(put on 2026-11-17)

**Background.**
- **The fault Plan 18 fixes:** in Plan 17, a click on a line that moved more
  than 4 px before release became an orbit (turning the paper), so the click
  folded nothing. That's one of the three suspected causes of the clicks that
  sometimes fail.
- **Plan 18's fix (Decision 1):** a press on a lit line belongs to the line from
  the moment it goes down. It never orbits, however far it moves. That covers
  touch too.
- **What touch is like:**
  - There's no hover, so nothing lights before the finger lands, and the player
    can't see where a line's touch area ends. It reaches about 12 px either side
    of a line on a phone.
  - A drag that happens to start near a line would turn nothing, which feels
    broken.
  - Orbiting still works from bare paper between lines and from the background
    around the paper.
  - Fingers wobble more than a mouse. The 4 px allowance before a press counts
    as a drag is a mouse-sized figure.
- **Plan 19:** its drag to an angle is on a Fold Button, which is a separate
  element, so this choice doesn't affect it. Q9 deals with the mismatch between
  Plans 18 and 19.
- **Gate:** Plan 18's Open question 1, due 2026-11-18 at its review.

**Options.**
- **A. Touch is claimed like the mouse (as written).** A tap on a line always
  picks it, however much the finger wobbles. A drag that starts on or near a
  line turns nothing, so orbits must start between lines or off the paper, and
  with no hover the player can't see where those gaps are.
- **B. Touch is claimed only if it ends as a tap.** A drag always orbits, from
  anywhere. A tap that wobbles more than 4 px becomes an orbit instead, which is
  Plan 17's failing tap, brought back for touch only.
- **C. B with a touch-sized allowance.** A drag always orbits. A touch counts as
  a tap until it moves more than a new `TOUCH_DRAG_THRESHOLD_PX = 10`, a first
  guess open to tuning, and the mouse keeps 4 px. Taps survive normal finger
  wobble. The cost is one more constant, and an orbit starts 10 px late on
  touch.

**Recommendation: C.** On touch, "a drag turns the paper" is what players
expect, and a larger allowance keeps taps reliable without claiming presses the
player can't see.

**Answer** (2026-11-17):

> On a touch screen, a drag that starts on a Fold Line will **never** turn the
> paper. Plan 19 will allow that kind of precise, fast, expert-mode interaction
> for mouse users only — a mouse is assumed to be more accurate, and the hover
> state is deemed necessary as part of the UX when
> dragging-to-choose-fold-angle.
>
> So what happens when a touchscreen finger starts on a Fold Line? I think,
> because this input method is inherently less accurate, and there is no obvious
> way of telling when you are inside or outside the wide Fold Line hitzone, that
> it should just simply start rotating (orbiting) the scene: the exact same
> behaviour as dragging **outside** of Fold Line hitzones. Therefore, for
> touchscreens, Fold Line hitzones are **only** used to detect taps. They have
> no special drag-start behaviour of their own.

### Follow-up

One detail is still ambiguous before I move on: **how far can a finger move and
still count as a tap?** Today every press, mouse or touch, has the same 4 px
allowance before it becomes a drag. Your ruling makes a touch drag orbit, so a
tap that wobbles past 4 px will now turn the paper instead of picking the line.
That's Plan 17's failing tap, kept for touch.

- **A. Keep 4 px for touch,** the same as everywhere else, as your "exact same
  behaviour" suggests.
- **B. Give touch its own allowance,** a new `TOUCH_DRAG_THRESHOLD_PX = 10` (a
  first guess, open to tuning), so normal finger wobble still counts as a tap.
  Orbits on touch start 10 px late; the mouse keeps 4 px.

I recommend **B**, since fingers wobble more than a mouse.

**Answer** (2026-11-17):

> B.
>
> Is 'physical screen size' available to the running code? A true and accurate
> absolute size, e.g. in mm? That would make more sense for an actual finger,
> because (as I understand it), a CSS pixel can be different sizes.

The question in this answer was answered before Q9 was put: no web API
reports a screen's physical size or density. CSS's `mm` and `in` are
defined from CSS pixels (1 in = 96 px), not measured, and a CSS pixel is
physically smaller on a phone, about 0.17 mm on an iPhone 12 Pro, so
10 px is about 1.7 mm there. The allowance therefore stays in CSS
pixels, with a real-phone check in Plan 18's Manual QA 13.

## Q9

**When a mouse drags from a lit Fold Line to choose an angle, what sets the
fold's direction?** (put on 2026-11-17)

**Background.**
- **What your last ruling settled:** Plan 19's drag to an angle starts from a
  lit line, with a mouse only, and relies on hover. Plan 18 already gets ready
  for it: a mouse press on a lit line belongs to the line from the moment it
  goes down and never orbits, however far it moves (Decision 1).
- **Plan 19 as written still describes the old design**, from 2026-11-14:
  - the drag is on a **Fold Button**, and the distance dragged in any direction
    sets the angle, 1.5° per pixel, snapped down to 15° steps;
  - a ring round the button shows the angle;
  - Up and Down step the angle on a focused button.
  It needs rewriting at its review whatever you rule here. On the old design,
  the button pressed set the direction.
- **What a line knows now:** every line on screen has a Mountain side and a
  Valley side, in every mode. They're the sides its pair's buttons sit on: above
  and below a shallow line, right and left of a steep one (Plan 18, Decision
  15). In Fast Fold, each side already stands in for its button on hover and
  click (Decision 17).
- **Why it matters now:** nothing in Plan 18 waits on it, but Plan 19's rewrite
  does.

**Options.**
- **A. The side pressed sets the direction.** Press on the Mountain side and
  drag, and it folds mountain at the angle the drag's length gives; the same on
  the Valley side. One rule then covers hover, click and drag, and the drag's
  length still sets the angle, as Plan 19 has it. The ring can sit round the
  button on that side.
- **B. The drag's direction sets it.** Drag towards the Mountain side for
  mountain, towards the Valley side for valley, with the distance as the angle.
  It feels like pulling a flap, but a drag that starts on one side and heads the
  other way needs its own rule, and small drags near the line become ambiguous.
- **C. Decide at Plan 19's review instead.** Nothing is recorded now, and the
  rewrite of Plan 19 starts from both options.

**Recommendation: A.** It reuses the sides the player has already learned from
hover and click, and keeps the drag's length for one job only, the angle.

**Answer** (2026-11-17):

> The angle should be precisely equivalent to the distance from the line.
>
> By dragging from near the line TO the line, the angle becomes zero.
>
> When a Mouse drag starts on the 'Mountain' side of the line, the angle rapidly
> transitions to a Mountain angle, based on the mouse distance away from the
> line. The user drags towards the viewport's nearest edge. 40px or less away
> from that edge, the angle should be 180 degrees mountain. If the user keeps
> dragging back again, and actually crosses the line into the 'Valley' side, the
> fold bends back the other way, and the angle reaches -180 degrees at 40px or
> less away from that nearest viewport edge (opposite the other).
>
> When such a mouse drag is released very close to the line (producing a fold of
> less than 4 degrees, say), I think that counts as the user wanting to cancel
> the fold — the paper should transition back to zero in that case. But for any
> other point in the viewport, including when releasing over the toolbar
> buttons, the paper will fold.

### Follow-up

One ambiguity in your ruling changes other plans: **snapping**. "Precisely
equivalent to the distance" reads as a continuous angle. But Plan 19's Decision
2 snaps to 15° steps, and Plan 20 exports each angle as a whole number of
twelfths of a half turn.

- **A. Continuous throughout.** The fold is made at exactly the angle released.
  Plan 20 must then export a decimal angle instead of a fraction, and two people
  can't easily repeat the same design.
- **B. Continuous while dragging, snapped on release.** The paper follows the
  pointer smoothly, then eases to the nearest 15° when you let go. Plan 20's
  fractions stand.
- **C. Snapped while dragging too.** The paper steps in 15° jumps as you drag.

I recommend **B**: the drag feels exact, and saved designs keep clean angles.

**Answer** (2026-11-17):

> B — and while 15 degrees is the current spec, we may decide to reduce it to 10
> or even 5, later.

## Q10

**In Gameplay Mode, what does a mouse drag from a Fold Line do?** (put on
2026-11-17)

**Background.**
- **The question as Plan 14 asked it** (open question 6) was about dragging a
  **Fold Button**. That premise has moved on. As of today's rulings, the
  Sandbox's angle drag starts from a lit **Fold Line**, mouse only, and folds
  the paper live:
  - the side of the line sets the direction;
  - the distance from the line sets the angle, 180° at 40 px inside the window's
    edge, snapped to 15° on release;
  - releasing below 4° cancels.
- **What Gameplay Mode's folds are:** each fold has its design's own angle, flat
  for almost every fold and 90° for the paper dart's wings. Any other angle
  can't reach the goal. A click on a Fold Button folds the design's angle (ruled
  2026-11-12).
- **Direction in Gameplay Mode:** a one-way line has a single Fold Button, and
  both sides of the line stand in for it (Plan 18, Decision 18). If plain lines
  are ruled in (row 13), the side would be the player's choice of direction, as
  in the Sandbox.
- **Why it matters now:** it doesn't block anything yet. It's needed before
  Gameplay plan 2, which brings Fold Buttons and folding into Gameplay Mode.

**Options.**
- **A. No drag.** A click folds the design's angle, and a drag from a line does
  nothing, or orbits. It's the simplest to build and explain, but the gesture
  learned in the Sandbox does nothing here.
- **B. Drag allowed, release angle judged.** The paper folds live, and the angle
  at release must match the design's, or it counts as a mistake. It adds
  angle-matching to the game, but only the dart's wings aren't flat, and that
  needs judging rules and feedback of its own.
- **C. Drag allowed as a live preview.** The paper follows the pointer as in the
  Sandbox, and returning to the line still cancels. Any other release always
  settles at the design's own angle. One gesture works in both modes, nothing
  can go wrong with the angle, and the game stays about order (and direction, if
  row 13 rules it in).

**Recommendation: C.** It keeps the Sandbox's gesture without adding an angle
puzzle that only the dart could pose.

**Answer** (2026-11-17):

> C

## Q11

**In Gameplay Mode, how should a screen reader name each fold without giving the
order away?** (put on 2026-11-17)

**Background.**
- **The question as Plan 14 asked it** (open question 4) was about "Fold Button
  labels". Two rulings have moved it on:
  - Fold Buttons show icons only, no words (2026-11-12), so there's no visible
    label to worry about.
  - Plan 18 takes the buttons out of the Tab order. The keyboard picks a line on
    the canvas with Left and Right, and folds it with Up and Down.
- **So the real question:** what does a screen reader hear when a line is
  picked, given that "Fold 3" would give the order away, since folds are
  numbered in the design's own order?
- **What the code does today:** each button's accessible name is just "Valley
  fold" or "Mountain fold". Nothing is announced when Left or Right picks a
  line: the page has no live region, the area a screen reader reads out when its
  text changes. So in the Sandbox today, a screen-reader user can't tell which
  line is picked. That gap exists already, Gameplay aside.
- **What the designs hold:** each fold is described only in code comments ("the
  tip", "the right corner"). There are no names as data.
- **Gate:** before Gameplay plan 2.

**Options.**
- **A. Name each fold in the design data.** Give each fold a short name ("tip",
  "right corner"), about 35 names across the five designs. A live region
  announces "Valley fold: right corner" when a line is picked. It's meaningful,
  stays the same however the paper is turned, and reveals nothing about order.
- **B. Describe the line by where it is on screen.** For example "Valley fold,
  upright line, left of centre", worked out from the geometry. It needs no new
  data, but it changes as the paper turns and gets vague when lines run
  parallel. It would also suit the Sandbox's unnamed grid lines.
- **C. Direction only, as the Sandbox does now.** Leave screen-reader play of
  Gameplay Mode to a backlog item. Nothing to build now, but a screen-reader
  user can't play the game.

**Recommendation: A.** Names are cheap, stable and say nothing about order.
Separately, the Sandbox's missing announcement is worth a backlog item using B,
since its grid lines have no names.

**Answer** (2026-11-17):

> A

## Q12

**When the pencil or Mount Fuji hits a dead end, should the game say more than
"no Fold Button left"?** (put on 2026-11-17)

**Background.**
- **What happens in these two designs:** the wrong turn comes early, but the
  dead end only shows at the very last fold. In the pencil, a common mistake is
  folding a side before both the tip and the body are in. The player can still
  make every remaining fold, and only after the sixth does the model look nearly
  right with one flap over the wrong neighbour. All 39 of the pencil's dead ends
  arrive at the sixth fold, and all of Mount Fuji's arrive at the fourth.
- **What the plan already does at any dead end:** the player loses a life and
  the fold that led there is blocked. Blocking then spreads back: a state whose
  every fold is blocked becomes a dead end too, at no extra life. So the player
  can Undo step by step until a fold is free again, but nothing tells them how
  far back the mistake was.
- **What the code knows:** the live graph (every state from which the finished
  model can still be reached) knows exactly where the player's path left it: the
  last state on the path that's still in the graph. No goal test exists in code
  yet. Plan 14 defines one as comparing each face's place and layer with the
  finished model's.
- **Gate:** before Gameplay plan 3 (the game).

**Options.**
- **A. Treat it like any other dead end.** No Fold Button left, a life lost and
  a short "Dead end" message. It costs nothing extra and keeps the maze pure,
  but it feels unfair: the model looks right, and the player has no clue that
  the mistake was four folds back.
- **B. Show the goal test's verdict.** Highlight the faces that are out of
  place, and name them using Q11's fold names, for example "Not quite: the left
  corner is under the right side". It's the most informative option, but it
  needs new work: a comparison of the dead-end state with the goal, and a way to
  highlight faces on the paper. It may also hint too strongly at which fold to
  change (inferred).
- **C. Say how far back the wrong turn was.** For example "Not quite: the wrong
  turn was 3 folds back". This comes straight from the live graph (the last live
  state on the path), so there's nothing new to compute or draw. It tells the
  player how far to undo without saying which fold to change. The hints from a
  doomed state (one the finished model can no longer be reached from) were
  already going to offer this, so at a last-fold dead end it would simply come
  free.

**Recommendation: C.** It turns the late surprise into something the player can
act on, costs almost nothing, and still leaves the puzzle for the player to
solve.

**Answer** (2026-11-17):

> A — I think we will pick better more playable origami designs for the
> Gameplay, at some future point.

## Q13

**Should Gameplay Mode print plain lines and make the player choose each fold's
direction?** (put on 2026-11-17)

**Background.**
- **Today's plan:** each fold line shows its Yoshizawa marking: dashes for a
  valley fold, dash-dot-dot for a mountain fold. Each line then gets one Fold
  Button, centred on the line, and with a mouse both sides of the line stand in
  for it (Plan 18, Decision 18). The puzzle is only the order of the folds.
- **With plain lines:** each line gets the Sandbox's pair of buttons instead,
  mountain and valley, so the player chooses the direction as well as the order.
  - The dashes would move onto the buttons' icons.
  - The Sandbox already draws plain lines and Fold Button pairs, so Gameplay can
    reuse both.
  - The yacht and the heart have no order traps, so this is the only way they
    become puzzles. Every available fold gains a trap, its wrong direction, so
    the yacht becomes 3 decisions and the heart 11.
- **The catch:** a wrong direction makes exactly the same creases as the right
  one, so no later fold is blocked by it. The mistake stays hidden until the
  last fold, unless the game reports it some other way, which is Q14. Q12's
  answer makes this matter less: more playable designs are expected later
  anyway.
- **Gate:** this sets how many buttons a fold has, so it must be settled before
  Gameplay plan 2.

**Options.**
- **A. In, from the start.** Plain lines and a pair per fold from Gameplay plan
  2. Every design is a puzzle from day one, but plan 2 is bigger, and Q14's
  direction feedback is needed before the game is fair.
- **B. In, but later.** Plan 2 ships with marked lines and one button per fold,
  so the order maze comes first. Plain lines and pairs arrive as Gameplay plan
  4, as Likely plans already sketches. It's a smaller first step, and the single
  button is already designed. The cost is that the yacht and heart are not
  puzzles until plan 4.
- **C. Out.** Lines keep their marks, and the puzzle is order alone. This is the
  simplest option, and Q14 falls away. The yacht and heart stay easy unless the
  more playable designs replace them.

**Recommendation: B.** It builds the order maze on the single-button design
that's already ruled, keeps plan 2 small, and keeps the direction challenge for
when the designs and Q14's feedback are ready. The other gameplay questions
don't depend on it.

**Answer** (2026-11-17):

> Yes B — with the option to add _some_ plain lines to _some_ designs, to make
> them more difficult and interesting.

## Q14

**When a player folds a plain line the wrong way, when should the game say so?**
(put on 2026-11-17)

**Background.**
- **Only plain lines are affected.** A marked line has one button, so it can't
  be folded the wrong way.
- **The code can't tell from the folds that follow.** A wrong direction makes
  the same creases as the right one, so every later fold stays available. Left
  alone, the mistake shows only at the last fold, as a dead end with no clue
  where it went wrong. Q12 ruled that this is how the pencil's late dead ends
  are reported.
- **The live graph can tell at once.** The live graph is every state from which
  the finished model can still be reached. A wrong-direction state isn't in it,
  and checking that is a cheap lookup.
- **What it means for the puzzle:** with *k* plain lines, reporting only at the
  end leaves up to 2^*k* combinations to sort out by Undo alone. Reporting at
  once turns each plain line into a single 50/50 choice.
- **How a dead end works now:** no Fold Button is left, a life is lost, a short
  message appears, and the edge (the fold that led there) is blocked.
- **Gate:** before Gameplay plan 4 (plain lines).

**Options.**
- **A. At once, and the game undoes it.** A buzz, a life lost, and the paper
  unfolds that fold by itself. It's the quickest for the player, but it adds a
  new kind of event that ordinary dead ends don't have.
- **B. At once, as a dead end.** A wrong-direction fold counts as a dead end the
  moment it's made: no Fold Button left, a life lost, the same short message,
  the edge blocked, and the player presses Undo. It reuses the dead-end
  machinery and Q12's "every dead end reported the same way", with one new rule.
  Order mistakes stay hidden, so the maze is still about order.
- **C. At the end.** No feedback until the last fold, which then dead-ends like
  the pencil's. It's the hardest and simplest option, but with several plain
  lines it becomes trial and error.

**Recommendation: B.** The player learns about a direction mistake straight
away, with no new kind of feedback and almost no new code.

**Answer** (2026-11-17):

> B

## Q15

**How should lives, points and hints work in Gameplay Mode's first version?**
(put on 2026-11-17)

**Background.**
- **The brief offers each of these as a "perhaps":**
  - **Lives:** a life is lost at each dead end.
  - **Hints:** power-ups, at most five slots, earned as the player progresses.
    Spending one highlights the right Fold Button to press next.
  - **Points:** scored in the current session. Unfold doesn't reset them.
- **What Plan 14 already proposes:**
  - Points are awarded only at the goal, from folds pressed against the minimum
    and lives kept. A score that rose on every correct press would show which
    folds are right and spoil the maze.
  - A hint pulses a Fold Button from a live state (one the finished model can
    still be reached from), or Undo from a doomed one.
- **Still open:** how many lives, how hints are earned, whether anything carries
  across designs, and what happens when lives run out.
- **One catch with earning hints "per run of correct folds":** awarding one
  would show the run was correct, much as rising points would.
- **Q12 matters here:** more playable designs are expected, and today two of the
  five (the yacht and the heart) aren't puzzles at all until plain lines arrive.
  Any balancing across designs would be tuned on a set that's going to change.
- **Gate:** before Gameplay plan 3.

**Options.**
- **A. Everything per design.** Each design starts with 3 lives and 1 hint (both
  named constants, to tune later). Points are scored at the goal. Running out of
  lives ends the attempt: a message, then the paper unfolds and the design
  starts afresh. Nothing carries across designs or survives a reload. It's
  simple, needs no balancing across designs, and suits a design set that will
  change. The cost is no long-run progress, so there's no reason to earn hint
  slots up to five.
- **B. Across the page session.** 3 lives, with hints earned one per design
  finished, up to five. Points add up across designs. Running out of lives is
  game over and resets all three. It's closer to the brief's power-ups, but it
  needs balancing across designs that aren't settled, and a reload still loses
  everything (no storage is planned).
- **C. Defer lives and points.** Plan 3 ships dead ends, blocking and hints
  only, with hints unlimited or on a cool-down. The scoring is designed once the
  more playable designs exist. It's the smallest plan 3, but it's less of a
  game, and the gameplay bar's lives and points wait.

**Recommendation: A.** It makes each design a complete little game now, keeps
every number a constant to tune, and leaves carrying things across designs for
when the design set is settled.

**Answer** (2026-11-17):

> A

## Q16

**Should Plan 19 drop the ghost preview, now that the paper itself folds live
during a drag?** (put on 2026-11-18)

**Background.**
- **What the ghost was:** a see-through copy of the paper, posed at the angle
  being dragged. On release, the real paper would then animate to that angle.
  It was designed for the old Plan 19, where you dragged a Fold Button and the
  paper stayed still until you let go. The ring round the button was then the
  only sign of the angle, and the ghost was a way to "fine-tune by eye"
  ([Sandbox research, Fold Buttons](./13-sandbox-mode-research.md#fold-buttons)).
- **The earlier ruling, 12 November:** leave the ghost out of the first angle
  plan, and add it later only if the ring alone proved hard to judge by. Plan
  19's Context said this, and its Manual QA 10 asked you to judge it, with the
  ghost as the "next backlog item" if the ring wasn't enough. Plan 21 also said
  the ghost isn't part of it.
- **What has changed since:** your Decision 1 ruling on 17 November makes the
  paper fold live as the pointer moves. The real paper now does what the ghost
  was for.
- **One gap the live fold leaves:** while you drag, the paper follows your exact
  angle. On release it eases to the nearest 15° (Decision 2). So during the drag
  you see, say, 82°, but you can't see the 90° it will settle at. A ghost could
  show that snapped angle beside the live paper. Q18 (the readout) may cover
  this more cheaply, with a number.
- **Why it matters now:** the review has to either rewrite or delete the ghost's
  lines in the Context and Manual QA 10.

**Options.**
- **A. Drop it.** Plan 19's Context says the live fold replaces the ghost.
  Manual QA 10 goes, and Plan 21's line about the ghost goes with it. No
  backlog item. If the snap ever surprises players, it can be raised as new
  work.
- **B. Keep it as a possible later item.** Manual QA 10 is rewritten to ask
  whether the live paper is enough to judge the angle where it will settle. If
  not, a backlog item follows for a ghost at the snapped angle. This costs one
  QA step and keeps an idea alive that Q18 may make unnecessary.

**Recommendation: A.** The live fold already shows the angle. The settle point
is a readout question, better answered in Q18 than by a second mesh.

**Answer** (2026-11-18):

> A

## Q17

**As a mouse drag moves away from a Fold Line, what fixes how far the pointer
must travel to reach 180°?** (put on 2026-11-18)

**Background.**
- **Your ruling, 17 November (Decision 1):** the angle is the pointer's distance
  from the line. It is 0° on the line and 180° at 40 px or less from "the
  viewport's nearest edge", with the Mountain side running to one edge and the
  Valley side to the other.
- **What the agent added, marked as inferred:** "nearest edge" means the edge
  you reach by going from the pointer at right angles to the line. The distance
  from the line to 40 px inside that edge, measured along that same path,
  counts as 180°. The agent recalculated this on every pointer move.
- **Where the inference goes wrong:** the result depends on the line's slant.
  For a horizontal or vertical line, the edge is always equally far away, so
  only the distance from the line matters. For a diagonal line, the path at
  right angles meets the viewport edge at different distances depending on
  where along the line the pointer is. Slide the pointer parallel to a diagonal
  line, keeping the same distance from it, and the angle still changes. That
  breaks "precisely equivalent to the distance from the line".
- **Other facts:**
  - Plan 18 already puts every line on screen and knows which side of it is
    Mountain and which is Valley (Decisions 15 and 17), so either option below
    can be built on what exists.
  - A line close to one edge leaves only a short run to 180° on that side, for
    example 30 px. That makes the drag touchy there under either option.
- **Why it matters now:** Step 1's pure function and its Agent QA tested the old
  fixed scale, where 120 px gave 180°. The review has to rewrite them to
  whichever rule you choose here.

**Options.**
- **A. Recalculate on every move, as the plan said.** Each pointer move finds
  the edge at right angles to the line through the pointer, and works out the
  angle from there. It follows the wording of the ruling. On diagonal lines the
  angle drifts as the pointer slides along the line.
- **B. Fix each side's scale at the press.** When the press goes down, measure
  from the press point at right angles to the line to 40 px inside the viewport
  edge, once on the Mountain side and once on the Valley side. Each side keeps
  that scale for the whole drag. From then on the angle depends only on the
  pointer's distance from the line, whatever the slant, and you still reach
  180° near the edge you're dragging towards. It costs two measurements per
  press and nothing per move.

**Recommendation: B.** It keeps your "precisely equivalent to the distance from
the line" true for every slant, and it's cheaper. The touchy short run near an
edge affects both options equally. Manual QA can judge it by eye.

**Answer** (2026-11-18):

> B

## Q18

**While a mouse drag folds the paper live, should anything else show the
angle?** (put on 2026-11-18)

**Background.**
- **What Decision 3 said:** a ring round the Fold Button being dragged. Its arc
  grows clockwise from the top, a full ring at 180°, with the angle in degrees
  inside it. It was designed when the drag was on a button and the paper didn't
  move until release.
- **What has changed:** under Decision 1, the drag now starts on the line
  itself, and no button is under the pointer to wrap a ring round. In Fast Fold
  the line's pair may be on screen nearby, but outside Fast Fold, pressing a lit
  line that isn't picked yet shows no buttons at all.
- **What the paper already shows, and what it doesn't:**
  - It shows the angle live, in 3D.
  - Perspective makes 80° and 90° hard to tell apart by eye.
  - It doesn't show where the fold will settle. Under Decision 2, release eases
    to the nearest 15° (Q16 named this gap).
  - The direction is clear from which way the flap moves.
- **Accessibility:** a mouse drag is a sighted, pointer-only action, so a screen
  reader needs no live readout during it. No live region exists in the app yet.
- **Why it matters now:** Decision 3, Step 2 and Manual QA 2 to 4 were all
  written around the ring. The review rewrites them to this ruling.

**Options.**
- **A. No readout.** The paper alone shows the angle, and the release reveals
  where it settles. This is the least to build. Exact angles such as a 90° wall
  then depend on judging the paper by eye, then undoing and trying again.
- **B. A small degree label by the pointer.** A pill near the cursor shows the
  angle the fold will settle at, such as "90°". It changes only when that
  snapped angle changes, and goes on release. There's no ring. It fills Q16's
  gap at the cost of one positioned element. Manual QA checks that it doesn't
  hide the flap.
- **C. A ring and label by the pointer.** As B, but with Decision 3's ring round
  the cursor as well. It shows the angle at a glance too, but repeats what the
  paper and the number already say, and puts more on screen right where you're
  looking.

**Recommendation: B.** The paper shows the angle, and the label shows the one
thing the paper can't, which is where the fold will settle. The ring would only
repeat both.

**Answer** (2026-11-18):

> A

## Q19

**How does the keyboard fold the active line to an angle short of flat?** (put
on 2026-11-18)

**Background.**
- **The keyboard today (Plan 18, Decision 7):** with the canvas focused, Left
  and Right move through the lines, lighting one as active. Up folds it
  mountain and Down folds it valley, both flat. The canvas declares those four
  keys to assistive technology. The Fold Buttons are out of the Tab order, so
  keyboard folding happens on the canvas alone.
- **What Plan 19's Decision 6 said:** Up and Down on a focused Fold Button step
  the angle, shown by the ring, and Enter folds. Both halves are gone: the
  buttons can't take focus, and Plan 18 gave Up and Down to the flat fold. The
  ring went in Q18.
- **Keys already in use:**
  - Cmd+Z and Cmd+Shift+Z (Ctrl+Y on Windows) undo and redo.
  - Escape belongs to the toolbar's show and hide toggle.
  - Nothing uses Shift with the arrows, or Enter on the canvas.
- **Why it matters:** the Web Content Accessibility Guidelines (WCAG) 2.2,
  criterion 2.1.1 Keyboard (level A, the base level), asks that everything a
  mouse can do, the keyboard can do. If angles are mouse only, the app falls
  short of that until a keyboard route arrives. Standing folds only come into
  play from this plan onwards, and Plan 21 builds on them.

**Options.**
- **A. Flat only from the keyboard for now.** No new keys. Angles are mouse only
  in this plan, with a backlog item for a keyboard route. This is the least to
  build, but it leaves a level A gap open, and Plan 21's standing folds would
  be mouse only too.
- **B. Shift+Up and Shift+Down move the angle live.** With a line active,
  Shift+Up moves the fold 15° towards mountain and Shift+Down 15° towards
  valley. This is the same single axis as the mouse drag, from 180° mountain
  through flat to 180° valley, and the paper folds live at each step. Enter
  folds at the angle shown, and stepping back to flat cancels, as dragging
  back to the line does. Plain Up and Down keep folding flat at once. It adds
  two key combinations to the canvas's declared shortcuts and one Manual QA
  step, and reuses the drag's live fold.
- **C. Number keys set the angle.** With a line active, 1 to 9 might fold to
  15° to 135°, for example. It's quick for experts, but it's hard to discover,
  gives no direction without an extra key, and breaks if the step later
  shrinks to 10° or 5°.

**Recommendation: B.** It mirrors the mouse drag step for step, so one live fold
serves both, and it closes the level A gap in this plan rather than leaving it
in the backlog.

**Answer** (2026-11-18):

> B

## Q20

**Can someone without a mouse drag still reach an angle, on a touch screen or
with any pointer that can't drag?** (put on 2026-11-18)

**Background.**
- **Who has no route today:**
  - **Touch users.** Your Q8 ruling (17 November) makes the angle drag mouse
    only, and a touch drag on a Fold Line always turns the paper. A tap picks
    the line, and its Fold Buttons fold flat.
  - **People who can point but not drag,** such as those using a head pointer
    or with a tremor.
  - Under Plan 19 as ruled, both groups can fold flat but never to an angle.
    They can't reach the standing folds that Plan 21 builds on either.
- **The standard:** WCAG 2.2, criterion 2.5.7 Dragging Movements (level AA),
  asks that anything done by dragging can also be done with single clicks or
  taps. W3C's guidance page (read 2026-11-18) says a keyboard equivalent "does
  not automatically meet this success criterion", so Q19's Shift and arrow
  keys don't cover it. Its examples include tapping to select an item and then
  using "adjacent controls" to move it, and step buttons beside a map.
- **The plan contradicted itself:** "Done when" promised an angle "from the
  mouse, a touch screen and the keyboard", and Manual QA 9 dragged a button
  with a finger. Both predated your Q8 ruling and had to change whichever
  option you chose.
- **What Q19 already built:** a live fold that moves 15° per step along one
  axis, from mountain through flat to valley, with Enter to fold. Any buttons
  for this could drive that same path.

**Options.**
- **A. Mouse and keyboard only, for good.** Touch and single-pointer users fold
  flat only. "Done when" and Manual QA 9 are corrected, and no backlog item is
  written. This is the least work. It leaves the level AA gap open
  permanently, and keeps standing folds out of reach on phones.
- **B. Step buttons in the sandbox bar, in this plan.** While a line is picked,
  the bar shows three more buttons: one stepping the fold towards mountain, one
  towards valley, and one confirming the fold. These are the touch equivalents
  of Shift+Up, Shift+Down and Enter, sharing their code path. This closes the
  gap and makes standing folds work on phones. It costs three icon buttons,
  room in the bar at phone width, a Manual QA step or two, and a somewhat
  bigger plan.
- **C. The same buttons, deferred.** Plan 19 states that angles are mouse and
  keyboard for now and corrects "Done when" and Manual QA 9. A dated backlog
  item records option B's design as the intended route, to be picked up before
  Gameplay Mode or with Plan 21. Plan 19 stays at its present size, and the gap
  is recorded rather than forgotten.

**Recommendation: B.** Q19's ruling already built the live step and confirm, so
the buttons are a thin layer on top. Without them, phones can't reach Plan 21's
standing folds at all. If you'd rather keep Plan 19 lean for its unattended
run, C is the safe second choice.

**Answer** (2026-11-18):

> C
