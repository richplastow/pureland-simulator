/**
 * @fileoverview
 * Moves the sequence position through a sheet's steps, folds and
 * turn-overs, one step at a time, towards a target, by way of the flat
 * sheet stretching and turning to its starting pose and lean when the
 * target names another sheet, and fades the printed lines in and out.
 */

export const FADE_IN_SECONDS = 0.6; // the fold lines, from hidden to shown
export const FADE_OUT_SECONDS = 0.3; // the fold lines, from shown to hidden
export const FOLD_SECONDS = 0.7; // one step, a fold or a turn-over, forwards
export const STRETCH_SECONDS = 0.4; // the flat sheet, to another shape or pose
export const UNFOLD_SECONDS = 0.35; // one step, backwards: twice as fast

/** #### Advances the sequence state one frame towards the target
 * - The position moves linearly in time, one step in `FOLD_SECONDS`
 *   forwards or `UNFOLD_SECONDS` back, a turn-over as a fold; the pose
 *   eases each step.
 * - One phase runs at a time: a stretch, then any fade, then a step. The
 *   target is read only at a whole position with no stretch or fade under
 *   way, so a step, fade or stretch in progress always finishes first.
 *   Time left over carries on into the next phase, so the total time does
 *   not depend on the frame rate.
 * - While the target names another sheet, the paper unfolds towards 0,
 *   whatever the target's `position`. At 0, the lines fade out, if
 *   showing, then the target's sheet takes over: `stretchFromId` takes
 *   the old `sheetId`, and `stretchProgress` runs from 0 to 1 in
 *   `STRETCH_SECONDS`, or is 1 at once when the two sheets share their
 *   aspect, their starting pose, its roll and its side, and their lean.
 *   Once it reaches 1, the lines fade towards `linesOn`, then folding
 *   starts.
 * - A target `sheetId` of null means flat, keeping the sheet showing;
 *   once the paper is flat, the lines fade out, if showing.
 * - At rest at the sheet's `finishedPosition`, the lines fade out, if
 *   showing, so the finished model shows none. When the target leaves it,
 *   the lines fade towards `linesOn` before unfolding starts, so the paper
 *   unfolds showing them if they are switched on. A sandbox sheet's
 *   `finishedPosition` is null: it is never finished, so its lines never
 *   fade out at rest.
 * - At rest at any other position, the lines fade towards `linesOn`.
 * - `linesVisibility` moves linearly in time, over `FADE_IN_SECONDS` in
 *   and `FADE_OUT_SECONDS` out; the renderer eases it. With the lines off
 *   and hidden, no fade time is spent.
 * - A negative delta counts as zero.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param deltaSeconds The time elapsed since the last frame, in seconds.
 * @param sheets The sheets, keyed by id, each with its `aspect`,
 *   `finishedPosition`, a step count or null, `leanRadians` and `start`.
 * @param state The sequence state, mutated: `direction`, 1 while folding,
 *   −1 while unfolding and 0 at rest, stretching or fading; `linesFade`, 1
 *   while the lines fade in, −1 while they fade out and 0 otherwise;
 *   `linesVisibility`, from 0 (hidden) to 1 (shown), linear in time;
 *   `position`, from 0 (flat) to the sheet's step count; `sheetId`, the
 *   sheet's key in `sheets`; `stretchFromId`, the sheet the stretch
 *   started from; and `stretchProgress`, from 0 to 1, linear in time.
 * @param target The target: `linesOn`, true if the fold lines are
 *   switched on; `position`; and `sheetId`, or null for flat.
 * @returns True if `position`, `sheetId`, `stretchProgress` or
 *   `linesVisibility` changed.
 */
export const stepSequence = (deltaSeconds, sheets, state, target) => {
  const startLinesVisibility = state.linesVisibility;
  const startPosition = state.position;
  const startSheetId = state.sheetId;
  const startStretchProgress = state.stretchProgress;

  // Timer resets with performance.now() but updates with the frame's
  // timestamp, which marks the end of the previous frame, so its delta can
  // dip below zero when a hidden tab becomes visible again.
  let remainingSeconds = Math.max(deltaSeconds, 0);

  while (true) {
    // The flat sheet finishes stretching and turning to its starting pose
    // before anything else happens.
    if (state.stretchProgress < 1) {
      if (remainingSeconds <= 0) break;
      const stretchSecondsLeft = (1 - state.stretchProgress) * STRETCH_SECONDS;
      if (remainingSeconds < stretchSecondsLeft) {
        state.stretchProgress += remainingSeconds / STRETCH_SECONDS;
        break;
      }
      state.stretchProgress = 1;
      remainingSeconds -= stretchSecondsLeft;
    }

    // A fade under way finishes before the target is read again.
    if (state.linesFade !== 0) {
      if (remainingSeconds <= 0) break;
      const isFadingIn = state.linesFade > 0;
      const fadeSeconds = isFadingIn ? FADE_IN_SECONDS : FADE_OUT_SECONDS;
      const fadeLeft = isFadingIn
        ? 1 - state.linesVisibility
        : state.linesVisibility;
      const fadeSecondsLeft = fadeLeft * fadeSeconds;
      if (remainingSeconds < fadeSecondsLeft) {
        state.linesVisibility +=
          (state.linesFade * remainingSeconds) / fadeSeconds;
        break;
      }
      state.linesVisibility = isFadingIn ? 1 : 0;
      state.linesFade = 0;
      remainingSeconds -= fadeSecondsLeft;
    }

    if (Number.isInteger(state.position) || state.direction === 0) {
      const isSwitching =
        target.sheetId !== null && target.sheetId !== state.sheetId;
      const targetPosition = isSwitching ? 0 : target.position;

      // The finished model at rest, and flat paper leaving its sheet, for
      // another or for flat, show no lines; at 0 before folding, at the
      // finished position before unfolding, or at rest, they follow the
      // checkbox.
      const isFinished =
        state.position === sheets[state.sheetId].finishedPosition;
      if (
        isFinished ||
        state.position === 0 ||
        state.position === targetPosition
      ) {
        const isDone = isFinished && state.position === targetPosition;
        const isLeaving =
          state.position === 0 && (isSwitching || target.sheetId === null);
        const linesWanted = !isDone && !isLeaving && target.linesOn ? 1 : 0;
        if (state.linesVisibility !== linesWanted) {
          state.direction = 0;
          state.linesFade = Math.sign(linesWanted - state.linesVisibility);
          continue;
        }
      }

      if (isSwitching && state.position === 0) {
        state.stretchFromId = state.sheetId;
        state.sheetId = target.sheetId;
        state.direction = 0;
        state.stretchProgress = sharesSheet(
          sheets[state.stretchFromId],
          sheets[state.sheetId],
        )
          ? 1
          : 0;
        continue;
      }
      state.direction = Math.sign(targetPosition - state.position);
    }
    if (state.direction === 0 || remainingSeconds <= 0) break;

    const secondsPerFold = state.direction > 0 ? FOLD_SECONDS : UNFOLD_SECONDS;
    const nextWhole =
      state.direction > 0
        ? Math.floor(state.position) + 1
        : Math.ceil(state.position) - 1;
    const foldsLeft = Math.abs(nextWhole - state.position);
    const foldsInTime = remainingSeconds / secondsPerFold;

    if (foldsInTime < foldsLeft) {
      state.position += state.direction * foldsInTime;
      break;
    }
    state.position = nextWhole;
    remainingSeconds -= foldsLeft * secondsPerFold;
  }

  return (
    state.position !== startPosition ||
    state.sheetId !== startSheetId ||
    state.stretchProgress !== startStretchProgress ||
    state.linesVisibility !== startLinesVisibility
  );
};

/** #### Returns true if two flat sheets look the same
 * - The same `aspect`, roll, side and lean, so no stretch or turn is needed
 *   between them.
 * - Allocates nothing, so it is safe on the per-frame path.
 * @param first One sheet, with its `aspect`, `leanRadians` and `start`.
 * @param second The other sheet, likewise.
 * @returns True if the two share their shape, starting pose and lean.
 */
const sharesSheet = (first, second) =>
  first.aspect === second.aspect &&
  first.start.rollRadians === second.start.rollRadians &&
  first.start.side === second.start.side &&
  first.leanRadians === second.leanRadians;
