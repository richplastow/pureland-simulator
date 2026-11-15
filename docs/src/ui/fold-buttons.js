/**
 * @fileoverview
 * The two Fold Buttons, valley and mountain, laid over the canvas above a
 * picked line: their icons, their place on screen and their colours.
 */

import { Vector3 } from "three";

// The pair's centre sits this far above the pick point on screen, in CSS
// pixels; tuned by eye.
const FOLD_BUTTON_OFFSET_PX = 28;

// Each button, in the order they sit and Tab reaches them: its fold as the
// player sees it, its accessible name, and its icon, in a view box 24 units
// square: the fold's dash pattern as the paper prints it, dashed for a
// valley and dash-dot-dot for a mountain, as SVG's `stroke-dasharray`, over
// a shape, a V for a valley and a chevron, like a peak, for a mountain, as
// SVG polyline `points`.
const FOLD_BUTTONS = Object.freeze([
  Object.freeze({
    dashes: "4 3",
    label: "Valley fold",
    shape: "6,11 12,19 18,11",
    type: "valley",
  }),
  Object.freeze({
    dashes: "5 2 1 2 1 2",
    label: "Mountain fold",
    shape: "6,19 12,11 18,19",
    type: "mountain",
  }),
]);

// The dash pattern's line across the icon, in the view box's units.
const ICON_DASH_LINE = Object.freeze({ x1: 3, x2: 21, y: 6 });
const ICON_VIEW_BOX = "0 0 24 24";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

// Scratch for the pick point as it is carried to the screen, created once.
const screenPoint = new Vector3();

/** #### Creates the Fold Buttons, hidden, and passes each press on
 * - Two `<button>`s in a `.fold-buttons` container, which is inserted
 *   directly after the canvas, so Tab runs from the canvas to the Valley
 *   button, then the Mountain button, then the toolbar. Each holds an
 *   inline SVG icon, hidden from assistive technology, and keeps its icon
 *   and its `aria-label` whichever side of the paper faces the camera.
 * - Returns hide(), setColors(), setOverWhite() and showAt(). The
 *   container is hidden, by its `hidden` attribute, until showAt() is
 *   called; the CSS fades it in and out.
 * - A press, by pointer or by Enter or Space, marks its button
 *   `data-bumped` before passing the fold on, which the CSS plays as a
 *   bump before the pair fades out. showAt() clears the mark.
 * - Each button passes on the fold it shows, as the player sees it; the
 *   caller turns that into the front's terms.
 * @param camera The camera the scene renders with.
 * @param canvas The canvas the scene renders to, which fills the viewport.
 * @param onFold Called on a press with the fold as the player sees it,
 *   `"mountain"` or `"valley"`.
 * @param stretchGroup The paper's innermost group, in whose frame showAt()
 *   takes its point.
 * @returns hide(), which hides the buttons; setColors(), which takes the
 *   paper colour's deeper and lighter shades, each a hex number in sRGB;
 *   setOverWhite(), which takes true for the theme over the white side;
 *   and showAt(), which takes a point in `stretchGroup`'s frame, a Vector3
 *   in metres, and shows the pair centred above it.
 */
export const connectFoldButtons = (camera, canvas, onFold, stretchGroup) => {
  const container = document.createElement("div");
  container.className = "fold-buttons";
  container.hidden = true;
  for (const { dashes, label, shape, type } of FOLD_BUTTONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.append(createIcon(dashes, shape));
    button.addEventListener("click", () => {
      button.toggleAttribute("data-bumped", true);
      onFold(type);
    });
    container.append(button);
  }
  canvas.after(container);

  /** #### Hides the buttons, handing keyboard focus back to the canvas
   * - A button that held keyboard focus would lose it to the page as it
   *   hides, so focus moves to the canvas first, where the arrow keys pick
   *   the next line. Focus from a pointer press stays where it falls.
   */
  const hide = () => {
    const focused = document.activeElement;
    if (container.contains(focused) && focused.matches(":focus-visible")) {
      canvas.focus();
    }
    container.hidden = true;
  };

  /** #### Sets the paper colour's two shades, which the buttons' themes take
   * - Writes `--fold-button-deeper` and `--fold-button-lighter` on the
   *   container, which the CSS's two themes read: over the coloured side,
   *   the lighter shade behind black ink; over the white side, a white
   *   behind the deeper shade.
   * - Allocates strings, so call it only when the paper colour changes.
   * @param deeper The deeper shade, as a hex number in sRGB.
   * @param lighter The lighter shade, as a hex number in sRGB.
   */
  const setColors = (deeper, lighter) => {
    container.style.setProperty("--fold-button-deeper", toCss(deeper));
    container.style.setProperty("--fold-button-lighter", toCss(lighter));
  };

  /** #### Sets whether the buttons take the theme for over the white side
   * - Toggles `data-over-white` on the container, which the CSS reads.
   * - Allocates nothing.
   * @param isOverWhite True if the paper under the pick shows its white
   *   side.
   */
  const setOverWhite = (isOverWhite) => {
    container.toggleAttribute("data-over-white", isOverWhite);
  };

  /** #### Shows the pair centred `FOLD_BUTTON_OFFSET_PX` above a point
   * - Carries the point to the screen with localToWorld() and project(),
   *   so call it after the frame's render, which updates the camera's
   *   matrices. The canvas fills the viewport, so its pixels are the
   *   viewport's, which the fixed container is placed in.
   * - Writes `--fold-buttons-x` and `--fold-buttons-y` on the container,
   *   which the CSS reads, and which it keeps within the viewport near
   *   an edge. Allocates strings, so call it only when the point, the
   *   pose, the spin or the canvas size changes.
   * @param point The point, a Vector3 in metres in `stretchGroup`'s frame.
   */
  const showAt = (point) => {
    stretchGroup.localToWorld(screenPoint.copy(point)).project(camera);
    const xPixels = ((screenPoint.x + 1) / 2) * canvas.clientWidth;
    const yPixels =
      ((1 - screenPoint.y) / 2) * canvas.clientHeight - FOLD_BUTTON_OFFSET_PX;
    container.style.setProperty("--fold-buttons-x", `${xPixels}px`);
    container.style.setProperty("--fold-buttons-y", `${yPixels}px`);
    for (const button of container.children) {
      button.removeAttribute("data-bumped");
    }
    container.hidden = false;
  };

  return { hide, setColors, setOverWhite, showAt };
};

/** #### Creates a Fold Button's icon: a dash pattern over a shape
 * - The CSS strokes both in the button's ink, `currentColor`, and fills
 *   nothing.
 * @param dashes The dash pattern, as SVG's `stroke-dasharray`.
 * @param shape The shape, as an SVG polyline's `points`.
 * @returns The `<svg>` element.
 */
const createIcon = (dashes, shape) => {
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", ICON_VIEW_BOX);

  const line = document.createElementNS(SVG_NAMESPACE, "line");
  line.setAttribute("stroke-dasharray", dashes);
  line.setAttribute("x1", String(ICON_DASH_LINE.x1));
  line.setAttribute("x2", String(ICON_DASH_LINE.x2));
  line.setAttribute("y1", String(ICON_DASH_LINE.y));
  line.setAttribute("y2", String(ICON_DASH_LINE.y));

  const polyline = document.createElementNS(SVG_NAMESPACE, "polyline");
  polyline.setAttribute("points", shape);
  svg.append(line, polyline);

  return svg;
};

/** #### Formats a colour as a CSS hex string, such as `#ffffff`
 * @param color The colour, as a hex number in sRGB.
 * @returns The CSS colour.
 */
const toCss = (color) => `#${color.toString(16).padStart(6, "0")}`;
