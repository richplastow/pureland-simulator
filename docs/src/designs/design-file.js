/**
 * @fileoverview
 * The JSON design file, `pureland-design/1`: its reader, which turns a
 * parsed file into a design, and its writer, which turns a Sandbox session
 * into one, with fractions of the sheet and of a half turn standing in for
 * metres and radians.
 */

import { sheetSize } from "./sheet.js";
import { createFold } from "./steps.js";

// The fold types a step may name.
const FOLD_TYPES = Object.freeze(["mountain", "valley"]);

// The format a file names, which this module reads and writes.
const FORMAT = "pureland-design/1";

// A fraction's text: an optional minus sign and a whole number, then
// optionally `/` and a whole number, the denominator.
const FRACTION_PATTERN = /^(-?\d+)(?:\/(\d+))?$/;

// How close a value must lie to a fraction for toFraction() to write it as
// that fraction, as a fraction of the unit: far above rounding error, and
// far below 1/1260, the least gap between two fractions with denominators
// up to 36.
const FRACTION_TOLERANCE = 1e-9;

// The largest denominator a coordinate's fraction may have: every lattice
// point is a whole number of sixteenths of the sheet's width and height.
const MAX_COORDINATE_DENOMINATOR = 16;

// The largest denominator an angle's fraction of a half turn may have, so
// a snap step of 15°, 10° or 5° writes exactly.
const MAX_HALF_TURN_DENOMINATOR = 36;

/** #### Reads a parsed design file into the frozen design it describes
 * - Builds the design a design module builds, `{ aspect, colorId, id,
 *   steps }`, its `id` the file's, with one fold step through every layer
 *   per step in the file, carrying the step's `name` when it has one. Its
 *   notes, the file's and each step's, are for people, and are dropped.
 * - Resolves each coordinate, a fraction of the sheet's width for x and of
 *   its height for y, into metres by sheetSize(), and each `halfTurns`, a
 *   fraction of a half turn, into `targetRadians`, in radians.
 * - Throws, naming the file's `id`, on a `format` other than
 *   `pureland-design/1`, a fraction that does not parse, or a `type` that
 *   is neither `"mountain"` nor `"valley"`.
 * - Pure maths, with no DOM or GPU access.
 * @param file The parsed file: `aspect`, `colorId`, `format`, `id`,
 *   `steps`, and an optional `note`. Each step may carry a `name`, added
 *   by hand, as the note is.
 * @returns The design, frozen, its steps too.
 */
export const readDesignFile = (file) => {
  const { aspect, colorId, format, id } = file;
  if (format !== FORMAT) {
    throw new Error(`Design "${id}": unknown format "${format}"`);
  }

  const { heightMeters, widthMeters } = sheetSize(aspect);
  const readPoint = ([x, y]) => [
    readFraction(id, x, widthMeters),
    readFraction(id, y, heightMeters),
  ];
  const steps = file.steps.map(({ from, halfTurns, name, to, type }) => {
    if (!FOLD_TYPES.includes(type)) {
      throw new Error(`Design "${id}": unknown fold type "${type}"`);
    }

    return createFold(readPoint(from), "all", readPoint(to), type, {
      name,
      targetRadians: readFraction(id, halfTurns, Math.PI),
    });
  });

  return Object.freeze({ aspect, colorId, id, steps: Object.freeze(steps) });
};

/** #### Returns the value a fraction's text gives, as a share of a unit
 * - Takes an optional minus sign and a whole number `n`, then optionally
 *   `/` and a whole number `d` above 0, and returns `(n × unit) / d`, the
 *   form snapAngleRadians() computes, so every snapped angle reads back to
 *   the very number it was.
 * - Throws a RangeError naming any other text.
 * - Pure maths, with no DOM or GPU access.
 * @param text The fraction's text, such as `"-3/8"`.
 * @param unit The unit the fraction is of, such as the sheet's width in
 *   metres, or π, a half turn in radians.
 * @returns The value, in the unit's units.
 */
export const fromFraction = (text, unit) => {
  const match = typeof text === "string" ? FRACTION_PATTERN.exec(text) : null;
  const denominator = Number(match?.[2] ?? 1);
  if (match === null || denominator === 0) {
    throw new RangeError(`Not a fraction: "${text}"`);
  }

  return (Number(match[1]) * unit) / denominator;
};

/** #### Returns a value as the text of a fraction of a unit, in lowest terms
 * - Returns `value / unit` as the fraction with the smallest denominator,
 *   up to `maxDenominator`, that lies within `FRACTION_TOLERANCE` of it, a
 *   fraction of the unit: `"0"`, `"1"` and `"-2"` for whole numbers, and
 *   `"1/2"` or `"-3/8"` otherwise.
 * - Throws a RangeError naming the value when no such fraction lies that
 *   close.
 * - Its arguments run value over unit, as the division reads, then the
 *   bound, rather than A-Z.
 * - Pure maths, with no DOM or GPU access.
 * @param value The value, in the unit's units, such as metres or radians.
 * @param unit The unit, in the same units, such as the sheet's width in
 *   metres, or π, a half turn in radians.
 * @param maxDenominator The largest denominator allowed, a whole number.
 * @returns The fraction's text.
 */
export const toFraction = (value, unit, maxDenominator) => {
  const ratio = value / unit;
  for (let denominator = 1; denominator <= maxDenominator; denominator += 1) {
    const numerator = Math.round(ratio * denominator);
    if (Math.abs(ratio - numerator / denominator) <= FRACTION_TOLERANCE) {
      // A template literal writes −0, from a tiny negative ratio, as "0".
      return denominator === 1
        ? `${numerator}`
        : `${numerator}/${denominator}`;
    }
  }

  throw new RangeError(
    `${value} is no fraction of ${unit} with a denominator up to ` +
      `${maxDenominator}`,
  );
};

/** #### Writes a session's folds as a design file's JSON text
 * - Writes `aspect` and `colorId` from the pattern, `format`, `id`, the
 *   `note` if one is given, and one step per fold: its `from` and `to`, each
 *   as fractions of the sheet's width and height; its `halfTurns`, the
 *   angle as a fraction of a half turn, `"1"` for flat; and its `type`.
 *   It writes no `name`, since a session's folds have none.
 * - Fractions are in lowest terms, such as `"0"`, `"1/2"` or `"-3/8"`.
 *   Keys run A-Z, and the text is indented by two spaces.
 * - Throws a RangeError, from toFraction(), for a coordinate that is no
 *   whole number of sixteenths, or an angle that is no whole number of
 *   36ths of a half turn, neither of which a lattice fold at a snapped
 *   angle makes.
 * - Pure maths, with no DOM or GPU access.
 * @param id The file's `id`, assigned, never derived from its content.
 * @param pattern The pattern folded, from `PATTERNS`: its `aspect` and
 *   `colorId`.
 * @param session The session, whose `folds` are each `{ from,
 *   targetRadians, to, type }`, the ends in metres and the angle in
 *   radians.
 * @param note Optional words for people about the design.
 * @returns The JSON text.
 */
export const writeDesignFile = (id, pattern, session, note) => {
  const { aspect, colorId } = pattern;
  const { heightMeters, widthMeters } = sheetSize(aspect);
  const writePoint = ([x, y]) => [
    toFraction(x, widthMeters, MAX_COORDINATE_DENOMINATOR),
    toFraction(y, heightMeters, MAX_COORDINATE_DENOMINATOR),
  ];
  const steps = session.folds.map(({ from, targetRadians, to, type }) => ({
    from: writePoint(from),
    halfTurns: toFraction(targetRadians, Math.PI, MAX_HALF_TURN_DENOMINATOR),
    to: writePoint(to),
    type,
  }));

  // JSON.stringify() writes no key for a `note` left undefined.
  return JSON.stringify(
    { aspect, colorId, format: FORMAT, id, note, steps },
    null,
    2,
  );
};

/** #### Reads a fraction of a design file, naming the file if it fails
 * - Throws a RangeError naming the file's `id` and the text, with
 *   fromFraction()'s error as its `cause`.
 * @param id The file's `id`.
 * @param text The fraction's text.
 * @param unit The unit the fraction is of.
 * @returns The value, in the unit's units.
 */
const readFraction = (id, text, unit) => {
  try {
    return fromFraction(text, unit);
  } catch (error) {
    throw new RangeError(`Design "${id}": ${error.message}`, { cause: error });
  }
};
