/** #### Passes the "Fold lines" checkbox's state on, now and on every change
 * - Passes it once on connection, since a browser may restore a
 *   checkbox's state on reload, whatever the page's `checked` attribute
 *   says.
 * - Enables the checkbox at connection, whatever the browser restored:
 *   Firefox keeps a form control's disabled state across a reload
 *   (https://bugzilla.mozilla.org/show_bug.cgi?id=654072).
 * - Returns setForcedOn(), which forces the lines on, for Gameplay Mode
 *   and Sandbox Mode: while forced, the checkbox is ticked and disabled,
 *   and passes true on; once released, in Presentation Mode, it is
 *   enabled again with the state it had, and passes that on. Forcing or
 *   releasing it twice does nothing the second time.
 * - Throws at once if the page has no `input[data-fold-lines]`.
 * @param onChange Called with true if the lines are switched on: the
 *   checkbox is ticked, or forced on.
 * @returns setForcedOn(), which takes true to force the lines on, or
 *   false to release them.
 */
export const connectFoldLinesToggle = (onChange) => {
  const checkbox = document.querySelector("input[data-fold-lines]");
  if (checkbox === null) {
    throw new Error("No fold-lines checkbox: input[data-fold-lines]");
  }

  // The checkbox's own state, kept while it is forced on.
  let isForced = false;
  let ownChecked = checkbox.checked;

  checkbox.disabled = false;
  onChange(checkbox.checked);
  checkbox.addEventListener("change", () => onChange(checkbox.checked));

  return (nextIsForced) => {
    if (nextIsForced === isForced) return;

    isForced = nextIsForced;
    if (isForced) ownChecked = checkbox.checked;
    checkbox.checked = isForced || ownChecked;
    checkbox.disabled = isForced;
    onChange(checkbox.checked);
  };
};
