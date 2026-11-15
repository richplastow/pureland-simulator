/**
 * @fileoverview
 * Finds where the pointer meets the paper's plane, as a hover or as a
 * press that does not move, and which side of the paper faces the camera,
 * for picking a lattice line; and passes on the arrow keys that cycle the
 * lines from the keyboard.
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

/** #### Reports where the pointer meets the paper's plane, and the arrow keys
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
 *   no button down: a mouse, or a pen in range. A press that moves is a
 *   drag, which captures the pointer, and reports no hover; a touch is
 *   always pressed, so never hovers. Reports a hover of null when the
 *   pointer leaves the canvas.
 * - Reports a press through the returned pressAt(), which connectDrag()'s
 *   `onPress` calls for a press that does not move.
 * - Reports Left and Right, with the canvas focused, as a step back or
 *   forward through the lines, cancelling their default; a held key
 *   repeats. Up and Down are left alone.
 * - The hit passed on is a scratch vector, overwritten on the next event:
 *   copy it rather than keep it.
 * - Allocates nothing per move, press or key.
 * @param camera The camera the scene renders with.
 * @param canvas The canvas the scene renders to.
 * @param onCycle Called on an arrow key with the step, −1 for Left or 1
 *   for Right, and true if the camera faces the paper's front.
 * @param onHover Called on a hover with the hit, a Vector3 in metres in
 *   `stretchGroup`'s frame, or null, and true if the camera faces the
 *   paper's front.
 * @param onPress Called on a press that does not move, as `onHover` is.
 * @param stretchGroup The paper's innermost group, whose local XY plane
 *   the posed paper lies in.
 * @returns pressAt(), which takes where a press ended, right and down from
 *   the canvas's top-left corner, in CSS pixels.
 */
export const connectPick = (
  camera,
  canvas,
  onCycle,
  onHover,
  onPress,
  stretchGroup,
) => {
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
    onHover(readHit(event.offsetX, event.offsetY), isFrontFacing);
  });

  canvas.addEventListener("pointerleave", () => {
    onHover(null, readPlane());
  });

  canvas.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    onCycle(event.key === "ArrowLeft" ? -1 : 1, readPlane());
  });

  return (xPixels, yPixels) => {
    const isFrontFacing = readPlane();
    onPress(readHit(xPixels, yPixels), isFrontFacing);
  };
};
