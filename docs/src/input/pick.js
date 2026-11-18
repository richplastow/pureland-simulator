/**
 * @fileoverview
 * Finds where the pointer meets the paper's plane, as a hover or as a
 * press that does not move, and which side of the paper faces the camera,
 * for picking a lattice line; and passes on the keys that cycle the lines,
 * fold them flat, and step and make a fold's angle from the keyboard.
 */

import { Plane, Raycaster, Vector2, Vector3 } from "three";

// Scratch objects, created once and reused, so a pointer move allocates
// nothing: the pointer in normalised device coordinates, the ray through
// it, the paper's plane, and its world position and normal, then the hit.
const hit = new Vector3();
const normal = new Vector3();
const origin = new Vector3();
const plane = new Plane();
const pointer = new Vector2();
const raycaster = new Raycaster();

/** #### Reports where the pointer meets the paper's plane, and the keyboard
 * - The plane is the posed paper's, at local z = 0: `stretchGroup`'s world
 *   position, and its world +Z from getWorldDirection(), the front's
 *   normal. Scale, start pose, lean and spin all fall out of the world
 *   matrix. At rest every flat fold lies in that plane, so no raycast
 *   against the mesh is needed.
 * - The hit, from the pointer's ray through the camera, is given in
 *   `stretchGroup`'s frame, which is the folded plane less the stage's
 *   centre, the slide the pose gives the paper. It is null when the ray
 *   misses the plane, as it does when the paper is edge-on or behind the
 *   camera.
 * - The facing side is the sign of the camera's distance from the plane:
 *   positive, the camera lies in front of the paper's front.
 * - Reports a hover on each move of a pointer over the canvas that holds
 *   no button down: a mouse, or a pen in range. A press captures the
 *   pointer, and reports no hover; a touch is always pressed, so never
 *   hovers. Reports a hover of null when the pointer leaves the canvas,
 *   unless it moves onto an element where the hover goes on, as it does
 *   onto a shown Fold Button pair, which reports its own hover.
 * - Reports a press through the returned pressAt(), which connectDrag()'s
 *   `onPress` calls for a press that does not move, and any point through
 *   the returned hitAt().
 * - With the canvas focused, reports Left and Right as a step back or
 *   forward through the lines, a held key repeating; Up and Down as a
 *   mountain or valley fold, ignoring a held key's repeats; Shift+Up and
 *   Shift+Down as a step of the fold's angle towards mountain or valley, a
 *   held key repeating; and Enter as the angle's commit, ignoring a held
 *   key's repeats. Each cancels its default. Reports the canvas losing and
 *   regaining focus.
 * - The hit passed on is a scratch vector, overwritten on the next event
 *   or call of hitAt(): copy it rather than keep it.
 * - Allocates nothing per move, press or key.
 * @param camera The camera the scene renders with.
 * @param canvas The canvas the scene renders to.
 * @param handlers The callbacks: `keepsHover`, called as the pointer
 *   leaves the canvas with the element it moves onto, or null, which
 *   returns true if the hover goes on there; `onAngleKey`, called on
 *   Shift+Up or Shift+Down with the step, 1 towards mountain for Up or −1
 *   towards valley for Down; `onBlur` and `onFocus`, called as the canvas
 *   loses and regains focus; `onCommitKey`, called on Enter; `onCycle`,
 *   called on Left or Right with the step, −1 for Left or 1 for Right, and
 *   true if the camera faces the paper's front; `onFoldKey`, called on Up
 *   or Down with the fold, `"mountain"` or `"valley"`; `onHover`, called
 *   on a hover with the hit, a Vector3 in metres in `stretchGroup`'s
 *   frame, or null, true if the camera faces the paper's front, the
 *   pointer's position, right and down from the canvas's top-left corner
 *   in CSS pixels, and its `pointerType`; and `onPress`, called on a press
 *   that does not move, as `onHover` is.
 * @param stretchGroup The paper's innermost group, whose local XY plane
 *   the posed paper lies in.
 * @returns facesFront(), which returns true if the camera faces the
 *   paper's front; hitAt(), which takes a point on the canvas, right and
 *   down from its top-left corner in CSS pixels, and returns the hit
 *   there, or null; and pressAt(), which takes where a press ended, the
 *   same way, and its `pointerType`.
 */
export const connectPick = (camera, canvas, handlers, stretchGroup) => {
  const {
    keepsHover,
    onAngleKey,
    onBlur,
    onCommitKey,
    onCycle,
    onFocus,
    onFoldKey,
    onHover,
    onPress,
  } = handlers;

  /** #### Sets the paper's plane, and returns which side faces the camera
   * @returns True if the camera faces the paper's front.
   */
  const readPlane = () => {
    stretchGroup.getWorldPosition(origin);
    stretchGroup.getWorldDirection(normal);
    plane.setFromNormalAndCoplanarPoint(normal, origin);

    return plane.distanceToPoint(camera.position) > 0;
  };

  /** #### Finds where the ray through a point on the canvas meets the plane
   * - Call readPlane() first.
   * @param xPixels Right from the canvas's left edge, in CSS pixels.
   * @param yPixels Down from the canvas's top edge, in CSS pixels.
   * @returns The hit in `stretchGroup`'s frame, the scratch `hit`, or
   *   null if the ray misses the plane.
   */
  const readHit = (xPixels, yPixels) => {
    pointer.set(
      (2 * xPixels) / canvas.clientWidth - 1,
      1 - (2 * yPixels) / canvas.clientHeight,
    );
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(plane, hit) === null) return null;

    return stretchGroup.worldToLocal(hit);
  };

  canvas.addEventListener("pointermove", (event) => {
    if (canvas.hasPointerCapture(event.pointerId)) return;

    const isFrontFacing = readPlane();
    onHover(
      readHit(event.offsetX, event.offsetY),
      isFrontFacing,
      event.offsetX,
      event.offsetY,
      event.pointerType,
    );
  });

  canvas.addEventListener("pointerleave", (event) => {
    if (keepsHover(event.relatedTarget)) return;

    onHover(null, readPlane(), event.offsetX, event.offsetY, event.pointerType);
  });

  canvas.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      onCycle(event.key === "ArrowLeft" ? -1 : 1, readPlane());
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      if (event.shiftKey) {
        onAngleKey(event.key === "ArrowUp" ? 1 : -1);
        return;
      }
      if (event.repeat) return;

      onFoldKey(event.key === "ArrowUp" ? "mountain" : "valley");
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (event.repeat) return;

      onCommitKey();
    }
  });

  canvas.addEventListener("blur", onBlur);
  canvas.addEventListener("focus", onFocus);

  return {
    facesFront: readPlane,
    hitAt: (xPixels, yPixels) => {
      readPlane();

      return readHit(xPixels, yPixels);
    },
    pressAt: (xPixels, yPixels, pointerType) => {
      const isFrontFacing = readPlane();
      onPress(
        readHit(xPixels, yPixels),
        isFrontFacing,
        xPixels,
        yPixels,
        pointerType,
      );
    },
  };
};
