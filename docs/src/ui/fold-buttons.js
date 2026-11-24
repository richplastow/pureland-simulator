/**
 * @fileoverview
 * The Fold Button pairs, valley and mountain, laid over the canvas on Fold
 * Lines: their icons, their place on screen, their arrangement and their
 * colours, in a pool that keeps every pair made for the page's life.
 */

// Each button's accessible name, by its fold as the player sees it, which
// the status line also reads.
export const FOLD_BUTTON_LABELS = Object.freeze({
  mountain: "Mountain fold",
  valley: "Valley fold",
});

// Each button, in the order they sit in the DOM: its fold as the player
// sees it, its accessible name, and its icon, in a view box 24 units
// square: the fold's dash pattern as the paper prints it, dashed for a
// valley and dash-dot-dot for a mountain, as SVG's `stroke-dasharray`, over
// a shape, a V for a valley and a chevron, like a peak, for a mountain, as
// SVG polyline `points`. Side by side, Valley sits left; stacked, the CSS
// reverses the column, so Mountain sits on top.
const FOLD_BUTTONS = Object.freeze([
  Object.freeze({
    dashes: "4 3",
    label: FOLD_BUTTON_LABELS.valley,
    shape: "6,11 12,19 18,11",
    type: "valley",
  }),
  Object.freeze({
    dashes: "5 2 1 2 1 2",
    label: FOLD_BUTTON_LABELS.mountain,
    shape: "6,19 12,11 18,19",
    type: "mountain",
  }),
]);

// The dash pattern's line across the icon, in the view box's units.
const ICON_DASH_LINE = Object.freeze({ x1: 3, x2: 21, y: 6 });
const ICON_VIEW_BOX = "0 0 24 24";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

/** #### Creates the pool of Fold Button pairs, and passes each press on
 * - Each pair is two `<button>`s, Valley then Mountain, in a
 *   `.fold-buttons` container inserted directly after the canvas, so it
 *   paints over it. Each button holds an inline SVG icon, hidden from
 *   assistive technology, keeps its icon and its `aria-label` whichever
 *   side of the paper faces the camera, and takes `tabindex="-1"`, out of
 *   the Tab order: Up and Down on the focused canvas press them instead.
 * - A pair is made on demand, by acquire(), hidden until its show(), and
 *   kept for the page's life, so one can fade out while the next fades
 *   in. The CSS fades each in and out.
 * - A press on a button, by pointer or by its pair's press(), marks it
 *   `data-bumped` before passing the fold on, which the CSS plays as a
 *   bump before the pair fades out. show() clears the mark. A pointer
 *   press leaves focus where it was, as one on the canvas does, so the
 *   canvas keeps the keyboard's pick.
 * - One more pair, never shown, is laid out but invisible, so measure()
 *   can read a pair's size from the CSS, `--fold-button-size` and
 *   `--controls-gap`.
 * - Each button passes on the fold it shows, as the player sees it, with
 *   its pair; the caller turns that into the front's terms.
 * - One button of a pair can be hidden, for a direction its line cannot
 *   fold; a press on a hidden button, by its pair's press(), does nothing.
 * - Reports a pointer that hovers over a shown pair's buttons, a mouse or a
 *   pen in range, never a touch, as it enters one, and as it leaves them
 *   for anywhere but the canvas, whose own hover then takes over, or
 *   another shown pair, which reports itself. The CSS passes the pointer
 *   through the pair's box around its round buttons to the canvas.
 * @param canvas The canvas the scene renders to, which fills the viewport.
 * @param onFold Called on a press with the fold as the player sees it,
 *   `"mountain"` or `"valley"`, and the pair pressed.
 * @param onHover Called with the pair a hovering pointer enters, or with
 *   null as it leaves one for anywhere but the canvas or another pair, and
 *   the pointer's `pointerType`.
 * @returns acquire(), which returns a pair that is hidden and done fading,
 *   making one if none is, as createPair() returns it; holds(), which
 *   takes an element, or null, and returns true if it lies in a shown
 *   pair; measure(), which writes a side-by-side pair's `widthPx` and
 *   `heightPx`, in CSS pixels, into the object it takes; and setColors(),
 *   which takes the paper colour's deeper and lighter shades, each a hex
 *   number in sRGB.
 */
export const connectFoldButtons = (canvas, onFold, onHover) => {
  const pairs = [];
  const measured = createContainer();
  measured.toggleAttribute("data-measured", true);
  canvas.after(measured);

  /** #### Returns a pair that is hidden and done fading, making one if none
   * - Reads each hidden pair's computed `display`, which the fade holds
   *   until it ends, so call it only when a pair is about to show.
   * - Allocates only when it makes a pair.
   * @returns The pair, still hidden, with its `placement` to write.
   */
  const acquire = () => {
    for (let i = 0; i < pairs.length; i++) {
      if (pairs[i].isFree()) return pairs[i];
    }
    const pair = createPair(canvas, onHover, onFold, onLeave);
    pairs.push(pair);

    return pair;
  };

  /** #### Returns true if an element lies in a shown pair
   * - A pair fading out passes the pointer through, so it holds nothing.
   * - Allocates nothing.
   * @param element The element, or null.
   * @returns True if a shown pair holds it.
   */
  const holds = (element) => {
    for (let i = 0; i < pairs.length; i++) {
      if (pairs[i].holds(element)) return true;
    }

    return false;
  };

  /** #### Writes a side-by-side pair's size, as the CSS lays it out
   * - Call it before each layout, since the size follows the root font
   *   size.
   * - Allocates a DOMRect.
   * @param size The object to write `widthPx` and `heightPx` into, in CSS
   *   pixels.
   */
  const measure = (size) => {
    const { height, width } = measured.getBoundingClientRect();
    size.heightPx = height;
    size.widthPx = width;
  };

  /** #### Passes on a hovering pointer leaving a pair, unless for the paper
   * - Allocates nothing.
   * @param pointerType The pointer's `pointerType`.
   * @param relatedTarget The element the pointer moves onto, or null if it
   *   leaves the window.
   */
  const onLeave = (pointerType, relatedTarget) => {
    if (relatedTarget !== canvas && !holds(relatedTarget)) {
      onHover(null, pointerType);
    }
  };

  /** #### Sets the paper colour's two shades, which every pair's theme takes
   * - Writes `--fold-button-deeper` and `--fold-button-lighter` on the
   *   pairs' parent, which every pair inherits, made now or later: over
   *   the coloured side, the lighter shade behind black ink; over the
   *   white side, a white behind the deeper shade.
   * - Allocates strings, so call it only when the paper colour changes.
   * @param deeper The deeper shade, as a hex number in sRGB.
   * @param lighter The lighter shade, as a hex number in sRGB.
   */
  const setColors = (deeper, lighter) => {
    const { style } = canvas.parentElement;
    style.setProperty("--fold-button-deeper", toCss(deeper));
    style.setProperty("--fold-button-lighter", toCss(lighter));
  };

  return { acquire, holds, measure, setColors };
};

/** #### Creates one pair, hidden, after the canvas
 * - Allocates, so call it only when the pool has no free pair.
 * @param canvas The canvas, which the pair is inserted after.
 * @param onEnter Called with the pair, and the pointer's `pointerType`, as
 *   a hovering pointer, not a touch, enters it.
 * @param onFold Called on a press with the fold and the pair.
 * @param onLeave Called with the pointer's `pointerType` and the element a
 *   hovering pointer, not a touch, moves onto as it leaves the pair, or
 *   null.
 * @returns The pair: its `placement`, `isStacked`, `lineIndex`, `x` and
 *   `y`, written by its owner before show(); hide(), isFree() and
 *   isShown(); holds(), which takes an element, or null, and returns true
 *   if the pair is shown and holds it; press(), which takes a fold and
 *   presses that button, unless it is hidden;
 *   setEmphasised(), which takes true to draw the pair as hovered;
 *   setHiddenButton(), which takes a fold, or null, and hides that button
 *   alone, showing the other;
 *   setOverWhite(), which takes true for the theme over the white side;
 *   setProxied(), which takes a fold, or null, and draws that button as
 *   hovered; and show(), which shows the pair at its placement.
 */
const createPair = (canvas, onEnter, onFold, onLeave) => {
  const container = createContainer();
  container.hidden = true;
  const computed = getComputedStyle(container);
  const [valleyButton, mountainButton] = container.children;
  const placement = { isStacked: false, lineIndex: -1, x: 0, y: 0 };
  let proxiedButton = null;

  // The position last written to the style, so an unmoved pair writes no
  // strings.
  let writtenX = NaN;
  let writtenY = NaN;

  /** #### Returns the button for a fold
   * @param type `"mountain"` or `"valley"`.
   * @returns The button.
   */
  const buttonOf = (type) =>
    type === "mountain" ? mountainButton : valleyButton;

  /** #### Hides the pair, which the CSS fades out
   * - An emphasised pair drops the mark and, marked `data-lingering`,
   *   fades only after `--fold-button-linger-duration`, as it shrinks
   *   back. A button that held keyboard focus hands it to the canvas
   *   first, since it would otherwise lose it to the page.
   * - Allocates nothing.
   */
  const hide = () => {
    if (container.hidden) return;

    const focused = document.activeElement;
    if (container.contains(focused) && focused.matches(":focus-visible")) {
      canvas.focus();
    }
    container.toggleAttribute(
      "data-lingering",
      container.hasAttribute("data-emphasised"),
    );
    container.removeAttribute("data-emphasised");
    setProxied(null);
    container.hidden = true;
  };

  /** #### Presses one of the pair's buttons, as a pointer would
   * - Marks it `data-bumped`, then passes the fold on; does nothing if the
   *   button is hidden.
   * @param type `"mountain"` or `"valley"`.
   */
  const press = (type) => {
    const button = buttonOf(type);
    if (button.hidden) return;

    button.toggleAttribute("data-bumped", true);
    onFold(type, pair);
  };

  /** #### Hides one of the pair's buttons, or none, showing the other
   * - Written only on change.
   * - Allocates nothing.
   * @param type `"mountain"` or `"valley"`, the button to hide, or null
   *   to show both.
   */
  const setHiddenButton = (type) => {
    const isValleyHidden = type === "valley";
    const isMountainHidden = type === "mountain";
    if (valleyButton.hidden !== isValleyHidden) {
      valleyButton.hidden = isValleyHidden;
    }
    if (mountainButton.hidden !== isMountainHidden) {
      mountainButton.hidden = isMountainHidden;
    }
  };

  /** #### Draws one of the pair's buttons as hovered, or none
   * - Marks it `data-proxied`, which the CSS draws as `:hover`. Written
   *   only on change.
   * - Allocates nothing, so it is safe on every pointer move.
   * @param type `"mountain"` or `"valley"`, or null for none.
   */
  const setProxied = (type) => {
    const button = type === null ? null : buttonOf(type);
    if (button === proxiedButton) return;

    proxiedButton?.removeAttribute("data-proxied");
    button?.toggleAttribute("data-proxied", true);
    proxiedButton = button;
  };

  /** #### Shows the pair at its placement, which the CSS fades in
   * - Writes `--fold-buttons-x` and `--fold-buttons-y`, the point on
   *   screen in CSS pixels that the pair centres on, only when they
   *   change, since they allocate strings; and `data-stacked` for its
   *   arrangement. Clears any bump and linger.
   */
  const show = () => {
    if (placement.x !== writtenX) {
      writtenX = placement.x;
      container.style.setProperty("--fold-buttons-x", `${writtenX}px`);
    }
    if (placement.y !== writtenY) {
      writtenY = placement.y;
      container.style.setProperty("--fold-buttons-y", `${writtenY}px`);
    }
    container.toggleAttribute("data-stacked", placement.isStacked);
    container.removeAttribute("data-lingering");
    valleyButton.removeAttribute("data-bumped");
    mountainButton.removeAttribute("data-bumped");
    container.hidden = false;
  };

  for (const button of container.children) {
    const { type } = button.dataset;
    button.addEventListener("click", () => press(type));
  }

  // A press leaves focus where it was, so a press on the keyboard's pair
  // leaves the canvas focused, and its pick standing.
  container.addEventListener("mousedown", (event) => event.preventDefault());

  // A touch never hovers, so only a mouse or a pen in range is reported.
  container.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") onEnter(pair, event.pointerType);
  });
  container.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "touch") {
      onLeave(event.pointerType, event.relatedTarget);
    }
  });
  canvas.after(container);

  const pair = {
    hide,
    holds: (element) => !container.hidden && container.contains(element),
    isFree: () => container.hidden && computed.display === "none",
    isShown: () => !container.hidden,
    placement,
    press,
    setEmphasised: (isEmphasised) => {
      container.toggleAttribute("data-emphasised", isEmphasised);
    },
    setHiddenButton,
    setOverWhite: (isOverWhite) => {
      container.toggleAttribute("data-over-white", isOverWhite);
    },
    setProxied,
    show,
  };

  return pair;
};

/** #### Creates a `.fold-buttons` container holding its two buttons
 * - Allocates.
 * @returns The container, not yet in the document.
 */
const createContainer = () => {
  const container = document.createElement("div");
  container.className = "fold-buttons";
  for (const { dashes, label, shape, type } of FOLD_BUTTONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.tabIndex = -1;
    button.dataset.type = type;
    button.setAttribute("aria-label", label);
    button.append(createIcon(dashes, shape));
    container.append(button);
  }

  return container;
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
