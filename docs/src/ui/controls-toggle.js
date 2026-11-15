/** #### Hides and shows the toolbar on Escape, so the paper can show alone
 * - Passes each Escape to `onEscape` first: if it handles it, such as by
 *   clearing a picked line, the toolbar stays as it is.
 * - Toggles a `data-hidden` attribute on the `.controls` element, which
 *   the CSS fades out and back in, and which the mouse passes through
 *   while hidden. The hidden toolbar's controls stay within keyboard
 *   reach, so the arrow keys still step through the choices and colours.
 * - Ignores a held key's repeats, so holding Escape toggles once.
 * - On hiding, moves focus to the checked choice of the group the mode
 *   shows, if nothing holds focus: the checked design in Presentation
 *   Mode, or the checked pattern in Sandbox Mode, since a radio in a
 *   `hidden` group cannot take focus. The arrow keys then step through
 *   that group at once, without a Tab first. Focus held in the toolbar,
 *   or on the canvas, where the arrow keys pick lines, stays there.
 * - Throws at once if the page has no `.controls`, and on hiding if no
 *   mode, or no choice in the group shown, is checked.
 * @param onEscape Called first on each Escape, its repeats aside; returns
 *   true if it handled it.
 */
export const connectControlsToggle = (onEscape) => {
  const controls = document.querySelector(".controls");
  if (controls === null) {
    throw new Error("No toolbar: .controls");
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.repeat || onEscape()) return;

    const isHidden = controls.toggleAttribute("data-hidden");
    const focused = document.activeElement;
    if (!isHidden || (focused !== null && focused !== document.body)) return;

    const mode = controls.querySelector('input[name="mode"]:checked');
    if (mode === null) {
      throw new Error('No checked mode: input[name="mode"]:checked');
    }
    const name = mode.value === "sandbox" ? "pattern" : "design";
    const checked = controls.querySelector(`input[name="${name}"]:checked`);
    if (checked === null) {
      throw new Error(`No checked ${name}: input[name="${name}"]:checked`);
    }
    checked.focus();
  });
};
