/**
 * @fileoverview
 * Reports drags on an element, and presses that do not move, with the
 * slop that tells one from the other.
 */

// How far, in CSS pixels, a press may stray from where it went down and
// still count as a press rather than a drag: a mouse button or a trackpad
// pressed down often nudges the pointer a pixel or two. Tuned by eye.
export const DRAG_THRESHOLD_PX = 4;

/** #### Reports each drag on an element, and each press that does not move
 * - Starts a drag on a press of the primary pointer's primary button, and
 *   captures that pointer, so the drag carries on over other elements and
 *   outside the window. Mouse, touch and pen share this one path; a second
 *   finger is not primary, and both its press and its moves are ignored.
 * - The pointer capture is the drag's only state, beside whether it has
 *   moved: the browser releases it on `pointerup` and `pointercancel`,
 *   which ends the drag. A `data-dragging` attribute on the element
 *   mirrors it, for the CSS's grabbing cursor, set on the press and
 *   removed when the capture is lost.
 * - A press moves only once the pointer strays more than
 *   `DRAG_THRESHOLD_PX` from where it went down; its first move then
 *   reports the whole way from there, so the drag loses nothing. A press
 *   that ends, on `pointerup`, without having moved is reported as a
 *   press, not a drag; a press cancelled by the browser, on
 *   `pointercancel`, is neither.
 * - Cancels the element's `mousedown` default, so a press or a
 *   double-click on it leaves focus where it was, such as on the design
 *   picker while the toolbar is hidden. In Firefox, that also stops the
 *   element's active state
 *   (https://bugzilla.mozilla.org/show_bug.cgi?id=771241), so the cursor
 *   follows `data-dragging` rather than that state.
 * - Allocates nothing per move.
 * @param element The element whose drags and presses to report.
 * @param onDrag Called on each move with the change since the last event,
 *   right and down, in CSS pixels.
 * @param onPress Called when a press ends without moving, with where it
 *   ended, right and down from the element's top-left corner, in CSS
 *   pixels.
 * @TODO Revisit presses that fail to pick. In Chrome on macOS, a click on
 *   a lattice line in Sandbox Mode still now and then shows no Fold
 *   Buttons, even with `DRAG_THRESHOLD_PX` of slop and a double-click no
 *   longer resetting an unspun paper (startSpinReset() in spin.js). The
 *   cause is not found: it may always have been so. See Plan 17's Audit,
 *   2026-11-15.
 */
export const connectDrag = (element, onDrag, onPress) => {
  // The pointer's position at the last event of the drag, in CSS pixels,
  // and whether it has moved since the press.
  let hasMoved = false;
  let lastClientX = 0;
  let lastClientY = 0;

  element.addEventListener("mousedown", (event) => event.preventDefault());

  element.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;

    element.setPointerCapture(event.pointerId);
    element.dataset.dragging = "";
    hasMoved = false;
    lastClientX = event.clientX;
    lastClientY = event.clientY;
  });

  // A second finger's capture, implicit for a touch, ends no drag.
  element.addEventListener("lostpointercapture", (event) => {
    if (!event.isPrimary) return;

    delete element.dataset.dragging;
  });

  // A touch captures its pointer implicitly, a second finger's included, so
  // capture alone would let that finger's moves into the drag. A move event
  // that leaves the pointer where it was, as a pen's change of pressure
  // can, moves nothing, and nor does one within the slop of the press.
  element.addEventListener("pointermove", (event) => {
    if (!event.isPrimary || !element.hasPointerCapture(event.pointerId)) {
      return;
    }
    const deltaXPixels = event.clientX - lastClientX;
    const deltaYPixels = event.clientY - lastClientY;
    if (deltaXPixels === 0 && deltaYPixels === 0) return;
    // Until it moves, the last position is still the press's.
    const isWithinSlop =
      !hasMoved &&
      Math.hypot(deltaXPixels, deltaYPixels) <= DRAG_THRESHOLD_PX;
    if (isWithinSlop) return;

    hasMoved = true;
    onDrag(deltaXPixels, deltaYPixels);
    lastClientX = event.clientX;
    lastClientY = event.clientY;
  });

  // The capture is released only after `pointerup`, so it still marks the
  // press here.
  element.addEventListener("pointerup", (event) => {
    if (!event.isPrimary || !element.hasPointerCapture(event.pointerId)) {
      return;
    }

    if (!hasMoved) onPress(event.offsetX, event.offsetY);
  });
};
