/** #### Reports, once, the first sign of a mouse since the page loaded
 * - Listens on the window, in the capture phase, so the detection comes
 *   before any element handles the same event, for the first `pointermove`
 *   or `pointerdown` whose `pointerType` is `"mouse"`, which a trackpad's
 *   is too, an iPad's included. Then it removes its listeners: detection
 *   is one-way for the page's life.
 * - Allocates nothing per event.
 * @param onDetect Called once, on the first mouse event.
 */
export const connectMouseDetection = (onDetect) => {
  const detect = (event) => {
    const isMouse = event.pointerType === "mouse";
    if (!isMouse) return;

    window.removeEventListener("pointerdown", detect, true);
    window.removeEventListener("pointermove", detect, true);
    onDetect();
  };
  window.addEventListener("pointerdown", detect, true);
  window.addEventListener("pointermove", detect, true);
};
