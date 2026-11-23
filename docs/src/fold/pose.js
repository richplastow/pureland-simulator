/**
 * @fileoverview
 * Poses a cut sheet at a point in its sequence of steps, with its layers
 * held apart by the paper's thickness, and finds how far the model has
 * turned over.
 */

import { smoothstep } from "./easing.js";
import { standingFoldOf, stopsShort, TOLERANCE_METERS } from "./engine.js";

// About one sheet of 80 gsm paper; tuned by eye.
export const PAPER_THICKNESS_METERS = 0.0001;

const SAMPLES_PER_STEP = 32; // poses per step that maxPaperRadius() measures

// Each turn-over turns the model half a turn about its upright axis, the
// negative way, so its right edge swings towards the viewer, on +Z.
const TURN_OVER_RADIANS = -Math.PI;

// Scratch for the vertex being posed, `[x, y, z]` in metres, reused so
// posing allocates nothing.
const point = new Float64Array(3);

/** #### Writes every vertex of a cut sheet, posed at a sequence position
 * - Poses the folds at foldPositionAt(), so the paper holds still through a
 *   turn-over, which turns a group around it instead.
 * - During a fold, a face the fold moves turns about the fold's line, by
 *   the fold's eased angle, towards +Z for a valley or −Z for a mountain.
 * - Each face shifts along its normal by the paper's thickness for each
 *   layer beneath it: a moved face's shift runs from its height before a
 *   fold to π to minus its height after, which lands it on top; a face the
 *   fold holds rises to its new height.
 * - A fold that stops short of π turns the faces it moves as one rigid
 *   block, about its line raised to the top of every face on that line,
 *   moved or held, for a valley, or lowered to their bottom for a
 *   mountain, as pivotLayers() finds it, so no layer swings into the
 *   faces it leaves behind. It presses nothing flat, so the faces it
 *   holds keep their height. Its faces keep that turn, and their shift
 *   before it, from then on, raised or lowered by the change since in
 *   the stack's height at its line, as pivotLayers() finds it, easing as
 *   the held faces ease, so a standing flap rides with the paper at its
 *   hinge as later folds slide paper under it.
 * - A fold whose `turns` is `"both-sides"` turns the whole paper back by
 *   half its angle, about its line, from then on, so the two sides share
 *   the turn.
 * - After every turn, the paper slides by minus the sheet's stage centre,
 *   easing from one stage's to the next with the fold, so each stage's
 *   folded shape stays centred on the origin.
 * - Vertices run face by face, around each face's polygon, in the folded
 *   plane as seen from the front.
 * - A sheet with no folds, such as a pattern's flat sheet, poses flat at
 *   every position: each face at its stage-0 placement and height, less
 *   the stage-0 centre.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param positions An array of three numbers per vertex, in metres,
 *   overwritten.
 * @param sequencePosition From 0 (flat) to the step count: whole steps
 *   done, plus the linear progress through the next.
 * @param sheet The sheet that cutSheet() returns.
 */
export const writePaperPositions = (positions, sequencePosition, sheet) => {
  const { centres, faces, folds } = sheet;
  if (folds.length === 0) {
    writeFlatPositions(positions, sheet);
    return;
  }

  const foldPosition = foldPositionAt(sequencePosition, sheet);
  const foldIndex = Math.max(
    0,
    Math.min(Math.floor(foldPosition), folds.length - 1),
  );
  const fold = folds[foldIndex];
  const progress = smoothstep(foldPosition - foldIndex);
  const isFlatFold = !stopsShort(fold);
  const foldPivotLayers = isFlatFold
    ? 0
    : pivotLayers(faces, fold, folds, foldIndex);
  const fromCentre = centres[foldIndex];
  const toCentre = centres[foldIndex + 1];
  const centreX = lerp(fromCentre[0], toCentre[0], progress);
  const centreY = lerp(fromCentre[1], toCentre[1], progress);

  let vertex = 0;
  for (let f = 0; f < faces.length; f++) {
    const { layers, movedBy, placements, polygon } = faces[f];

    // A face that a fold which stops short moved, earlier, stays where
    // that fold put it.
    const restingFoldIndex = standingFoldOf(folds, movedBy, foldIndex);

    let pivot = 0; // the turn's line, in layers above the back
    let stage = foldIndex;
    let shiftLayers;
    let turnFold = fold;
    let turnRadians = 0;
    if (restingFoldIndex !== -1) {
      stage = restingFoldIndex;
      turnFold = folds[stage];
      turnRadians = turnSign(turnFold) * turnFold.targetRadians;

      // Ride with the stack at the hinge, which later folds may have raised
      // or lowered since: the hinge's height now, eased between stages as
      // the held faces ease, less its height at the flap's own fold.
      const pivotThen = pivotLayers(faces, turnFold, folds, stage);
      const pivotNow = isFlatFold
        ? lerp(
            pivotLayers(faces, turnFold, folds, foldIndex),
            pivotLayers(faces, turnFold, folds, foldIndex + 1),
            progress,
          )
        : pivotLayers(faces, turnFold, folds, foldIndex);
      shiftLayers = layers[stage] - 1 + pivotNow - pivotThen;
      pivot = pivotNow;
    } else if (movedBy.includes(foldIndex)) {
      const before = layers[foldIndex] - 1;
      shiftLayers = isFlatFold
        ? lerp(before, 1 - layers[foldIndex + 1], progress)
        : before;
      turnRadians = turnSign(fold) * progress * fold.targetRadians;
      pivot = foldPivotLayers;
    } else {
      // A fold that stops short presses nothing flat, so lifts nothing.
      shiftLayers = isFlatFold
        ? lerp(layers[foldIndex] - 1, layers[foldIndex + 1] - 1, progress)
        : layers[foldIndex] - 1;
    }

    // Read by index: array destructuring would run an iterator.
    const placement = placements[stage];
    const a = placement[0];
    const b = placement[1];
    const c = placement[2];
    const d = placement[3];
    const tx = placement[4];
    const ty = placement[5];
    for (let i = 0; i < polygon.length; i++, vertex++) {
      const x = polygon[i][0];
      const y = polygon[i][1];
      point[0] = a * x + c * y + tx;
      point[1] = b * x + d * y + ty;
      point[2] = PAPER_THICKNESS_METERS * shiftLayers;
      if (turnRadians !== 0) {
        rotateAboutLine(
          turnRadians,
          turnFold,
          PAPER_THICKNESS_METERS * pivot,
          point,
        );
      }

      // Folds that turn both sides turn the whole paper back by half.
      for (let j = 0; j <= foldIndex; j++) {
        if (folds[j].turns !== "both-sides") continue;
        const foldRadians =
          j < foldIndex
            ? folds[j].targetRadians
            : progress * folds[j].targetRadians;
        rotateAboutLine(
          (-turnSign(folds[j]) * foldRadians) / 2,
          folds[j],
          0,
          point,
        );
      }

      // Slide the paper to keep its folded shape centred.
      positions[3 * vertex] = point[0] - centreX;
      positions[3 * vertex + 1] = point[1] - centreY;
      positions[3 * vertex + 2] = point[2];
    }
  }
};

/** #### Returns the folds done at a sequence position, which counts steps
 * - Whole folds done, plus the linear progress through the fold under way.
 *   It holds still through a turn-over.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param sequencePosition From 0 (flat) to the step count: whole steps
 *   done, plus the linear progress through the next.
 * @param sheet The sheet that cutSheet() returns.
 * @returns From 0 (flat) to the fold count, and 0 for a sheet with no
 *   steps.
 */
export const foldPositionAt = (sequencePosition, sheet) => {
  if (sheet.steps.length === 0) return 0;

  const stepIndex = stepIndexAt(sequencePosition, sheet);
  const step = sheet.steps[stepIndex];
  if (step.kind !== "fold") return step.foldsBefore;

  return step.foldsBefore + clampUnit(sequencePosition - stepIndex);
};

/** #### Returns the largest distance any vertex reaches from the origin
 * - Samples every step of the sequence, from flat to finished, so a
 *   sphere of this radius at the origin holds the paper throughout. A
 *   turn-over turns the paper about an axis through the origin, so moves
 *   no vertex nearer or further.
 * - Allocates, so call it once, at load.
 * @param sheet The sheet that cutSheet() returns.
 * @returns The radius, in metres.
 */
export const maxPaperRadius = (sheet) => {
  const vertexCount = sheet.faces.reduce(
    (count, { polygon }) => count + polygon.length,
    0,
  );
  const positions = new Float64Array(3 * vertexCount);
  const sampleCount = SAMPLES_PER_STEP * sheet.steps.length;

  let radiusMeters = 0;
  for (let sample = 0; sample <= sampleCount; sample++) {
    writePaperPositions(positions, sample / SAMPLES_PER_STEP, sheet);
    for (let i = 0; i < positions.length; i += 3) {
      radiusMeters = Math.max(
        radiusMeters,
        Math.hypot(positions[i], positions[i + 1], positions[i + 2]),
      );
    }
  }

  return radiusMeters;
};

/** #### Returns the stack's height at a fold's line, which it turns about
 * - The highest, for a valley, or the lowest, for a mountain, of every
 *   face with a point on the fold's line at a stage: a corner on it, an
 *   edge along it, or an edge across it. At the stage before a fold that
 *   stops short, that counts the faces the fold holds as well as those it
 *   moves, so the moving faces turn as one block clear of every layer at
 *   the hinge, including a held one that only meets the line at a corner.
 *   At a later stage, it is the height a standing flap's hinge has
 *   reached.
 * - Leaves out every face that a fold before the stage, stopping short of
 *   π, moved, since it no longer lies in the stack.
 * - The line is the fold's whole line, through its `from` and `to`, met
 *   within `TOLERANCE_METERS`.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param faces The sheet's faces.
 * @param fold The fold whose line to measure at.
 * @param folds The sheet's folds.
 * @param stage The stage, from 0 (flat) to the fold count.
 * @returns The height, in layers above the back of the stack.
 */
export const pivotLayers = (faces, fold, folds, stage) => {
  const isValley = fold.type === "valley";
  const px = fold.from[0];
  const py = fold.from[1];
  const length = Math.hypot(fold.to[0] - px, fold.to[1] - py);
  const nx = -(fold.to[1] - py) / length;
  const ny = (fold.to[0] - px) / length;

  let pivot = isValley ? -Infinity : Infinity;
  for (let f = 0; f < faces.length; f++) {
    const { layers, movedBy, placements, polygon } = faces[f];
    if (standingFoldOf(folds, movedBy, stage) !== -1) continue;

    // Read by index: array destructuring would run an iterator.
    const placement = placements[stage];
    const a = placement[0];
    const b = placement[1];
    const c = placement[2];
    const d = placement[3];
    const tx = placement[4];
    const ty = placement[5];
    let nearest = Infinity; // signed distance from the line, in metres
    let furthest = -Infinity;
    for (let i = 0; i < polygon.length; i++) {
      const x = polygon[i][0];
      const y = polygon[i][1];
      const offset =
        (a * x + c * y + tx - px) * nx + (b * x + d * y + ty - py) * ny;
      nearest = Math.min(nearest, offset);
      furthest = Math.max(furthest, offset);
    }
    const meetsLine =
      nearest <= TOLERANCE_METERS && furthest >= -TOLERANCE_METERS;
    if (!meetsLine) continue;

    const below = layers[stage] - 1;
    pivot = isValley ? Math.max(pivot, below) : Math.min(pivot, below);
  }

  return pivot;
};

/** #### Turns a point in 3D about a fold's line, at a height above z = 0
 * - Rodrigues' rotation formula, right-handed about the line's `from` to
 *   `to` direction, so a positive angle turns the line's left side
 *   towards +Z.
 * - Writes the turned point over the one given, so it allocates nothing
 *   and is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param angleRadians The angle to turn by, in radians.
 * @param fold The fold whose line to turn about.
 * @param heightMeters The line's height along Z, in metres.
 * @param vector The point, `[x, y, z]` in metres, overwritten.
 */
export const rotateAboutLine = (angleRadians, fold, heightMeters, vector) => {
  const px = fold.from[0];
  const py = fold.from[1];
  const length = Math.hypot(fold.to[0] - px, fold.to[1] - py);
  const ux = (fold.to[0] - px) / length;
  const uy = (fold.to[1] - py) / length;
  const vx = vector[0] - px;
  const vy = vector[1] - py;
  const vz = vector[2] - heightMeters;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  const along = (ux * vx + uy * vy) * (1 - cos); // `(u · v)(1 − cos)`

  vector[0] = px + vx * cos + uy * vz * sin + ux * along;
  vector[1] = py + vy * cos - ux * vz * sin + uy * along;
  vector[2] = heightMeters + vz * cos + (ux * vy - uy * vx) * sin;
};

/** #### Returns the direction a fold turns its moving side
 * @param fold The fold.
 * @returns 1 for a valley, towards +Z, or −1 for a mountain.
 */
export const turnSign = (fold) => (fold.type === "valley" ? 1 : -1);

/** #### Returns how far the model has turned about its upright axis
 * - Each turn-over turns it by −π radians, eased as a fold is, so its
 *   right edge swings towards the viewer; it ends at −π times the count.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param sequencePosition From 0 (flat) to the step count: whole steps
 *   done, plus the linear progress through the next.
 * @param sheet The sheet that cutSheet() returns.
 * @returns The turn, in radians, 0 before any turn-over and for a sheet
 *   with no steps.
 */
export const viewTurnRadiansAt = (sequencePosition, sheet) => {
  if (sheet.steps.length === 0) return 0;

  const stepIndex = stepIndexAt(sequencePosition, sheet);
  const step = sheet.steps[stepIndex];
  const turnOvers =
    step.kind === "turn-over"
      ? step.turnOversBefore + smoothstep(sequencePosition - stepIndex)
      : step.turnOversBefore;

  return TURN_OVER_RADIANS * turnOvers;
};

/** #### Clamps a value to the range 0 to 1
 * @param value The value.
 * @returns The value, no less than 0 and no more than 1.
 */
const clampUnit = (value) => Math.min(Math.max(value, 0), 1);

/** #### Returns the value a fraction of the way from one value to another
 * @param from The value at fraction 0.
 * @param to The value at fraction 1.
 * @param fraction From 0 to 1.
 * @returns The value between.
 */
const lerp = (from, to, fraction) => from + (to - from) * fraction;

/** #### Returns the index of the step under way at a sequence position
 * - The last step's, at the end of the sequence.
 * @param sequencePosition From 0 (flat) to the step count.
 * @param sheet The sheet that cutSheet() returns.
 * @returns The step's index in the sheet's `steps`.
 */
const stepIndexAt = (sequencePosition, sheet) =>
  Math.max(0, Math.min(Math.floor(sequencePosition), sheet.steps.length - 1));

/** #### Writes every vertex of a sheet with no folds, posed flat
 * - Each face at its stage-0 placement, raised by the paper's thickness
 *   for each layer beneath it, less the stage-0 centre.
 * - Allocates nothing, so it is safe on the per-frame path.
 * @param positions An array of three numbers per vertex, in metres,
 *   overwritten.
 * @param sheet The sheet that cutSheet() returns, with no folds.
 */
const writeFlatPositions = (positions, sheet) => {
  const { centres, faces } = sheet;
  const centreX = centres[0][0];
  const centreY = centres[0][1];

  let vertex = 0;
  for (let f = 0; f < faces.length; f++) {
    const { layers, placements, polygon } = faces[f];

    // Read by index: array destructuring would run an iterator.
    const placement = placements[0];
    const a = placement[0];
    const b = placement[1];
    const c = placement[2];
    const d = placement[3];
    const tx = placement[4];
    const ty = placement[5];
    const z = PAPER_THICKNESS_METERS * (layers[0] - 1);
    for (let i = 0; i < polygon.length; i++, vertex++) {
      const x = polygon[i][0];
      const y = polygon[i][1];
      positions[3 * vertex] = a * x + c * y + tx - centreX;
      positions[3 * vertex + 1] = b * x + d * y + ty - centreY;
      positions[3 * vertex + 2] = z;
    }
  }
};
