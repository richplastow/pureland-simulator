/**
 * @fileoverview
 * A Basic Sandbox Mode session as its fold list, and its cut into a sheet.
 */

import { createFold } from "../designs/steps.js";
import { cutSheet } from "../fold/engine.js";

/** #### Creates the empty session, before any fold
 * - A session is `{ folds }`, frozen, each fold `{ from, targetRadians, to,
 *   type }`: its line's ends, `[x, y]` in metres in the folded plane, the
 *   side to the line's left moving; its finished angle, in radians; and
 *   `"mountain"` or `"valley"`. A session starts front up and never turns
 *   over, so the folded plane is always seen from the front.
 * @returns The empty session, frozen.
 */
export const createSession = () => Object.freeze({ folds: Object.freeze([]) });

/** #### Cuts a session's folds into a sheet, as a design of the pattern
 * - Builds the design `{ aspect, id, steps }`, with no `start`, one fold
 *   step per fold through every layer, and cuts it with cutSheet(), which
 *   throws as it does for a design: when a fold moves nothing, say.
 * - Pure maths, with no DOM or GPU access.
 * @param pattern The pattern folded, from `PATTERNS`: its `aspect` and
 *   `id`, which becomes the sheet's `designId`.
 * @param session The session, from createSession() or foldAt().
 * @returns The sheet, as cutSheet() returns it.
 */
export const cutSession = (pattern, session) =>
  cutSheet({
    aspect: pattern.aspect,
    id: pattern.id,
    steps: session.folds.map(({ from, targetRadians, to, type }) =>
      createFold(from, "all", to, type, { targetRadians }),
    ),
  });

/** #### Returns a new session with a fold made at a position in the old one
 * - Keeps the old session's first `position` folds, then the new fold, so
 *   a fold made after undoing drops the undone tail.
 * - Copies the fold, and its ends, so the caller's objects are never
 *   frozen. The session, its `folds` and each fold are frozen; the old
 *   session is never changed.
 * - Throws a RangeError if `position` is not a whole number from 0 to the
 *   old session's fold count.
 * - Its arguments run as the call reads, the session, then where, then
 *   what, rather than A-Z.
 * @param session The old session.
 * @param position The number of the old session's folds to keep.
 * @param fold The fold made: `from` and `to`, `[x, y]` in metres in the
 *   folded plane; `targetRadians`, in radians; and `type`, `"mountain"`
 *   or `"valley"`.
 * @returns The new session, frozen.
 */
export const foldAt = (session, position, fold) => {
  const { folds } = session;
  if (!Number.isInteger(position) || position < 0 || position > folds.length) {
    throw new RangeError(
      `Position ${position} is outside a session of ${folds.length} folds`,
    );
  }

  const { from, targetRadians, to, type } = fold;
  const made = Object.freeze({
    from: Object.freeze([from[0], from[1]]),
    targetRadians,
    to: Object.freeze([to[0], to[1]]),
    type,
  });

  return Object.freeze({
    folds: Object.freeze([...folds.slice(0, position), made]),
  });
};
