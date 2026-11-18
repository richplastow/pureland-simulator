/**
 * @fileoverview
 * The pure maths of placing Fold Button pairs on screen: each on its own
 * Fold Line, arranged by the line's slant, inside the viewport and clear of
 * the toolbar, the pointer and each other; and which side of a line the
 * pointer is on.
 *
 * Everything is in CSS pixels from the viewport's top-left. A line on
 * screen is `{ index, lengthPx, segments }`: its index in the list of Fold
 * Lines, its fold spans' total length, and four numbers per span, `x1, y1,
 * x2, y2`, all on one straight line. A placement is `{ isStacked,
 * lineIndex, x, y }`: the pair's arrangement and centre. A space is
 * `{ exclusions, pair, pointerClearancePx, viewport }`: the boxes to keep
 * clear of, each `{ bottom, left, right, top }`; the side-by-side pair's
 * `widthPx` and `heightPx`, with `gapPx` and `hitzonePx`; and the
 * viewport's `width` and `height`. A stacked pair's box is the side-by-side
 * one turned a quarter, since its buttons are square.
 */

// The gap kept between two shown pairs, in CSS pixels; a first guess, open
// to tuning.
export const PAIR_GAP_PX = 12;

// How far a shown pair's hitzone reaches beyond its box, in CSS pixels:
// half the gap, so the zones of two shown pairs never overlap.
export const PAIR_HITZONE_PX = PAIR_GAP_PX / 2;

// How far a pair placed beside the pointer keeps its box from it, in CSS
// pixels; a first guess, open to tuning.
export const POINTER_CLEARANCE_PX = 40;

// How far past a blocked stretch a slide along a line steps, in CSS
// pixels, so rounding never leaves the pair touching what blocked it.
const EDGE_NUDGE_PX = 1e-6;

// No shown pairs, for a slide that keeps clear of none.
const NO_PAIRS = Object.freeze([]);

// The touch layout's tries along each span: this many points, evenly from
// the first fraction of the span to the last.
const LAYOUT_SAMPLES = 9;
const LAYOUT_SAMPLE_FROM = 0.1;
const LAYOUT_SAMPLE_TO = 0.9;

/** #### Lays out a pair on every Fold Line that fits, longest lines first
 * - Greedy: takes the lines longest on screen first, ties in their
 *   `index` order, and for each tries `LAYOUT_SAMPLES` points evenly from
 *   0.1 to 0.9 of each of its spans. It keeps the points whose box lies in
 *   the viewport, clear of every exclusion and at least `space.pair.gapPx`
 *   from every box placed, and takes the one furthest from other lines
 *   and placed pairs. A line with no such point gets no pair, so pairs
 *   never overlap.
 * - Each pair centres on a point of its own line, arranged by its slant:
 *   stacked on a shallow line, side by side on a steep one.
 * - Allocates, so call it only when the scene comes to rest.
 * - Pure maths, with no DOM or GPU access.
 * @param lines The Fold Lines on screen.
 * @param space The space to lay the pairs out in.
 * @returns The placements, one per line that fits, in the order placed.
 */
export const placePairs = (lines, space) => {
  const order = [...lines].sort(
    (first, second) =>
      second.lengthPx - first.lengthPx || first.index - second.index,
  );
  const placed = [];
  for (const line of order) {
    const isStacked = !isSteep(line);
    const halfWidth = halfWidthOf(isStacked, space.pair);
    const halfHeight = halfHeightOf(isStacked, space.pair);
    const { segments } = line;
    let best = null;
    let bestClearancePx = -Infinity;
    for (let s = 0; s < segments.length; s += 4) {
      for (let k = 0; k < LAYOUT_SAMPLES; k++) {
        const t =
          LAYOUT_SAMPLE_FROM +
          ((LAYOUT_SAMPLE_TO - LAYOUT_SAMPLE_FROM) * k) / (LAYOUT_SAMPLES - 1);
        const x = segments[s] + t * (segments[s + 2] - segments[s]);
        const y = segments[s + 1] + t * (segments[s + 3] - segments[s + 1]);
        if (!isBoxClear(x, y, halfWidth, halfHeight, placed, space)) continue;

        const clearancePx = clearanceOf(x, y, line, lines, placed, space);
        if (clearancePx > bestClearancePx) {
          bestClearancePx = clearancePx;
          best = { isStacked, lineIndex: line.index, x, y };
        }
      }
    }
    if (best !== null) placed.push(best);
  }

  return placed;
};

/** #### Returns how far a point lies from a placed pair's box
 * - Zero on or inside the box.
 * - Allocates nothing.
 * - Pure maths, with no DOM or GPU access.
 * @param placement The pair's placement.
 * @param space The space it was placed in, for the pair's size.
 * @param x The point's x, in CSS pixels.
 * @param y The point's y, in CSS pixels.
 * @returns The distance, in CSS pixels.
 */
export const distanceToBox = (placement, space, x, y) => {
  const outsideX =
    Math.abs(x - placement.x) - halfWidthOf(placement.isStacked, space.pair);
  const outsideY =
    Math.abs(y - placement.y) - halfHeightOf(placement.isStacked, space.pair);

  return Math.hypot(Math.max(outsideX, 0), Math.max(outsideY, 0));
};

/** #### Returns how far a point lies from a line's nearest fold span
 * - Measures to each span's extent, not to the infinite line.
 * - Allocates nothing.
 * - Pure maths, with no DOM or GPU access.
 * @param line The line on screen.
 * @param x The point's x, in CSS pixels.
 * @param y The point's y, in CSS pixels.
 * @returns The distance, in CSS pixels, or Infinity for a line with no
 *   span.
 */
export const distanceToSpans = (line, x, y) => {
  const { segments } = line;
  let nearestPx = Infinity;
  for (let s = 0; s < segments.length; s += 4) {
    const ax = segments[s];
    const ay = segments[s + 1];
    const dx = segments[s + 2] - ax;
    const dy = segments[s + 3] - ay;
    const t = footOf(ax, ay, dx, dy, x, y);
    nearestPx = Math.min(
      nearestPx,
      Math.hypot(ax + t * dx - x, ay + t * dy - y),
    );
  }

  return nearestPx;
};

/** #### Returns true if a line runs steeper than 45° on screen
 * - A line within 45° of horizontal, 45° included, is shallow. Reads the
 *   direction from the first span's start to the last span's end, which
 *   lie on one straight line.
 * - Allocates nothing.
 * - Pure maths, with no DOM or GPU access.
 * @param line The line on screen.
 * @returns True if steep, false if shallow.
 */
export const isSteep = (line) => {
  const { segments } = line;
  const last = segments.length - 4;

  return (
    Math.abs(segments[last + 3] - segments[1]) >
    Math.abs(segments[last + 2] - segments[0])
  );
};

/** #### Returns true if two placed pairs lie at least the gap apart
 * - Allocates nothing.
 * - Pure maths, with no DOM or GPU access.
 * @param first One placement.
 * @param second The other placement.
 * @param space The space they were placed in, for the pair's size and gap.
 * @returns True if their boxes lie at least `space.pair.gapPx` apart.
 */
export const pairsApart = (first, second, space) => {
  const { pair } = space;

  return (
    Math.abs(first.x - second.x) >=
      halfWidthOf(first.isStacked, pair) +
        halfWidthOf(second.isStacked, pair) +
        pair.gapPx ||
    Math.abs(first.y - second.y) >=
      halfHeightOf(first.isStacked, pair) +
        halfHeightOf(second.isStacked, pair) +
        pair.gapPx
  );
};

/** #### Places Slow Fold's pair on its line, beside a click
 * - Slides the pair along the line's fold spans from the point of them
 *   nearest the click, towards the viewport's nearer edge: on a shallow
 *   line, leftwards for a click on the viewport's left half and
 *   rightwards for its right half; on a steep line, upwards for a click on
 *   the upper half and downwards for the lower. It stops as near the click
 *   as keeps its box `space.pointerClearancePx` from it, inside the
 *   viewport and clear of the exclusions.
 * - With no room that way, it tries the other way, and with none either
 *   way, it centres over that nearest point, clamped into the viewport.
 * - Allocates nothing.
 * - Pure maths, with no DOM or GPU access.
 * @param line The line on screen, with at least one span.
 * @param out The placement to write.
 * @param click The click, `x` and `y` in CSS pixels.
 * @param space The space to place the pair in.
 */
export const placeBesideClick = (line, out, click, space) => {
  const isStacked = !isSteep(line);
  const { segments } = line;
  const { viewport } = space;

  // The span and the fraction along it nearest the click.
  let footSpan = 0;
  let footT = 0;
  let footDistancePx = Infinity;
  for (let s = 0; s < segments.length; s += 4) {
    const ax = segments[s];
    const ay = segments[s + 1];
    const dx = segments[s + 2] - ax;
    const dy = segments[s + 3] - ay;
    const t = footOf(ax, ay, dx, dy, click.x, click.y);
    const distancePx = Math.hypot(ax + t * dx - click.x, ay + t * dy - click.y);
    if (distancePx < footDistancePx) {
      footDistancePx = distancePx;
      footSpan = s;
      footT = t;
    }
  }

  // −1 slides towards the viewport's left or top edge, 1 the other way.
  const towards = isStacked
    ? click.x < viewport.width / 2
      ? -1
      : 1
    : click.y < viewport.height / 2
      ? -1
      : 1;
  out.isStacked = isStacked;
  out.lineIndex = line.index;
  if (slideAlong(line, out, click, footSpan, footT, towards, space)) return;
  if (slideAlong(line, out, click, footSpan, footT, -towards, space)) return;

  const halfWidth = halfWidthOf(isStacked, space.pair);
  const halfHeight = halfHeightOf(isStacked, space.pair);
  const footX =
    segments[footSpan] +
    footT * (segments[footSpan + 2] - segments[footSpan]);
  const footY =
    segments[footSpan + 1] +
    footT * (segments[footSpan + 3] - segments[footSpan + 1]);
  out.x = clampInto(footX, halfWidth, viewport.width - halfWidth);
  out.y = clampInto(footY, halfHeight, viewport.height - halfHeight);
};

/** #### Places a nearby pair on its line, as near the pointer as it may
 * - Centres the pair on a point of the line's own fold spans, as near the
 *   pointer as keeps its box `space.pointerClearancePx` from it, inside
 *   the viewport, clear of the exclusions, and at least `space.pair.gapPx`
 *   from the first `shownCount` shown pairs; arranged by the line's slant.
 * - Writes `out` only in part when there is no room.
 * - Allocates nothing, so it is safe on every pointer move.
 * - Pure maths, with no DOM or GPU access.
 * @param line The line on screen.
 * @param out The placement to write.
 * @param pointer The pointer, `x` and `y` in CSS pixels.
 * @param shown The shown pairs' placements.
 * @param shownCount How many of `shown`, from the first, are in use.
 * @param space The space to place the pair in.
 * @returns True if the pair was placed, false if there is no room.
 */
export const placeNearbyPair = (
  line,
  out,
  pointer,
  shown,
  shownCount,
  space,
) => {
  const isStacked = !isSteep(line);
  const halfWidth = halfWidthOf(isStacked, space.pair);
  const halfHeight = halfHeightOf(isStacked, space.pair);
  const { segments } = line;
  let bestDistancePx = Infinity;
  for (let s = 0; s < segments.length; s += 4) {
    const ax = segments[s];
    const ay = segments[s + 1];
    const dx = segments[s + 2] - ax;
    const dy = segments[s + 3] - ay;
    const footT = footOf(ax, ay, dx, dy, pointer.x, pointer.y);
    for (let step = -1; step <= 1; step += 2) {
      const t = clearAlong(
        ax,
        ay,
        dx,
        dy,
        footT,
        step,
        halfWidth,
        halfHeight,
        pointer,
        shown,
        shownCount,
        space,
      );
      if (Number.isNaN(t)) continue;

      const x = ax + t * dx;
      const y = ay + t * dy;
      const distancePx = Math.hypot(x - pointer.x, y - pointer.y);
      if (distancePx < bestDistancePx) {
        bestDistancePx = distancePx;
        out.x = x;
        out.y = y;
      }
    }
  }
  out.isStacked = isStacked;
  out.lineIndex = line.index;

  return bestDistancePx < Infinity;
};

/** #### Places a pair centred on a point, clamped into the viewport
 * - For the keyboard's pair, centred on the middle of its line's longest
 *   span, and arranged by the line's slant.
 * - Allocates nothing.
 * - Pure maths, with no DOM or GPU access.
 * @param line The line on screen.
 * @param out The placement to write.
 * @param space The space to place the pair in.
 * @param x The point's x, in CSS pixels.
 * @param y The point's y, in CSS pixels.
 */
export const placeOnPoint = (line, out, space, x, y) => {
  const isStacked = !isSteep(line);
  const halfWidth = halfWidthOf(isStacked, space.pair);
  const halfHeight = halfHeightOf(isStacked, space.pair);
  out.isStacked = isStacked;
  out.lineIndex = line.index;
  out.x = clampInto(x, halfWidth, space.viewport.width - halfWidth);
  out.y = clampInto(y, halfHeight, space.viewport.height - halfHeight);
};

/** #### Returns which side of a line a point is on, by its pair's button
 * - The Mountain side is above a shallow line and right of a steep one,
 *   where the pair's Mountain button sits; the Valley side is the other.
 *   So the sides flip only on the bottom-left-to-top-right diagonal, where
 *   the line turns from shallow to steep.
 * - The sign of the cross product of the line's direction, pointing right
 *   on a shallow line and down on a steep one, and the point's offset from
 *   the line. A point exactly on the line counts as the Mountain side.
 * - Allocates nothing, so it is safe on every pointer move.
 * - Pure maths, with no DOM or GPU access.
 * @param line The line on screen.
 * @param x The point's x, in CSS pixels.
 * @param y The point's y, in CSS pixels.
 * @returns `"mountain"` or `"valley"`.
 */
export const sideOf = (line, x, y) => {
  const { segments } = line;
  const last = segments.length - 4;
  let dx = segments[last + 2] - segments[0];
  let dy = segments[last + 3] - segments[1];
  const isSteepLine = Math.abs(dy) > Math.abs(dx);
  if ((isSteepLine && dy < 0) || (!isSteepLine && dx < 0)) {
    dx = -dx;
    dy = -dy;
  }
  const cross = dx * (y - segments[1]) - dy * (x - segments[0]);

  return cross <= 0 ? "mountain" : "valley";
};

/** #### Returns true if a point lies in a shown pair's hitzone
 * - The pair's box grown on every side by `space.pair.hitzonePx`, edges
 *   included.
 * - Allocates nothing, so it is safe on every pointer move.
 * - Pure maths, with no DOM or GPU access.
 * @param placement The pair's placement.
 * @param space The space it was placed in, for the pair's size and zone.
 * @param x The point's x, in CSS pixels.
 * @param y The point's y, in CSS pixels.
 * @returns True if the point lies in the zone.
 */
export const zoneContains = (placement, space, x, y) => {
  const { pair } = space;

  return (
    Math.abs(x - placement.x) <=
      halfWidthOf(placement.isStacked, pair) + pair.hitzonePx &&
    Math.abs(y - placement.y) <=
      halfHeightOf(placement.isStacked, pair) + pair.hitzonePx
  );
};

/** #### Returns where a rectangle blocks a box sliding along a span
 * - The box's centre moves as `(ax + t × dx, ay + t × dy)`; the rectangle,
 *   centred on `(rx, ry)` with half-sizes `hx` and `hy`, already grown by
 *   the box's half-size and any gap, blocks it wherever the centre lies
 *   strictly inside.
 * - Allocates nothing.
 * @param ax The span's start x, in CSS pixels.
 * @param ay The span's start y, in CSS pixels.
 * @param dx The span's run in x, in CSS pixels.
 * @param dy The span's run in y, in CSS pixels.
 * @param t The fraction along the span to test.
 * @param step 1 to slide towards the span's end, −1 towards its start.
 * @param rx The rectangle's centre x, in CSS pixels.
 * @param ry The rectangle's centre y, in CSS pixels.
 * @param hx The rectangle's half-width, in CSS pixels.
 * @param hy The rectangle's half-height, in CSS pixels.
 * @returns NaN if the centre at `t` is not blocked; otherwise the fraction
 *   where the blocked stretch ends, slid that way, or ±Infinity if it
 *   never does.
 */
const blockedUntil = (ax, ay, dx, dy, t, step, rx, ry, hx, hy) => {
  if (
    Math.abs(ax + t * dx - rx) >= hx ||
    Math.abs(ay + t * dy - ry) >= hy
  ) {
    return NaN;
  }

  let end = step * Infinity;
  if (dx !== 0) {
    const first = (rx - hx - ax) / dx;
    const second = (rx + hx - ax) / dx;
    end =
      step > 0
        ? Math.min(end, Math.max(first, second))
        : Math.max(end, Math.min(first, second));
  }
  if (dy !== 0) {
    const first = (ry - hy - ay) / dy;
    const second = (ry + hy - ay) / dy;
    end =
      step > 0
        ? Math.min(end, Math.max(first, second))
        : Math.max(end, Math.min(first, second));
  }

  return end;
};

/** #### Returns a point's distance from other lines and placed pairs
 * - The least of its distances from every other line's spans and every
 *   placed pair's box: the touch layout takes the point where this is
 *   greatest.
 * - Allocates nothing.
 * @param x The point's x, in CSS pixels.
 * @param y The point's y, in CSS pixels.
 * @param line The line the point lies on, left out.
 * @param lines Every line on screen.
 * @param placed The placements so far.
 * @param space The space, for the pair's size.
 * @returns The distance, in CSS pixels.
 */
const clearanceOf = (x, y, line, lines, placed, space) => {
  let clearancePx = Infinity;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === line) continue;

    clearancePx = Math.min(clearancePx, distanceToSpans(lines[i], x, y));
  }
  for (let i = 0; i < placed.length; i++) {
    clearancePx = Math.min(clearancePx, distanceToBox(placed[i], space, x, y));
  }

  return clearancePx;
};

/** #### Returns the first fraction along a span, one way, where a box fits
 * - Slides the box's centre from `t` towards the span's end (`step` 1) or
 *   start (`step` −1), keeping it in the viewport, and past every stretch
 *   where the pointer's clearance, a shown pair's gap or an exclusion
 *   blocks it, until it fits or runs off the span.
 * - Allocates nothing, so it is safe on every pointer move.
 * @param ax The span's start x, in CSS pixels.
 * @param ay The span's start y, in CSS pixels.
 * @param dx The span's run in x, in CSS pixels.
 * @param dy The span's run in y, in CSS pixels.
 * @param t The fraction to start from, from 0 to 1.
 * @param step 1 or −1.
 * @param halfWidth The box's half-width, in CSS pixels.
 * @param halfHeight The box's half-height, in CSS pixels.
 * @param pointer The pointer to keep clear of, `x` and `y`, or null.
 * @param shown The shown pairs' placements.
 * @param shownCount How many of `shown`, from the first, are in use.
 * @param space The space, with its exclusions, pair, clearance and
 *   viewport.
 * @returns The fraction, or NaN if the box fits nowhere that way.
 */
const clearAlong = (
  ax,
  ay,
  dx,
  dy,
  t,
  step,
  halfWidth,
  halfHeight,
  pointer,
  shown,
  shownCount,
  space,
) => {
  const { exclusions, pair, pointerClearancePx, viewport } = space;
  const lengthPx = Math.hypot(dx, dy);
  const nudge = lengthPx === 0 ? 0 : EDGE_NUDGE_PX / lengthPx;

  // The stretch of the span that keeps the box in the viewport.
  let from = 0;
  let to = 1;
  if (dx === 0) {
    if (ax < halfWidth || ax > viewport.width - halfWidth) return NaN;
  } else {
    const first = (halfWidth - ax) / dx;
    const second = (viewport.width - halfWidth - ax) / dx;
    from = Math.max(from, Math.min(first, second));
    to = Math.min(to, Math.max(first, second));
  }
  if (dy === 0) {
    if (ay < halfHeight || ay > viewport.height - halfHeight) return NaN;
  } else {
    const first = (halfHeight - ay) / dy;
    const second = (viewport.height - halfHeight - ay) / dy;
    from = Math.max(from, Math.min(first, second));
    to = Math.min(to, Math.max(first, second));
  }
  if (from > to) return NaN;

  // Each pass clears one blocked stretch, which the slide never re-enters.
  let at = t;
  const passes = shownCount + exclusions.length + 3;
  for (let pass = 0; pass < passes; pass++) {
    if (at < from) {
      if (step < 0) return NaN;
      at = from;
    }
    if (at > to) {
      if (step > 0) return NaN;
      at = to;
    }

    let end = NaN;
    if (pointer !== null) {
      end = blockedUntil(
        ax,
        ay,
        dx,
        dy,
        at,
        step,
        pointer.x,
        pointer.y,
        halfWidth + pointerClearancePx,
        halfHeight + pointerClearancePx,
      );
    }
    for (let i = 0; i < shownCount && Number.isNaN(end); i++) {
      const other = shown[i];
      end = blockedUntil(
        ax,
        ay,
        dx,
        dy,
        at,
        step,
        other.x,
        other.y,
        halfWidth + halfWidthOf(other.isStacked, pair) + pair.gapPx,
        halfHeight + halfHeightOf(other.isStacked, pair) + pair.gapPx,
      );
    }
    for (let i = 0; i < exclusions.length && Number.isNaN(end); i++) {
      const { bottom, left, right, top } = exclusions[i];
      end = blockedUntil(
        ax,
        ay,
        dx,
        dy,
        at,
        step,
        (left + right) / 2,
        (top + bottom) / 2,
        (right - left) / 2 + halfWidth,
        (bottom - top) / 2 + halfHeight,
      );
    }
    if (Number.isNaN(end)) return at;

    at = end + step * nudge;
  }

  return NaN;
};

/** #### Clamps a value into a range, the range's start winning if it is empty
 * @param value The value.
 * @param min The range's start.
 * @param max The range's end.
 * @returns The clamped value.
 */
const clampInto = (value, min, max) => Math.max(min, Math.min(value, max));

/** #### Returns the fraction along a span of a point's foot, kept to its ends
 * - Allocates nothing.
 * @param ax The span's start x, in CSS pixels.
 * @param ay The span's start y, in CSS pixels.
 * @param dx The span's run in x, in CSS pixels.
 * @param dy The span's run in y, in CSS pixels.
 * @param x The point's x, in CSS pixels.
 * @param y The point's y, in CSS pixels.
 * @returns The fraction, from 0 to 1; 0 for a span of no length.
 */
const footOf = (ax, ay, dx, dy, x, y) => {
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return 0;

  return Math.min(
    Math.max(((x - ax) * dx + (y - ay) * dy) / lengthSquared, 0),
    1,
  );
};

/** #### Returns half a pair's box height, by its arrangement
 * @param isStacked True if the pair is stacked.
 * @param pair The side-by-side pair's `widthPx` and `heightPx`.
 * @returns Half the height, in CSS pixels.
 */
const halfHeightOf = (isStacked, pair) =>
  (isStacked ? pair.widthPx : pair.heightPx) / 2;

/** #### Returns half a pair's box width, by its arrangement
 * @param isStacked True if the pair is stacked.
 * @param pair The side-by-side pair's `widthPx` and `heightPx`.
 * @returns Half the width, in CSS pixels.
 */
const halfWidthOf = (isStacked, pair) =>
  (isStacked ? pair.heightPx : pair.widthPx) / 2;

/** #### Returns true if a pair's box at a point fits the touch layout
 * - In the viewport, edges included, clear of every exclusion, and at
 *   least the gap from every box placed.
 * - Allocates nothing.
 * @param x The box's centre x, in CSS pixels.
 * @param y The box's centre y, in CSS pixels.
 * @param halfWidth The box's half-width, in CSS pixels.
 * @param halfHeight The box's half-height, in CSS pixels.
 * @param placed The placements so far.
 * @param space The space, with its exclusions, pair and viewport.
 * @returns True if the box fits.
 */
const isBoxClear = (x, y, halfWidth, halfHeight, placed, space) => {
  const { exclusions, pair, viewport } = space;
  const isInViewport =
    x - halfWidth >= 0 &&
    y - halfHeight >= 0 &&
    x + halfWidth <= viewport.width &&
    y + halfHeight <= viewport.height;
  if (!isInViewport) return false;

  for (const { bottom, left, right, top } of exclusions) {
    const overlaps =
      x - halfWidth < right &&
      x + halfWidth > left &&
      y - halfHeight < bottom &&
      y + halfHeight > top;
    if (overlaps) return false;
  }
  for (const other of placed) {
    const isApart =
      Math.abs(x - other.x) >=
        halfWidth + halfWidthOf(other.isStacked, pair) + pair.gapPx ||
      Math.abs(y - other.y) >=
        halfHeight + halfHeightOf(other.isStacked, pair) + pair.gapPx;
    if (!isApart) return false;
  }

  return true;
};

/** #### Slides a pair along a line's spans one way from a foot, until it fits
 * - `towards` −1 slides towards smaller x on a shallow line and smaller y
 *   on a steep one, and 1 the other way, across the gaps between spans.
 *   The box keeps `space.pointerClearancePx` from the click, inside the
 *   viewport and clear of the exclusions; of the points that fit, it
 *   takes the nearest the foot.
 * - Writes `out.x` and `out.y` only if it finds one.
 * - Allocates nothing.
 * @param line The line on screen.
 * @param out The placement, its `isStacked` already written.
 * @param click The click, `x` and `y` in CSS pixels.
 * @param footSpan The index in `segments` of the span nearest the click.
 * @param footT The fraction along that span of the click's foot.
 * @param towards −1 or 1.
 * @param space The space to place the pair in.
 * @returns True if the pair fits somewhere that way.
 */
const slideAlong = (line, out, click, footSpan, footT, towards, space) => {
  const { segments } = line;
  const halfWidth = halfWidthOf(out.isStacked, space.pair);
  const halfHeight = halfHeightOf(out.isStacked, space.pair);

  // The coordinate the slide runs along: x on a shallow line, y on a
  // steep one, offset 0 for x and 1 for y.
  const axis = out.isStacked ? 0 : 1;
  const footAt =
    segments[footSpan + axis] +
    footT * (segments[footSpan + 2 + axis] - segments[footSpan + axis]);
  let bestAheadPx = Infinity;
  for (let s = 0; s < segments.length; s += 4) {
    const ax = segments[s];
    const ay = segments[s + 1];
    const dx = segments[s + 2] - ax;
    const dy = segments[s + 3] - ay;
    const run = axis === 0 ? dx : dy;
    if (run === 0) continue;

    // Along the span, the way that moves the coordinate `towards`.
    const step = Math.sign(run) * towards;
    let start = footT;
    if (s !== footSpan) {
      start = step > 0 ? 0 : 1;
      const farAheadPx =
        towards * (segments[s + axis] + (1 - start) * run - footAt);
      if (farAheadPx < 0) continue;
    }
    const t = clearAlong(
      ax,
      ay,
      dx,
      dy,
      start,
      step,
      halfWidth,
      halfHeight,
      click,
      NO_PAIRS,
      0,
      space,
    );
    if (Number.isNaN(t)) continue;

    const aheadPx = towards * (segments[s + axis] + t * run - footAt);
    if (aheadPx >= 0 && aheadPx < bestAheadPx) {
      bestAheadPx = aheadPx;
      out.x = ax + t * dx;
      out.y = ay + t * dy;
    }
  }

  return bestAheadPx < Infinity;
};
