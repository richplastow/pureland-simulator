/**
 * @fileoverview
 * Entry point: draws a lit sheet of paper, which shadows itself, on a
 * transparent canvas. In Presentation Mode it folds the paper into the
 * design a radio chooses, turning it over where the design says, or back
 * to flat; in Sandbox Mode it unfolds the paper to the flat sheet of the
 * pattern a radio chooses, with the pattern's lattice printed on it. It
 * stretches the flat sheet from one shape to the next between them while
 * turning it to the next's starting pose and lean, prints each design's
 * fold lines on it as it folds and unfolds while the "Fold lines" checkbox
 * is ticked, or always in Sandbox Mode, but fades them out on the finished
 * model at rest, fades its front to the colour a swatch names, or a design
 * or pattern names once it takes over the flat sheet, and turns it like a
 * turntable as a drag on the canvas moves, easing it back on a
 * double-click; Escape hides and shows the toolbar. In Sandbox Mode at
 * rest, a hover lights the nearest lattice line, and a click, a tap or the
 * arrow keys pick one, showing its two Fold Buttons, which fold it flat,
 * valley or mountain as the player sees the paper, recutting the sandbox
 * sheet; Undo, Redo and Unfold, and their shortcuts, walk the session back
 * and forth.
 */

import {
  MathUtils,
  PerspectiveCamera,
  Scene,
  Timer,
  Vector3,
  WebGLRenderer,
} from "three";
import { distanceToFitSphere } from "./camera/fit.js";
import { DESIGNS } from "./designs/list.js";
import {
  writeLean,
  writeStartPose,
  writeStretchScale,
} from "./designs/sheet.js";
import { cutSheet } from "./fold/engine.js";
import { foldPositionAt, maxPaperRadius } from "./fold/pose.js";
import { stepSequence } from "./fold/stepper.js";
import { connectDrag } from "./input/drag.js";
import { connectPick } from "./input/pick.js";
import { startSpinReset, stepSpinReset, turnSpin } from "./input/spin.js";
import { foldableLines } from "./sandbox/lattice.js";
import {
  litSegments,
  pickLine,
  pickSpans,
  placedFaces,
  seenType,
  showsFrontAt,
  writeFoldMiddle,
} from "./sandbox/line-pick.js";
import { PATTERNS } from "./sandbox/patterns.js";
import { createSession, cutSession, foldAt } from "./sandbox/session.js";
import { createLights } from "./scene/lights.js";
import {
  PAPER_COLOR_SHADES,
  PAPER_COLORS,
  stepColorFade,
} from "./scene/paper-colors.js";
import { createPaper } from "./scene/paper.js";
import { connectColorSwatches } from "./ui/color-swatches.js";
import { connectControlsToggle } from "./ui/controls-toggle.js";
import { connectDesignRadios } from "./ui/design-radios.js";
import { connectFoldButtons } from "./ui/fold-buttons.js";
import { connectFoldLinesToggle } from "./ui/fold-lines-toggle.js";
import { connectModeRadios } from "./ui/mode-radios.js";
import { connectPatternRadios } from "./ui/pattern-radios.js";
import { connectSandboxBar } from "./ui/sandbox-bar.js";

// Raised above the horizontal XZ plane, turned from +Z towards +Y.
const CAMERA_ELEVATION_RADIANS = MathUtils.degToRad(20);
const CAMERA_FAR_METERS = 10;
const CAMERA_FOV_DEGREES = 30; // vertical; PerspectiveCamera takes degrees
const CAMERA_NEAR_METERS = 0.01;
const FRAME_MARGIN = 1.1; // leaves room around the paper for the toolbar

// The graphic black the lit paper never reaches: the lit line's ink over
// the coloured side, as the Fold Buttons' ink there is in the CSS.
const GRAPHIC_BLACK = 0x000000;

// The tilt stops where the view looks straight down or straight up the
// paper's vertical axis. Past either limit, a drag right would carry the
// paper's near surface left.
const MAX_PITCH_RADIANS = Math.PI / 2 - CAMERA_ELEVATION_RADIANS;
const MAX_PIXEL_RATIO = 2; // caps GPU cost on high-density screens
const MIN_PITCH_RADIANS = -(Math.PI / 2 + CAMERA_ELEVATION_RADIANS);

// The faces, lines and segments of the rest state while there is none.
const NONE_AT_REST = Object.freeze([]);

// How near a press or a hover must come to a line to pick or light it, on
// the sheet, in metres: 8 mm, about 12 px on a phone and 27 px on a
// desktop.
const PICK_DISTANCE_METERS = 0.008;

const canvas = document.querySelector(".scene");

// Every design and every pattern, keyed by its `id`, for its colour.
const designs = Object.fromEntries(
  DESIGNS.map((design) => [design.id, design]),
);
const patterns = Object.fromEntries(
  PATTERNS.map((pattern) => [pattern.id, pattern]),
);

// Every sheet the paper can show, cut once at load, keyed by the `id` of
// the design or pattern it is cut from: each design's, and each pattern's
// flat sheet, cut from the empty session.
const sheets = {
  ...Object.fromEntries(DESIGNS.map((design) => [design.id, cutSheet(design)])),
  ...Object.fromEntries(
    PATTERNS.map((pattern) => [
      pattern.id,
      cutSession(pattern, createSession()),
    ]),
  ),
};
const [firstDesign] = DESIGNS;

// The sphere that holds the paper over every design's whole fold sequence,
// so the camera never moves while the paper folds or switches sheets. A
// pattern's flat sheet lies inside it, so it counts the designs' alone.
const paperRadiusMeters = Math.max(
  ...DESIGNS.map((design) => maxPaperRadius(sheets[design.id])),
);

// An `alpha` canvas clears to transparent, so the page shows through.
// A stencil buffer, off by default, lets the paper mark where it draws, so
// the lit line keeps within the paper's outline; `autoClearStencil` clears
// it each frame.
const renderer = new WebGLRenderer({
  alpha: true,
  antialias: true,
  canvas,
  stencil: true,
});

// The paper shadows itself, and only itself: the scene holds nothing else.
renderer.shadowMap.enabled = true;

const scene = new Scene();
const camera = new PerspectiveCamera(
  CAMERA_FOV_DEGREES,
  1, // replaced by the canvas's aspect before the first frame
  CAMERA_NEAR_METERS,
  CAMERA_FAR_METERS,
);
const timer = new Timer();

// The paper starts as the first design, finished, in Presentation Mode, and
// stays there until a design or a mode is chosen. A finished model at rest
// shows no fold lines, whatever the "Fold lines" checkbox says, so the
// lines start hidden. The target names that same point, so the stepper has
// nothing to do at load. The target's `linesOn` follows the checkbox, which
// a browser may restore on reload, or is forced on in Sandbox Mode, and
// governs the lines while the paper folds and unfolds.
const sequenceTarget = {
  linesOn: true, // replaced by the checkbox's state at connection
  position: firstDesign.steps.length,
  sheetId: firstDesign.id,
};
const forceLinesOn = connectFoldLinesToggle((linesOn) => {
  sequenceTarget.linesOn = linesOn;
});
const sequenceState = {
  direction: 0,
  linesFade: 0,
  linesVisibility: 0,
  position: firstDesign.steps.length,
  sheetId: firstDesign.id,
  stretchFromId: firstDesign.id,
  stretchProgress: 1,
};

// The paper takes the first design's colour from its first frame.
const paper = createPaper(
  PAPER_COLORS[firstDesign.colorId],
  paperRadiusMeters,
  sheets[sequenceState.sheetId],
);

// The front's colour fade, done at load, with the first design's swatch
// checked, whatever the browser restored on reload. A swatch's colour
// starts at once, whatever the fold sequence is doing, and a design's when
// it takes over the flat sheet, or at once if the paper already holds it;
// each fades from the colour then showing. The lit line and the Fold
// Buttons follow the colour chosen at once, through `chosenColorId`.
const colorFade = { progress: 1 };
let chosenColorId = firstDesign.colorId;
const chooseColor = connectColorSwatches(
  firstDesign.colorId,
  PAPER_COLORS,
  (colorId) => {
    paper.startFrontColorFade(PAPER_COLORS[colorId]);
    colorFade.progress = 0;
    chosenColorId = colorId;
    writePickColors();
  },
);

// The sheet the paper's geometry holds, swapped by identity, so a sheet
// replaced under the same id is shown too; and the id whose colour applied
// last, so the colour follows a change of id, never a swap under the same
// one.
let shownSheet = sheets[sequenceState.sheetId];
let shownSheetId = sequenceState.sheetId;

// The paper's turntable spin, and its ease back to the view at load, which
// a double-click starts; done at load.
const spin = { pitchRadians: 0, yawRadians: 0 };
const spinReset = { fromPitchRadians: 0, fromYawRadians: 0, progress: 1 };

// Sandbox Mode's session: the folds made so far, with any undone tail kept
// for Redo, on the pattern the target names. Reset to empty whenever a
// pattern or Sandbox Mode is chosen, which discards it without a warning.
let isSandbox = false;
let session = createSession();

// The state the paper rests in, in Sandbox Mode, found once per rest state:
// the faces as they lie, which say which side of the paper shows where; the
// lines its lattice can fold along there, and each line's segments, seen
// from each side of the paper, in the same order; the spans of those lines
// that are folds, with paper on both sides, which a press or a hover picks
// from, and the lines that have one, which the arrow keys cycle; and the
// stage's centre, which the pose slides the paper by. No faces or lines
// while not at rest.
let isAtRest = false;
let restCentre = null;
let restFaces = NONE_AT_REST;
let restFoldLines = NONE_AT_REST;
let restLines = NONE_AT_REST;
let restSegments = NONE_AT_REST;
let restSpans = NONE_AT_REST;

// The pick: the line picked, or null; the point its Fold Buttons centre
// above, in `stretchGroup`'s frame; which side faced the camera when it was
// made, which says which fold a valley is; which side of the paper shows
// under it, which says the buttons' colours; and whether the buttons have
// been placed since it, or the canvas's size, last changed.
let isPickFrontFacing = true;
let isPickOnFront = true;
let isPickPlaced = false;
let pickedLine = null;
const pickPoint = new Vector3();

// The line lit, the pick or the hover's preview, or null; the side it was
// lit for; and its segments and the deeper ink they were lit in, so
// lighting it again writes nothing.
let isLitFrontFacing = true;
let litDeeperInk = null;
let litLine = null;
let litLineSegments = null;

// The colour id and the side of the paper the Fold Buttons' colours were
// written for.
let buttonsColorId = null;
let isButtonsOnFront = null;

// A press's or a hover's point in the folded plane, `[x, y]` in metres,
// rewritten in place.
const foldedPoint = [0, 0];

scene.add(paper.group, ...createLights(paperRadiusMeters));

/** #### Matches the camera and drawing buffer to the canvas's CSS size
 * - The camera keeps its elevation and moves along its line of sight, so
 *   the paper's bounding sphere fills the view's smaller dimension.
 * @param width The canvas's width, in CSS pixels.
 * @param height The canvas's height, in CSS pixels.
 */
const resize = (width, height) => {
  if (width === 0 || height === 0) return; // hidden, nothing to fit

  camera.aspect = width / height;
  const distanceMeters =
    FRAME_MARGIN *
    distanceToFitSphere(camera.aspect, camera.fov, paperRadiusMeters);
  camera.position.set(
    0,
    distanceMeters * Math.sin(CAMERA_ELEVATION_RADIANS),
    distanceMeters * Math.cos(CAMERA_ELEVATION_RADIANS),
  );
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

  // CSS sizes the canvas, so Three.js must not set its style.
  renderer.setSize(width, height, false);
};

resize(canvas.clientWidth, canvas.clientHeight);

// A new size moves the pick point on screen, so the Fold Buttons are placed
// again after the next frame's render.
new ResizeObserver(([entry]) => {
  resize(entry.contentRect.width, entry.contentRect.height);
  isPickPlaced = false;
}).observe(canvas);

/** #### Passes a design's or a pattern's choice on to the target and colour
 * - A choice or a tick mid-step changes only the target, which the stepper
 *   reads once the step, fade or stretch in progress finishes. A choice's
 *   target carries no `linesOn`, so Object.assign() keeps the checkbox's.
 * - Choosing the sheet the paper already holds re-applies its colour, if
 *   it names one; another sheet's colour waits until that sheet takes over
 *   the flat sheet, in writeSequenceState().
 * - A choice can arrive twice, and does nothing the second time: the
 *   target is the same, and chooseColor() ignores the colour already
 *   chosen.
 * @param choice The choice: `colorId`, or null for none; and `target`,
 *   its `position` and `sheetId`, or null for flat.
 */
const choose = ({ colorId, target }) => {
  Object.assign(sequenceTarget, target);
  if (colorId !== null && target.sheetId === sequenceState.sheetId) {
    chooseColor(colorId);
  }
};

/** #### Passes a pattern's choice on, starting an empty session on it
 * - Discards the session so far without a warning, and leaves the
 *   pattern's sheet in `sheets` as it is, since the paper may still be
 *   unfolding on it towards the choice's position 0; the next fold, made
 *   at position 0, replaces it.
 * - A choice can arrive twice, and the second empties an empty session.
 * @param choice The pattern's choice, as choose() takes it.
 */
const choosePattern = (choice) => {
  session = createSession();
  choose(choice);
  writeSandboxBar();
};

const checkedDesignChoice = connectDesignRadios(PAPER_COLORS, choose);
const checkedPatternChoice = connectPatternRadios(PAPER_COLORS, choosePattern);

/** #### Folds the picked line flat, as a Fold Button says, recutting the sheet
 * - The fold is the pick's line, `from` and `to` as the lattice oriented
 *   them, the button's fold turned into the front's terms by the side
 *   that faced the camera at the pick, flat. It replaces the session with
 *   one that keeps the folds before the paper's position, k, then this
 *   fold, recuts the pattern's sheet from it, and sets the target to
 *   k + 1.
 * - Swaps the new sheet in at once, at rest at k, before the step starts:
 *   both sheets are cut along the same first k folds, so the new one,
 *   posed at k, covers the same paper, in the same order; only heights in
 *   deep stacks may settle.
 * - Does nothing unless the paper is still at rest: a choice, an Undo or
 *   a Redo made since the pick moves the target at once, but the pick
 *   clears only on the next frame, and a fold at the old position would
 *   override the move, or fall outside an emptied session.
 * - Allocates, on the press only.
 * @param type The fold as the player sees it, `"mountain"` or `"valley"`.
 */
const foldPick = (type) => {
  if (pickedLine === null || !canPick()) return;

  const { position, sheetId } = sequenceState;
  const { from, to } = pickedLine;
  session = foldAt(session, position, {
    from,
    targetRadians: Math.PI, // flat
    to,
    type: seenType(isPickFrontFacing, type),
  });
  sheets[sheetId] = cutSession(patterns[sheetId], session);
  sequenceTarget.position = position + 1;
  clearPick();
  writeSequenceState();
  writeSandboxBar();
};

const foldButtons = connectFoldButtons(
  camera,
  canvas,
  foldPick,
  paper.stretchGroup,
);

// Undo, Redo and Unfold move only the target, so a step under way finishes
// first, and repeated presses add up, each playing in turn.
const sandboxBar = connectSandboxBar(
  () => {
    sequenceTarget.position = Math.min(
      sequenceTarget.position + 1,
      session.folds.length,
    );
    writeSandboxBar();
  },
  () => {
    sequenceTarget.position = Math.max(sequenceTarget.position - 1, 0);
    writeSandboxBar();
  },
  () => {
    sequenceTarget.position = 0;
    writeSandboxBar();
  },
);

/** #### Writes the sandbox bar's limits from the target and the session
 * - Undo and Unfold stop at position 0, and Redo at the session's fold
 *   count.
 */
const writeSandboxBar = () => {
  sandboxBar.setLimits(session.folds.length, sequenceTarget.position);
};

// Choosing a mode forces the fold lines on in Sandbox Mode, or releases
// them in Presentation Mode, shows the sandbox bar in Sandbox Mode only,
// and passes on the choice of the checked pattern or design, as if that
// radio had been chosen. A mode can arrive twice, and does nothing the
// second time but empty an empty session.
connectModeRadios((mode) => {
  isSandbox = mode === "sandbox";
  forceLinesOn(isSandbox);
  sandboxBar.setShown(isSandbox);
  if (isSandbox) {
    choosePattern(checkedPatternChoice());
  } else {
    choose(checkedDesignChoice());
  }
});

/** #### Returns true if a line can be lit or picked now
 * - In Sandbox Mode, with the lines found for the rest state, the
 *   sequence state at its target, and no stretch, fade or spin reset
 *   under way. A held drag reports no hover and no press.
 * - Allocates nothing.
 * @returns True if a line can be lit or picked.
 */
const canPick = () =>
  isAtRest && isSequenceAtRest() && spinReset.progress >= 1;

/** #### Clears the pick, if there is one, and the lit line
 * - Hides the Fold Buttons, if they show.
 * - Allocates nothing, so it is safe on every pointer move.
 * @returns True if there was a pick to clear.
 */
const clearPick = () => {
  const hadPick = pickedLine !== null;
  if (hadPick) {
    pickedLine = null;
    foldButtons.hide();
  }
  light(null, true);

  return hadPick;
};

/** #### Lights a line, or none, in the inks of the printed lines beneath it
 * - Each segment of the line takes the ink of the printed line it covers,
 *   as seen from the camera's side: black where the paper shows its front,
 *   the coloured side, and along a border between the two sides; the
 *   paper colour's deeper shade where it shows only its back, the white
 *   side. The line grows in, and the one before shrinks out, as
 *   paper.stepLitLines() steps them.
 * - Writes nothing if the line's segments and inks are as they were.
 * - Allocates nothing, so it is safe on every pointer move.
 * @param line The line to light, from `restLines`, or null for none.
 * @param isFrontFacing True if the camera lies on the front's side of the
 *   paper's plane.
 */
const light = (line, isFrontFacing) => {
  if (line === null) {
    if (litLine === null) return;

    litLine = null;
    litLineSegments = null;
    paper.clearLitLine();
    return;
  }

  const { back, front } = restSegments[restLines.indexOf(line)];
  const segments = isFrontFacing ? front : back;
  const deeperInk = PAPER_COLOR_SHADES[chosenColorId].deeper;
  if (segments === litLineSegments && deeperInk === litDeeperInk) return;

  isLitFrontFacing = isFrontFacing;
  litDeeperInk = deeperInk;
  litLine = line;
  litLineSegments = segments;
  paper.lightLine(deeperInk, restCentre, GRAPHIC_BLACK, line, segments);
};

/** #### Returns the line nearest a hit on the paper's plane, within reach
 * - Adds back the stage's centre, so the hit becomes a point of the
 *   folded plane, which the lattice's lines are in.
 * - Measures to the lines' spans that are folds, so a hit near a line
 *   where it only runs along the paper's outline, or over a gap, finds
 *   nothing there.
 * - Allocates nothing, so it is safe on every pointer move.
 * @param hit The hit, a Vector3 in metres in `stretchGroup`'s frame, or
 *   null if the pointer's ray missed the plane.
 * @returns The line whose fold span is nearest, within
 *   `PICK_DISTANCE_METERS`, or null.
 */
const nearestLine = (hit) => {
  if (hit === null) return null;

  foldedPoint[0] = hit.x + restCentre[0];
  foldedPoint[1] = hit.y + restCentre[1];

  return pickLine(restSpans, PICK_DISTANCE_METERS, foldedPoint)?.line ?? null;
};

/** #### Picks a line, lighting it and showing its Fold Buttons
 * - The buttons are placed above `pickPoint`, which the caller has
 *   written, after the next frame's render. Their colours follow the side
 *   of the paper showing at `foldedPoint`, the same point in the folded
 *   plane, which the caller has also written; where no paper lies there,
 *   the side facing the camera's.
 * - Allocates nothing, unless the buttons' colours change.
 * @param line The line, from `restLines`.
 * @param isFrontFacing True if the camera lies on the front's side of the
 *   paper's plane.
 */
const pick = (line, isFrontFacing) => {
  isPickFrontFacing = isFrontFacing;
  isPickOnFront =
    showsFrontAt(restFaces, isFrontFacing, foldedPoint) ?? isFrontFacing;
  isPickPlaced = false;
  pickedLine = line;
  light(line, isFrontFacing);
  writePickColors();
};

/** #### Writes the Fold Buttons' colours and the lit line's for the pick
 * - The buttons take the paper colour's two shades, and the theme for the
 *   side of the paper under the pick, which the CSS draws: over the
 *   coloured side, the lighter shade behind black ink; over the white
 *   side, a white behind the deeper shade.
 * - Called on a pick and on a change of colour; writes the buttons'
 *   shades only when the colour has changed since, their theme only when
 *   the side under the pick has, and the lit line's only when it shows.
 */
const writePickColors = () => {
  if (litLine !== null) light(litLine, isLitFrontFacing);
  if (pickedLine === null) return;
  if (buttonsColorId !== chosenColorId) {
    buttonsColorId = chosenColorId;
    const { deeper, lighter } = PAPER_COLOR_SHADES[chosenColorId];
    foldButtons.setColors(deeper, lighter);
  }
  if (isButtonsOnFront !== isPickOnFront) {
    isButtonsOnFront = isPickOnFront;
    foldButtons.setOverWhite(!isPickOnFront);
  }
};

/** #### Returns true if the sequence state rests at its target in Sandbox Mode
 * - At the target's `sheetId` and `position`, with no stretch or fade of
 *   the lines under way.
 * - Allocates nothing, so it is safe on the per-frame path.
 * @returns True if at rest.
 */
const isSequenceAtRest = () =>
  isSandbox &&
  sequenceState.sheetId === sequenceTarget.sheetId &&
  sequenceState.position === sequenceTarget.position &&
  sequenceState.stretchProgress === 1 &&
  sequenceState.linesFade === 0;

/** #### Finds what the paper shows where it now rests, and what can fold
 * - The faces placed at the position's stage, the lines the paper can fold
 *   along there, and each line's segments seen from each side, once per
 *   rest state, so a pointer move compares the hit with at most a few tens
 *   of lines, and lights one by lookup. Also the stage's centre.
 * - Allocates, so call it only when the paper comes to rest.
 */
const enterRest = () => {
  const sheet = sheets[sequenceState.sheetId];
  const stage = foldPositionAt(sequenceState.position, sheet);
  restCentre = sheet.centres[stage];
  restFaces = placedFaces(sheet, stage);
  restLines = foldableLines(
    patterns[sequenceState.sheetId],
    restFaces.map(({ polygon }) => polygon),
  );
  restSegments = restLines.map((line) => ({
    back: litSegments(restFaces, false, line),
    front: litSegments(restFaces, true, line),
  }));
  restSpans = pickSpans(
    restLines,
    restSegments.map(({ front }) => front),
  );
  restFoldLines = restLines.filter((_line, i) => restSegments[i].front.length);
};

// Escape clears the pick if there is one, and otherwise hides and shows
// the toolbar: the hidden toolbar leaves the paper alone on screen.
connectControlsToggle(clearPick);

/** #### Writes the spin to the paper's outermost group
 * - With the default order `XYZ`, the paper turns about its own vertical
 *   axis first and tilts towards the viewer second.
 * - Allocates nothing, so it is safe on the per-frame path.
 */
const writeSpin = () => {
  paper.group.rotation.set(spin.pitchRadians, spin.yawRadians, 0);
};

// A hover, with no pick standing, lights the nearest line within reach as
// a preview, or none. A press that does not move picks the nearest line
// within reach, at the press, or clears the pick if there is none. Left
// and Right pick the line before or after the pick, in the lattice's
// order, among the lines that are folds somewhere, at the middle of the
// line's longest fold span.
const pressAt = connectPick(
  camera,
  canvas,
  (step, isFrontFacing) => {
    if (!canPick() || restFoldLines.length === 0) return;

    const count = restFoldLines.length;
    const index = restFoldLines.indexOf(pickedLine);
    let next = (index + step + count) % count;
    if (index === -1) next = step > 0 ? 0 : count - 1;
    writeFoldMiddle(restFoldLines[next], foldedPoint, restSpans);
    pickPoint.set(
      foldedPoint[0] - restCentre[0],
      foldedPoint[1] - restCentre[1],
      0,
    );
    pick(restFoldLines[next], isFrontFacing);
  },
  (hit, isFrontFacing) => {
    if (pickedLine !== null || !canPick()) return;

    light(nearestLine(hit), isFrontFacing);
  },
  (hit, isFrontFacing) => {
    if (!canPick()) return;

    const line = nearestLine(hit);
    if (line === null) {
      clearPick();
      return;
    }
    pickPoint.copy(hit);
    pick(line, isFrontFacing);
  },
  paper.stretchGroup,
);

// A drag clears the pick as it starts, cancels a reset under way where it
// is, and takes over at once; a double-click starts a reset from where the
// spin is.
connectDrag(
  canvas,
  (deltaXPixels, deltaYPixels) => {
    clearPick();
    spinReset.progress = 1;
    turnSpin(
      deltaXPixels,
      deltaYPixels,
      MAX_PITCH_RADIANS,
      MIN_PITCH_RADIANS,
      spin,
    );
    writeSpin();
  },
  pressAt,
);
canvas.addEventListener("dblclick", () => startSpinReset(spinReset, spin));

/** #### Writes the sequence state to the paper
 * - Swaps in the sheet `sheetId` names if it is no longer the one shown,
 *   by identity, which happens only at rest: with the paper flat and its
 *   lines hidden, for a design or a pattern, or at a sandbox fold's
 *   position with its lines showing, for a sandbox fold. Redraws the
 *   printed lines only when the new sheet's `designId` differs from the
 *   old one's, since a sandbox fold keeps the pattern's lattice.
 * - Chooses the colour of the design or pattern `sheetId` names, if it
 *   names one, if `sheetId` has changed. Then poses the paper, shows its
 *   lines, and writes the stretch, the start pose and the lean.
 * - Writes the scale, the pose and the lean on every change, so the scale
 *   ends on exactly 1, and the pose and the lean on exactly the sheet's.
 *   Refits the grain after the scale, in the same frame: setSheet() fits
 *   the grain to the scale written before.
 * - Allocates nothing unless the sheet has changed.
 */
const writeSequenceState = () => {
  const sheet = sheets[sequenceState.sheetId];
  if (sheet !== shownSheet) {
    const isNewDesign = sheet.designId !== shownSheet.designId;
    shownSheet = sheet;
    paper.setSheet(sheet);
    if (isNewDesign) paper.setPrintedLines(sheet);
  }
  if (sequenceState.sheetId !== shownSheetId) {
    shownSheetId = sequenceState.sheetId;
    const { colorId } = designs[shownSheetId] ?? patterns[shownSheetId];
    if (colorId !== undefined) chooseColor(colorId);
  }
  paper.setSequencePosition(sequenceState.position);
  paper.setLinesVisibility(sequenceState.linesVisibility);
  writeStretchScale(paper.stretchScale, sheets, sequenceState);
  writeStartPose(paper.startRotation, sheets, sequenceState);
  writeLean(paper.leanRotation, sheets, sequenceState);
  paper.fitGrain();
};

// The first frame shows the state the page starts in, with no animation.
writeSequenceState();

// Avoid a large jump in the fold when a hidden tab becomes visible again.
timer.connect(document);

renderer.setAnimationLoop((timestampMs) => {
  timer.update(timestampMs);
  const deltaSeconds = timer.getDelta();
  if (stepSequence(deltaSeconds, sheets, sequenceState, sequenceTarget)) {
    writeSequenceState();
  }

  // True on the step that reaches 1, so the fade ends on exactly its colour.
  if (stepColorFade(deltaSeconds, colorFade)) {
    paper.setFrontColorFade(colorFade.progress);
  }

  // True on the step that reaches 1, so the spin ends on exactly 0. A
  // reset moves the paper, so it clears the pick.
  if (stepSpinReset(deltaSeconds, spinReset, spin)) {
    writeSpin();
    clearPick();
  }

  // Coming to rest finds the lines to pick from; leaving it clears them,
  // and the pick, before the frame draws the paper moving.
  const isNowAtRest = isSequenceAtRest();
  if (isNowAtRest !== isAtRest) {
    isAtRest = isNowAtRest;
    if (isAtRest) {
      enterRest();
    } else {
      clearPick();
      restFaces = NONE_AT_REST;
      restFoldLines = NONE_AT_REST;
      restLines = NONE_AT_REST;
      restSegments = NONE_AT_REST;
      restSpans = NONE_AT_REST;
    }
  }

  // After the rest check, so a line put out as the paper leaves rest starts
  // shrinking in this frame.
  paper.stepLitLines(deltaSeconds);
  renderer.render(scene, camera);

  // After the render, so the camera's matrices are this frame's.
  if (pickedLine !== null && !isPickPlaced) {
    foldButtons.showAt(pickPoint);
    isPickPlaced = true;
  }
});
