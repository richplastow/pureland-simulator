/**
 * @fileoverview
 * The ease every fold and turn-over is posed with, and its inverse.
 */

/** #### Eases a linear progress, slow at both ends and fastest midway
 * - The curve of r187's MathUtils.smoothstep(), `p² × (3 − 2p)`, written
 *   here so that Node can run the fold modules without Three.js.
 * - Returns exactly 0 and 1 at the ends.
 * - Pure maths, with no DOM or GPU access.
 * @param progress The linear progress, clamped to 0 to 1.
 * @returns The eased progress, from 0 to 1.
 */
export const smoothstep = (progress) => {
  const p = Math.min(Math.max(progress, 0), 1);
  return p * p * (3 - 2 * p);
};

/** #### Returns the linear progress that smoothstep() eases to a value
 * - The inverse of smoothstep() on 0 to 1, in closed form: the root of
 *   `p² × (3 − 2p) = eased` that lies in 0 to 1, which is
 *   `½ − sin(asin(1 − 2 × eased) / 3)`.
 * - Returns exactly 0 and 1 at the ends.
 * - Pure maths, with no DOM or GPU access.
 * @param eased The eased progress, clamped to 0 to 1.
 * @returns The linear progress, from 0 to 1.
 */
export const unsmoothstep = (eased) => {
  if (eased <= 0) return 0;
  if (eased >= 1) return 1;

  return 0.5 - Math.sin(Math.asin(1 - 2 * eased) / 3);
};
