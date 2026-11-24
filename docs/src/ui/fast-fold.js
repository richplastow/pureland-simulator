/**
 * @fileoverview
 * Fast Fold: the toolbar's checkbox, and the Fold Button pairs it shows
 * with no line active, laid out on every Fold Line that fits for touch, or
 * on as many of those nearest the mouse as `NEARBY_PAIR_COUNT` allows.
 */

import {
  distanceToBox,
  distanceToSpans,
  pairsApart,
  placeNearbyPair,
  placePairs,
  zoneContains,
} from "./fold-button-layout.js";

// A shown nearby pair whose box lies further than this from the pointer
// fades, in CSS pixels; a first guess, open to tuning.
const NEARBY_KEEP_RADIUS_PX = 200;

// The most nearby pairs shown at once, the lit line's included, so with
// one, the lit line's pair replaces any other; a trial, open to tuning, and
// more may suit designs whose lines each fold one way only.
const NEARBY_PAIR_COUNT = 1;

// How near the pointer a Fold Line's spans must come for the line to get a
// nearby pair, in CSS pixels; a first guess, open to tuning.
const NEARBY_RADIUS_PX = 120;

/** #### Connects the Fast Fold checkbox, and lays out its pairs
 * - The checkbox, `input[data-fast-fold]`, is ticked at connection,
 *   whatever the browser restored on reload, and passes each change on.
 *   Its label shows only while setShown() says so, by its `hidden`
 *   attribute.
 * - Keeps the pairs it shows, each with its placement, whose line is
 *   given by `lineIndex`, an index in the list of lines on screen. Shown
 *   pairs lie at least the gap apart, so their hitzones never overlap; a
 *   pair fading out is no longer shown, and has no zone.
 * - layOutTouch() lays out the touch layout, a pair on every line that
 *   fits, longest first, keeping in place any pair whose line keeps its
 *   placement. layOutNearby() runs the nearby layout on a mouse move: it
 *   fades the pairs far from the pointer, places the lit line's pair
 *   first, then up to `NEARBY_PAIR_COUNT` in all on the nearest lines. A
 *   nearby pair never moves once shown.
 * - Throws at once if the page has no `input[data-fast-fold]` inside a
 *   `<label>`.
 * @param foldButtons The Fold Buttons' pool, from connectFoldButtons().
 * @param hiddenButtonOf Called with a line's index in the list of lines on
 *   screen, and returns the button its pair hides, `"mountain"` or
 *   `"valley"`, for a direction the line cannot fold, or null for none.
 * @param isOverWhiteAt Called with a point on screen, `x` and `y` in CSS
 *   pixels, and returns true if the paper there shows its white side.
 * @param onToggle Called with true when the checkbox is ticked, and false
 *   when unticked.
 * @returns hideAll(), which hides every pair shown; hideNear(), which
 *   takes a placement and a space, and hides the pairs within the gap of
 *   it; isOn(), which returns true while the checkbox is ticked;
 *   layOutNearby() and layOutTouch(), as above; pairAt(), which takes a
 *   point and a space and returns the shown pair whose hitzone holds it,
 *   or null; pairOf(), which takes a line's index and returns its shown
 *   pair, or null; and setShown(), which takes true to show the checkbox.
 */
export const connectFastFold = (
  foldButtons,
  hiddenButtonOf,
  isOverWhiteAt,
  onToggle,
) => {
  const checkbox = document.querySelector("input[data-fast-fold]");
  const label = checkbox?.closest("label") ?? null;
  if (label === null) {
    throw new Error("No Fast Fold checkbox: label input[data-fast-fold]");
  }
  checkbox.checked = true;
  checkbox.addEventListener("change", () => onToggle(checkbox.checked));

  // The shown pairs and, in the same order, their placements, made once
  // and reused: only the first `shownCount` of each are in use.
  const shownPairs = [];
  const shownPlacements = [];
  let shownCount = 0;

  // Per line, whether this move's nearby layout has tried it; and the
  // pointer, as placeNearbyPair() takes it. Reused on every move.
  const tried = [];
  const pointer = { x: 0, y: 0 };

  /** #### Shows a pair at the placement written into it, and keeps it
   * - Hides the button for a direction its line cannot fold.
   * - Allocates only the position strings a pair newly placed writes.
   * @param pair The pair, from the pool.
   */
  const add = (pair) => {
    const { placement } = pair;
    pair.setHiddenButton(hiddenButtonOf(placement.lineIndex));
    pair.setOverWhite(isOverWhiteAt(placement.x, placement.y));
    pair.show();
    shownPairs[shownCount] = pair;
    shownPlacements[shownCount] = placement;
    shownCount++;
  };

  /** #### Hides the shown pair at an index, and stops keeping it
   * - The last shown pair takes its place, so walk the pairs from the end
   *   when removing as you go.
   * - Allocates nothing.
   * @param i The index, below `shownCount`.
   */
  const removeAt = (i) => {
    shownPairs[i].hide();
    shownCount--;
    shownPairs[i] = shownPairs[shownCount];
    shownPlacements[i] = shownPlacements[shownCount];
  };

  /** #### Hides every pair shown
   * - Allocates nothing.
   */
  const hideAll = () => {
    while (shownCount > 0) removeAt(shownCount - 1);
  };

  /** #### Hides the shown pairs within the gap of a placement
   * - For the keyboard's pair, placed among the touch layout's.
   * - Allocates nothing.
   * @param placement The placement to clear.
   * @param space The space it was placed in.
   */
  const hideNear = (placement, space) => {
    for (let i = shownCount - 1; i >= 0; i--) {
      if (!pairsApart(shownPlacements[i], placement, space)) removeAt(i);
    }
  };

  /** #### Runs the nearby layout for a mouse move
   * - Fades the shown pairs whose box lies further than
   *   `NEARBY_KEEP_RADIUS_PX` from the pointer. Then places the lit
   *   line's pair, if it has none, clear of the pointer but not of other
   *   lines' pairs: any it would come within the gap of fade, and if
   *   `NEARBY_PAIR_COUNT` still show, the one furthest from the pointer
   *   fades. Then, while fewer than `NEARBY_PAIR_COUNT` show, places a pair
   *   on the nearest line without one whose spans come within
   *   `NEARBY_RADIUS_PX`, clear of the pointer and the pairs shown; a line
   *   with no room is passed over.
   * - Allocates nothing, but a pair made when the pool has none free, and
   *   the position strings of a pair newly shown.
   * @param lines The Fold Lines on screen, each line's `index` its index
   *   in this list.
   * @param litLine The lit line on screen, or null.
   * @param x The pointer's x, in CSS pixels.
   * @param y The pointer's y, in CSS pixels.
   * @param space The space to lay out in.
   */
  const layOutNearby = (lines, litLine, x, y, space) => {
    pointer.x = x;
    pointer.y = y;
    for (let i = shownCount - 1; i >= 0; i--) {
      const distancePx = distanceToBox(shownPlacements[i], space, x, y);
      if (distancePx > NEARBY_KEEP_RADIUS_PX) removeAt(i);
    }

    if (litLine !== null && pairOf(litLine.index) === null) {
      const pair = foldButtons.acquire();
      const { placement } = pair;
      // Placed with a shown count of 0, so it ignores other lines' pairs.
      const isPlaced = placeNearbyPair(
        litLine,
        placement,
        pointer,
        shownPlacements,
        0,
        space,
      );
      if (isPlaced) {
        for (let i = shownCount - 1; i >= 0; i--) {
          if (!pairsApart(shownPlacements[i], placement, space)) removeAt(i);
        }
        if (shownCount >= NEARBY_PAIR_COUNT) {
          removeAt(furthestFrom(x, y, space));
        }
        add(pair);
      }
    }

    for (let i = 0; i < lines.length; i++) tried[i] = false;
    while (shownCount < NEARBY_PAIR_COUNT) {
      let nearest = -1;
      let nearestPx = NEARBY_RADIUS_PX;
      for (let i = 0; i < lines.length; i++) {
        if (tried[i] || pairOf(i) !== null) continue;

        const distancePx = distanceToSpans(lines[i], x, y);
        const isNearer =
          nearest === -1 ? distancePx <= nearestPx : distancePx < nearestPx;
        if (isNearer) {
          nearest = i;
          nearestPx = distancePx;
        }
      }
      if (nearest === -1) break;

      tried[nearest] = true;
      const pair = foldButtons.acquire();
      const isPlaced = placeNearbyPair(
        lines[nearest],
        pair.placement,
        pointer,
        shownPlacements,
        shownCount,
        space,
      );
      if (isPlaced) add(pair);
    }
  };

  /** #### Lays out the touch layout: a pair on every line that fits
   * - A pair whose line is placed again keeps showing, moved to its new
   *   placement if that differs; the others fade, and new pairs fade in.
   * - Allocates, so call it only when the scene comes to rest.
   * @param lines The Fold Lines on screen, each line's `index` its index
   *   in this list.
   * @param space The space to lay out in.
   * @param isMiddleFirst True to place each pair nearest its line's
   *   middle, as placePairs() sets out; false, the default, furthest from
   *   other lines and pairs.
   */
  const layOutTouch = (lines, space, isMiddleFirst = false) => {
    const placements = placePairs(lines, space, isMiddleFirst);
    const isTaken = placements.map(() => false);
    for (let i = shownCount - 1; i >= 0; i--) {
      const pair = shownPairs[i];
      const j = placements.findIndex(
        ({ lineIndex }) => lineIndex === pair.placement.lineIndex,
      );
      if (j === -1) {
        removeAt(i);
        continue;
      }
      isTaken[j] = true;
      Object.assign(pair.placement, placements[j]);
      pair.setHiddenButton(hiddenButtonOf(pair.placement.lineIndex));
      pair.setOverWhite(isOverWhiteAt(pair.placement.x, pair.placement.y));
      pair.show();
    }
    placements.forEach((placement, j) => {
      if (isTaken[j]) return;

      const pair = foldButtons.acquire();
      Object.assign(pair.placement, placement);
      add(pair);
    });
  };

  /** #### Returns the index of the shown pair furthest from a point
   * - Allocates nothing.
   * @param x The point's x, in CSS pixels.
   * @param y The point's y, in CSS pixels.
   * @param space The space the pairs were placed in.
   * @returns The index, below `shownCount`; −1 if none shows.
   */
  const furthestFrom = (x, y, space) => {
    let furthest = -1;
    let furthestPx = -1;
    for (let i = 0; i < shownCount; i++) {
      const distancePx = distanceToBox(shownPlacements[i], space, x, y);
      if (distancePx > furthestPx) {
        furthest = i;
        furthestPx = distancePx;
      }
    }

    return furthest;
  };

  /** #### Returns the shown pair whose hitzone holds a point, or null
   * - Allocates nothing, so it is safe on every pointer move.
   * @param x The point's x, in CSS pixels.
   * @param y The point's y, in CSS pixels.
   * @param space The space the pairs were placed in.
   * @returns The pair, or null.
   */
  const pairAt = (x, y, space) => {
    for (let i = 0; i < shownCount; i++) {
      if (zoneContains(shownPlacements[i], space, x, y)) return shownPairs[i];
    }

    return null;
  };

  /** #### Returns a line's shown pair, or null
   * - Allocates nothing, so it is safe on every pointer move.
   * @param lineIndex The line's index in the list of lines on screen.
   * @returns The pair, or null.
   */
  const pairOf = (lineIndex) => {
    for (let i = 0; i < shownCount; i++) {
      if (shownPlacements[i].lineIndex === lineIndex) return shownPairs[i];
    }

    return null;
  };

  return {
    hideAll,
    hideNear,
    isOn: () => checkbox.checked,
    layOutNearby,
    layOutTouch,
    pairAt,
    pairOf,
    setShown: (isShown) => {
      label.hidden = !isShown;
    },
  };
};
