/** #### Connects the status line, a polite live region over the paper
 * - The line is `p.status`, which carries `role="status"`, so assistive
 *   technology reads each change of its text once the reader is idle, as
 *   WCAG 2.2's Status Messages (4.1.3) asks. Empty, its box has no size,
 *   but it stays in the accessibility tree, so the next text is read.
 * - say() writes the text only when it changes, so a repeat is never read
 *   out twice and writes nothing.
 * - Throws at once if the page has no `p.status`.
 * @returns say(), which takes the text to show, or `""` for none.
 */
export const connectStatus = () => {
  const status = document.querySelector("p.status");
  if (status === null) {
    throw new Error("No status line: p.status");
  }

  // The text last written, so an unchanged one writes nothing.
  let saidText = status.textContent;

  /** #### Shows a text in the status line, or none
   * - Allocates nothing.
   * @param text The text, or `""` to empty the line.
   */
  const say = (text) => {
    if (text === saidText) return;

    saidText = text;
    status.textContent = text;
  };

  return say;
};
