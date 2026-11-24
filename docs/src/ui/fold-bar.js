/**
 * @fileoverview
 * Connects the fold bar's Undo, Redo, Unfold and Export buttons, and
 * their keyboard shortcuts, to the moves they make, keeps each button
 * disabled at its limit, and shows the export in its dialog; and finds a
 * button by its data attribute, for the gameplay bar too.
 */

// How long "Copy" reads "Copied" after a copy, in seconds.
const COPIED_SECONDS = 1.5;

/** #### Connects the fold bar's buttons, their shortcuts, and the export
 * - Each `<button>` in `.fold-bar`, `[data-undo]`, `[data-redo]`,
 *   `[data-unfold]` and `[data-export]`, passes its press on.
 * - Export opens the `.export-dialog`, a modal `<dialog>`, with the text
 *   `onExport` returns in its read-only `<textarea>`. Its `[data-copy]`
 *   button writes that text to the clipboard and reads "Copied" for
 *   `COPIED_SECONDS`; a refused write rejects unhandled, so the console
 *   shows it, and the text can still be selected and copied by hand. Its
 *   Close button, in a `<form method="dialog">`, and Escape close it.
 * - Ctrl+Z and Cmd+Z undo; Ctrl+Y, Ctrl+Shift+Z and Cmd+Shift+Z redo.
 *   Each cancels its default, so the browser's own undo stays out of it,
 *   and ignores a held key's repeats, as Escape does. They answer only
 *   while the bar shows, which is in Gameplay Mode and Sandbox Mode, and
 *   the dialog is closed.
 * - The bar starts hidden, by its `hidden` attribute, and its buttons
 *   disabled; setShown() shows or hides it. setExportShown() shows or
 *   hides Export alone, by its own `hidden` attribute, since only Sandbox
 *   Mode exports.
 * - setLimits() disables Undo, Unfold and Export at position 0, and Redo
 *   at the fold count, writing them only when they change.
 * - setUndoHinted() marks Undo `data-hinted`, which the CSS pulses while a
 *   Gameplay Mode hint says the wrong turn lies back along the path, or
 *   clears the mark.
 * - Throws at once if the page has no `.fold-bar` or `.export-dialog`,
 *   the bar lacks one of its four buttons, or the dialog its `<textarea>`
 *   or its Copy button.
 * @param onExport Called on a press of Export; returns the text to export.
 * @param onRedo Called on a press of Redo or its shortcuts.
 * @param onUndo Called on a press of Undo or its shortcuts.
 * @param onUnfold Called on a press of Unfold.
 * @returns isExportOpen(), which returns true while the dialog is open;
 *   setExportShown(), which takes true to show Export, or false to hide
 *   it; setLimits(), which takes the fold count, a session's or a game's,
 *   and the target's position; setShown(), which takes true to show the
 *   bar, or false to hide it; and setUndoHinted(), which takes true to
 *   mark Undo, or false to clear the mark.
 */
export const connectFoldBar = (onExport, onRedo, onUndo, onUnfold) => {
  const bar = document.querySelector(".fold-bar");
  if (bar === null) {
    throw new Error("No fold bar: .fold-bar");
  }
  const dialog = document.querySelector(".export-dialog");
  if (dialog === null) {
    throw new Error("No export dialog: .export-dialog");
  }
  const text = dialog.querySelector("textarea");
  if (text === null) {
    throw new Error("No export text: .export-dialog textarea");
  }
  const copyButton = buttonOf(dialog, "data-copy");
  const exportButton = buttonOf(bar, "data-export");
  const redoButton = buttonOf(bar, "data-redo");
  const undoButton = buttonOf(bar, "data-undo");
  const unfoldButton = buttonOf(bar, "data-unfold");
  redoButton.addEventListener("click", onRedo);
  undoButton.addEventListener("click", onUndo);
  unfoldButton.addEventListener("click", onUnfold);

  // The Copy button's own label, and the timer that sets it back after a
  // copy, or null while none runs.
  const copyLabel = copyButton.textContent;
  let copiedTimer = null;

  /** #### Sets the Copy button back to "Copy", stopping any timer */
  const resetCopyButton = () => {
    clearTimeout(copiedTimer);
    copiedTimer = null;
    copyButton.textContent = copyLabel;
  };

  exportButton.addEventListener("click", () => {
    // Put the caret at the start, as setting `value` moves it to the end,
    // so the text shows from its top once the dialog focuses it.
    text.value = onExport();
    text.setSelectionRange(0, 0);
    dialog.showModal();
  });

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(text.value);
    resetCopyButton();
    copyButton.textContent = "Copied";
    copiedTimer = setTimeout(resetCopyButton, COPIED_SECONDS * 1000);
  });

  dialog.addEventListener("close", resetCopyButton);

  // Whether Redo, and Undo, Unfold and Export, are enabled, as last
  // written. All four start disabled, whatever the browser restored on
  // reload, as the empty session at position 0 has them.
  let canRedo = false;
  let canUndo = false;
  exportButton.disabled = true;
  redoButton.disabled = true;
  undoButton.disabled = true;
  unfoldButton.disabled = true;

  document.addEventListener("keydown", (event) => {
    if (bar.hidden || dialog.open || event.altKey) return;

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

  /** #### Returns true while the export dialog is open
   * @returns True if the dialog is open.
   */
  const isExportOpen = () => dialog.open;

  /** #### Shows or hides the Export button
   * @param isShown True to show Export.
   */
  const setExportShown = (isShown) => {
    exportButton.hidden = !isShown;
  };

  /** #### Disables each button at its limit
   * - Writes the buttons only when their state changes.
   * @param foldCount The fold count, a session's or a game's.
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
      exportButton.disabled = !canUndo;
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

  /** #### Marks Undo as the hint's way back, or clears the mark
   * @param isHinted True to mark Undo `data-hinted`.
   */
  const setUndoHinted = (isHinted) => {
    undoButton.toggleAttribute("data-hinted", isHinted);
  };

  return { isExportOpen, setExportShown, setLimits, setShown, setUndoHinted };
};

/** #### Returns the button within an element that carries a data attribute
 * - Throws if the element has no such button.
 * - Shared with the gameplay bar, whose buttons are found the same way.
 * @param parent The element to search, such as the `.fold-bar`.
 * @param attribute The attribute's name, such as `data-undo`.
 * @returns The button.
 */
export const buttonOf = (parent, attribute) => {
  const button = parent.querySelector(`button[${attribute}]`);
  if (button === null) {
    throw new Error(`No button: .${parent.className} button[${attribute}]`);
  }

  return button;
};
