import BLINTZ_FILE from "./blintz.json" with { type: "json" };
import { readDesignFile } from "./design-file.js";
import { HEART } from "./heart.js";
import { MOUNT_FUJI } from "./mount-fuji.js";
import { PAPER_DART } from "./paper-dart.js";
import { PENCIL } from "./pencil.js";
import { YACHT } from "./yacht.js";

// The blintz, read from its JSON design file, written from a Sandbox
// session: the design file format's round trip, shipped as a design.
const BLINTZ = readDesignFile(BLINTZ_FILE);

/** #### Every design the page offers, in the order of their radios
 * - `main.js` cuts each design's sheet from it; `design-radios.js` builds
 *   each radio's target and colour from it, and checks the first. A new
 *   design is its file, a line here and an `<input type="radio"
 *   name="design">` in its `<label>` in `index.html`, whose `value` is the
 *   design's `id`.
 * - A design's file is a design module, or a JSON design file, such as one
 *   exported from Sandbox Mode, imported as a JSON module and read by
 *   readDesignFile(), whose `id` is the file's.
 * - Each design may name its paper colour as `colorId`, an id in
 *   `PAPER_COLORS`, which choosing it fades the front to; one that names
 *   none leaves the colour as it is.
 * - Design files not imported here are kept but not loaded.
 * - Frozen: copy it rather than change it.
 */
export const DESIGNS = Object.freeze([
  PENCIL,
  MOUNT_FUJI,
  YACHT,
  PAPER_DART,
  HEART,
  BLINTZ,
]);
