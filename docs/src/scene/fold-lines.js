/**
 * @fileoverview
 * Draws a sheet's printed lines into a 2D canvas, as printed on either side
 * of the sheet: a design's crease pattern as dashed lines for valley folds
 * and dash-dot-dot lines for mountain folds, after the Yoshizawa–Randlett
 * system, and a pattern's lattice as solid plain lines, the same on both
 * sides.
 */

const FOLD_LINE_BACK_COLOR = 0xffffff; // white, the back's coverage mask
const FOLD_LINE_BACK_FILL_COLOR = 0x000000; // black, the back's bare paper
const FOLD_LINE_DASH_MM = 3; // a dash's length, on the sheet
const FOLD_LINE_DOT_MM = 0.5; // a mountain line's dot's length, on the sheet
const FOLD_LINE_FRONT_COLOR = 0x000000; // black
const FOLD_LINE_GAP_MM = 1.5; // the gap after a dash or a dot, on the sheet
const FOLD_LINE_TEXTURE_PX = 2048; // the canvas, along the sheet's longer side
const FOLD_LINE_WIDTH_MM = 0.5; // on the sheet

/** #### Sizes a canvas to a sheet and draws one side's printed lines on it
 * - The canvas is `FOLD_LINE_TEXTURE_PX` along the sheet's longer side and
 *   the shorter side by its aspect, so its pixels are square on the sheet.
 * - Draws either side at the same canvas coordinates, top edge at the
 *   canvas's top row: a sheet point `(x, y)` lands at `((x / width + 0.5) ×
 *   canvas.width, (0.5 − y / height) × canvas.height)`, which a texture's
 *   default `flipY` uploads at `u = x / width + 0.5`,
 *   `v = y / height + 0.5`. Both sides' meshes share those UVs, so each back
 *   line lies beneath its front line; seen from behind, the back's pattern
 *   looks mirrored left to right, without the canvas being mirrored.
 * - The front's lines are black on a clear canvas, each of its own kind.
 * - The back's lines are a coverage mask, white on a canvas filled black,
 *   each fold line of the opposite kind, since a fold that goes away from
 *   the front comes towards the back. Opaque, the mask has no clear texels,
 *   whose black filtering would mix into a line's edges.
 * - A `"plain"` line has no direction, so it is solid, at the dashes'
 *   width and colour, on both sides.
 * - Resizing clears the canvas, so the old lines never show through.
 * - Allocates, so call it only when the sheet changes.
 * @param canvas The canvas to draw on, resized here.
 * @param sheet The sheet that cutSheet() or cutSession() returns, with its
 *   `printedLines`, each typed as seen from the front: `"mountain"`,
 *   `"valley"` or `"plain"`.
 * @param side `"front"` or `"back"`, the side of the sheet to draw.
 */
export const drawFoldLines = (canvas, sheet, side) => {
  const { heightMeters, printedLines, widthMeters } = sheet;
  const longerMeters = Math.max(widthMeters, heightMeters);
  const pixelsPerMeter = FOLD_LINE_TEXTURE_PX / longerMeters;
  canvas.width = Math.round(pixelsPerMeter * widthMeters);
  canvas.height = Math.round(pixelsPerMeter * heightMeters);

  const pixelsPerMillimeter = pixelsPerMeter / 1000;
  const dash = FOLD_LINE_DASH_MM * pixelsPerMillimeter;
  const dot = FOLD_LINE_DOT_MM * pixelsPerMillimeter;
  const gap = FOLD_LINE_GAP_MM * pixelsPerMillimeter;
  const mountainDash = [dash, gap, dot, gap, dot, gap];
  const plainDash = []; // solid, which setLineDash() draws for no dashes
  const valleyDash = [dash, gap];
  const isBack = side === "back";
  const dashes = isBack
    ? { mountain: valleyDash, plain: plainDash, valley: mountainDash }
    : { mountain: mountainDash, plain: plainDash, valley: valleyDash };

  const context = canvas.getContext("2d");
  if (isBack) {
    context.fillStyle = toCssColor(FOLD_LINE_BACK_FILL_COLOR);
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.lineCap = "butt";
  context.lineWidth = FOLD_LINE_WIDTH_MM * pixelsPerMillimeter;
  context.strokeStyle = toCssColor(
    isBack ? FOLD_LINE_BACK_COLOR : FOLD_LINE_FRONT_COLOR,
  );

  const toCanvasX = (x) => (x / widthMeters + 0.5) * canvas.width;
  const toCanvasY = (y) => (0.5 - y / heightMeters) * canvas.height;
  for (const { from, to, type } of printedLines) {
    context.setLineDash(dashes[type]);
    context.beginPath();
    context.moveTo(toCanvasX(from[0]), toCanvasY(from[1]));
    context.lineTo(toCanvasX(to[0]), toCanvasY(to[1]));
    context.stroke();
  }
};

/** #### Formats a colour as a CSS hex string, such as `#ffffff`
 * @param color The colour, as a hex number in sRGB.
 * @returns The CSS colour.
 */
const toCssColor = (color) => `#${color.toString(16).padStart(6, "0")}`;
