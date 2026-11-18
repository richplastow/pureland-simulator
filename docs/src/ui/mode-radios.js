/** #### Checks Sandbox Mode's radio, then passes each mode chosen on
 * - Checks the `sandbox` radio at connection, whatever the browser
 *   restored on reload, so every load starts in Sandbox Mode, and shows
 *   its group of choices. The caller starts the app in that mode itself:
 *   no mode is passed on at connection.
 * - Shows the group of choices the mode offers and hides the other, by
 *   their `hidden` attribute: the `.designs` group in Presentation Mode
 *   and the `.patterns` group in Sandbox Mode. A `hidden` group is out of
 *   keyboard reach as well as off the screen, which is right, since its
 *   radios choose nothing in the other mode.
 * - Passes a mode on both `change` and `click`, as the design radios do,
 *   so choosing the current mode again passes it on again. An arrow key
 *   can fire both, so `onChoose` must do nothing the second time.
 * - Throws at once if a radio's `value` names no known mode, if the page
 *   has no `.designs` or `.patterns` group, or if no radio names
 *   `sandbox`.
 * @param onChoose Called with the chosen mode, `"presentation"` or
 *   `"sandbox"`.
 */
export const connectModeRadios = (onChoose) => {
  const designs = document.querySelector(".designs");
  const patterns = document.querySelector(".patterns");
  if (designs === null || patterns === null) {
    throw new Error("No design or pattern group: .designs, .patterns");
  }

  /** #### Shows the group of choices a mode offers, and hides the other
   * @param mode `"presentation"` or `"sandbox"`.
   */
  const showChoices = (mode) => {
    designs.hidden = mode !== "presentation";
    patterns.hidden = mode !== "sandbox";
  };

  const radios = [...document.querySelectorAll('input[name="mode"]')];
  for (const radio of radios) {
    const mode = radio.value;
    if (mode !== "presentation" && mode !== "sandbox") {
      throw new Error(`Unknown mode value: "${mode}"`);
    }

    const choose = () => {
      showChoices(mode);
      onChoose(mode);
    };
    radio.addEventListener("change", choose);
    radio.addEventListener("click", choose);
  }

  const sandboxRadio = radios.find((radio) => radio.value === "sandbox");
  if (sandboxRadio === undefined) {
    throw new Error('No mode radio: input[value="sandbox"]');
  }
  sandboxRadio.checked = true;
  showChoices("sandbox");
};
