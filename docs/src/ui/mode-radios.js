/**
 * @fileoverview
 * Connects the page's mode radios to the mode chosen, and shows the group
 * of choices that mode offers.
 */

// Each mode mapped to the selector of the group of choices it offers: the
// Gameplay designs in Gameplay Mode, the designs in Presentation Mode and
// the patterns in Sandbox Mode.
const MODE_GROUPS = Object.freeze({
  gameplay: ".gameplay-designs",
  presentation: ".designs",
  sandbox: ".patterns",
});

/** #### Checks Gameplay Mode's radio, then passes each mode chosen on
 * - Checks the `gameplay` radio at connection, whatever the browser
 *   restored on reload, so every load starts in Gameplay Mode, and shows
 *   its group of choices. The caller starts the app in that mode itself:
 *   no mode is passed on at connection.
 * - Shows the group of choices the mode offers and hides the other two,
 *   by their `hidden` attribute: the `.gameplay-designs` group in Gameplay
 *   Mode, the `.designs` group in Presentation Mode and the `.patterns`
 *   group in Sandbox Mode. A `hidden` group is out of keyboard reach as
 *   well as off the screen, which is right, since its radios choose
 *   nothing in another mode.
 * - Passes a mode on both `change` and `click`, as the design radios do,
 *   so choosing the current mode again passes it on again. An arrow key
 *   can fire both, so `onChoose` must do nothing the second time.
 * - Throws at once if the page lacks any of the three groups, if a radio's
 *   `value` names no known mode, or if no radio names `gameplay`.
 * @param onChoose Called with the chosen mode, `"gameplay"`,
 *   `"presentation"` or `"sandbox"`.
 */
export const connectModeRadios = (onChoose) => {
  const groups = Object.fromEntries(
    Object.entries(MODE_GROUPS).map(([mode, selector]) => {
      const group = document.querySelector(selector);
      if (group === null) {
        throw new Error(`No group of choices for mode "${mode}": ${selector}`);
      }

      return [mode, group];
    }),
  );

  /** #### Shows the group of choices a mode offers, and hides the others
   * @param mode `"gameplay"`, `"presentation"` or `"sandbox"`.
   */
  const showChoices = (mode) => {
    for (const [groupMode, group] of Object.entries(groups)) {
      group.hidden = groupMode !== mode;
    }
  };

  const radios = [...document.querySelectorAll('input[name="mode"]')];
  for (const radio of radios) {
    const mode = radio.value;
    if (!Object.hasOwn(MODE_GROUPS, mode)) {
      throw new Error(`Unknown mode value: "${mode}"`);
    }

    const choose = () => {
      showChoices(mode);
      onChoose(mode);
    };
    radio.addEventListener("change", choose);
    radio.addEventListener("click", choose);
  }

  const gameplayRadio = radios.find((radio) => radio.value === "gameplay");
  if (gameplayRadio === undefined) {
    throw new Error('No mode radio: input[value="gameplay"]');
  }
  gameplayRadio.checked = true;
  showChoices("gameplay");
};
