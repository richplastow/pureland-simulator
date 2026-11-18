/**
 * @fileoverview
 * Entry point: draws a lit sheet of paper, which shadows itself, on a
 * transparent canvas. In Presentation Mode it folds the paper into the
 * design a radio chooses, turning it over where the design says, or back
 * to flat; in Sandbox Mode, where the page starts, it unfolds the paper to
 * the flat sheet of the pattern a radio chooses, with the pattern's lattice
 * printed on it. It stretches the flat sheet from one shape to the next
 * between them while turning it to the next's starting pose and lean,
 * prints each design's fold lines on it as it folds and unfolds while the
 * "Fold lines" checkbox is ticked, or always in Sandbox Mode, but fades
 * them out on the finished model at rest, fades its front to the colour a
 * swatch names, or a design or pattern names once it takes over the flat
 * sheet, and turns it like a turntable as a drag on the canvas moves,
 * easing it back on a double-click; Escape hides and shows the toolbar.
 * In Sandbox Mode at rest, a hover lights the nearest Fold Line, and a
 * click, a tap or Left and Right make one active, showing its two Fold
 * Buttons on it, which fold it flat, valley or mountain as the player sees
 * the paper, recutting the sandbox sheet; Up and Down press them. With
 * "Fast Fold" ticked, pairs show with no line active, on every line that
 * fits until a mouse is detected, then on those nearest the mouse, each
 * side of a lit line standing in for its button. A mouse drag from a lit
 * line folds the paper live, by the side of the line and the distance from
 * it, and Shift with Up or Down steps the active line's fold live; a
 * release or Enter snaps the angle to a whole step and makes the fold,
 * which may stand short of flat, after which nothing more folds. Undo,
 * Redo and Unfold, and their shortcuts, walk the session back and forth,
 * and Export shows the folds the paper shows as a JSON design file.
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
import { writeDesignFile } from "./designs/design-file.js";
import { DESIGNS } from "./designs/list.js";
import {
  writeLean,
  writeStartPose,
  writeStretchScale,
} from "./designs/sheet.js";
import { unsmoothstep } from "./fold/easing.js";
import { cutSheet } from "./fold/engine.js";
import { foldPositionAt, maxPaperRadius } from "./fold/pose.js";
import { stepSequence } from "./fold/stepper.js";
import { connectDrag } from "./input/drag.js";
import { connectMouseDetection } from "./input/mouse.js";
import { connectPick } from "./input/pick.js";
import { startSpinReset, stepSpinReset, turnSpin } from "./input/spin.js";
import {
  CANCEL_RADIANS,
  dragAngleRadians,
  reachesPx,
  SNAP_RADIANS,
  snapAngleRadians,
  stepLiveAngle,
  stepLiveCentre,
} from "./sandbox/angle.js";
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
import {
  createSession,
  cutSession,
  foldAt,
  hasStandingFold,
} from "./sandbox/session.js";
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
import { connectFastFold } from "./ui/fast-fold.js";
import {
  PAIR_GAP_PX,
  PAIR_HITZONE_PX,
  placeBesideClick,
  placeOnPoint,
  POINTER_CLEARANCE_PX,
  sideOf,
  zoneContains,
} from "./ui/fold-button-layout.js";
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
const controls = document.querySelector(".controls");

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
const [firstPattern] = PATTERNS;

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

// The paper starts in Sandbox Mode, at rest on the first pattern's flat
// sheet, position 0, with its lattice showing, as the mode forces the fold
// lines on, and stays there until a pattern or a mode is chosen. The target
// names that same point, so the stepper has nothing to do at load. The
// target's `linesOn` follows the checkbox, which a browser may restore on
// reload, or is forced on in Sandbox Mode, and governs the lines while the
// paper folds and unfolds.
const sequenceTarget = {
  linesOn: true, // replaced by the checkbox's state at connection
  position: 0,
  sheetId: firstPattern.id,
};
const forceLinesOn = connectFoldLinesToggle((linesOn) => {
  sequenceTarget.linesOn = linesOn;
});
const sequenceState = {
  direction: 0,
  linesFade: 0,
  linesVisibility: 1,
  position: 0,
  sheetId: firstPattern.id,
  stretchFromId: firstPattern.id,
  stretchProgress: 1,
};

// The paper takes the first pattern's colour from its first frame.
const paper = createPaper(
  PAPER_COLORS[firstPattern.colorId],
  paperRadiusMeters,
  sheets[sequenceState.sheetId],
);

// The front's colour fade, done at load, with the first pattern's swatch
// checked, whatever the browser restored on reload. A swatch's colour
// starts at once, whatever the fold sequence is doing, and a design's when
// it takes over the flat sheet, or at once if the paper already holds it;
// each fades from the colour then showing. The lit lines and the Fold
// Buttons follow the colour chosen at once, through `chosenColorId`.
const colorFade = { progress: 1 };
let chosenColorId = firstPattern.colorId;
const chooseColor = connectColorSwatches(
  firstPattern.colorId,
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
let isSandbox = true;
let session = createSession();

// The state the paper rests in, in Sandbox Mode, found once per rest state:
// the faces as they lie, which say which side of the paper shows where; the
// lines its lattice can fold along there, and each line's segments, seen
// from each side of the paper, in the same order; the spans of those lines
// that are folds, with paper on both sides, which a press or a hover picks
// from, all together and per line, in the same order as the lines; the
// Fold Lines, those with a span, which the arrow keys cycle; and the
// stage's centre, which the pose slides the paper by. No faces or lines
// while not at rest.
let isAtRest = false;
let restCentre = null;
let restFaces = NONE_AT_REST;
let restFoldLines = NONE_AT_REST;
let restLines = NONE_AT_REST;
let restSegments = NONE_AT_REST;
let restSpans = NONE_AT_REST;
let restSpansByLine = NONE_AT_REST;

// The Fold Lines on screen, in CSS pixels, each line's `index` its index in
// `restFoldLines`, as fold-button-layout.js takes them: projected after
// each frame that a layout event marks stale, while the scene rests, and
// emptied while a drag or a resize leaves them out of date. The
// space the pairs are laid out in, made once: the toolbar's controls to
// keep clear of, a pair's size, measured from the CSS, and the viewport.
// Which side faced the camera at the last layout, which a Fast Fold pair's
// press folds by.
let screenLines = NONE_AT_REST;
const space = {
  exclusions: NONE_AT_REST,
  pair: {
    gapPx: PAIR_GAP_PX,
    heightPx: 0, // measured at each layout
    hitzonePx: PAIR_HITZONE_PX,
    widthPx: 0, // measured at each layout
  },
  pointerClearancePx: POINTER_CLEARANCE_PX,
  viewport: { height: 0, width: 0 }, // the canvas's, written on resize
};
let isLayoutStale = true;
let layoutFrontFacing = true;

// Whether a drag is turning the paper, which lights nothing and lays out
// nothing until it ends; and whether a mouse has been detected, which
// switches Fast Fold from the touch layout to the nearby one.
let hasMouse = false;
let isOrbiting = false;

// The active line: the line picked, or null; its fold spans, whose hitzone
// is part of the kept zone; whether Left or Right picked it; its pair, or
// null, and whether that pair is one of Fast Fold's touch layout; the point
// its pair was placed by, in `stretchGroup`'s frame; which side faced the
// camera when it was picked, which says which fold a valley is; and which
// side of the paper shows under the pick, which says the pair's colours.
let activeLine = null;
let activePair = null;
let activeSpans = NONE_AT_REST;
let isActiveByKeyboard = false;
let isActivePairFast = false;
let isPickFrontFacing = true;
let isPickOnFront = true;
const pickPoint = new Vector3();

// The keyboard's pick, put away as the canvas lost focus, which focus
// returning restores, or null.
let rememberedLine = null;

// The press a Fold Line claimed at `pointerdown`, kept for its release or
// its drag: the line, or null; where it went down, in `stretchGroup`'s
// frame, and on screen, in CSS pixels; the side facing the camera then;
// where the proxy serves it, the line's Fast Fold pair, or null, and the
// side of the line it went down on; and whether it has started to drag.
let claimedLine = null;
let claimedPair = null;
let claimedSide = "mountain";
let claimXPx = 0;
let claimYPx = 0;
let isClaimDragging = false;
let isClaimFrontFacing = true;
const claimPoint = new Vector3();

// The live fold, while a mouse drag from a Fold Line, or Shift and the
// arrows on the active line, fold that line live, before the fold is made:
// whether one shows, whether it is the keyboard's, and whether it has been
// released, by the mouse's release, Enter or a step back to flat, so that
// it settles, then is made or dropped; its line, from `restFoldLines`, and
// whether the camera faced the paper's front at its start, which says
// which fold a valley is; the angle shown and the angle wanted, signed,
// positive towards mountain as seen, in radians; the centre shown, a
// scratch `[x, y]` in metres in the folded plane, which the shown cuts'
// two centres at the fold are, and the centre wanted; the session cut with
// the line folded a half turn, per fold as seen, or null until wanted, and
// the same cut as shown, its two centres at the fold the centre shown; for
// a drag, the line on screen and each side's reach, fixed at the press;
// and the step Left or Right takes once a keyboard angle has eased back to
// flat, or 0.
const live = {
  centre: [0, 0],
  cuts: { mountain: null, valley: null },
  cycleStep: 0,
  isActive: false,
  isByKeyboard: false,
  isFrontFacing: true,
  isReleased: false,
  line: null,
  radians: 0,
  reaches: null,
  screenLine: null,
  shownCuts: { mountain: null, valley: null },
  targetCentre: [0, 0],
  targetRadians: 0,
};

// The hovered line lit, or null; the side it was lit for; and its segments
// and the deeper ink they were lit in, so lighting it again writes nothing.
let isLitFrontFacing = true;
let litDeeperInk = null;
let litLine = null;
let litLineSegments = null;

// Whether the canvas carries `data-over-line`, and the pair whose button
// the proxy marks, or null.
let isOverLine = false;
let proxiedPair = null;

// The colour id the Fold Buttons' colours were written for.
let buttonsColorId = null;

// A point in the folded plane, `[x, y]` in metres, rewritten in place: a
// press's or a hover's, and one under a pair, for its colours.
const foldedPoint = [0, 0];
const themePoint = [0, 0];

// Scratch for a point carried to the screen, created once: the projected
// vector, and the result, `x` and `y` in CSS pixels.
const projected = new Vector3();
const screenPoint = { x: 0, y: 0 };

scene.add(paper.group, ...createLights(paperRadiusMeters));

/** #### Matches the camera and drawing buffer to the canvas's CSS size
 * - The camera keeps its elevation and moves along its line of sight, so
 *   the paper's bounding sphere fills the view's smaller dimension.
 * - Writes the layout's viewport, which the canvas fills.
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
  space.viewport.height = height;
  space.viewport.width = width;
};

resize(canvas.clientWidth, canvas.clientHeight);

// A new size moves the lines on screen, so nothing is picked by their old
// place, and the pairs are laid out again after the next frame's render.
new ResizeObserver(([entry]) => {
  resize(entry.contentRect.width, entry.contentRect.height);
  screenLines = NONE_AT_REST;
  isLayoutStale = true;
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
 * - Drops a live fold first, restoring the rest sheet.
 * @param choice The choice: `colorId`, or null for none; and `target`,
 *   its `position` and `sheetId`, or null for flat.
 */
const choose = ({ colorId, target }) => {
  dropLive();
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

/** #### Folds a line flat, as a Fold Button says, recutting the sheet
 * - The fold is the line, `from` and `to` as the lattice oriented them,
 *   the button's fold turned into the front's terms by the side that
 *   faced the camera when its pair was placed, flat. It replaces the
 *   session with one that keeps the folds before the paper's position, k,
 *   then this fold, recuts the pattern's sheet from it, and sets the
 *   target to k + 1.
 * - Swaps the new sheet in at once, at rest at k, before the step starts:
 *   both sheets are cut along the same first k folds, so the new one,
 *   posed at k, covers the same paper, in the same order; only heights in
 *   deep stacks may settle.
 * - Does nothing unless the paper is still at rest: a choice, an Undo or
 *   a Redo made since the pair showed moves the target at once, but the
 *   pairs hide only on the next frame, and a fold at the old position
 *   would override the move, or fall outside an emptied session.
 * - Allocates, on the press only.
 * @param line The line, from `restFoldLines`.
 * @param isFrontFacing True if the camera faced the paper's front when the
 *   pair was placed.
 * @param type The fold as the player sees it, `"mountain"` or `"valley"`.
 */
const foldLine = (line, isFrontFacing, type) => {
  if (!canPick()) return;

  const { position, sheetId } = sequenceState;
  const { from, to } = line;
  session = foldAt(session, position, {
    from,
    targetRadians: Math.PI, // flat
    to,
    type: seenType(isFrontFacing, type),
  });
  sheets[sheetId] = cutSession(patterns[sheetId], session);
  sequenceTarget.position = position + 1;
  clearPick();
  writeSequenceState();
  writeSandboxBar();
};

/** #### Starts a live fold of a Fold Line, flat
 * - Puts the hover's light out and hides every pair. A drag clears the
 *   active line, as an orbit's start does; the keyboard keeps its line
 *   active, its pair hidden until the paper is flat again.
 * - The sequence state and target do not move while it shows, so the
 *   stepper rests, and canLayOut() and canPick() are false.
 * - Allocates nothing.
 * @param isByKeyboard True for Shift and the arrows, false for a drag.
 * @param isFrontFacing True if the camera faced the paper's front at the
 *   pick or the press.
 * @param line The line, from `restFoldLines`.
 */
const startLive = (isByKeyboard, isFrontFacing, line) => {
  live.cuts.mountain = null;
  live.cuts.valley = null;
  live.cycleStep = 0;
  live.isActive = true;
  live.isByKeyboard = isByKeyboard;
  live.isFrontFacing = isFrontFacing;
  live.isReleased = false;
  live.line = line;
  live.radians = 0;
  live.shownCuts.mountain = null;
  live.shownCuts.valley = null;
  live.targetRadians = 0;
  live.centre[0] = restCentre[0];
  live.centre[1] = restCentre[1];
  live.targetCentre[0] = restCentre[0];
  live.targetCentre[1] = restCentre[1];
  if (isByKeyboard) {
    light(null, true);
    setOverLine(false);
    hideFastPairs();
    if (activePair !== null) activePair.hide();
  } else {
    clearPick();
    hideFastPairs();
  }
};

/** #### Sets the angle the live fold wants, cutting its side once
 * - The first time the angle wanted lies on one side of flat, cuts the
 *   session with the line folded a half turn that way, as seen, and keeps
 *   that cut as shown, with its stage centres at both ends of the fold
 *   replaced by the centre shown, so the pose's slide, which blends the
 *   two, puts the paper exactly there.
 * - Allocates only when it cuts: on the first move or step, and on first
 *   crossing the line.
 * @param radians The angle wanted, signed, positive towards mountain as
 *   seen, in radians.
 */
const setLiveTarget = (radians) => {
  live.targetRadians = radians;
  if (radians === 0) return;

  const seen = radians > 0 ? "mountain" : "valley";
  if (live.cuts[seen] !== null) return;

  const { position, sheetId } = sequenceState;
  const { from, to } = live.line;
  const cut = cutSession(
    patterns[sheetId],
    foldAt(session, position, {
      from,
      targetRadians: Math.PI, // flat
      to,
      type: seenType(live.isFrontFacing, seen),
    }),
  );
  live.cuts[seen] = cut;
  live.shownCuts[seen] = {
    ...cut,
    centres: cut.centres.map((centre, stage) =>
      stage === position || stage === position + 1 ? live.centre : centre,
    ),
  };
};

/** #### Releases the live fold to settle at an angle, then be made
 * - The angle wanted becomes the one given, and the centre wanted the
 *   centre the made fold rests at: the flat fold's own for a half turn,
 *   or the rest centre for a fold that stops short, as stageCentres()
 *   keeps it, or for flat, which makes nothing.
 * - Forgets any step Left or Right left to take.
 * - Allocates nothing, unless it cuts.
 * @param radians The angle to settle at, signed, positive towards
 *   mountain as seen, in radians: 0, or a whole number of steps.
 */
const releaseLive = (radians) => {
  setLiveTarget(radians);
  live.cycleStep = 0;
  live.isReleased = true;

  const flatCut =
    Math.abs(radians) === Math.PI
      ? live.cuts[radians > 0 ? "mountain" : "valley"]
      : null;
  const centre =
    flatCut === null
      ? restCentre
      : flatCut.centres[sequenceState.position + 1];
  live.targetCentre[0] = centre[0];
  live.targetCentre[1] = centre[1];
};

/** #### Returns true if a keyboard angle shows that is not being made
 * - True while Shift and the arrows hold an angle, or while a step back to
 *   flat, Left, Right, Escape, a press or a loss of focus eases it back;
 *   false once Enter has released it to be made.
 * - Allocates nothing.
 * @returns True if the keyboard's live fold can still be eased back.
 */
const isKeyboardAngleShown = () =>
  live.isActive &&
  live.isByKeyboard &&
  (!live.isReleased || live.targetRadians === 0);

/** #### Eases a keyboard angle back to flat, if one shows unmade
 * - Allocates nothing.
 */
const easeKeyboardAngleBack = () => {
  if (isKeyboardAngleShown()) releaseLive(0);
};

/** #### Drops the live fold at once, if there is one, restoring the rest sheet
 * - For a choice, Undo, Redo or Unfold, which then act on the rest state.
 */
const dropLive = () => {
  if (live.isActive) endLive();
};

/** #### Ends the live fold without making it, restoring the rest sheet
 * - Poses the rest sheet at the rest position again, and lays the pairs
 *   out afresh at the next frame.
 * - Allocates only if the paper showed a cut, which it swaps back out.
 */
const endLive = () => {
  forgetLive();
  writeSequenceState();
  isLayoutStale = true;
};

/** #### Makes the live fold, once it has settled at a non-zero angle
 * - Made as foldLine() makes a flat fold, its `targetRadians` the angle
 *   settled at, but with the sequence state and target both moved to the
 *   next position, since the paper already shows the fold made: the
 *   stepper has nothing to animate, and the frame loop never sees the
 *   paper leave rest, so the new rest state is found here. A half turn
 *   reuses its cut as the new sheet.
 * - Allocates, once per fold made.
 */
const commitLive = () => {
  const { isFrontFacing, line, targetRadians } = live;
  const seen = targetRadians > 0 ? "mountain" : "valley";
  const radians = Math.abs(targetRadians);
  const flatCut = live.cuts[seen];
  const { position, sheetId } = sequenceState;
  forgetLive();

  session = foldAt(session, position, {
    from: line.from,
    targetRadians: radians,
    to: line.to,
    type: seenType(isFrontFacing, seen),
  });
  sheets[sheetId] =
    radians === Math.PI ? flatCut : cutSession(patterns[sheetId], session);
  sequenceState.position = position + 1;
  sequenceTarget.position = position + 1;
  clearPick();
  writeSequenceState();
  enterRest();
  writeSandboxBar();
};

/** #### Marks the live fold ended, and lets its cuts go
 * - Allocates nothing.
 */
const forgetLive = () => {
  live.cuts.mountain = null;
  live.cuts.valley = null;
  live.cycleStep = 0;
  live.isActive = false;
  live.line = null;
  live.reaches = null;
  live.screenLine = null;
  live.shownCuts.mountain = null;
  live.shownCuts.valley = null;
};

/** #### Advances the live fold one frame, and settles it once released
 * - Eases the angle shown and the centre shown towards those wanted, and
 *   poses the paper when either moves. Once a released fold's angle and
 *   centre have both landed, makes the fold, or, at flat, ends it, then
 *   takes any step Left or Right left.
 * - Allocates nothing, but for swapping the paper's geometry as the angle
 *   shown crosses flat, and for making or ending the fold once.
 * @param deltaSeconds The time elapsed since the last frame, in seconds.
 */
const stepLive = (deltaSeconds) => {
  if (!live.isActive) return;

  const isAngleChanged = stepLiveAngle(deltaSeconds, live);
  const isCentreChanged = stepLiveCentre(deltaSeconds, live);
  if (isAngleChanged || isCentreChanged) writeLivePose();

  const isSettled =
    live.isReleased &&
    live.radians === live.targetRadians &&
    live.centre[0] === live.targetCentre[0] &&
    live.centre[1] === live.targetCentre[1];
  if (!isSettled) return;

  if (live.targetRadians !== 0) {
    commitLive();
    return;
  }
  const step = live.cycleStep;
  endLive();
  if (step !== 0) cycleLine(step, pick.facesFront());
};

/** #### Poses the paper at the live fold's angle shown
 * - Shows the cut for the side of flat the angle is on, swapping the
 *   paper's geometry only when that side changes, posed at the rest
 *   position plus unsmoothstep() of the angle's share of a half turn, so
 *   the pose's own smoothstep() turns the fold by exactly that angle.
 * - Allocates nothing, unless it swaps the geometry.
 */
const writeLivePose = () => {
  const { radians } = live;
  if (radians !== 0) {
    const sheet = live.shownCuts[radians > 0 ? "mountain" : "valley"];
    if (sheet !== shownSheet) {
      shownSheet = sheet;
      paper.setSheet(sheet);
    }
  }
  paper.setSequencePosition(
    sequenceState.position + unsmoothstep(Math.abs(radians) / Math.PI),
  );
};

// A press on a pair folds its line: the active line's, by the side that
// faced the camera at the pick, or a Fast Fold pair's line, by the side
// that faced it at the layout, with no activation. A pointer hovering over
// a pair lights the pair's line, as the paper beside the pair does, while
// the button itself shows the hover, so the proxy marks nothing and the
// canvas's cursor is not the line's; over the active line's pair, its own
// strip stays lit. Leaving the pair for anywhere but the paper puts the
// light out, as leaving the canvas does.
const foldButtons = connectFoldButtons(
  canvas,
  (type, pair) => {
    if (pair === activePair) {
      foldLine(activeLine, isPickFrontFacing, type);
      return;
    }
    const line = restFoldLines[pair.placement.lineIndex];
    if (line !== undefined) foldLine(line, layoutFrontFacing, type);
  },
  (pair) => {
    if (!canPick()) return;

    const line =
      pair === null || pair === activePair
        ? null
        : (restFoldLines[pair.placement.lineIndex] ?? null);
    light(line === activeLine ? null : line, pick.facesFront());
    setOverLine(false);
    setProxied(null, null);
  },
);

// Ticking Fast Fold lays its pairs out at the next frame; unticking hides
// them, and the active line, if the keyboard picked it among them, takes
// Slow Fold's pair at the next frame.
const fastFold = connectFastFold(
  foldButtons,
  (x, y) => isOverWhiteAt(x, y),
  (isOn) => {
    if (!isOn) hideFastPairs();
    isLayoutStale = true;
  },
);

// The first mouse move or press switches Fast Fold to the nearby layout,
// which the move's own hover runs, since detection comes first. Only an
// active line needs a layout, to give its pair back if it was one of the
// touch layout's: a layout with no line active would fade the nearby pairs
// the move has just shown.
connectMouseDetection(() => {
  hasMouse = true;
  hideFastPairs();
  if (activeLine !== null) isLayoutStale = true;
});

// Export writes the folds the paper shows, or is folding to, those before
// the target's position, never the undone tail kept for Redo, as a design
// file of the pattern, under a new id and with no note, which a person adds
// by hand. Undo, Redo and Unfold move only the target, so a step under way
// finishes first, and repeated presses add up, each playing in turn. Each
// drops a live fold first.
const sandboxBar = connectSandboxBar(
  () =>
    writeDesignFile(crypto.randomUUID(), patterns[sequenceTarget.sheetId], {
      folds: session.folds.slice(0, sequenceTarget.position),
    }),
  () => {
    dropLive();
    sequenceTarget.position = Math.min(
      sequenceTarget.position + 1,
      session.folds.length,
    );
    writeSandboxBar();
  },
  () => {
    dropLive();
    sequenceTarget.position = Math.max(sequenceTarget.position - 1, 0);
    writeSandboxBar();
  },
  () => {
    dropLive();
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

/** #### Applies a mode: its fold lines, its toolbar, and its choice
 * - Forces the fold lines on in Sandbox Mode, or releases them in
 *   Presentation Mode, shows the sandbox bar and the "Fast Fold" checkbox
 *   in Sandbox Mode only, and passes on the choice of the checked pattern
 *   or design, as if that radio had been chosen.
 * - A mode can arrive twice, and does nothing the second time but empty an
 *   empty session.
 * @param mode `"presentation"` or `"sandbox"`.
 */
const chooseMode = (mode) => {
  isSandbox = mode === "sandbox";
  forceLinesOn(isSandbox);
  sandboxBar.setShown(isSandbox);
  fastFold.setShown(isSandbox);
  if (isSandbox) {
    choosePattern(checkedPatternChoice());
  } else {
    choose(checkedDesignChoice());
  }
};

connectModeRadios(chooseMode);
chooseMode("sandbox");

/** #### Returns true if the pairs can be laid out now
 * - In Sandbox Mode, with the lines found for the rest state, the
 *   sequence state at its target, no stretch, fade or spin reset under
 *   way, no drag turning the paper, and no live fold showing.
 * - Allocates nothing.
 * @returns True if the scene rests for a layout.
 */
const canLayOut = () =>
  isAtRest &&
  isSequenceAtRest() &&
  spinReset.progress >= 1 &&
  !isOrbiting &&
  !live.isActive;

/** #### Returns true if a line can be lit, picked or folded now
 * - As canLayOut(), once the rest state's Fold Lines have been projected
 *   to the screen, after the frame that found them, and again since a drag
 *   or a resize last moved them there: until then, a hover or a press
 *   between a drag's release and the next frame would read the pairs and
 *   the sides from where the lines were.
 * - Allocates nothing.
 * @returns True if a line can be lit, picked or folded.
 */
const canPick = () =>
  canLayOut() && screenLines.length === restFoldLines.length;

/** #### Makes a line the active line, lighting it and showing its pair
 * - Replaces any active line, whose pair fades, or, if it is one of the
 *   touch layout's, stays without its emphasis. The hover's light goes
 *   out, and any remembered keyboard pick is forgotten.
 * - The caller has written `pickPoint`, the point the pair is placed by:
 *   the click, or the middle of the line's longest span for the keyboard;
 *   and `foldedPoint`, the same point in the folded plane, where the side
 *   of the paper showing gives the pair's colours, or, with no paper
 *   there, the side facing the camera.
 * - Allocates nothing, unless its pair is a new one.
 * @param line The line, from `restFoldLines`.
 * @param isFrontFacing True if the camera faces the paper's front.
 * @param isByKeyboard True if Left, Right or focus picked it.
 */
const activate = (line, isFrontFacing, isByKeyboard) => {
  // A keyboard pick among the touch layout's pairs, after a pick that hid
  // them, needs them laid out again.
  const wasHidingTouchPairs = activeLine !== null && !isActiveByKeyboard;
  if (isByKeyboard && isAmongTouchPairs(true) && wasHidingTouchPairs) {
    isLayoutStale = true;
  }
  if (activeLine !== null) deactivate();

  activeLine = line;
  activeSpans = restSpansByLine[restLines.indexOf(line)];
  isActiveByKeyboard = isByKeyboard;
  isPickFrontFacing = isFrontFacing;
  isPickOnFront =
    showsFrontAt(restFaces, isFrontFacing, foldedPoint) ?? isFrontFacing;
  rememberedLine = null;
  light(null, true);
  paper.lightActiveLine(
    PAPER_COLOR_SHADES[chosenColorId].deeper,
    restCentre,
    GRAPHIC_BLACK,
    line,
    segmentsOf(line, isFrontFacing),
  );
  showActivePair();
};

/** #### Clears the active line, if there is one, and the hover's light
 * - Its pair fades, or, if it is one of the touch layout's, stays without
 *   its emphasis; Fast Fold's pairs are laid out again at the next frame.
 * - Allocates nothing, so it is safe on every pointer move.
 * @returns True if there was an active line to clear.
 */
const clearPick = () => {
  const hadPick = activeLine !== null;
  if (hadPick) {
    deactivate();
    isLayoutStale = true;
  }
  light(null, true);
  setOverLine(false);
  setProxied(null, null);

  return hadPick;
};

/** #### Puts the active line out and lets its pair go
 * - Allocates nothing.
 */
const deactivate = () => {
  activeLine = null;
  activeSpans = NONE_AT_REST;
  paper.clearActiveLine();
  if (activePair !== null) {
    if (isActivePairFast) {
      activePair.setEmphasised(false);
    } else {
      activePair.hide();
    }
    activePair = null;
    isActivePairFast = false;
  }
};

/** #### Hides every Fast Fold pair, and the proxy's mark
 * - The active line's pair, if it is one of them, is let go: the next
 *   layout shows Slow Fold's pair for it.
 * - Allocates nothing.
 */
const hideFastPairs = () => {
  fastFold.hideAll();
  if (isActivePairFast) {
    activePair = null;
    isActivePairFast = false;
  }
  setProxied(null, null);
};

/** #### Returns true if the active pick keeps Fast Fold's touch layout
 * - A keyboard pick, with Fast Fold ticked and no mouse detected, shows
 *   its line's pair among the touch layout's rather than suspending it.
 * - Allocates nothing.
 * @param isByKeyboard True if the pick is the keyboard's.
 * @returns True if the touch layout stays.
 */
const isAmongTouchPairs = (isByKeyboard) =>
  isByKeyboard && fastFold.isOn() && !hasMouse;

/** #### Returns true if the paper shows its white side at a point on screen
 * - Where the pair at that point takes its colours from. With no paper
 *   there, or the paper's plane missed, the side facing the camera's.
 * - Allocates nothing, so it is safe on every pointer move.
 * @param x The point's x, in CSS pixels.
 * @param y The point's y, in CSS pixels.
 * @returns True for the white side.
 */
const isOverWhiteAt = (x, y) => {
  const isFrontFacing = pick.facesFront();
  const hit = pick.hitAt(x, y);
  if (hit === null) return !isFrontFacing;

  themePoint[0] = hit.x + restCentre[0];
  themePoint[1] = hit.y + restCentre[1];
  const isOnFront = showsFrontAt(restFaces, isFrontFacing, themePoint);

  return !(isOnFront ?? isFrontFacing);
};

/** #### Lays out the pairs for the scene at rest, after a layout event
 * - Projects the Fold Lines' spans to the screen, reads the toolbar's
 *   controls, none while Escape has it hidden, measures a pair, and notes
 *   the side facing the camera. Then lays out Fast Fold's touch layout,
 *   unless a mouse is detected, Fast Fold is unticked or an active line
 *   suspends it, and hides Fast Fold's pairs otherwise; the nearby layout
 *   waits for the next mouse move. Places the active line's pair afresh.
 * - Call it after a frame's render, which updates the camera's matrices.
 * - Allocates, so call it only on a layout event.
 */
const layOut = () => {
  screenLines = restFoldLines.map((line, index) => {
    const segments = [];
    let lengthPx = 0;
    for (const { from, to } of restSpansByLine[restLines.indexOf(line)]) {
      toScreen(from[0], from[1]);
      const { x, y } = screenPoint;
      toScreen(to[0], to[1]);
      segments.push(x, y, screenPoint.x, screenPoint.y);
      lengthPx += Math.hypot(screenPoint.x - x, screenPoint.y - y);
    }

    return { index, lengthPx, segments };
  });
  space.exclusions = controls.hasAttribute("data-hidden")
    ? NONE_AT_REST
    : [...controls.children]
        .map((control) => control.getBoundingClientRect())
        .filter(({ height, width }) => width > 0 && height > 0);
  foldButtons.measure(space.pair);
  layoutFrontFacing = pick.facesFront();

  const isTouch = fastFold.isOn() && !hasMouse;
  const isSuspended =
    activeLine !== null && !isAmongTouchPairs(isActiveByKeyboard);
  if (isTouch && !isSuspended) {
    fastFold.layOutTouch(screenLines, space);
  } else {
    hideFastPairs();
  }
  if (activeLine !== null) showActivePair();
};

/** #### Lights the hovered line, or none, in the inks of the printed lines
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

  const segments = segmentsOf(line, isFrontFacing);
  const deeperInk = PAPER_COLOR_SHADES[chosenColorId].deeper;
  if (segments === litLineSegments && deeperInk === litDeeperInk) return;

  isLitFrontFacing = isFrontFacing;
  litDeeperInk = deeperInk;
  litLine = line;
  litLineSegments = segments;
  paper.lightLine(deeperInk, restCentre, GRAPHIC_BLACK, line, segments);
};

/** #### Returns a line's segments seen from one side, as litSegments() lists
 * - Allocates nothing.
 * @param line The line, from `restLines`.
 * @param isFrontFacing True if the camera faces the paper's front.
 * @returns The segments.
 */
const segmentsOf = (line, isFrontFacing) => {
  const { back, front } = restSegments[restLines.indexOf(line)];

  return isFrontFacing ? front : back;
};

/** #### Marks the canvas `data-over-line`, for the CSS's pointer cursor
 * - Written only on change.
 * - Allocates nothing, so it is safe on every pointer move.
 * @param isOver True while a mouse press there would be a line's.
 */
const setOverLine = (isOver) => {
  if (isOver === isOverLine) return;

  isOverLine = isOver;
  canvas.toggleAttribute("data-over-line", isOver);
};

/** #### Marks the button of a pair that the proxy stands in for, or none
 * - Clears the mark on the pair marked before, if another.
 * - Allocates nothing, so it is safe on every pointer move.
 * @param pair The pair, or null for none.
 * @param side `"mountain"` or `"valley"`, the button to mark, or null.
 */
const setProxied = (pair, side) => {
  if (proxiedPair !== null && proxiedPair !== pair) {
    proxiedPair.setProxied(null);
  }
  proxiedPair = pair;
  pair?.setProxied(side);
};

/** #### Shows the active line's pair, placed for how it was picked
 * - A keyboard pick among the touch layout's pairs emphasises its line's
 *   pair there; a line with none placed shows its own pair over the middle
 *   of its longest span, and the touch pairs within the gap of it fade
 *   until the next layout.
 * - Any other pick hides Fast Fold's pairs, suspending it, and shows Slow
 *   Fold's pair: for the keyboard, over the middle of the line's longest
 *   span; for a click or a tap, on the line beside `pickPoint`. A
 *   keyboard pick's pair is emphasised.
 * - An active Slow Fold pair is moved, not replaced, so a layout event
 *   places it afresh where it stands.
 * - Allocates nothing, unless the pair is a new one, and the position
 *   strings it writes.
 */
const showActivePair = () => {
  const index = restFoldLines.indexOf(activeLine);
  const screenLine = screenLines[index];
  const isAmongTouch = isAmongTouchPairs(isActiveByKeyboard);
  if (!isAmongTouch) hideFastPairs();

  const touchPair = isAmongTouch ? fastFold.pairOf(index) : null;
  if (touchPair !== null) {
    if (activePair !== null && !isActivePairFast) activePair.hide();
    activePair = touchPair;
    isActivePairFast = true;
    touchPair.setEmphasised(true);
    return;
  }

  const pair =
    activePair !== null && !isActivePairFast
      ? activePair
      : foldButtons.acquire();
  toScreen(pickPoint.x + restCentre[0], pickPoint.y + restCentre[1]);
  if (isActiveByKeyboard) {
    placeOnPoint(
      screenLine,
      pair.placement,
      space,
      screenPoint.x,
      screenPoint.y,
    );
  } else {
    placeBesideClick(screenLine, pair.placement, screenPoint, space);
  }
  if (isAmongTouch) fastFold.hideNear(pair.placement, space);
  pair.setOverWhite(!isPickOnFront);
  pair.setEmphasised(isActiveByKeyboard);
  pair.show();
  activePair = pair;
  isActivePairFast = false;
};

/** #### Returns the line a pointer at a point would light or claim
 * - While a line is active, its kept zone, its hitzone on the paper and
 *   its pair's hitzone, returns that line, so nothing else lights there.
 *   Otherwise a shown Fast Fold pair's hitzone returns its own line, which
 *   wins over any other line's hitzone it overlaps; and otherwise the line
 *   whose fold span is nearest on the paper, within
 *   `PICK_DISTANCE_METERS`, or null.
 * - Writes the point, in the folded plane, into `foldedPoint`.
 * - Allocates nothing, so it is safe on every pointer move.
 * @param hit The pointer's hit on the paper's plane, a Vector3 in metres
 *   in `stretchGroup`'s frame, or null if the ray missed it, which finds
 *   nothing.
 * @param x The pointer's x on screen, in CSS pixels.
 * @param y The pointer's y on screen, in CSS pixels.
 * @returns The line, from `restFoldLines`, or null.
 */
const targetAt = (hit, x, y) => {
  if (hit === null) return null;

  foldedPoint[0] = hit.x + restCentre[0];
  foldedPoint[1] = hit.y + restCentre[1];
  if (activeLine !== null) {
    const isInKeptZone =
      (activePair !== null &&
        zoneContains(activePair.placement, space, x, y)) ||
      pickLine(activeSpans, PICK_DISTANCE_METERS, foldedPoint) !== null;
    if (isInKeptZone) return activeLine;
  }

  const pair = fastFold.pairAt(x, y, space);
  if (pair !== null) return restFoldLines[pair.placement.lineIndex];

  return pickLine(restSpans, PICK_DISTANCE_METERS, foldedPoint)?.line ?? null;
};

/** #### Carries a point of the folded plane to the screen
 * - Writes `screenPoint`, in CSS pixels from the viewport's top-left,
 *   with the camera's matrices from the last render.
 * - Allocates nothing.
 * @param foldedX The point's x in the folded plane, in metres.
 * @param foldedY The point's y in the folded plane, in metres.
 */
const toScreen = (foldedX, foldedY) => {
  projected.set(foldedX - restCentre[0], foldedY - restCentre[1], 0);
  paper.stretchGroup.localToWorld(projected).project(camera);
  screenPoint.x = ((projected.x + 1) / 2) * space.viewport.width;
  screenPoint.y = ((1 - projected.y) / 2) * space.viewport.height;
};

/** #### Writes the Fold Buttons' colours and the lit lines' for the colour
 * - The buttons take the paper colour's two shades, which the CSS draws:
 *   over the coloured side, the lighter shade behind black ink; over the
 *   white side, a white behind the deeper shade.
 * - Called at load and on a change of colour; writes the buttons' shades
 *   only when the colour has changed since, and the lit lines' only when
 *   they show.
 */
const writePickColors = () => {
  if (litLine !== null) light(litLine, isLitFrontFacing);
  if (activeLine !== null) {
    paper.lightActiveLine(
      PAPER_COLOR_SHADES[chosenColorId].deeper,
      restCentre,
      GRAPHIC_BLACK,
      activeLine,
      segmentsOf(activeLine, isPickFrontFacing),
    );
  }
  if (buttonsColorId !== chosenColorId) {
    buttonsColorId = chosenColorId;
    const { deeper, lighter } = PAPER_COLOR_SHADES[chosenColorId];
    foldButtons.setColors(deeper, lighter);
  }
};

writePickColors();

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
 *   along there, each line's segments seen from each side, and their fold
 *   spans, once per rest state, so a pointer move compares the hit with at
 *   most a few tens of lines, and lights one by lookup. Also the stage's
 *   centre.
 * - After a fold that stops short, finds no lines at all, so nothing
 *   lights, picks or folds until Undo goes back past it: nothing yet
 *   checks whether a later fold would swing paper through the standing
 *   flap.
 * - Forgets the remembered keyboard pick, whose line is gone, and marks
 *   the layout stale.
 * - Allocates, so call it only when the paper comes to rest, or a live
 *   fold is made.
 */
const enterRest = () => {
  const { position, sheetId } = sequenceState;
  const sheet = sheets[sheetId];
  const stage = foldPositionAt(position, sheet);
  restCentre = sheet.centres[stage];
  restFaces = placedFaces(sheet, stage);
  restLines = hasStandingFold(session, position)
    ? NONE_AT_REST
    : foldableLines(
        patterns[sheetId],
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
  restSpansByLine = restLines.map((line) =>
    restSpans.filter((span) => span.line === line),
  );
  restFoldLines = restLines.filter((_line, i) => restSegments[i].front.length);
  rememberedLine = null;
  screenLines = NONE_AT_REST;
  isLayoutStale = true;
};

// Escape, while the export dialog is open, closes the dialog alone, which
// the browser does once the key has passed, leaving the toolbar and any
// pick as they were. Otherwise it eases a keyboard angle back to flat, then
// clears the active line if there is one, and forgets the keyboard pick put
// away; failing that, it hides and shows the toolbar, which the pairs are
// laid out afresh around: the hidden toolbar leaves the paper alone on
// screen. During a mouse drag, it leaves the drag to its release.
connectControlsToggle(() => {
  if (sandboxBar.isExportOpen()) return true;

  easeKeyboardAngleBack();
  rememberedLine = null;
  if (clearPick()) return true;

  isLayoutStale = true;
  return false;
});

/** #### Writes the spin to the paper's outermost group
 * - With the default order `XYZ`, the paper turns about its own vertical
 *   axis first and tilts towards the viewer second.
 * - Allocates nothing, so it is safe on the per-frame path.
 */
const writeSpin = () => {
  paper.group.rotation.set(spin.pitchRadians, spin.yawRadians, 0);
};

// A hover lights the line a press there would take, as targetAt() finds
// it, or none: nothing in the active line's kept zone. A mouse over a lit
// line shows the pointer cursor, and with Fast Fold, runs the nearby
// layout and marks the button the proxy stands in for. Leaving the canvas
// for a shown pair keeps the light, which the pair's hover then sets, so
// its line stays lit with no flicker. A press that does not move,
// by touch or pen, makes the line it finds active, or clears the active
// line if there is none, but leaves it in its kept zone; a mouse's never
// picks, since a mouse press on a line is claimed. Left and Right make the
// line before or after the active one active, in the lattice's order,
// among the Fold Lines, at the middle of its longest fold span; Up and
// Down press its pair's buttons. Shift with Up or Down steps the active
// line's fold live, towards mountain or valley as seen, and Enter makes
// it; a step back to flat drops it, and Left, Right or Escape first ease
// it back to flat, as a press or a loss of focus does, while plain Up and
// Down fold flat at once in its place. Focus leaving the canvas puts a
// keyboard pick away, and focus returning restores it.
const pick = connectPick(
  camera,
  canvas,
  {
    keepsHover: foldButtons.holds,
    onAngleKey: (step) => {
      if (!live.isActive) {
        if (activeLine === null || !canPick()) return;

        startLive(true, isPickFrontFacing, activeLine);
      } else if (!isKeyboardAngleShown() || activeLine !== live.line) {
        return;
      }

      const radians = live.targetRadians + step * SNAP_RADIANS;
      const snapped = Math.sign(radians) * snapAngleRadians(Math.abs(radians));
      if (snapped === 0) {
        releaseLive(0);
        return;
      }
      live.cycleStep = 0;
      live.isReleased = false;
      setLiveTarget(snapped);
    },
    onBlur: () => {
      easeKeyboardAngleBack();
      if (activeLine === null || !isActiveByKeyboard) return;

      const line = activeLine;
      clearPick();
      rememberedLine = line;
    },
    // The active line stays active through the fold's settling, its strip
    // put out first, since a half turn slides the paper from under it.
    onCommitKey: () => {
      if (!live.isActive || !live.isByKeyboard || live.isReleased) return;

      clearPick();
      releaseLive(live.targetRadians);
    },
    onCycle: (step, isFrontFacing) => {
      if (isKeyboardAngleShown()) {
        releaseLive(0);
        live.cycleStep = step;
        return;
      }
      cycleLine(step, isFrontFacing);
    },
    onFocus: () => {
      const line = rememberedLine;
      if (line === null || !canPick() || !restFoldLines.includes(line)) {
        return;
      }
      pickKeyboardLine(line, pick.facesFront());
    },
    onFoldKey: (type) => {
      if (live.isActive) {
        if (!live.isByKeyboard || activeLine !== live.line) return;

        const line = activeLine;
        endLive();
        foldLine(line, isPickFrontFacing, type);
        return;
      }
      if (activePair === null || !canPick()) return;

      activePair.press(type);
    },
    onHover: (hit, isFrontFacing, x, y, pointerType) => {
      if (!canPick()) return;

      const target = targetAt(hit, x, y);
      const line = target === activeLine ? null : target;
      const isMouse = pointerType === "mouse";
      light(line, isFrontFacing);
      setOverLine(isMouse && line !== null);

      const isNearby =
        isMouse && hit !== null && activeLine === null && fastFold.isOn();
      if (!isNearby || !hasMouse) {
        setProxied(null, null);
        return;
      }
      const index = restFoldLines.indexOf(line);
      fastFold.layOutNearby(
        screenLines,
        index === -1 ? null : screenLines[index],
        x,
        y,
        space,
      );
      const pair = index === -1 ? null : fastFold.pairOf(index);
      setProxied(pair, pair === null ? null : sideOf(screenLines[index], x, y));
    },
    onPress: (hit, isFrontFacing, x, y, pointerType) => {
      if (!canPick()) return;

      const target = targetAt(hit, x, y);
      if (target !== null && target === activeLine) return;
      if (pointerType === "mouse" || target === null) {
        clearPick();
        return;
      }
      pickPoint.copy(hit);
      activate(target, isFrontFacing, false);
    },
  },
  paper.stretchGroup,
);

/** #### Makes the line before or after the active one active, for Left or Right
 * - In the lattice's order, among the Fold Lines, wrapping round; with no
 *   line active, the first for Right or the last for Left.
 * - Does nothing unless a line can be picked now.
 * - Allocates nothing, unless its pair is a new one.
 * @param step −1 for the line before, or 1 for the line after.
 * @param isFrontFacing True if the camera faces the paper's front.
 */
const cycleLine = (step, isFrontFacing) => {
  if (!canPick() || restFoldLines.length === 0) return;

  const count = restFoldLines.length;
  const index = restFoldLines.indexOf(activeLine);
  let next = (index + step + count) % count;
  if (index === -1) next = step > 0 ? 0 : count - 1;
  pickKeyboardLine(restFoldLines[next], isFrontFacing);
};

/** #### Makes a line active from the keyboard, at its longest span's middle
 * - Allocates nothing, unless its pair is a new one.
 * @param line The line, from `restFoldLines`.
 * @param isFrontFacing True if the camera faces the paper's front.
 */
const pickKeyboardLine = (line, isFrontFacing) => {
  writeFoldMiddle(line, foldedPoint, restSpans);
  pickPoint.set(
    foldedPoint[0] - restCentre[0],
    foldedPoint[1] - restCentre[1],
    0,
  );
  activate(line, isFrontFacing, true);
};

// A mouse press on a lit Fold Line, outside the active line's kept zone,
// is the line's, decided at `pointerdown`: it never turns the paper. If it
// does not move, on release it makes the line active, or, where the proxy
// serves it, presses the button on the side it went down on. Once it
// moves, it folds the line live, by the side of the line the pointer is on
// and its distance from the line against each side's reach, fixed at the
// press; on release, the angle snaps to a whole step, or to flat below
// `CANCEL_RADIANS`, and the fold settles there. Any press first eases a
// keyboard angle back to flat. Any other press is the drag's,
// which clears the active line and hides the pairs as it starts, cancels a
// reset under way where it is, and takes over at once; the pairs are laid
// out afresh once it ends. A double-click starts a reset from where the
// spin is, hiding the pairs.
connectDrag(canvas, {
  claimsPress: (x, y, pointerType) => {
    easeKeyboardAngleBack();
    isClaimDragging = false;
    if (pointerType !== "mouse" || !canPick()) return false;

    const hit = pick.hitAt(x, y);
    const target = targetAt(hit, x, y);
    if (target === null || target === activeLine) return false;

    claimedLine = target;
    claimPoint.copy(hit);
    claimXPx = x;
    claimYPx = y;
    isClaimFrontFacing = pick.facesFront();
    const index = restFoldLines.indexOf(target);
    claimedPair =
      activeLine === null && fastFold.isOn() && hasMouse
        ? fastFold.pairOf(index)
        : null;
    if (claimedPair !== null) claimedSide = sideOf(screenLines[index], x, y);

    return true;
  },
  onClaimedDrag: (x, y) => {
    if (!isClaimDragging) {
      isClaimDragging = true;
      const line = claimedLine;
      claimedLine = null;
      if (line === null || !canPick() || !restFoldLines.includes(line)) {
        return;
      }

      const screenLine = screenLines[restFoldLines.indexOf(line)];
      live.reaches = reachesPx(screenLine, space.viewport, claimXPx, claimYPx);
      live.screenLine = screenLine;
      startLive(false, isClaimFrontFacing, line);
    }
    if (!live.isActive || live.isByKeyboard || live.isReleased) return;

    setLiveTarget(dragAngleRadians(live.screenLine, live.reaches, x, y));
  },
  onClaimedDragCancel: () => {
    const isLiveDrag =
      isClaimDragging &&
      live.isActive &&
      !live.isByKeyboard &&
      !live.isReleased;
    isClaimDragging = false;
    if (isLiveDrag) releaseLive(0);
  },
  onClaimedDragEnd: (x, y) => {
    const isLiveDrag =
      isClaimDragging &&
      live.isActive &&
      !live.isByKeyboard &&
      !live.isReleased;
    isClaimDragging = false;
    if (!isLiveDrag) return;

    const radians = dragAngleRadians(live.screenLine, live.reaches, x, y);
    const size = Math.abs(radians);
    releaseLive(
      size < CANCEL_RADIANS ? 0 : Math.sign(radians) * snapAngleRadians(size),
    );
  },
  onClaimedPress: () => {
    const line = claimedLine;
    claimedLine = null;
    if (line === null || !canPick() || !restFoldLines.includes(line)) return;

    const index = restFoldLines.indexOf(line);
    const isServed =
      claimedPair !== null &&
      claimedPair.isShown() &&
      claimedPair.placement.lineIndex === index;
    if (isServed) {
      claimedPair.press(claimedSide);
      return;
    }
    pickPoint.copy(claimPoint);
    foldedPoint[0] = claimPoint.x + restCentre[0];
    foldedPoint[1] = claimPoint.y + restCentre[1];
    activate(line, isClaimFrontFacing, false);
    setOverLine(false);
  },
  onDrag: (deltaXPixels, deltaYPixels) => {
    clearPick();
    hideFastPairs();
    isOrbiting = true;
    screenLines = NONE_AT_REST; // projected afresh once the drag ends
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
  onDragEnd: () => {
    isOrbiting = false;
    isLayoutStale = true;
  },
  onPress: pick.pressAt,
});
canvas.addEventListener("dblclick", () => {
  startSpinReset(spinReset, spin);
  if (spinReset.progress < 1) hideFastPairs();
});

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

  // The live fold eases, and is made or ended once it settles, at rest.
  stepLive(deltaSeconds);

  // True on the step that reaches 1, so the fade ends on exactly its colour.
  if (stepColorFade(deltaSeconds, colorFade)) {
    paper.setFrontColorFade(colorFade.progress);
  }

  // True on the step that reaches 1, so the spin ends on exactly 0. A
  // reset moves the paper, so it clears the active line; once it ends, the
  // pairs are laid out afresh.
  if (stepSpinReset(deltaSeconds, spinReset, spin)) {
    writeSpin();
    clearPick();
    if (spinReset.progress >= 1) isLayoutStale = true;
  }

  // Coming to rest finds the lines to pick from; leaving it clears them,
  // the active line and every pair, before the frame draws the paper
  // moving.
  const isNowAtRest = isSequenceAtRest();
  if (isNowAtRest !== isAtRest) {
    isAtRest = isNowAtRest;
    if (isAtRest) {
      enterRest();
    } else {
      clearPick();
      hideFastPairs();
      restFaces = NONE_AT_REST;
      restFoldLines = NONE_AT_REST;
      restLines = NONE_AT_REST;
      restSegments = NONE_AT_REST;
      restSpans = NONE_AT_REST;
      restSpansByLine = NONE_AT_REST;
      screenLines = NONE_AT_REST;
    }
  }

  // After the rest check, so a line put out as the paper leaves rest starts
  // shrinking in this frame.
  paper.stepLitLines(deltaSeconds);
  renderer.render(scene, camera);

  // After the render, so the camera's matrices are this frame's.
  if (isLayoutStale && canLayOut()) {
    isLayoutStale = false;
    layOut();
  }
});
