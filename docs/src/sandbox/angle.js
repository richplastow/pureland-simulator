/**
 * @fileoverview
 * The pure maths of folding a Fold Line to an angle: the angle a drag from
 * the line reaches, by its side and its distance from the line, the snap
 * to whole steps on release, and the ease of the live fold's angle and
 * centre towards where they are wanted.
 *
 * A line on screen is one as `docs/src/ui/fold-button-layout.js` defines
 * it, of which only `segments` is read: four numbers per fold span,
 * `x1, y1, x2, y2`, in CSS pixels from the viewport's top-left, all on one
 * straight line. An angle is signed: positive towards mountain, negative
 * towards valley, as the player sees the paper.
 */

import { sideOf } from "../ui/fold-button-layout.js";

// A release whose angle is under this folds nothing, whatever it snaps to,
// in radians: 4°. A first guess, open to retuning by eye.
export const CANCEL_RADIANS = (4 * Math.PI) / 180;

// How far inside the viewport's edge a drag reaches a half turn, in CSS
// pixels. A first guess, open to retuning by eye.
const EDGE_MARGIN_PX = 40;

// The time constant of the live fold's exponential ease, towards the angle
// and the centre wanted, in seconds. A first guess, open to retuning by
// feel.
const LIVE_FOLD_SECONDS = 0.05;

// The least reach a side of the line keeps, in CSS pixels, so a line near
// or beyond the viewport's edge still has room to fold. A first guess,
// open to retuning by eye.
const MIN_REACH_PX = 40;

// How near its target the live fold's centre lands on it, in metres: 1 µm.
// A first guess.
const SETTLE_METERS = 0.000001;

// How near its target the live fold's angle lands on it, in radians: about
// 0.06°.
const SETTLE_RADIANS = 0.001;

// The step a fold's angle snaps to on release, and the keyboard steps by,
// in radians: 15°. Nothing else assumes twelfths of a half turn, so it may
// shrink to 10° or 5°; it must divide a half turn whole.
export const SNAP_RADIANS = Math.PI / 12;

/** #### Returns the signed angle a drag from a line reaches at a point
 * - The side of the line the point is on, as sideOf() finds it, sets the
 *   sign: positive on the Mountain side, negative on the Valley side. A
 *   point on the line gives 0.
 * - The point's distance from the line, measured square to it, sets the
 *   size: 0 on the line, rising evenly to a half turn at that side's
 *   reach, and staying there beyond it. Sliding along the line changes
 *   nothing, whatever its slant.
 * - Allocates nothing, so it is safe on every pointer move.
 * - Pure maths, with no DOM or GPU access.
 * @param line The line on screen.
 * @param reaches Each side's reach, from reachesPx().
 * @param x The point's x, in CSS pixels.
 * @param y The point's y, in CSS pixels.
 * @returns The angle, in radians, from −π (valley) to π (mountain).
 */
export const dragAngleRadians = (line, reaches, x, y) => {
  const { segments } = line;
  const last = segments.length - 4;
  const dx = segments[last + 2] - segments[0];
  const dy = segments[last + 3] - segments[1];
  const distancePx =
    Math.abs(dx * (y - segments[1]) - dy * (x - segments[0])) /
    Math.hypot(dx, dy);
  const isMountain = sideOf(line, x, y) === "mountain";
  const reachPx = isMountain ? reaches.mountainPx : reaches.valleyPx;
  const radians = Math.PI * Math.min(distancePx / reachPx, 1);

  return isMountain ? radians : -radians;
};

/** #### Returns each side's reach for a drag pressed at a point on a line
 * - A side's reach runs from the line, along the square line through the
 *   press, to `EDGE_MARGIN_PX` inside the viewport's edge on that side,
 *   and is never less than `MIN_REACH_PX`, so a line near or beyond an
 *   edge still has room to fold.
 * - The Mountain side is the one sideOf() names: above a shallow line,
 *   right of a steep one.
 * - Allocates, so call it once, when the drag starts.
 * - Pure maths, with no DOM or GPU access.
 * @param line The line on screen.
 * @param viewport The viewport, `{ height, width }` in CSS pixels.
 * @param x The press's x, in CSS pixels.
 * @param y The press's y, in CSS pixels.
 * @returns `{ mountainPx, valleyPx }`, each side's reach, in CSS pixels.
 */
export const reachesPx = (line, viewport, x, y) => {
  const { segments } = line;
  const last = segments.length - 4;
  let dx = segments[last + 2] - segments[0];
  let dy = segments[last + 3] - segments[1];
  const lengthPx = Math.hypot(dx, dy);
  dx /= lengthPx;
  dy /= lengthPx;

  // Orient the line as sideOf() does, right on a shallow line and down on
  // a steep one, so the Mountain side lies along `(dy, −dx)`.
  const isSteepLine = Math.abs(dy) > Math.abs(dx);
  if ((isSteepLine && dy < 0) || (!isSteepLine && dx < 0)) {
    dx = -dx;
    dy = -dy;
  }

  // The foot of the press on the line.
  const along = (x - segments[0]) * dx + (y - segments[1]) * dy;
  const footX = segments[0] + along * dx;
  const footY = segments[1] + along * dy;

  return {
    mountainPx: reachFrom(footX, footY, dy, -dx, viewport),
    valleyPx: reachFrom(footX, footY, -dy, dx, viewport),
  };
};

/** #### Returns an angle snapped to the nearest whole step, from 0 to π
 * - Rounds to the nearest multiple of `SNAP_RADIANS`, clamped to 0 to a
 *   half turn, which it returns as exactly π, so a fold snapped there
 *   folds flat.
 * - Pure maths, with no DOM or GPU access.
 * @param radians The angle, in radians.
 * @returns The snapped angle, in radians.
 */
export const snapAngleRadians = (radians) => {
  const stepsPerHalfTurn = Math.round(Math.PI / SNAP_RADIANS);
  const steps = Math.round(radians / SNAP_RADIANS);
  if (steps <= 0) return 0;
  if (steps >= stepsPerHalfTurn) return Math.PI;

  return (steps * Math.PI) / stepsPerHalfTurn;
};

/** #### Eases the live fold's angle one frame towards the angle wanted
 * - Exponential, with a time constant of `LIVE_FOLD_SECONDS`, so the ease
 *   does not depend on the frame rate, and it lands exactly on the angle
 *   wanted once within `SETTLE_RADIANS` of it.
 * - A negative delta counts as zero, as in stepSequence().
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param deltaSeconds The time elapsed since the last frame, in seconds.
 * @param live The live fold, mutated: `radians`, the angle shown, and
 *   `targetRadians`, the angle wanted, both in radians.
 * @returns True if it changed `radians`.
 */
export const stepLiveAngle = (deltaSeconds, live) => {
  const { radians, targetRadians } = live;
  if (radians === targetRadians) return false;

  const next =
    targetRadians + (radians - targetRadians) * easeFactor(deltaSeconds);
  live.radians =
    Math.abs(targetRadians - next) <= SETTLE_RADIANS ? targetRadians : next;

  return live.radians !== radians;
};

/** #### Eases the live fold's centre one frame towards the centre wanted
 * - Exponential, as stepLiveAngle() eases the angle, with the same time
 *   constant, and lands exactly on the centre wanted once within
 *   `SETTLE_METERS` of it.
 * - A negative delta counts as zero.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param deltaSeconds The time elapsed since the last frame, in seconds.
 * @param live The live fold, mutated: `centre`, the centre shown, written
 *   in place, and `targetCentre`, the centre wanted, each `[x, y]` in
 *   metres in the folded plane.
 * @returns True if it changed `centre`.
 */
export const stepLiveCentre = (deltaSeconds, live) => {
  const { centre, targetCentre } = live;
  const targetX = targetCentre[0];
  const targetY = targetCentre[1];
  if (centre[0] === targetX && centre[1] === targetY) return false;

  const factor = easeFactor(deltaSeconds);
  const x = targetX + (centre[0] - targetX) * factor;
  const y = targetY + (centre[1] - targetY) * factor;
  const isSettled = Math.hypot(targetX - x, targetY - y) <= SETTLE_METERS;
  const nextX = isSettled ? targetX : x;
  const nextY = isSettled ? targetY : y;
  if (nextX === centre[0] && nextY === centre[1]) return false;

  centre[0] = nextX;
  centre[1] = nextY;
  return true;
};

/** #### Returns the share of the way still to go after an exponential ease
 * @param deltaSeconds The time elapsed, in seconds; a negative delta
 *   counts as zero.
 * @returns From 0 to 1: 1 for no time elapsed.
 */
const easeFactor = (deltaSeconds) =>
  Math.exp(-Math.max(deltaSeconds, 0) / LIVE_FOLD_SECONDS);

/** #### Returns how far a ray from a point runs to the viewport's inset edge
 * - The edge is `EDGE_MARGIN_PX` inside the viewport's. Never less than
 *   `MIN_REACH_PX`, so a point near or beyond that edge still has room.
 * @param fromX The ray's start x, in CSS pixels.
 * @param fromY The ray's start y, in CSS pixels.
 * @param unitX The ray's unit direction's x.
 * @param unitY The ray's unit direction's y.
 * @param viewport The viewport, `{ height, width }` in CSS pixels.
 * @returns The distance, in CSS pixels.
 */
const reachFrom = (fromX, fromY, unitX, unitY, viewport) => {
  const { height, width } = viewport;
  const toX = unitX > 0 ? width - EDGE_MARGIN_PX : EDGE_MARGIN_PX;
  const toY = unitY > 0 ? height - EDGE_MARGIN_PX : EDGE_MARGIN_PX;
  const alongX = unitX === 0 ? Infinity : (toX - fromX) / unitX;
  const alongY = unitY === 0 ? Infinity : (toY - fromY) / unitY;

  return Math.max(Math.min(alongX, alongY), MIN_REACH_PX);
};
