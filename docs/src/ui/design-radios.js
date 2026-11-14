/**
 * @fileoverview
 * Connects the page's design radios to the point in a design's sequence of
 * steps that the paper should move to, and to the design's paper colour.
 */

import { DESIGNS } from "../designs/list.js";

// Each radio's `value`, mapped to its choice: its sequence target and its
// paper colour's id. "flat", whose `sheetId` of null means flat, keeping
// the sheet showing, names no colour; each design's `id` targets the last
// step of its sheet, keyed by that same id, and names its `colorId`, or no
// colour if it gives none.
const DESIGN_CHOICES = Object.freeze({
  flat: Object.freeze({
    colorId: null,
    target: Object.freeze({ position: 0, sheetId: null }),
  }),
  ...Object.fromEntries(
    DESIGNS.map(({ colorId, id, steps }) => [
      id,
      Object.freeze({
        colorId: colorId ?? null,
        target: Object.freeze({ position: steps.length, sheetId: id }),
      }),
    ]),
  ),
});

/** #### Checks the first design's radio, then passes each choice on
 * - Checks the first design's radio at connection, whatever the browser
 *   restored on reload, so every load starts on the same design.
 * - Returns checkedDesignChoice(), which returns the checked radio's
 *   choice, for Presentation Mode to pass on as if that radio had been
 *   chosen.
 * - Passes a choice on both `change` and `click`: `change` fires whenever
 *   a radio becomes checked, by a click or an arrow key, and `click` also
 *   fires on the radio already checked, so choosing the current design
 *   again re-applies its colour. An arrow key can fire both, so `onChoose`
 *   must do nothing the second time.
 * - Each choice is frozen, and created once: copy it rather than change
 *   it.
 * - Throws at once if a radio's `value` names no known choice, if a
 *   design's `colorId` names no colour, or if no radio names the first
 *   design.
 * @param colors Each colour's id mapped to its colour, as a hex number in
 *   sRGB, such as `PAPER_COLORS`.
 * @param onChoose Called with the chosen radio's choice: `colorId`, or
 *   null for none; and `target`, its `position` and `sheetId`.
 * @returns checkedDesignChoice(), which takes nothing and returns the
 *   checked radio's choice.
 */
export const connectDesignRadios = (colors, onChoose) => {
  for (const [id, { colorId }] of Object.entries(DESIGN_CHOICES)) {
    if (colorId !== null && !Object.hasOwn(colors, colorId)) {
      throw new Error(`Design "${id}" names unknown colour "${colorId}"`);
    }
  }

  const radios = [...document.querySelectorAll('input[name="design"]')];
  for (const radio of radios) {
    const choice = DESIGN_CHOICES[radio.value];
    if (choice === undefined) {
      throw new Error(`Unknown design value: "${radio.value}"`);
    }

    const choose = () => onChoose(choice);
    radio.addEventListener("change", choose);
    radio.addEventListener("click", choose);
  }

  const [firstDesign] = DESIGNS;
  const firstRadio = radios.find((radio) => radio.value === firstDesign.id);
  if (firstRadio === undefined) {
    throw new Error(`No design radio: input[value="${firstDesign.id}"]`);
  }
  firstRadio.checked = true;

  // One radio is checked from here on: only checking another unchecks it.
  return () => DESIGN_CHOICES[radios.find((radio) => radio.checked).value];
};
