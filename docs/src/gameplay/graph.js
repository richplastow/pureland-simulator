/**
 * @fileoverview
 * Builds a design's maze: every state its folds reach, in any order.
 */

import {
  placedPolygons,
  stopsShort,
  TOLERANCE_METERS,
} from "../fold/engine.js";
import { maxPaperRadius } from "../fold/pose.js";
import { cutPath } from "./path.js";

/** #### Builds a design's graph of states, every available fold an edge
 * - Explores from the flat sheet, node 0, breadth first, trying the folds
 *   not yet made in index order. A node's `id` is its place in the order
 *   found, its `path` the first path found to it, and its `edges` come in
 *   fold order. Doomed states are built too, so every judgement is a
 *   lookup.
 * - A fold is available under the printed rule: cutPath() makes it
 *   without throwing, it makes at least one crease, and every crease it
 *   makes lies, end to end, along the creases the design's own order adds
 *   at that fold, which may be several collinear pieces. Under the
 *   standing rule, once a fold that stops short of 180° is made, only
 *   such folds follow.
 * - Two states are one when the same folds are made and their faces pair
 *   off one for one, each pair with the same corners in the folded plane,
 *   to within `TOLERANCE_METERS` and in the same cyclic order, the same
 *   layer and the same folds, by index in the design, having moved it.
 * - The goal is the node the design's own order leads to. A node is live
 *   if it is the goal or has an edge to a live node.
 * - Throws, naming the design and the fold, when the design's own order
 *   cannot be made under these rules.
 * - Frozen through and through. Pure maths, with no DOM or GPU access.
 * @param sheet The design's own sheet, from cutSheet(design).
 * @returns The graph: `designId`; `foldCount`, the design's; `goalNodeId`;
 *   `nodes`, each `{ edges, id, isLive, path }`, its `path` indices in
 *   `sheet.folds`, each edge `{ fold, from, nodeId, targetRadians, to,
 *   type }`, as edgeOf() sets out; and `radiusMeters`, the furthest any
 *   point of the paper reaches at any state or during any fold, in metres.
 */
export const buildGraph = (sheet) => {
  const { designId, folds } = sheet;
  const printed = printedPerFold(sheet);

  const flat = cutPath(sheet, [], false);
  const nodes = [{ edges: [], id: 0, isLive: false, path: [] }];
  const states = [stateOf(flat, [])];
  let radiusMeters = maxPaperRadius(flat);
  for (let id = 0; id < nodes.length; id++) {
    const node = nodes[id];
    const stands = node.path.some((f) => stopsShort(folds[f]));
    for (let f = 0; f < folds.length; f++) {
      if (node.path.includes(f)) continue;
      if (stands && !stopsShort(folds[f])) continue;

      const path = [...node.path, f];
      const cut = cutIfAllowed(sheet, path);
      if (cut === null) continue;

      const made = cut.creaseLines.slice(states[id].creaseCount);
      if (!liesOnPrinted(made, printed[f])) continue;

      const state = stateOf(cut, path);
      let nodeId = states.findIndex((known) => isSameState(known, state));
      if (nodeId === -1) {
        nodeId = nodes.length;
        nodes.push({ edges: [], id: nodeId, isLive: false, path });
        states.push(state);
      }
      radiusMeters = Math.max(radiusMeters, maxPaperRadius(cut));
      node.edges.push(edgeOf(cut, folds[f], f, nodeId, node.path.length));
    }
  }

  let goalNodeId = 0;
  for (let f = 0; f < folds.length; f++) {
    const edge = nodes[goalNodeId].edges.find(({ fold }) => fold === f);
    if (edge === undefined) {
      throw new Error(
        `Design "${designId}" cannot make fold ${f} in its own order`,
      );
    }
    goalNodeId = edge.nodeId;
  }

  // Spread life back from the goal until no node changes.
  nodes[goalNodeId].isLive = true;
  for (let hasChanged = true; hasChanged; ) {
    hasChanged = false;
    for (const node of nodes) {
      if (node.isLive || !node.edges.some((e) => nodes[e.nodeId].isLive)) {
        continue;
      }
      node.isLive = true;
      hasChanged = true;
    }
  }

  return Object.freeze({
    designId,
    foldCount: folds.length,
    goalNodeId,
    nodes: Object.freeze(
      nodes.map(({ edges, id, isLive, path }) =>
        Object.freeze({
          edges: Object.freeze(edges),
          id,
          isLive,
          path: Object.freeze(path),
        }),
      ),
    ),
    radiusMeters,
  });
};

/** #### Returns a path cut as a sheet, or null if the engine refuses it
 * - The engine refuses with a plain Error, when a fold moves nothing,
 *   say, and cutPath() with a RangeError, when a `{ movedBy }` names a
 *   fold not yet made. Any other error is a fault, so is thrown on.
 * @param sheet The design's own sheet.
 * @param path Indices in `sheet.folds`, in the order folded.
 * @returns The cut sheet, from cutPath(), or null.
 */
const cutIfAllowed = (sheet, path) => {
  try {
    return cutPath(sheet, path, false);
  } catch (error) {
    if (error.constructor === Error || error instanceof RangeError) {
      return null;
    }
    throw error;
  }
};

/** #### Returns an edge: a fold from a node, with its Fold Line
 * - `from` and `to`, `[x, y]` in metres in the folded plane at the node,
 *   are the ends of the fold's crossing of the faces it moves: the first
 *   and last points, along the fold's line, of every edge of a moved face
 *   that lies on the line once the fold is cut. They run the way the
 *   fold's own `from` and `to` run, so the side to the line's left moves.
 * - Read in the folded plane at the node's stage, never rounded.
 * @param cut The node's path and the fold, cut by cutPath().
 * @param fold The fold, from the design's own sheet, in the front's terms.
 * @param foldIndex The fold's index in the design's folds.
 * @param nodeId The id of the node the fold leads to.
 * @param stage The node's stage, the length of its path, which is the
 *   fold's place in the cut's path.
 * @returns The edge, frozen: `fold`, `from`, `nodeId`, `targetRadians`,
 *   the fold's angle in radians, `to` and `type`, in the front's terms.
 */
const edgeOf = (cut, fold, foldIndex, nodeId, stage) => {
  const [px, py] = fold.from;
  const length = Math.hypot(fold.to[0] - px, fold.to[1] - py);
  const ux = (fold.to[0] - px) / length;
  const uy = (fold.to[1] - py) / length;
  const polygons = placedPolygons(cut, stage);

  let min = Infinity;
  let max = -Infinity;
  cut.faces.forEach(({ movedBy }, i) => {
    if (!movedBy.includes(stage)) return;

    const points = polygons[i];
    const isOn = points.map(
      ([x, y]) => Math.abs(ux * (y - py) - uy * (x - px)) <= TOLERANCE_METERS,
    );
    points.forEach(([x, y], j) => {
      const k = (j + 1) % points.length;
      if (!isOn[j] || !isOn[k]) return;

      const [nextX, nextY] = points[k];
      const along = (x - px) * ux + (y - py) * uy;
      const nextAlong = (nextX - px) * ux + (nextY - py) * uy;
      min = Math.min(min, along, nextAlong);
      max = Math.max(max, along, nextAlong);
    });
  });

  return Object.freeze({
    fold: foldIndex,
    from: Object.freeze([px + min * ux, py + min * uy]),
    nodeId,
    targetRadians: fold.targetRadians,
    to: Object.freeze([px + max * ux, py + max * uy]),
    type: fold.type,
  });
};

/** #### Returns true if two polygons have the same corners in cyclic order
 * - Corners match to within `TOLERANCE_METERS`, starting anywhere.
 * @param first One polygon's corners, `[x, y]` in metres.
 * @param second The other's.
 * @returns True if the polygons are one.
 */
const isSamePolygon = (first, second) => {
  const count = first.length;
  if (second.length !== count) return false;

  for (let offset = 0; offset < count; offset++) {
    const isSame = first.every(([x, y], i) => {
      const [otherX, otherY] = second[(i + offset) % count];
      return Math.hypot(x - otherX, y - otherY) <= TOLERANCE_METERS;
    });
    if (isSame) return true;
  }

  return false;
};

/** #### Returns true if the engine could not tell two states apart
 * @param first One state, from stateOf().
 * @param second The other.
 * @returns True if the same folds are made and the faces pair off one for
 *   one, each pair alike in corners, layer and moving folds.
 */
const isSameState = (first, second) => {
  if (first.folds !== second.folds) return false;
  if (first.faces.length !== second.faces.length) return false;

  const isTaken = second.faces.map(() => false);

  return first.faces.every((face) => {
    const match = second.faces.findIndex(
      (other, i) =>
        !isTaken[i] &&
        other.layer === face.layer &&
        other.movedBy === face.movedBy &&
        isSamePolygon(other.polygon, face.polygon),
    );
    if (match === -1) return false;

    isTaken[match] = true;
    return true;
  });
};

/** #### Returns true if a fold's creases lie along the creases printed for it
 * - True only if the fold makes at least one crease, and each lies, end to
 *   end, within `TOLERANCE_METERS`, along printed creases on its line,
 *   which may be several collinear pieces.
 * @param made The creases the fold makes, in sheet coordinates.
 * @param printed The creases printed for the fold, in sheet coordinates.
 * @returns True if the fold keeps to the printed pattern.
 */
const liesOnPrinted = (made, printed) =>
  made.length > 0 &&
  made.every(({ from, to }) => {
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const ux = (to[0] - from[0]) / length;
    const uy = (to[1] - from[1]) / length;
    const along = ([x, y]) => ux * (x - from[0]) + uy * (y - from[1]);
    const across = ([x, y]) =>
      Math.abs(ux * (y - from[1]) - uy * (x - from[0]));
    const spans = printed
      .filter(
        (line) =>
          across(line.from) <= TOLERANCE_METERS &&
          across(line.to) <= TOLERANCE_METERS,
      )
      .map((line) => [along(line.from), along(line.to)].sort((a, b) => a - b))
      .sort((a, b) => a[0] - b[0]);

    // Walk the spans from the crease's start, until one leaves a gap.
    let covered = 0;
    for (const [start, end] of spans) {
      if (start > covered + TOLERANCE_METERS) break;
      covered = Math.max(covered, end);
    }

    return covered >= length - TOLERANCE_METERS;
  });

/** #### Returns the creases the design prints for each of its folds
 * - The engine's crease lines carry no fold, so the design's own order is
 *   cut one fold longer at a time, and each fold's creases are those its
 *   cut adds.
 * @param sheet The design's own sheet, with its `creaseLines` and `folds`.
 * @returns Per fold, by index in the design, its printed creases.
 */
const printedPerFold = (sheet) => {
  const { creaseLines, folds } = sheet;
  const order = folds.map((_fold, f) => f);
  const counts = [0];
  for (let f = 1; f <= folds.length; f++) {
    counts.push(cutPath(sheet, order.slice(0, f), false).creaseLines.length);
  }

  return order.map((f) => creaseLines.slice(counts[f], counts[f + 1]));
};

/** #### Returns what tells a state apart, for isSameState() to compare
 * @param cut The state's path, cut by cutPath().
 * @param path Indices in the design's folds, in the order folded.
 * @returns The state: `creaseCount`, the creases its path makes; `faces`,
 *   each with its `layer`, its `movedBy`, the design's folds that moved
 *   it, sorted, and its `polygon`, placed in the folded plane; and
 *   `folds`, the folds made, sorted.
 */
const stateOf = (cut, path) => {
  const polygons = placedPolygons(cut, path.length);
  const sorted = (indices) => [...indices].sort((a, b) => a - b).join();

  return {
    creaseCount: cut.creaseLines.length,
    faces: cut.faces.map(({ layers, movedBy }, i) => ({
      layer: layers[path.length],
      movedBy: sorted(movedBy.map((position) => path[position])),
      polygon: polygons[i],
    })),
    folds: sorted(path),
  };
};
