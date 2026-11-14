/** #### The lattice patterns Basic Sandbox Mode folds, in the order offered
 * - A pattern is a square lattice printed on a square or 2:1 sheet, and a
 *   fold runs along one of its lines through every layer.
 * - Each pattern holds `aspect`, the sheet's width divided by its height,
 *   1 or 2; `colorId`, an id in `PAPER_COLORS`, as a design names one;
 *   `diagonals`, true if both diagonal families are printed beside the
 *   upright and level lines; `id`, assigned, never derived; and
 *   `spacingFraction`, the lattice spacing as a fraction of the sheet's
 *   short side. Cells are square.
 * - The colours are open to retuning by eye.
 * - Frozen, each pattern too: copy it rather than change it.
 */
export const PATTERNS = Object.freeze([
  Object.freeze({
    aspect: 1,
    colorId: "blue",
    diagonals: true,
    id: "square-half-diagonals",
    spacingFraction: 0.5,
  }),
  Object.freeze({
    aspect: 1,
    colorId: "green",
    diagonals: false,
    id: "square-quarter",
    spacingFraction: 0.25,
  }),
  Object.freeze({
    aspect: 2,
    colorId: "orange",
    diagonals: true,
    id: "oblong-half-diagonals",
    spacingFraction: 0.5,
  }),
  Object.freeze({
    aspect: 2,
    colorId: "pink",
    diagonals: false,
    id: "oblong-quarter",
    spacingFraction: 0.25,
  }),
]);
