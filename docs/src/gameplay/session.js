/**
 * @fileoverview
 * A Basic Gameplay Mode game as its path of folds, and the states along it.
 */

/** #### Creates the empty game of a design, at the flat sheet
 * - A game is `{ designId, nodeIds, path }`, frozen, its arrays too:
 *   `path`, the folds pressed, in order, as indices in the design's own
 *   `folds`, with any undone tail kept for Redo; and `nodeIds`, the
 *   graph's node after each, starting with node 0, the flat sheet, so one
 *   longer than `path`.
 * - The paper's position stays in the sequence target, as the Sandbox's
 *   does; the game holds no position of its own.
 * - Pure, with no DOM or GPU access.
 * @param graph The design's graph, from buildGraph().
 * @returns The empty game, frozen.
 */
export const createGame = (graph) =>
  Object.freeze({
    designId: graph.designId,
    nodeIds: Object.freeze([0]),
    path: Object.freeze([]),
  });

/** #### Returns a new game with a fold made at a position in the old one
 * - Keeps the old game's first `position` folds, then the new fold, as the
 *   Sandbox's foldAt() does, so a fold made after undoing drops the undone
 *   tail.
 * - The new game, its `nodeIds` and its `path` are frozen; the old game is
 *   never changed.
 * - Throws a RangeError if `position` is not a whole number from 0 to the
 *   old game's fold count, or if `fold` is not an edge of the node at that
 *   position: a fault in the caller, since only open folds are offered.
 * - Its arguments run as the call reads, the game and its graph, then
 *   where, then what, rather than A-Z, as the Sandbox's foldAt()'s do.
 * - Pure, with no DOM or GPU access.
 * @param game The old game.
 * @param graph The design's graph, from buildGraph().
 * @param position The number of the old game's folds to keep.
 * @param fold The fold made, by its index in the design's own `folds`.
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

  return Object.freeze({
    designId: game.designId,
    nodeIds: Object.freeze([
      ...game.nodeIds.slice(0, position + 1),
      edge.nodeId,
    ]),
    path: Object.freeze([...game.path.slice(0, position), fold]),
  });
};

/** #### Returns the folds the paper can make at a position in a game
 * - Returns the edges of the graph's node at that position, in fold order,
 *   each `{ fold, from, nodeId, targetRadians, to, type }`, as buildGraph()
 *   sets out, its `from` and `to` the Fold Line's ends.
 * - Throws a RangeError if `position` is not a whole number from 0 to the
 *   game's fold count.
 * - Its arguments run as foldAt()'s do, rather than A-Z.
 * - Pure, with no DOM or GPU access.
 * @param game The game.
 * @param graph The design's graph, from buildGraph().
 * @param position The number of the game's folds made, 0 for the flat
 *   sheet.
 * @returns The node's edges, frozen.
 */
export const openEdges = (game, graph, position) => {
  const { path } = game;
  if (!Number.isInteger(position) || position < 0 || position > path.length) {
    throw new RangeError(
      `Position ${position} is outside a game of ${path.length} folds`,
    );
  }

  return graph.nodes[game.nodeIds[position]].edges;
};
