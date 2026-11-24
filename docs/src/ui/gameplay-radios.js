/**
 * @fileoverview
 * Connects the page's Gameplay design radios to the flat gameplay sheet of
 * the design chosen, which the paper should move to, and to the design's
 * paper colour.
 */

import { GAMEPLAY_DESIGNS } from "../designs/list.js";
import { gameplaySheetId } from "../gameplay/path.js";

// Each radio's `value`, a Gameplay design's `id`, mapped to its choice: its
// paper colour's id, the design's id, and its sequence target, the flat
// gameplay sheet keyed by gameplaySheetId(), at position 0.
const GAMEPLAY_CHOICES = Object.freeze(
  Object.fromEntries(
    GAMEPLAY_DESIGNS.map(({ colorId, id }) => [
      id,
      Object.freeze({
        colorId,
        designId: id,
        target: Object.freeze({ position: 0, sheetId: gameplaySheetId(id) }),
      }),
    ]),
  ),
);

/** #### Checks the first Gameplay design's radio, then passes each choice on
 * - Checks the first Gameplay design's radio at connection, whatever the
 *   browser restored on reload, so every load starts on the same design.
 * - Passes a choice on both `change` and `click`, as the design radios
 *   do, so choosing the current design again re-applies its colour. An
 *   arrow key can fire both, so `onChoose` must do nothing the second
 *   time.
 * - Returns checkedGameplayChoice(), which returns the checked radio's
 *   choice, for Gameplay Mode to pass on as if that radio had been
 *   chosen; and hasNext() and chooseNext(), for the Next button, which
 *   goes on to the design after the checked one in `GAMEPLAY_DESIGNS`.
 *   chooseNext() clicks that design's radio, which checks it and passes
 *   its choice on as a pointer's click would.
 * - Each choice is frozen, its target too, and created once: copy it
 *   rather than change it.
 * - Throws at once if a radio's `value` names no Gameplay design, if a
 *   design's `colorId` names no colour, or if a Gameplay design has no
 *   radio.
 * @param colors Each colour's id mapped to its colour, as a hex number in
 *   sRGB, such as `PAPER_COLORS`.
 * @param onChoose Called with the chosen radio's choice: `colorId`;
 *   `designId`; and `target`, its `position`, 0, and `sheetId`.
 * @returns checkedGameplayChoice(), which takes nothing and returns the
 *   checked radio's choice; chooseNext(), which takes nothing, chooses the
 *   next design, and throws a RangeError on the last; and hasNext(), which
 *   takes nothing and returns true unless the last design is checked.
 */
export const connectGameplayRadios = (colors, onChoose) => {
  for (const [id, { colorId }] of Object.entries(GAMEPLAY_CHOICES)) {
    if (!Object.hasOwn(colors, colorId)) {
      throw new Error(`Design "${id}" names unknown colour "${colorId}"`);
    }
  }

  const radios = [
    ...document.querySelectorAll('input[name="gameplay-design"]'),
  ];
  for (const radio of radios) {
    const choice = GAMEPLAY_CHOICES[radio.value];
    if (choice === undefined) {
      throw new Error(`Unknown Gameplay design value: "${radio.value}"`);
    }

    const choose = () => onChoose(choice);
    radio.addEventListener("change", choose);
    radio.addEventListener("click", choose);
  }

  // Each Gameplay design's radio, in the order of `GAMEPLAY_DESIGNS`, which
  // Next follows.
  const radiosInOrder = GAMEPLAY_DESIGNS.map(({ id }) => {
    const radio = radios.find(({ value }) => value === id);
    if (radio === undefined) {
      throw new Error(`No Gameplay design radio: input[value="${id}"]`);
    }

    return radio;
  });
  radiosInOrder[0].checked = true;

  // One radio is checked from here on: only checking another unchecks it.
  const checkedIndex = () => radiosInOrder.findIndex(({ checked }) => checked);

  /** #### Returns the checked radio's choice
   * @returns The choice, frozen.
   */
  const checkedGameplayChoice = () =>
    GAMEPLAY_CHOICES[radiosInOrder[checkedIndex()].value];

  /** #### Chooses the design after the checked one, by clicking its radio
   * - Throws a RangeError if the last design is checked.
   */
  const chooseNext = () => {
    if (!hasNext()) {
      throw new RangeError("No Gameplay design after the last");
    }
    radiosInOrder[checkedIndex() + 1].click();
  };

  /** #### Returns true unless the last design is checked
   * @returns True if a design follows the checked one.
   */
  const hasNext = () => checkedIndex() < radiosInOrder.length - 1;

  return { checkedGameplayChoice, chooseNext, hasNext };
};
