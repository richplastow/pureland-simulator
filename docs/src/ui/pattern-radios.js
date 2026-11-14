/**
 * @fileoverview
 * Connects the page's pattern radios to the flat sheet of the pattern
 * chosen, which the paper should move to, and to the pattern's paper
 * colour.
 */

import { PATTERNS } from "../sandbox/patterns.js";

// Each radio's `value`, a pattern's `id`, mapped to its choice: its
// sequence target, the flat sheet keyed by that same id, at position 0,
// and its paper colour's id.
const PATTERN_CHOICES = Object.freeze(
  Object.fromEntries(
    PATTERNS.map(({ colorId, id }) => [
      id,
      Object.freeze({
        colorId,
        target: Object.freeze({ position: 0, sheetId: id }),
      }),
    ]),
  ),
);

/** #### Checks the first pattern's radio, then passes each choice on
 * - Checks the first pattern's radio at connection, whatever the browser
 *   restored on reload, so every load starts on the same pattern.
 * - Passes a choice on both `change` and `click`, as the design radios
 *   do, so choosing the current pattern again re-applies its colour. An
 *   arrow key can fire both, so `onChoose` must do nothing the second
 *   time.
 * - Returns checkedPatternChoice(), which returns the checked radio's
 *   choice, for Sandbox Mode to pass on as if that radio had been chosen.
 * - Each choice is frozen, and created once: copy it rather than change
 *   it.
 * - Throws at once if a radio's `value` names no known pattern, if a
 *   pattern's `colorId` names no colour, or if no radio names the first
 *   pattern.
 * @param colors Each colour's id mapped to its colour, as a hex number in
 *   sRGB, such as `PAPER_COLORS`.
 * @param onChoose Called with the chosen radio's choice: `colorId`; and
 *   `target`, its `position`, 0, and `sheetId`.
 * @returns checkedPatternChoice(), which takes nothing and returns the
 *   checked radio's choice.
 */
export const connectPatternRadios = (colors, onChoose) => {
  for (const [id, { colorId }] of Object.entries(PATTERN_CHOICES)) {
    if (!Object.hasOwn(colors, colorId)) {
      throw new Error(`Pattern "${id}" names unknown colour "${colorId}"`);
    }
  }

  const radios = [...document.querySelectorAll('input[name="pattern"]')];
  for (const radio of radios) {
    const choice = PATTERN_CHOICES[radio.value];
    if (choice === undefined) {
      throw new Error(`Unknown pattern value: "${radio.value}"`);
    }

    const choose = () => onChoose(choice);
    radio.addEventListener("change", choose);
    radio.addEventListener("click", choose);
  }

  const [firstPattern] = PATTERNS;
  const firstRadio = radios.find((radio) => radio.value === firstPattern.id);
  if (firstRadio === undefined) {
    throw new Error(`No pattern radio: input[value="${firstPattern.id}"]`);
  }
  firstRadio.checked = true;

  // One radio is checked from here on: only checking another unchecks it.
  return () => PATTERN_CHOICES[radios.find((radio) => radio.checked).value];
};
