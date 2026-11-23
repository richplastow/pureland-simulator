/**
 * @fileoverview
 * A path of a design's folds, made in any order, cut as a gameplay sheet.
 */

import { cutSheet } from "../fold/engine.js";

/** #### Cuts a path of a design's folds into a sheet, as a design of its own
 * - Builds the design `{ aspect, id, steps }`, one fold step per fold in
 *   the path, in the order folded, with no `start` and no turn-overs, and
 *   cuts it with cutSheet(). The sheet's folds are already in the front's
 *   terms, so leaving out the `start` reads none through a view frame
 *   twice; the stage centres then come from the unrolled frame, which
 *   matches the design's own for a start that is only a side.
 * - Every step turns its moving side only, whatever the design says, so
 *   every flat fold lies in the folded plane, where the Sandbox's picking
 *   and Fold Buttons read the paper.
 * - A fold's `layers` name a fold by its index in the design; each is
 *   renamed to that fold's place in the path. A `{ heldBy }` naming a fold
 *   not yet in the path becomes `"all"`, since nothing is yet moved by it.
 * - Throws a RangeError, before any fold runs, when a fold in the path is
 *   repeated or is not an index in `sheet.folds`, and when a `{ movedBy }`
 *   names a fold not yet in the path, since its paper is not there to
 *   move. Throws as cutSheet() does otherwise: when a fold moves nothing,
 *   say.
 * - The sheet then takes the design's `start` and `leanRadians`, so it
 *   sits in the design's starting pose, and prints the design's whole
 *   crease pattern, never only the creases the path makes.
 * - Its arguments run as the call reads, the sheet, then the path, then
 *   whether it is finished, rather than A-Z, as foldAt()'s do in
 *   `sandbox/session.js`.
 * - Pure maths, with no DOM or GPU access.
 * @param sheet The design's own sheet, from cutSheet(design).
 * @param path Indices in `sheet.folds`, each at most once, in the order
 *   folded.
 * @param isFinished True if the path is the design's goal, so the stepper
 *   fades its lines out at the end.
 * @returns The sheet, as cutSheet() returns it, with `designId` the
 *   design's; `finishedPosition` the path's length if `isFinished`, and
 *   null otherwise; `leanRadians` and `start` the design's; and
 *   `printedLines` the design's `creaseLines`.
 */
export const cutPath = (sheet, path, isFinished) => {
  const { aspect, creaseLines, designId, folds, leanRadians, start } = sheet;
  const steps = path.map((foldIndex, position) => {
    const fold = folds[foldIndex];
    if (
      !Number.isInteger(foldIndex) ||
      fold === undefined ||
      path.indexOf(foldIndex) !== position
    ) {
      throw new RangeError(
        `Path [${path.join(", ")}] of design "${designId}" repeats fold ` +
          `${foldIndex} or names one the design lacks`,
      );
    }

    return {
      ...fold,
      layers: layersAt(sheet, path, position),
      turns: "moving-side",
    };
  });

  return {
    ...cutSheet({ aspect, id: designId, steps }),
    finishedPosition: isFinished ? path.length : null,
    leanRadians,
    printedLines: creaseLines,
    start,
  };
};

/** #### Returns a fold's layer selection, renamed to places in the path
 * @param sheet The design's own sheet, with its `designId` and `folds`.
 * @param path Indices in `sheet.folds`, in the order folded.
 * @param position The fold's place in the path.
 * @returns `"all"`, or `{ heldBy }` or `{ movedBy }`, naming a place in
 *   the path.
 */
const layersAt = (sheet, path, position) => {
  const { layers } = sheet.folds[path[position]];
  if (layers === "all") return layers;

  // Checked in the order the engine reads them.
  const key = layers.movedBy !== undefined ? "movedBy" : "heldBy";
  const named = path.slice(0, position).indexOf(layers[key]);
  if (named !== -1) return { [key]: named };
  if (key === "heldBy") return "all";

  throw new RangeError(
    `Fold ${path[position]} of design "${sheet.designId}" moves the ` +
      `paper of fold ${layers.movedBy}, which the path has not yet made`,
  );
};
