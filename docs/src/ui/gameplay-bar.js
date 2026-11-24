/**
 * @fileoverview
 * Connects the gameplay bar, the lives readout and the Hint and Next
 * buttons, which Gameplay Mode alone shows.
 */

import { buttonOf } from "./fold-bar.js";

/** #### Connects the gameplay bar's lives readout and its two buttons
 * - The bar is `.gameplay-bar`, holding `output[data-lives]`, which reads
 *   "Lives: 3", and `button[data-hint]` and `button[data-next]`, each of
 *   which passes its press on.
 * - The bar starts hidden, by its `hidden` attribute; setShown() shows or
 *   hides it.
 * - write() writes the readout, enables or disables Hint, and shows or
 *   hides Next, by its own `hidden` attribute, each only when it changes.
 *   When the lives drop, it marks the readout `data-lost`, which the CSS
 *   plays as one pulse; the mark is cleared as the animation ends, or is
 *   cancelled by the bar's hiding, so the next loss plays again.
 * - Throws at once if the page has no `.gameplay-bar`, or the bar lacks its
 *   readout or one of its two buttons.
 * @param onHint Called on a press of Hint.
 * @param onNext Called on a press of Next.
 * @returns setShown(), which takes true to show the bar, or false to hide
 *   it; and write(), which takes `{ canHint, isNextShown, lives }`.
 */
export const connectGameplayBar = (onHint, onNext) => {
  const bar = document.querySelector(".gameplay-bar");
  if (bar === null) {
    throw new Error("No gameplay bar: .gameplay-bar");
  }
  const readout = bar.querySelector("output[data-lives]");
  if (readout === null) {
    throw new Error("No lives readout: .gameplay-bar output[data-lives]");
  }
  const hintButton = buttonOf(bar, "data-hint");
  const nextButton = buttonOf(bar, "data-next");
  hintButton.addEventListener("click", onHint);
  nextButton.addEventListener("click", onNext);

  // Hiding the bar mid-pulse cancels the animation rather than ending it.
  const clearLost = () => readout.removeAttribute("data-lost");
  readout.addEventListener("animationcancel", clearLost);
  readout.addEventListener("animationend", clearLost);

  // The lives, Hint's state and Next's as last written, or null for the
  // lives before the first write, which pulses nothing.
  let shownLives = null;
  let canHintShown = !hintButton.disabled;
  let isNextShownNow = !nextButton.hidden;

  /** #### Shows or hides the bar
   * @param isShown True to show the bar.
   */
  const setShown = (isShown) => {
    bar.hidden = !isShown;
  };

  /** #### Writes the lives, and Hint's and Next's states
   * - Writes each only when it changes; a drop in the lives marks the
   *   readout `data-lost`, a rise marks nothing.
   * @param state `canHint`, true to enable Hint; `isNextShown`, true to
   *   show Next; and `lives`, the lives left.
   */
  const write = ({ canHint, isNextShown, lives }) => {
    if (lives !== shownLives) {
      if (shownLives !== null && lives < shownLives) {
        readout.toggleAttribute("data-lost", true);
      }
      shownLives = lives;
      readout.textContent = `Lives: ${lives}`;
    }
    if (canHint !== canHintShown) {
      canHintShown = canHint;
      hintButton.disabled = !canHint;
    }
    if (isNextShown !== isNextShownNow) {
      isNextShownNow = isNextShown;
      nextButton.hidden = !isNextShown;
    }
  };

  return { setShown, write };
};
