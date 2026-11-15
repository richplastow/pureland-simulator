/**
 * @fileoverview
 * The pure maths of picking a lattice line: the nearest foldable line to a
 * point, the fold a Fold Button makes from the side facing the camera, which
 * side of the paper shows at a point and along a line, and the corners of
 * the strip that lights a line.
 */

import {
  crossingSegment,
  placedPolygons,
  TOLERANCE_METERS,
} from "../fold/engine.js";

// How far either side of a line litSegments() looks for the paper beneath
// it, in metres: far beyond the engine's tolerance, and far within any
// face a lattice line can cross.
const SIDE_PROBE_METERS = 1e-6;

/** #### Lists the segments of a line that are folds, each with its ink
 * - Splits the line's crossing extent where any face's polygon meets it,
 *   and asks showsFrontAt() which side of the paper shows just either side
 *   of each piece's middle. Only a piece with paper on both sides is a
 *   fold: a piece along the paper's outline, with paper on one side only,
 *   is an edge, and a piece over no paper is a gap; neither is lit nor
 *   picked.
 * - A segment takes the front's ink, black, where the front shows on
 *   either side, so a fold along a border between white and colour reads
 *   plainly against both; the back's ink, the paper's colour, where only
 *   the back shows. Runs of pieces taking one ink merge.
 * - A segment's end is capped where the line runs off the paper beyond
 *   it, into a gap or past the extent's end, so the band can be drawn on
 *   past it and clipped to the paper's outline; not where another segment,
 *   or an edge, carries on.
 * - Allocates, so call it once per rest state, not per pointer move.
 * - Pure maths, with no DOM or GPU access.
 * @param faces The faces at rest, as placedFaces() returns them.
 * @param isFrontFacing True if the camera lies on the front's side of the
 *   paper's plane.
 * @param line The line, with `from` and `to`, `[x, y]` in metres in the
 *   folded plane, apart.
 * @returns The segments, in order from `from`: each with `capsFrom` and
 *   `capsTo`, true if that end is capped; `fromFraction` and `toFraction`,
 *   from 0 at `from` to 1 at `to`; and `takesFrontInk`, true if it takes
 *   the front's ink, black.
 */
export const litSegments = (faces, isFrontFacing, line) => {
  const [fromX, fromY] = line.from;
  const dx = line.to[0] - fromX;
  const dy = line.to[1] - fromY;
  const length = Math.hypot(dx, dy);

  // The probe's offset, along the line's left normal, `(−dy, dx)`.
  const probeX = (-dy / length) * SIDE_PROBE_METERS;
  const probeY = (dx / length) * SIDE_PROBE_METERS;

  // Each face's crossing ends, as fractions along the line; left is
  // positive, as applyFold() in fold/engine.js measures a side.
  const fractions = [0, 1];
  for (const { polygon } of faces) {
    const sides = polygon.map(
      ([x, y]) => (dx * (y - fromY) - dy * (x - fromX)) / length,
    );
    for (const [x, y] of crossingSegment(polygon, sides)) {
      fractions.push(((x - fromX) * dx + (y - fromY) * dy) / length ** 2);
    }
  }
  fractions.sort((p, q) => p - q);

  const pieces = [];
  for (let i = 1; i < fractions.length; i++) {
    const start = Math.max(fractions[i - 1], 0);
    const end = Math.min(fractions[i], 1);
    if ((end - start) * length <= TOLERANCE_METERS) continue;

    const middle = (start + end) / 2;
    const middleX = fromX + middle * dx;
    const middleY = fromY + middle * dy;
    const left = showsFrontAt(faces, isFrontFacing, [
      middleX + probeX,
      middleY + probeY,
    ]);
    const right = showsFrontAt(faces, isFrontFacing, [
      middleX - probeX,
      middleY - probeY,
    ]);
    pieces.push({
      end,
      hasPaper: left !== null || right !== null,
      isFold: left !== null && right !== null,
      start,
      takesFrontInk: left === true || right === true,
    });
  }

  // Each segment, and the index in `pieces` of its last piece.
  const segments = [];
  const lastPieces = [];
  pieces.forEach((piece, i) => {
    if (!piece.isFold) return;

    const last = segments.at(-1);
    const isRunOn =
      last !== undefined &&
      lastPieces.at(-1) === i - 1 &&
      last.takesFrontInk === piece.takesFrontInk;
    if (isRunOn) {
      last.toFraction = piece.end;
      lastPieces[lastPieces.length - 1] = i;
      return;
    }
    segments.push({
      capsFrom: pieces[i - 1]?.hasPaper !== true,
      capsTo: false,
      fromFraction: piece.start,
      takesFrontInk: piece.takesFrontInk,
      toFraction: piece.end,
    });
    lastPieces.push(i);
  });
  segments.forEach((segment, i) => {
    segment.capsTo = pieces[lastPieces[i] + 1]?.hasPaper !== true;
  });

  return segments;
};

/** #### Returns the line, or span, nearest a point, if one is within reach
 * - Measures to each item's extent, from `from` to `to`, not to the
 *   infinite line, so a point beyond an item's end is as far from it as
 *   from that end.
 * - Of items at the same distance, the first in `lines` wins.
 * - Allocates nothing, so it is safe on every pointer move.
 * - Pure maths, with no DOM or GPU access.
 * @param lines The items to pick from: foldable lines, as foldableLines()
 *   lists them, or their spans, as pickSpans() lists them; each with
 *   `from` and `to`, `[x, y]` in metres in the folded plane.
 * @param maxDistanceMeters The furthest an item may be from the point and
 *   still be picked, in metres.
 * @param point The point, `[x, y]` in metres in the folded plane.
 * @returns The nearest item within reach, or null.
 */
export const pickLine = (lines, maxDistanceMeters, point) => {
  const px = point[0];
  const py = point[1];
  let nearest = null;
  let nearestMeters = Infinity;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ax = line.from[0];
    const ay = line.from[1];
    const dx = line.to[0] - ax;
    const dy = line.to[1] - ay;
    const lengthSquared = dx * dx + dy * dy;

    // The fraction along the extent of the point's foot, kept to the ends.
    const along =
      lengthSquared === 0
        ? 0
        : Math.min(
            Math.max(((px - ax) * dx + (py - ay) * dy) / lengthSquared, 0),
            1,
          );
    const distanceMeters = Math.hypot(
      px - (ax + along * dx),
      py - (ay + along * dy),
    );
    if (distanceMeters <= maxDistanceMeters && distanceMeters < nearestMeters) {
      nearest = line;
      nearestMeters = distanceMeters;
    }
  }

  return nearest;
};

/** #### Lists the spans of the lines that are folds, to pick from
 * - One span per segment, as litSegments() lists them, so a press near a
 *   line's edge or gap, where it is no fold, picks nothing. Seen from
 *   either side, a line's segments cover the same spans, so either side's
 *   will do.
 * - Allocates, so call it once per rest state.
 * - Pure maths, with no DOM or GPU access.
 * @param lines The foldable lines, as foldableLines() lists them.
 * @param segments Per line, in the same order, its segments.
 * @returns The spans, each frozen: `from` and `to`, `[x, y]` in metres in
 *   the folded plane, and `line`, the line it is part of.
 */
export const pickSpans = (lines, segments) =>
  lines.flatMap((line, i) => {
    const [fromX, fromY] = line.from;
    const dx = line.to[0] - fromX;
    const dy = line.to[1] - fromY;
    return segments[i].map(({ fromFraction, toFraction }) =>
      Object.freeze({
        from: [fromX + fromFraction * dx, fromY + fromFraction * dy],
        line,
        to: [fromX + toFraction * dx, fromY + toFraction * dy],
      }),
    );
  });

/** #### Places a sheet's faces at a stage, with what decides which shows
 * - Allocates, so call it once per rest state.
 * - Pure maths, with no DOM or GPU access.
 * @param sheet The sheet, from cutSheet() or cutSession().
 * @param stage The stage, from 0 (flat) to the fold count.
 * @returns Per face: `isFaceUp`, true if its front faces the front's side
 *   of the folded plane, which a placement that mirrors it reverses;
 *   `layer`, counted from 1 at the back; and `polygon`, its corners,
 *   `[x, y]` in metres in the folded plane.
 */
export const placedFaces = (sheet, stage) => {
  const polygons = placedPolygons(sheet, stage);

  return sheet.faces.map(({ layers, placements }, i) => {
    const [a, b, c, d] = placements[stage];
    return {
      isFaceUp: a * d - b * c > 0,
      layer: layers[stage],
      polygon: polygons[i],
    };
  });
};

/** #### Returns the fold, in the front's terms, of a fold as the player sees it
 * - A valley lifts the moving side towards the camera. Seen from the
 *   front, that is a `"valley"` in the front's terms; seen from the back,
 *   it is a `"mountain"`, and the other way about.
 * - Pure maths, with no DOM or GPU access.
 * @param isFrontFacing True if the camera faces the paper's front, its
 *   coloured side.
 * @param type The fold as the player sees it, `"mountain"` or `"valley"`.
 * @returns The fold in the front's terms, `"mountain"` or `"valley"`.
 */
export const seenType = (isFrontFacing, type) => {
  if (isFrontFacing) return type;

  return type === "valley" ? "mountain" : "valley";
};

/** #### Returns which side of the paper shows at a point, seen from one side
 * - The face nearest the camera at the point shows: the highest layer from
 *   the front's side, the lowest from the back's. It shows its front if it
 *   lies face up and the camera is on the front's side, or face down and
 *   the camera on the back's.
 * - A point on an edge belongs to the faces either side, so where two
 *   faces meet, the nearer of the two shows.
 * - Allocates nothing.
 * - Pure maths, with no DOM or GPU access.
 * @param faces The faces at rest, as placedFaces() returns them.
 * @param isFrontFacing True if the camera lies on the front's side of the
 *   paper's plane.
 * @param point The point, `[x, y]` in metres in the folded plane.
 * @returns True if the paper's front, its coloured side, shows; false if
 *   its back, the white side; null if there is no paper at the point.
 */
export const showsFrontAt = (faces, isFrontFacing, point) => {
  let shown = null;
  for (let i = 0; i < faces.length; i++) {
    const face = faces[i];
    const isNearer =
      shown === null ||
      (isFrontFacing ? face.layer > shown.layer : face.layer < shown.layer);
    if (isNearer && containsPoint(face.polygon, point)) shown = face;
  }

  return shown === null ? null : shown.isFaceUp === isFrontFacing;
};

/** #### Writes the middle of a line's longest fold span into a point
 * - Where a keyboard pick lands, so it lands on the line where it is a
 *   fold, never where it runs along the paper's outline.
 * - Leaves the point as it was if the line has no span.
 * - Allocates nothing.
 * - Pure maths, with no DOM or GPU access.
 * @param line The line, one of the lines the spans were listed for.
 * @param point An array of two numbers, `[x, y]` in metres in the folded
 *   plane, overwritten.
 * @param spans The spans, as pickSpans() lists them.
 */
export const writeFoldMiddle = (line, point, spans) => {
  let longestMeters = -1;
  for (let i = 0; i < spans.length; i++) {
    const { from, to } = spans[i];
    const lengthMeters = Math.hypot(to[0] - from[0], to[1] - from[1]);
    if (spans[i].line !== line || lengthMeters <= longestMeters) continue;

    longestMeters = lengthMeters;
    point[0] = (from[0] + to[0]) / 2;
    point[1] = (from[1] + to[1]) / 2;
  }
};

/** #### Writes the corners of the strip that lights a line, or part of it
 * - Four corners, in the frame of the posed paper, which is the folded
 *   plane less the stage's centre: corners 0 and 1 straddle the strip's
 *   start, and 2 and 3 its end, each pair half the width either side of
 *   the line, all at z = 0. Corners 0 and 2 lie to the line's left.
 * - By default the strip runs the line's whole length, from `from` to
 *   `to`, into the first four corners; a part of the line, written at a
 *   later corner, lets several strips share one buffer.
 * - Allocates nothing, so it is safe on every pointer move.
 * - Pure maths, with no DOM or GPU access.
 * @param centre The stage's centre, `[x, y]` in metres in the folded
 *   plane, which the pose slides the paper by.
 * @param line The line, with `from` and `to`, `[x, y]` in metres in the
 *   folded plane, apart.
 * @param positions An array of three numbers per corner, in metres,
 *   overwritten at the four corners from `firstCorner`.
 * @param widthMeters The strip's width, in metres.
 * @param firstCorner The index of the strip's first corner; 0 by default.
 * @param fromFraction Where the strip starts, from 0 at the line's `from`
 *   to 1 at its `to`; 0 by default.
 * @param toFraction Where the strip ends, likewise; 1 by default.
 */
export const writeStripPositions = (
  centre,
  line,
  positions,
  widthMeters,
  firstCorner = 0,
  fromFraction = 0,
  toFraction = 1,
) => {
  const lineFromX = line.from[0] - centre[0];
  const lineFromY = line.from[1] - centre[1];
  const dx = line.to[0] - line.from[0];
  const dy = line.to[1] - line.from[1];
  const length = Math.hypot(dx, dy);
  const fromX = lineFromX + fromFraction * dx;
  const fromY = lineFromY + fromFraction * dy;
  const toX = lineFromX + toFraction * dx;
  const toY = lineFromY + toFraction * dy;

  // Half the width along the line's left normal, `(−dy, dx)`.
  const offsetX = (-dy / length) * (widthMeters / 2);
  const offsetY = (dx / length) * (widthMeters / 2);

  writeCorner(positions, firstCorner, fromX + offsetX, fromY + offsetY);
  writeCorner(positions, firstCorner + 1, fromX - offsetX, fromY - offsetY);
  writeCorner(positions, firstCorner + 2, toX + offsetX, toY + offsetY);
  writeCorner(positions, firstCorner + 3, toX - offsetX, toY - offsetY);
};

/** #### Returns true if a convex polygon holds a point, its edges included
 * - Works whichever way the polygon runs, as a face lying face down runs
 *   clockwise.
 * - Allocates nothing.
 * @param polygon The polygon's corners, `[x, y]` in metres.
 * @param point The point, `[x, y]` in metres.
 * @returns True if the point lies inside or on an edge.
 */
const containsPoint = (polygon, point) => {
  let turn = 0;
  for (let i = 0; i < polygon.length; i++) {
    const start = polygon[i];
    const end = polygon[(i + 1) % polygon.length];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const across =
      (dx * (point[1] - start[1]) - dy * (point[0] - start[0])) /
      Math.hypot(dx, dy);
    if (Math.abs(across) <= TOLERANCE_METERS) continue;
    if (turn === 0) {
      turn = Math.sign(across);
    } else if (Math.sign(across) !== turn) {
      return false;
    }
  }

  return true;
};

/** #### Writes one corner of a strip, at z = 0
 * @param positions An array of three numbers per corner, overwritten.
 * @param corner The corner's index.
 * @param x The corner's x, in metres.
 * @param y The corner's y, in metres.
 */
const writeCorner = (positions, corner, x, y) => {
  positions[3 * corner] = x;
  positions[3 * corner + 1] = y;
  positions[3 * corner + 2] = 0;
};
