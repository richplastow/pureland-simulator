/**
 * @fileoverview
 * The lattice lines a pattern prints, and those paper crosses at a state,
 * each oriented so the smaller side moves.
 */

import { sheetSize } from "../designs/sheet.js";
import {
  clipPolygon,
  crossingSegment,
  MIN_AREA_SQUARE_METERS,
  signedArea,
  TOLERANCE_METERS,
} from "../fold/engine.js";

// Per family, with the origin at the sheet's centre and c the line's offset,
// `index` × spacing: `along(x, y)`, the coordinate the line runs along in
// its own direction, +y for "v" and +x for the others; `at(c, t)`, the
// point on line c at that coordinate; `offset(x, y)`, the offset of the
// family's line through a point; and `side(x, y, c)`, a point's signed
// distance from line c in metres, positive to the left of the family's
// direction, as applyFold() in fold/engine.js measures a side.
const FAMILY_LINES = Object.freeze({
  a: Object.freeze({
    along: (x, _y) => x,
    at: (c, t) => [t, c - t],
    offset: (x, y) => x + y,
    side: (x, y, c) => (x + y - c) * Math.SQRT1_2,
  }),
  d: Object.freeze({
    along: (x, _y) => x,
    at: (c, t) => [t, t + c],
    offset: (x, y) => y - x,
    side: (x, y, c) => (y - x - c) * Math.SQRT1_2,
  }),
  h: Object.freeze({
    along: (x, _y) => x,
    at: (c, t) => [t, c],
    offset: (_x, y) => y,
    side: (_x, y, c) => y - c,
  }),
  v: Object.freeze({
    along: (_x, y) => y,
    at: (c, t) => [c, t],
    offset: (x, _y) => x,
    side: (x, _y, c) => c - x,
  }),
});

// Within one index, lines come in this order of family.
const FAMILY_ORDER = Object.freeze(["v", "h", "d", "a"]);

/** #### Lists the lattice lines that paper crosses, the smaller side to move
 * - A pattern's lines are `"v"` (x = c), `"h"` (y = c), and, if it has
 *   `diagonals`, `"d"` (y = x + c) and `"a"` (y = −x + c), with the origin
 *   at the sheet's centre and c = `index` × spacing. `family` and `index`
 *   name a line while it is on screen, and are never saved.
 * - A line is foldable when the clipped area on each side of it, summed
 *   over every polygon so each layer counts, is more than
 *   `MIN_AREA_SQUARE_METERS`: a line that only touches the paper, at a
 *   corner or along an edge, would move nothing.
 * - `from` and `to` are the ends of the line's crossing extent, the first
 *   and last points where it meets any polygon, corners and edges on the
 *   line included, oriented so the side to the line's left, which moves,
 *   is the smaller. Areas within `MIN_AREA_SQUARE_METERS` of each other
 *   tie, and take the family's direction: +y for `"v"`, +x for the others.
 * - Lines come in order of `index`, lowest first, then of family: `"v"`,
 *   `"h"`, `"d"`, `"a"`.
 * - Allocates, so it is not for the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param pattern The pattern, from `PATTERNS`: `aspect`, `diagonals` and
 *   `spacingFraction`.
 * @param polygons The faces' polygons in the folded plane, `[x, y]` in
 *   metres, as placedPolygons() returns them.
 * @returns The lines, each frozen: `family`; `from` and `to`, `[x, y]` in
 *   metres, frozen; and `index`.
 */
export const foldableLines = (pattern, polygons) => {
  const spacing = spacingOf(pattern);
  const families = pattern.diagonals ? FAMILY_ORDER : ["v", "h"];
  const lines = [];
  for (const family of families) {
    const { offset } = FAMILY_LINES[family];
    let min = Infinity;
    let max = -Infinity;
    for (const polygon of polygons) {
      for (const [x, y] of polygon) {
        min = Math.min(min, offset(x, y));
        max = Math.max(max, offset(x, y));
      }
    }

    // A line on the bounding box only touches the paper, so the area test
    // drops it; `|| 0` turns an index of −0 into 0.
    const first = Math.ceil((min - TOLERANCE_METERS) / spacing) || 0;
    const last = Math.floor((max + TOLERANCE_METERS) / spacing);
    for (let index = first; index <= last; index++) {
      const line = crossingLine(family, index, polygons, spacing);
      if (line !== null) lines.push(line);
    }
  }

  return lines.sort(
    (p, q) =>
      p.index - q.index ||
      FAMILY_ORDER.indexOf(p.family) - FAMILY_ORDER.indexOf(q.family),
  );
};

/** #### Lists the lines a pattern prints on its flat sheet
 * - The lattice clipped to the sheet: one line per lattice line with sheet
 *   on both sides of it, so the sheet's own edges are not printed, its
 *   ends on the sheet's edges, in sheet coordinates.
 * - The lines foldableLines() finds on the flat sheet, in its order and
 *   orientation.
 * - Pure maths, with no DOM or GPU access.
 * @param pattern The pattern, from `PATTERNS`.
 * @returns The lines, each frozen: `from` and `to`, `[x, y]` in metres,
 *   frozen, and `type`, `"plain"`.
 */
export const printedLines = (pattern) => {
  const { heightMeters, widthMeters } = sheetSize(pattern.aspect);
  const halfWidth = widthMeters / 2;
  const halfHeight = heightMeters / 2;
  const sheet = [
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
    [halfWidth, halfHeight],
    [-halfWidth, halfHeight],
  ];

  return foldableLines(pattern, [sheet]).map(({ from, to }) =>
    Object.freeze({ from, to, type: "plain" }),
  );
};

/** #### Returns the area a line clips from a convex polygon, on one side
 * - Clips with clipPolygon(), so corners on the line belong to both sides,
 *   and a piece no larger than `MIN_AREA_SQUARE_METERS` is not paper, so
 *   counts as 0.
 * @param polygon The polygon's corners, `[x, y]`, either way round.
 * @param sides Each corner's signed distance from the line, in metres.
 * @param keep 1 to keep the positive side, −1 the negative side.
 * @returns The kept piece's area, in square metres, or 0.
 */
const clippedArea = (polygon, sides, keep) => {
  const piece = clipPolygon(polygon, sides, keep);

  return piece === null ? 0 : Math.abs(signedArea(piece));
};

/** #### Returns one lattice line as foldable, or null if paper is not on
 * both sides of it
 * @param family `"a"`, `"d"`, `"h"` or `"v"`.
 * @param index The line's whole number `k`, its offset `k` × spacing.
 * @param polygons The faces' polygons in the folded plane.
 * @param spacing The lattice spacing, in metres.
 * @returns The line, frozen, as foldableLines() lists it, or null.
 */
const crossingLine = (family, index, polygons, spacing) => {
  const { along, at, side } = FAMILY_LINES[family];
  const c = index * spacing;
  let leftArea = 0;
  let rightArea = 0;
  let minAlong = Infinity;
  let maxAlong = -Infinity;
  for (const polygon of polygons) {
    const sides = polygon.map(([x, y]) => side(x, y, c));
    leftArea += clippedArea(polygon, sides, 1);
    rightArea += clippedArea(polygon, sides, -1);
    for (const [x, y] of crossingSegment(polygon, sides)) {
      minAlong = Math.min(minAlong, along(x, y));
      maxAlong = Math.max(maxAlong, along(x, y));
    }
  }
  if (
    leftArea <= MIN_AREA_SQUARE_METERS ||
    rightArea <= MIN_AREA_SQUARE_METERS
  ) {
    return null;
  }

  // The family's direction puts the line's left side to move, unless that
  // side is the larger by more than a sliver.
  const start = Object.freeze(at(c, minAlong));
  const end = Object.freeze(at(c, maxAlong));
  const isReversed = leftArea - rightArea > MIN_AREA_SQUARE_METERS;

  return Object.freeze({
    family,
    from: isReversed ? end : start,
    index,
    to: isReversed ? start : end,
  });
};

/** #### Returns a pattern's lattice spacing
 * @param pattern The pattern: `aspect` and `spacingFraction`, a fraction
 *   of the sheet's short side.
 * @returns The spacing, in metres.
 */
const spacingOf = (pattern) => {
  const { heightMeters, widthMeters } = sheetSize(pattern.aspect);

  return pattern.spacingFraction * Math.min(heightMeters, widthMeters);
};
