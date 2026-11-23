/**
 * @fileoverview
 * The rules a standing flap sets on the folds after it: the hinge points a
 * fold must hold, the flaps as they stand in 3D, and how far a fold can
 * turn before the paper it moves sweeps into one.
 */

import {
  clipPolygon,
  placedPolygons,
  standingFoldOf,
  TOLERANCE_METERS,
} from "../fold/engine.js";
import { rotateAboutLine, turnSign } from "../fold/pose.js";
import { SNAP_RADIANS } from "./angle.js";

// How far the line where two polygons' planes meet must run through both
// interiors, and how far each must reach through the other's plane, for
// them to cross, in metres: 1 µm. Touching, at an edge or a corner, never
// crosses, so a fold may come to rest against a wall.
const CONTACT_METERS = 1e-6;

// The step a fold turns by as the sweep test follows it, in radians: 3°.
const SWEEP_STEP_RADIANS = Math.PI / 60;

/** #### Lists the hinge points of the flaps standing at a stage
 * - The corners, in the folded plane, of each face that a fold before the
 *   stage, stopping short of 180°, moved, that lie on that fold's line,
 *   within `TOLERANCE_METERS`: the ends of the edge where the flap meets
 *   the paper still flat. A later fold must hold every one strictly on
 *   its held side, or it would move a flap or crease across one.
 * - Allocates, so call it once per rest state.
 * - Pure maths, with no DOM or GPU access.
 * @param sheet The sheet, from cutSheet() or cutSession(), with its
 *   `faces` and `folds`.
 * @param stage The stage, from 0 (flat) to the fold count.
 * @returns The points, each `[x, y]` in metres in the folded plane; none
 *   if no flap stands.
 */
export const hingePoints = (sheet, stage) => {
  const points = [];
  for (const { fold, polygon } of flapsAt(sheet, stage)) {
    const { from, to } = fold;
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const length = Math.hypot(dx, dy);
    for (const [x, y] of polygon) {
      const offset = (dx * (y - from[1]) - dy * (x - from[0])) / length;
      if (Math.abs(offset) <= TOLERANCE_METERS) points.push([x, y]);
    }
  }

  return points;
};

/** #### Lists the faces standing at a stage, as polygons in 3D
 * - Each face that a fold before the stage, stopping short of 180°,
 *   moved, as it lay before that fold, turned about the fold's line by its
 *   angle: towards +Z for a valley, −Z for a mountain. Paper has no
 *   thickness here, so the flat paper lies at z = 0.
 * - Allocates, so call it once per rest state.
 * - Pure maths, with no DOM or GPU access.
 * @param sheet The sheet, from cutSheet() or cutSession(), with its
 *   `faces` and `folds`.
 * @param stage The stage, from 0 (flat) to the fold count.
 * @returns Per standing face, its corners, `[x, y, z]` in metres in the
 *   folded plane; none if no flap stands.
 */
export const standingPolygons = (sheet, stage) =>
  flapsAt(sheet, stage).map(({ fold, polygon }) =>
    polygon.map(([x, y]) => {
      const corner = [x, y, 0];
      rotateAboutLine(turnSign(fold) * fold.targetRadians, fold, 0, corner);

      return corner;
    }),
  );

/** #### Returns how far a fold can turn before it sweeps into a standing face
 * - Clips each moving polygon to the fold's moving side, the side to its
 *   line's left, as applyFold() in fold/engine.js clips, so whole faces
 *   may be passed; then turns the pieces about the line, towards +Z for a
 *   valley or −Z for a mountain, in steps of `SWEEP_STEP_RADIANS`, up to
 *   the fold's angle, testing each step against every standing polygon.
 * - Two polygons cross when the line where their planes meet runs through
 *   both interiors by more than `CONTACT_METERS`; coplanar or touching
 *   polygons never cross, so a flat stack's layers never block each
 *   other, and a fold may come to rest touching a wall.
 * - Returns the last step before any piece crosses any standing polygon,
 *   snapped down to a whole number of `SNAP_RADIANS` steps, as every
 *   fold's angle is; the fold's angle itself when nothing crosses.
 * - Allocates, so call it once per line and direction per rest state.
 * - Pure maths, with no DOM or GPU access.
 * @param fold The fold: `from` and `to`, `[x, y]` in metres in the folded
 *   plane, the side to the line's left moving; `targetRadians`, its angle,
 *   in radians; and `type`, `"mountain"` or `"valley"`.
 * @param movingPolygons The flat faces' polygons, `[x, y]` in metres in
 *   the folded plane, as placedPolygons() returns them.
 * @param standingPolygons The standing faces, as standingPolygons()
 *   returns them.
 * @returns The angle the fold can reach, in radians, from 0 to its
 *   `targetRadians`.
 */
export const sweepLimitRadians = (fold, movingPolygons, standingPolygons) => {
  const { from, targetRadians, to } = fold;
  if (standingPolygons.length === 0) return targetRadians;

  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const ux = (to[0] - from[0]) / length;
  const uy = (to[1] - from[1]) / length;
  const pieces = [];
  for (const polygon of movingPolygons) {
    const sides = polygon.map(
      ([x, y]) => ux * (y - from[1]) - uy * (x - from[0]),
    );
    const piece = clipPolygon(polygon, sides, 1);
    if (piece !== null) pieces.push(piece.map(([x, y]) => [x, y, 0]));
  }

  // Every whole step up to the fold's angle, then the angle itself if it
  // falls between steps.
  const sign = turnSign(fold);
  const stepCount = Math.floor(targetRadians / SWEEP_STEP_RADIANS + 1e-9);
  const angleCount =
    targetRadians - stepCount * SWEEP_STEP_RADIANS > TOLERANCE_METERS
      ? stepCount + 1
      : stepCount;
  let freeRadians = 0;
  for (let i = 1; i <= angleCount; i++) {
    const radians = Math.min(i * SWEEP_STEP_RADIANS, targetRadians);
    const isCrossing = pieces.some((piece) => {
      const turned = piece.map(([x, y, z]) => {
        const corner = [x, y, z];
        rotateAboutLine(sign * radians, fold, 0, corner);

        return corner;
      });
      return standingPolygons.some((standing) => crosses(turned, standing));
    });
    if (isCrossing) return snapDown(freeRadians);

    freeRadians = radians;
  }

  return targetRadians;
};

/** #### Returns a point's distance along a direction, from the origin
 * @param point The point, `[x, y, z]` in metres.
 * @param direction The unit direction, `[x, y, z]`.
 * @returns The distance, in metres.
 */
const alongOf = (point, direction) =>
  point[0] * direction[0] + point[1] * direction[1] + point[2] * direction[2];

/** #### Returns true if two convex polygons in 3D pass through each other
 * - Each must reach through the other's plane by more than
 *   `CONTACT_METERS` on both sides, and the line where the planes meet
 *   must run through both interiors by more than `CONTACT_METERS`, so
 *   touching at an edge or a corner never crosses.
 * @param first The first polygon's corners, `[x, y, z]` in metres.
 * @param second The second polygon's corners, `[x, y, z]` in metres.
 * @returns True if they cross.
 */
const crosses = (first, second) => {
  const firstNormal = normalOf(first);
  const secondNormal = normalOf(second);
  const firstSides = first.map((point) =>
    offsetFrom(second[0], secondNormal, point),
  );
  if (!straddles(firstSides)) return false;

  const secondSides = second.map((point) =>
    offsetFrom(first[0], firstNormal, point),
  );
  if (!straddles(secondSides)) return false;

  // The direction of the line where the two planes meet, their normals'
  // cross product.
  const [ax, ay, az] = firstNormal;
  const [bx, by, bz] = secondNormal;
  const dx = ay * bz - az * by;
  const dy = az * bx - ax * bz;
  const dz = ax * by - ay * bx;
  const length = Math.hypot(dx, dy, dz);
  if (length === 0) return false;

  const direction = [dx / length, dy / length, dz / length];
  const [firstStart, firstEnd] = spanAlong(first, firstSides, direction);
  const [secondStart, secondEnd] = spanAlong(second, secondSides, direction);

  return (
    Math.min(firstEnd, secondEnd) - Math.max(firstStart, secondStart) >
    CONTACT_METERS
  );
};

/** #### Lists the faces standing at a stage, each with the fold that stood
 * it
 * - Each face that a fold before the stage, stopping short of 180°,
 *   moved, placed as it lay before that fold.
 * @param sheet The sheet, with its `faces` and `folds`.
 * @param stage The stage, from 0 (flat) to the fold count.
 * @returns Per standing face, `fold`, the fold that stood it, and
 *   `polygon`, its corners, `[x, y]` in metres in the folded plane.
 */
const flapsAt = (sheet, stage) => {
  const { faces, folds } = sheet;
  const placedByStage = [];
  const flaps = [];
  faces.forEach(({ movedBy }, i) => {
    const j = standingFoldOf(folds, movedBy, stage);
    if (j === -1) return;

    placedByStage[j] ??= placedPolygons(sheet, j);
    flaps.push({ fold: folds[j], polygon: placedByStage[j][i] });
  });

  return flaps;
};

/** #### Returns a planar polygon's unit normal, by Newell's method
 * @param polygon The polygon's corners, `[x, y, z]` in metres.
 * @returns The normal, `[x, y, z]`, of length 1.
 */
const normalOf = (polygon) => {
  let x = 0;
  let y = 0;
  let z = 0;
  polygon.forEach((point, i) => {
    const next = polygon[(i + 1) % polygon.length];
    x += (point[1] - next[1]) * (point[2] + next[2]);
    y += (point[2] - next[2]) * (point[0] + next[0]);
    z += (point[0] - next[0]) * (point[1] + next[1]);
  });
  const length = Math.hypot(x, y, z);

  return [x / length, y / length, z / length];
};

/** #### Returns a point's signed distance from a plane
 * @param origin A point on the plane, `[x, y, z]` in metres.
 * @param normal The plane's unit normal, `[x, y, z]`.
 * @param point The point, `[x, y, z]` in metres.
 * @returns The distance, in metres, positive on the normal's side.
 */
const offsetFrom = (origin, normal, point) =>
  (point[0] - origin[0]) * normal[0] +
  (point[1] - origin[1]) * normal[1] +
  (point[2] - origin[2]) * normal[2];

/** #### Snaps an angle down to a whole number of `SNAP_RADIANS` steps
 * - Written as snapAngleRadians() in angle.js writes a snapped angle, so a
 *   limit and a snapped drag compare equal.
 * @param radians The angle, from 0 to π, in radians.
 * @returns The snapped angle, in radians.
 */
const snapDown = (radians) => {
  const stepsPerHalfTurn = Math.round(Math.PI / SNAP_RADIANS);
  const steps = Math.floor(radians / SNAP_RADIANS + 1e-9);

  return steps >= stepsPerHalfTurn
    ? Math.PI
    : (steps * Math.PI) / stepsPerHalfTurn;
};

/** #### Returns where the line where a plane meets another runs through a
 * polygon
 * - The polygon's corners on the other plane, and the points where its
 *   edges cross it, measured along the line's direction.
 * @param polygon The polygon's corners, `[x, y, z]` in metres.
 * @param sides Each corner's signed distance from the other plane, in
 *   metres.
 * @param direction The line's unit direction, `[x, y, z]`.
 * @returns The span's two ends, along the direction, in metres, from the
 *   origin's foot on the line.
 */
const spanAlong = (polygon, sides, direction) => {
  let start = Infinity;
  let end = -Infinity;
  polygon.forEach((point, i) => {
    const j = (i + 1) % polygon.length;
    const s = sides[i];
    const t = sides[j];
    let along = null;
    if (s === 0) {
      along = alongOf(point, direction);
    } else if ((s > 0 && t < 0) || (s < 0 && t > 0)) {
      const k = s / (s - t);
      const next = polygon[j];
      along = alongOf(
        [
          point[0] + k * (next[0] - point[0]),
          point[1] + k * (next[1] - point[1]),
          point[2] + k * (next[2] - point[2]),
        ],
        direction,
      );
    }
    if (along !== null) {
      start = Math.min(start, along);
      end = Math.max(end, along);
    }
  });

  return [start, end];
};

/** #### Returns true if a polygon reaches through a plane on both sides
 * @param sides Each corner's signed distance from the plane, in metres.
 * @returns True if a corner lies more than `CONTACT_METERS` either side.
 */
const straddles = (sides) =>
  Math.max(...sides) > CONTACT_METERS && Math.min(...sides) < -CONTACT_METERS;
