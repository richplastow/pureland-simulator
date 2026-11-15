/**
 * @fileoverview
 * Connects the sandbox bar's Undo, Redo and Unfold buttons, and their
 * keyboard shortcuts, to the moves they make, and keeps each button
 * disabled at its limit.
 */

/** #### Connects the sandbox bar's Undo, Redo and Unfold, and their shortcuts
 * - Each `<button>` in `.sandbox-bar`, `[data-undo]`, `[data-redo]` and
 *   `[data-unfold]`, passes its press on.
 * - Ctrl+Z and Cmd+Z undo; Ctrl+Y, Ctrl+Shift+Z and Cmd+Shift+Z redo.
 *   Each cancels its default, so the browser's own undo stays out of it,
 *   and ignores a held key's repeats, as Escape does. They answer only
 *   while the bar shows, which is in Sandbox Mode alone.
 * - The bar starts hidden, by its `hidden` attribute, and its buttons
 *   disabled; setShown() shows or hides it.
 * - setLimits() disables Undo and Unfold at position 0, and Redo at the
 *   fold count, writing them only when they change.
 * - Throws at once if the page has no `.sandbox-bar`, or the bar lacks
 *   one of its three buttons.
 * @param onRedo Called on a press of Redo or its shortcuts.
 * @param onUndo Called on a press of Undo or its shortcuts.
 * @param onUnfold Called on a press of Unfold.
 * @returns setLimits(), which takes the session's fold count and the
 *   target's position; and setShown(), which takes true to show the bar,
 *   or false to hide it.
 */
export const connectSandboxBar = (onRedo, onUndo, onUnfold) => {
  const bar = document.querySelector(".sandbox-bar");
  if (bar === null) {
    throw new Error("No sandbox bar: .sandbox-bar");
  }
  const redoButton = buttonOf(bar, "data-redo");
  const undoButton = buttonOf(bar, "data-undo");
  const unfoldButton = buttonOf(bar, "data-unfold");
  redoButton.addEventListener("click", onRedo);
  undoButton.addEventListener("click", onUndo);
  unfoldButton.addEventListener("click", onUnfold);

  // Whether Redo, and Undo and Unfold, are enabled, as last written. All
  // three start disabled, whatever the browser restored on reload, as the
  // empty session at position 0 has them.
  let canRedo = false;
  let canUndo = false;
  redoButton.disabled = true;
  undoButton.disabled = true;
  unfoldButton.disabled = true;

  document.addEventListener("keydown", (event) => {
    if (bar.hidden || event.altKey) return;

    const isZ = event.key === "z" || event.key === "Z";
    const isY = event.key === "y" || event.key === "Y";
    const isUndo = isZ && !event.shiftKey && (event.ctrlKey || event.metaKey);
    const isRedo =
      (isZ && event.shiftKey && (event.ctrlKey || event.metaKey)) ||
      (isY && !event.shiftKey && event.ctrlKey && !event.metaKey);
    if (!isUndo && !isRedo) return;

    event.preventDefault();
    if (event.repeat) return;
    if (isUndo) {
      onUndo();
    } else {
      onRedo();
    }
  });

  /** #### Disables each button at its limit
   * - Writes the buttons only when their state changes.
   * @param foldCount The session's fold count.
   * @param position The target's position, from 0 to `foldCount`.
   */
  const setLimits = (foldCount, position) => {
    const nextCanRedo = position < foldCount;
    const nextCanUndo = position > 0;
    if (nextCanRedo !== canRedo) {
      canRedo = nextCanRedo;
      redoButton.disabled = !canRedo;
    }
    if (nextCanUndo !== canUndo) {
      canUndo = nextCanUndo;
      undoButton.disabled = !canUndo;
      unfoldButton.disabled = !canUndo;
    }
  };

  /** #### Shows or hides the bar
   * @param isShown True to show the bar.
   */
  const setShown = (isShown) => {
    bar.hidden = !isShown;
  };

  return { setLimits, setShown };
};

/** #### Returns the bar's button that carries a data attribute
 * - Throws if the bar has no such button.
 * @param bar The `.sandbox-bar` element.
 * @param attribute The attribute's name, such as `data-undo`.
 * @returns The button.
 */
const buttonOf = (bar, attribute) => {
  const button = bar.querySelector(`button[${attribute}]`);
  if (button === null) {
    throw new Error(`No sandbox bar button: button[${attribute}]`);
  }

  return button;
};
