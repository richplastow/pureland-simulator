/**
 * @fileoverview
 * Reports drags on an element, presses that do not move, and presses that
 * something under the pointer claims, with the slop that tells a press
 * from a drag for each kind of pointer.
 */

// How far, in CSS pixels, a mouse press may stray from where it went down
// and still count as a press rather than a drag: a mouse button or a
// trackpad pressed down often nudges the pointer a pixel or two. Tuned by
// eye.
export const DRAG_THRESHOLD_PX = 4;

// The same for a touch or a pen, in CSS pixels: a finger wobbles more than
// a mouse, so a tap allows more. About 1.7 mm on an iPhone 12 Pro's screen;
// a first guess, to tune on a real phone.
export const TOUCH_DRAG_THRESHOLD_PX = 10;

/** #### Reports an element's drags, unmoved presses and claimed presses
 * - Starts on a press of the primary pointer's primary button, and
 *   captures that pointer, so a drag carries on over other elements and
 *   outside the window. Mouse, touch and pen share this one path; a second
 *   finger is not primary, and both its press and its moves are ignored.
 * - Asks `claimsPress` first. A claimed press captures the pointer but
 *   never drags and sets no `data-dragging`: on `pointerup`, however far
 *   the pointer has moved, it is reported to `onClaimedPress`, and on
 *   `pointercancel` it is dropped.
 * - Any other press is the drag's. The pointer capture is its only state,
 *   beside whether it has moved: the browser releases it on `pointerup`
 *   and `pointercancel`, which ends the drag, reported to `onDragEnd` if
 *   it moved. A `data-dragging` attribute on the element mirrors it, for
 *   the CSS's grabbing cursor, set on the press and removed when the
 *   capture is lost.
 * - A press moves only once the pointer strays more than its kind's slop
 *   from where it went down: `DRAG_THRESHOLD_PX` for a mouse, and
 *   `TOUCH_DRAG_THRESHOLD_PX` for a touch or a pen. Its first move then
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
 * @param handlers The callbacks: `claimsPress`, called on each press with
 *   where it went down, right and down from the element's top-left corner
 *   in CSS pixels, and its `pointerType`, which returns true to claim it;
 *   `onClaimedPress`, called when a claimed press ends; `onDrag`, called
 *   on each move of a drag with the change since the last event, right
 *   and down, in CSS pixels; `onDragEnd`, called when a drag that moved
 *   ends; and `onPress`, called when a press that is not claimed ends
 *   without moving, with where it ended, as `claimsPress` takes it, and
 *   its `pointerType`.
 */
export const connectDrag = (element, handlers) => {
  const { claimsPress, onClaimedPress, onDrag, onDragEnd, onPress } =
    handlers;

  // Whether the press under way has moved since it went down, and whether
  // it is claimed; the pointer's position at the last event of the drag,
  // in CSS pixels; and the press's slop, in CSS pixels.
  let hasMoved = false;
  let isClaimed = false;
  let lastClientX = 0;
  let lastClientY = 0;
  let slopPx = DRAG_THRESHOLD_PX;

  element.addEventListener("mousedown", (event) => event.preventDefault());

  element.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;

    element.setPointerCapture(event.pointerId);
    hasMoved = false;
    isClaimed = claimsPress(event.offsetX, event.offsetY, event.pointerType);
    if (isClaimed) return;

    element.dataset.dragging = "";
    lastClientX = event.clientX;
    lastClientY = event.clientY;
    slopPx =
      event.pointerType === "mouse"
        ? DRAG_THRESHOLD_PX
        : TOUCH_DRAG_THRESHOLD_PX;
  });

  // A second finger's capture, implicit for a touch, ends no drag.
  element.addEventListener("lostpointercapture", (event) => {
    if (!event.isPrimary) return;

    delete element.dataset.dragging;
    if (!isClaimed && hasMoved) onDragEnd();
    hasMoved = false;
    isClaimed = false;
  });

  // A touch captures its pointer implicitly, a second finger's included, so
  // capture alone would let that finger's moves into the drag. A move event
  // that leaves the pointer where it was, as a pen's change of pressure
  // can, moves nothing, and nor does one within the slop of the press.
  element.addEventListener("pointermove", (event) => {
    if (
      !event.isPrimary ||
      isClaimed ||
      !element.hasPointerCapture(event.pointerId)
    ) {
      return;
    }
    const deltaXPixels = event.clientX - lastClientX;
    const deltaYPixels = event.clientY - lastClientY;
    if (deltaXPixels === 0 && deltaYPixels === 0) return;
    // Until it moves, the last position is still the press's.
    const isWithinSlop =
      !hasMoved && Math.hypot(deltaXPixels, deltaYPixels) <= slopPx;
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

    if (isClaimed) {
      onClaimedPress();
    } else if (!hasMoved) {
      onPress(event.offsetX, event.offsetY, event.pointerType);
    }
  });
};
