/**
 * @fileoverview
 * A Basic Gameplay Mode game as its path of folds, the states along it, and
 * the rules that judge it: dead ends, lives, hints and points.
 */

// Each a first guess, open to tuning.
export const POINTS_FOR_GOAL = 100; // for the goal, and the least a game scores
export const POINTS_PER_EXTRA_FOLD = 10; // lost per press beyond the fold count
export const POINTS_PER_HINT = 50; // for each hint left at the goal
export const POINTS_PER_LIFE = 50; // for each life left at the goal
export const START_HINTS = 1; // hints at the start of a game
export const START_LIVES = 3; // lives at the start of a game

/** #### Creates the empty game of a design, at the flat sheet
 * - A game is `{ closedNodeIds, designId, hints, lives, nodeIds, path,
 *   pressCount }`, frozen, its arrays too: `closedNodeIds`, the graph's
 *   states proven dead, in the order closed; `hints` and `lives`, those
 *   left; `path`, the folds pressed, in order, as indices in the design's
 *   own `folds`, with any undone tail kept for Redo; `nodeIds`, the graph's
 *   node after each, starting with node 0, the flat sheet, so one longer
 *   than `path`; and `pressCount`, the folds pressed so far, undone ones
 *   included.
 * - Starts with `START_LIVES` lives, `START_HINTS` hints and nothing
 *   closed.
 * - The paper's position stays in the sequence target, as the Sandbox's
 *   does; the game holds no position of its own.
 * - Pure, with no DOM or GPU access.
 * @param graph The design's graph, from buildGraph().
 * @returns The empty game, frozen.
 */
export const createGame = (graph) =>
  Object.freeze({
    closedNodeIds: Object.freeze([]),
    designId: graph.designId,
    hints: START_HINTS,
    lives: START_LIVES,
    nodeIds: Object.freeze([0]),
    path: Object.freeze([]),
    pressCount: 0,
  });

/** #### Returns a new game with a fold pressed at a position in the old one
 * - Keeps the old game's first `position` folds, then the new fold, as the
 *   Sandbox's foldAt() does, so a fold made after undoing drops the undone
 *   tail. Counts the press.
 * - A press that lands on a dead end, a state other than the goal with no
 *   open edge, costs one life and closes that state; then, back along the
 *   path, each state now left with no open edge is closed too, at no
 *   further cost. A live state always has an edge to a live state, so is
 *   never closed.
 * - The new game and its arrays are frozen; the old game is never changed.
 * - Throws a RangeError if `position` is not a whole number from 0 to the
 *   old game's fold count, or if `fold` is not an open edge of the node at
 *   that position: a fault in the caller, since only open folds are
 *   offered.
 * - Its arguments run as the call reads, the game and its graph, then
 *   where, then what, rather than A-Z, as the Sandbox's foldAt()'s do.
 * - Pure, with no DOM or GPU access.
 * @param game The old game.
 * @param graph The design's graph, from buildGraph().
 * @param position The number of the old game's folds to keep.
 * @param fold The fold pressed, by its index in the design's own `folds`.
 * @returns The new game, frozen.
 */
export const foldAt = (game, graph, position, fold) => {
  const edge = openEdges(game, graph, position).find((e) => e.fold === fold);
  if (edge === undefined) {
    throw new RangeError(
      `Fold ${fold} is not open at position ${position} of a game of ` +
        `design "${game.designId}"`,
    );
  }

  const nodeIds = [...game.nodeIds.slice(0, position + 1), edge.nodeId];
  const closed = [...game.closedNodeIds];
  const isLifeLost = isDeadEnd(graph, closed, edge.nodeId);

  // Close the dead end, then each state behind it it leaves with no way on.
  for (let k = nodeIds.length - 1; k >= 0; k--) {
    if (!isDeadEnd(graph, closed, nodeIds[k])) break;
    if (!closed.includes(nodeIds[k])) closed.push(nodeIds[k]);
  }

  return Object.freeze({
    closedNodeIds: Object.freeze(closed),
    designId: game.designId,
    hints: game.hints,
    lives: game.lives - (isLifeLost ? 1 : 0),
    nodeIds: Object.freeze(nodeIds),
    path: Object.freeze([...game.path.slice(0, position), fold]),
    pressCount: game.pressCount + 1,
  });
};

/** #### Returns a hint at a position in a game: a right fold, or the way back
 * - From a live state, `fold` is the first open edge's, in fold order, that
 *   leads to a live state, so it follows the design's own order where it
 *   can, and `foldsBack` is 0; at the goal, which has no edge, `fold` is
 *   null.
 * - From a doomed state, `fold` is null and `foldsBack` is how many folds
 *   back along the path the last live state lies. The flat sheet is always
 *   live, so there is one.
 * - Spends nothing: spendHint() does.
 * - Throws a RangeError if `position` is not a whole number from 0 to the
 *   game's fold count.
 * - Its arguments run as foldAt()'s do, rather than A-Z.
 * - Pure, with no DOM or GPU access.
 * @param game The game.
 * @param graph The design's graph, from buildGraph().
 * @param position The number of the game's folds made, 0 for the flat
 *   sheet.
 * @returns The hint, `{ fold, foldsBack }`, frozen: `fold` an index in the
 *   design's own `folds`, or null.
 */
export const hintAt = (game, graph, position) => {
  const edges = openEdges(game, graph, position);
  let foldsBack = 0;
  while (!graph.nodes[game.nodeIds[position - foldsBack]].isLive) foldsBack++;
  if (foldsBack > 0) return Object.freeze({ fold: null, foldsBack });

  const edge = edges.find((e) => graph.nodes[e.nodeId].isLive);

  return Object.freeze({ fold: edge?.fold ?? null, foldsBack: 0 });
};

/** #### Returns the folds the paper can make at a position in a game
 * - Returns the open edges of the graph's node at that position, in fold
 *   order, each `{ fold, from, nodeId, targetRadians, to, type }`, as
 *   buildGraph() sets out, its `from` and `to` the Fold Line's ends. An
 *   edge is open unless it leads to a closed state, from any state.
 * - Throws a RangeError if `position` is not a whole number from 0 to the
 *   game's fold count.
 * - Its arguments run as foldAt()'s do, rather than A-Z.
 * - Pure, with no DOM or GPU access.
 * @param game The game.
 * @param graph The design's graph, from buildGraph().
 * @param position The number of the game's folds made, 0 for the flat
 *   sheet.
 * @returns The node's open edges, frozen.
 */
export const openEdges = (game, graph, position) => {
  const { closedNodeIds, path } = game;
  if (!Number.isInteger(position) || position < 0 || position > path.length) {
    throw new RangeError(
      `Position ${position} is outside a game of ${path.length} folds`,
    );
  }

  return Object.freeze(
    graph.nodes[game.nodeIds[position]].edges.filter(
      (edge) => !closedNodeIds.includes(edge.nodeId),
    ),
  );
};

/** #### Returns the points a game scores at the goal
 * - `POINTS_FOR_GOAL`, plus `POINTS_PER_LIFE` for each life left, plus
 *   `POINTS_PER_HINT` for each hint left, less `POINTS_PER_EXTRA_FOLD` for
 *   each press beyond the design's fold count, and never less than
 *   `POINTS_FOR_GOAL`.
 * - Nothing is scored per fold, since a score that rose on every right
 *   press would say which presses are right; the caller asks only at the
 *   goal.
 * - Pure, with no DOM or GPU access.
 * @param game The game, at the goal.
 * @param graph The design's graph, from buildGraph().
 * @returns The points.
 */
export const pointsOf = (game, graph) =>
  Math.max(
    POINTS_FOR_GOAL,
    POINTS_FOR_GOAL +
      POINTS_PER_LIFE * game.lives +
      POINTS_PER_HINT * game.hints -
      POINTS_PER_EXTRA_FOLD * (game.pressCount - graph.foldCount),
  );

/** #### Returns the game with one hint fewer
 * - No hint is ever earned back: a hint awarded for a run of right folds
 *   would say the run was right.
 * - Throws a RangeError with no hint left.
 * - Pure, with no DOM or GPU access.
 * @param game The old game, never changed.
 * @returns The new game, frozen.
 */
export const spendHint = (game) => {
  if (game.hints < 1) {
    throw new RangeError(
      `No hint left to spend in a game of design "${game.designId}"`,
    );
  }

  return Object.freeze({ ...game, hints: game.hints - 1 });
};

/** #### Returns true if a state is a dead end, given the states closed
 * - A dead end is a state other than the goal with no open edge: every
 *   edge, if it has any, leads to a closed state.
 * @param graph The design's graph, from buildGraph().
 * @param closedNodeIds The ids of the states closed so far.
 * @param nodeId The state's id.
 * @returns True if the state is a dead end.
 */
const isDeadEnd = (graph, closedNodeIds, nodeId) =>
  nodeId !== graph.goalNodeId &&
  graph.nodes[nodeId].edges.every((e) => closedNodeIds.includes(e.nodeId));
