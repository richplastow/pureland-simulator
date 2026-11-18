---
title: Export a Sandbox session as a JSON design
description: Adds the JSON design file format with fraction coordinates and notes, an Export button that writes a session out as one, and the converter that loads such a file as a design, proven by the blintz round-tripped into a radio.
type: plan
---

## Context

- The last of the five Basic Sandbox Mode plans but one, on
  [Plan 19](./19-fold-angle.md), whose angles it writes out, and before
  [Plan 21](../todo/21-standing-folds.md). It delivers the research's
  [export as a design](../todo/13-sandbox-mode-research.md#6-export-as-a-design)
  under its ruling: a JSON design file, carrying named fractions and
  notes, loaded back by a JSON module import and a small converter.
- Needed so a session folded in the Sandbox can become a Presentation
  Mode design, as the brief asks, and later a Gameplay Mode design.
- Browser behaviour it rests on:
  [JSON module import attributes](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/import/with),
  Baseline since April 2025 per
  [web.dev](https://web.dev/blog/json-imports-baseline-newly-available);
  [`Clipboard.writeText()`](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText),
  which needs a secure context, as `localhost` and GitHub Pages are;
  [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
  and its `showModal()`; and
  [`crypto.randomUUID()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID),
  also secure-context only.
- Node 25.8.0 runs a JSON module import with `with { type: "json" }`,
  so the converter is checked in Node.

## Decisions

1. **The file format**, `"format": "pureland-design/1"`, a JSON object
   of: `format`; `id`, assigned by `crypto.randomUUID()` at export,
   never derived from the content; `aspect` and `colorId` from the
   pattern; an optional `note`; and `steps`, one per fold, each with
   `from` and `to` as fraction strings, `type`, `halfTurns`, the
   finished angle as a fraction of a half turn, `"1"` for flat, in
   lowest terms with a denominator of at most 36, so a snap step of
   15°, 10° or 5° ([Plan 19](./19-fold-angle.md#decisions),
   Decision 2) all write exactly, and an optional `note`. Keys are
   written A-Z, as the repo orders properties. A coordinate is a
   fraction of the sheet's width for x and height for y, in lowest
   terms, such as `"0"`, `"1/2"` or `"-3/8"`: lattice points are exact
   fractions with a denominator of at most 16 (measured over 6,236
   random flat folds on the four patterns: 8 at most, on the 2:1
   sheet's x), and the writer refuses a coordinate that is not, or an
   angle whose fraction needs a denominator above 36, neither of which
   a lattice fold at a snapped angle produces. Notes are for people:
   the reader drops them. The blintz, as
   [Plan 15's Agent QA](./15-lattice-engine.md#step-2-the-session)
   cuts it, laid out more tightly than JSON.stringify() writes it:

   ```json
   {
     "aspect": 1,
     "colorId": "blue",
     "format": "pureland-design/1",
     "id": "2f0a6b7e-3c1d-4e8f-9a2b-6c5d4e3f2a1b",
     "note": "The blintz base: every corner to the centre.",
     "steps": [
       {
         "from": ["0", "1/2"],
         "halfTurns": "1",
         "to": ["1/2", "0"],
         "type": "valley"
       },
       { "from": ["0", "-1/2"], "halfTurns": "1", "to": ["-1/2", "0"],
         "type": "valley" },
       { "from": ["-1/2", "0"], "halfTurns": "1", "to": ["0", "1/2"],
         "type": "valley" },
       { "from": ["1/2", "0"], "halfTurns": "1", "to": ["0", "-1/2"],
         "type": "valley" }
     ]
   }
   ```

2. **`docs/src/designs/design-file.js`** holds the pure maths:
   readDesignFile(file) turns a parsed file into the frozen design
   object a design module builds, its `id` the file's, resolving each
   fraction with sheetSize() and each `halfTurns` into `targetRadians`
   through createFold(), with `"all"` layers, and throws, naming the
   file's `id`, on an unknown `format`, a fraction that does not parse,
   or a `type` that is neither fold type; writeDesignFile(id, pattern,
   session, note) returns the JSON text, indented by two spaces, from
   the session's folds, with no `note` key when `note` is not given.
   Fractions pass through toFraction(value, unit, maxDenominator) and
   fromFraction(text, unit), `value` and `unit` in one unit: metres
   for a coordinate, and radians for an angle, whose unit is π.
   - toFraction() returns `value / unit` as text in lowest terms: the
     fraction with the smallest denominator, up to `maxDenominator`,
     within `FRACTION_TOLERANCE = 1e-9`, a fraction of the unit, far
     above rounding error and far below 1/1260, the least gap between
     two fractions with denominators up to 36. It throws a RangeError
     naming the value when none lies that close. The writer passes
     `MAX_COORDINATE_DENOMINATOR = 16` for a coordinate and
     `MAX_HALF_TURN_DENOMINATOR = 36` for an angle. Its arguments run
     value over unit, as the division reads, then the bound, rather
     than A-Z.
   - fromFraction() returns `(n × unit) / d` for a text of an optional
     minus sign and a whole number `n`, then optionally `/` and a whole
     number `d` above 0, and throws a RangeError naming any other
     text. `(n × unit) / d` is the form snapAngleRadians()
     ([Plan 19](./19-fold-angle.md#decisions)) computes, so every
     angle at the 15° snap step reads back exactly, where
     `(n / d) × unit` misses 105°.
3. **A JSON design is loaded by a static import**,
   `import BLINTZ_FILE from "./blintz.json" with { type: "json" };` in
   `docs/src/designs/list.js`, converted at load and listed as any
   design is. The file lives beside the design modules, under
   `docs/src/designs/`, and is part of the site. A static import keeps
   the design list synchronous; a browser older than the Baseline
   would stop the page, which the page already asks of import maps
   and `:has()`. A JSON module import also needs the file served with
   a JSON MIME type, which Step 2's Agent QA 3 checks `npx serve`
   sends.
4. **The Export button** joins the sandbox bar after Unfold. It exports
   the folds the paper shows or is folding to, the session's folds
   before the target's position, never the undone tail kept for Redo,
   so it is disabled at position 0, as Undo and Unfold are; `main.js`
   passes writeDesignFile() a session of those folds alone, and no
   `note`, which a person adds by hand. It opens a `<dialog>`, through
   `showModal()`, holding a line saying what to do with the text, as
   the `<label>` of a read-only `<textarea>` holding it; a "Copy"
   button that calls `navigator.clipboard.writeText()` and says
   "Copied" for `COPIED_SECONDS = 1.5`; and a "Close" button. The
   dialog is a child of `<body>`, outside `.controls`, so the
   toolbar's fade and pointer rules never reach it. While it is open
   the page behind takes no keys: Escape closes the dialog alone,
   leaving the toolbar, shown or hidden, and any picked line as they
   were, and the Undo and Redo shortcuts do nothing. The hidden
   toolbar's buttons stay within keyboard reach, so Export can open
   the dialog over a hidden toolbar. One path for every browser: the
   dialog is not a fallback but the export itself, and selecting the
   text by hand works where the clipboard call is refused.
5. **The round trip ships the blintz** as `docs/src/designs/blintz.json`,
   written by the agent through writeDesignFile() in Node from the
   session Plan 15's Agent QA builds, with the `id` and `note` in
   Decision 1's example, the `id` generated once and kept, and a
   "Blintz" radio after Heart whose `value` is that `id`: every design
   radio's `value` is its design's `id`, by which
   `docs/src/ui/design-radios.js` finds its choice. The Lead Developer
   may keep it as the page's sixth design or remove the radio at
   done-plan; the file stays either way as the converter's fixture.

## Steps

### Step 1: The format's reader and writer [P]

- Adds `docs/src/designs/design-file.js` (Decisions 1, 2).
- It should read a file into a design whose cut sheet matches the
  session's exactly (Agent QA 1).
- It should write a session as the format, fractions in lowest terms,
  keys A-Z, indented by two spaces, and read it back to the session's
  metres and angle on a 2:1 sheet (Agent QA 2), a snapped angle to the
  very number it was (Agent QA 5).
- It should refuse a bad format, fraction or type by name
  (Agent QA 3).
- It should write a coordinate in sixteenths and an angle in 36ths of
  a half turn, write no `note` unless given one, and refuse by a
  RangeError a value that needs a larger denominator (Agent QA 4).

**Agent QA**

1. Do: `node --input-type=module -e 'import { createHash } from "node:crypto"; import { readDesignFile } from "./docs/src/designs/design-file.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const file = { aspect: 1, colorId: "blue", format: "pureland-design/1", id: "x", steps: [[["0", "1/2"], ["1/2", "0"]], [["0", "-1/2"], ["-1/2", "0"]], [["-1/2", "0"], ["0", "1/2"]], [["1/2", "0"], ["0", "-1/2"]]].map(([from, to]) => ({ from, halfTurns: "1", to, type: "valley" })) }; const d = readDesignFile(file); const s = cutSheet(d); console.log(d.id, d.colorId, Object.isFrozen(d) && Object.isFrozen(d.steps), d.steps[0].targetRadians === Math.PI, createHash("sha256").update(JSON.stringify([s.faces, s.creaseLines, s.centres, s.bridges])).digest("hex").slice(0, 16));'`
   Expect: `x blue true true 9c554b19b654ceaa` (the blintz's faces, as Plan 15's Agent QA hashes them; measured against a throwaway reader written from Decision 2)
2. Do: `node --input-type=module -e 'import { readDesignFile, writeDesignFile } from "./docs/src/designs/design-file.js"; import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, foldAt } from "./docs/src/sandbox/session.js"; const p = PATTERNS[3]; const s = foldAt(createSession(), 0, { from: [0.2121320343559643 * 0.375, 0.05303300858899107], targetRadians: Math.PI / 2, to: [0.2121320343559643 * 0.375, -0.05303300858899107], type: "mountain" }); const text = writeDesignFile("id-1", p, s, "A wall"); const file = JSON.parse(text); const d = readDesignFile(file); console.log(Object.keys(file).join(","), Object.keys(file.steps[0]).join(","), JSON.stringify(file.steps[0]), file.aspect, file.colorId, file.note, d.steps[0].from.map((v) => v.toFixed(4)).join(), d.steps[0].targetRadians === Math.PI / 2, text.split("\n")[1].indexOf("\""));'`
   Expect: `aspect,colorId,format,id,note,steps from,halfTurns,to,type {"from":["3/8","1/2"],"halfTurns":"1/2","to":["3/8","-1/2"],"type":"mountain"} 2 pink A wall 0.0795,0.0530 true 2`
   (the ends are a hair off 3/8 and 1/2, so the writer's tolerance is
   tested; read back, x is 3/8 of the width and y half the height; the
   last `2` is the second line's indent, two spaces)
3. Do: `node --input-type=module -e 'import { readDesignFile } from "./docs/src/designs/design-file.js"; const base = { aspect: 1, colorId: "blue", format: "pureland-design/1", id: "bad", steps: [{ from: ["0", "1/2"], halfTurns: "1", to: ["1/2", "0"], type: "valley" }] }; for (const file of [{ ...base, format: "other/9" }, { ...base, steps: [{ ...base.steps[0], from: ["x", "0"] }] }, { ...base, steps: [{ ...base.steps[0], type: "crease" }] }, { ...base, steps: [{ ...base.steps[0], to: ["1/0", "0"] }] }, { ...base, steps: [{ ...base.steps[0], from: ["0.5", "0"] }] }, { ...base, steps: [{ ...base.steps[0], halfTurns: "+1" }] }]) { try { readDesignFile(file); console.log("no error"); } catch (e) { console.log(e.message); } }'`
   Expect: six lines, each naming `"bad"` and, in turn, the format
   `other/9`, the fraction `x`, the type `crease`, and the fractions
   `1/0`, `0.5` and `+1`, none of which fromFraction()'s grammar
   accepts
4. Do: `node --input-type=module -e 'import { writeDesignFile } from "./docs/src/designs/design-file.js"; import { sheetSize } from "./docs/src/designs/sheet.js"; import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, foldAt } from "./docs/src/sandbox/session.js"; const p = PATTERNS[3]; const { heightMeters: H, widthMeters: W } = sheetSize(p.aspect); const write = (x, targetRadians) => { try { const file = JSON.parse(writeDesignFile("q", p, foldAt(createSession(), 0, { from: [x, H / 2], targetRadians, to: [x, -H / 2], type: "valley" }))); return [file.steps[0].from[0], file.steps[0].halfTurns, "note" in file].join(); } catch (e) { return e.name; } }; console.log(write((5 * W) / 16, Math.PI / 36), write(W / 17, Math.PI), write(0, Math.PI / 37), write(-W / 16, (35 * Math.PI) / 36), write(-1e-12, Math.PI));'`
   Expect: `5/16,1/36,false RangeError RangeError -1/16,35/36,false 0,1,false`
   (each bound met exactly, then just passed: a coordinate of 1/17 and
   an angle of 1/37 are refused; whole numbers are written as such, and
   a hair below 0 as `0`, not `-0`)
5. Do: `node --input-type=module -e 'import { readDesignFile, writeDesignFile } from "./docs/src/designs/design-file.js"; import { snapAngleRadians } from "./docs/src/sandbox/angle.js"; import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, foldAt } from "./docs/src/sandbox/session.js"; const a = snapAngleRadians((7 * Math.PI) / 12); const s = foldAt(createSession(), 0, { from: [0, -0.075], targetRadians: a, to: [0, 0.075], type: "valley" }); const file = JSON.parse(writeDesignFile("r", PATTERNS[0], s)); console.log(file.steps[0].halfTurns, readDesignFile(file).steps[0].targetRadians === a);'`
   Expect: `7/12 true` (a 105° fold, snapped, reads back to the very
   number snapAngleRadians() made, as `(n × unit) / d` does and
   `(n / d) × unit` would not; measured against a throwaway module)

### Step 2: The blintz, round-tripped

- Adds `docs/src/designs/blintz.json`, changes
  `docs/src/designs/list.js` (the import and the conversion) and
  `docs/index.html` (the "Blintz" radio after Heart, its `value` the
  file's `id`), per Decisions 3 and 5.
- It should list six designs, the blintz last, with a radio that
  quotes its `id`, and cut it as the session did (Agent QA 1, 2, 3;
  Manual QA 5).
- It should leave the camera's reach as it is: the blintz reaches
  0.1061 m, under the heart's 0.1189 m (Agent QA 1).

**Agent QA**

1. Do: `node --input-type=module -e 'import { createHash } from "node:crypto"; import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius } from "./docs/src/fold/pose.js"; const b = DESIGNS.at(-1); const s = cutSheet(b); console.log(DESIGNS.length, b.id.length, b.colorId, s.faces.length, maxPaperRadius(s).toFixed(4), Math.max(...DESIGNS.map((d) => maxPaperRadius(cutSheet(d)))).toFixed(4), createHash("sha256").update(JSON.stringify([s.faces, s.creaseLines, s.centres, s.bridges])).digest("hex").slice(0, 16));'`
   Expect: `6 36 blue 5 0.1061 0.1189 9c554b19b654ceaa` (a UUID is 36 characters; the widest reach stays the heart's, as [Plan 15](./15-lattice-engine.md#decisions), Decision 8, measured it; measured against a throwaway reader written from Decision 2)
2. Do: `grep -o 'with { type: "json" }' docs/src/designs/list.js | wc -l; grep -c 'value="2f0a6b7e-3c1d-4e8f-9a2b-6c5d4e3f2a1b"' docs/index.html; node --input-type=module -e 'import BLINTZ from "./docs/src/designs/blintz.json" with { type: "json" }; console.log(BLINTZ.id, BLINTZ.note);'; node --check docs/src/designs/list.js`
   Expect: `1`, `1`,
   `2f0a6b7e-3c1d-4e8f-9a2b-6c5d4e3f2a1b The blintz base: every corner to the centre.`,
   then nothing (the radio quotes the file's `id`, which
   design-radios.js looks the choice up by)
3. Do: with the server started and stopped as CLAUDE.md's
   [Agent checks](../../CLAUDE.md#agent-checks) say,
   `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:1111/src/designs/blintz.json`
   Expect: `200`, then a type starting `application/json`, which a
   JSON module import needs

### Step 3: The Export button and its dialog

- Changes `docs/index.html` (the button and the `<dialog>`),
  `docs/styles/main.css` (the dialog), `docs/src/ui/sandbox-bar.js`
  (the button, the dialog, the clipboard) and `docs/src/main.js` (the
  text from the session), per Decision 4.
- It should open a dialog holding the session as the format, with the
  pattern's aspect and colour and every fold's angle, at a desktop and
  a phone-sized viewport (Manual QA 1, 2, 8).
- It should copy the text to the clipboard on "Copy", and say so
  (Manual QA 2).
- It should export only the folds before the paper's position, and
  disable Export at position 0 (Manual QA 3, 4).
- It should close the dialog alone on Escape, leaving the toolbar as
  it was, and ignore the Undo and Redo shortcuts while the dialog is
  open (Manual QA 7).

**Agent QA**

1. Do: `grep -c '<dialog' docs/index.html; grep -o 'data-export\|data-copy' docs/index.html | sort -u | wc -l; grep -oh 'showModal\|clipboard.writeText\|crypto.randomUUID' docs/src/ui/sandbox-bar.js docs/src/main.js | sort -u | wc -l`
   Expect: `1`, `2`, `3`
2. Do: `node --check docs/src/ui/sandbox-bar.js && node --check docs/src/main.js && node --check docs/src/designs/design-file.js; awk 'length > 80 && !/data:image|aria-label="A sheet|aria-keyshortcuts=/ { print FILENAME ":" FNR }' docs/src/ui/sandbox-bar.js docs/src/main.js docs/src/designs/design-file.js docs/src/designs/list.js docs/styles/main.css docs/index.html`
   Expect: prints nothing. The `awk` skips the three lines of
   `docs/index.html` that no wrap can shorten, as
   [Plan 19](./19-fold-angle.md#step-3-shift-and-the-arrows-fold-live)'s
   check did: the favicon's `data:` URL, and the canvas's `aria-label`
   and `aria-keyshortcuts`.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser a session folded in the Sandbox, exported, pasted into a
file and given a radio plays back in Presentation Mode, as the shipped
blintz already does.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome, open the dev tools
console, hard-reload (Shift+Cmd+R), click "Sandbox", and fold the four
corners of the square to the centre, then stand the vertical centre
fold at 90° by a drag.

1. **Do:** click "Export".
   - **Expect:** a dialog opens over the page with a line saying to
     copy the JSON and save it as a design file in `docs/src/designs/`,
     over a text box of JSON, shown from its top:
     `"format": "pureland-design/1"`, an `id` of 36 characters,
     `"aspect": 1`, `"colorId": "blue"`, and five steps whose `from`
     and `to` are fractions such as `"1/2"`, the first four with
     `"halfTurns": "1"` and the last with `"1/2"`. The page behind
     cannot be clicked.
2. **Do:** click "Copy", then paste into an empty editor tab, not the
   console, which may refuse a paste.
   - **Expect:** the button reads "Copied" for a moment; the paste is
     the same JSON.
3. **Do:** scroll the text box to its end, click "Close", click "Undo"
   twice, then "Export" again.
   - **Expect:** the dialog closes; the new export has three steps,
     shown from its top again.
4. **Do:** click "Close", then "Unfold", and look at the sandbox bar.
   - **Expect:** "Export" is greyed out, as "Undo" and "Unfold" are,
     with the paper unfolded flat.
5. **Do:** click "Presentation", then "Blintz".
   - **Expect:** a sixth design button after Heart; the paper unfolds,
     turns blue, and folds its four corners to the centre, with four
     dashed valley lines showing as it folds.
6. **Do:** save the JSON pasted in step 2 as a new file,
   `docs/src/designs/wall.json`. In `list.js`, import it beside the
   blintz's and convert it into `DESIGNS` after the blintz, as the
   blintz is. In `index.html`, copy the Blintz radio to just after it,
   with the label "Wall" and its `value` the `id` in `wall.json`.
   Reload, click "Presentation", then "Wall".
   - **Expect:** the blintz folds, then its centre fold stands up at a
     right angle, in blue. Delete the file, the import, the conversion
     and the radio afterwards, and reload.
   - **Why:** the whole round trip, by hand, with an angle in it.
7. **Do:** click "Sandbox", fold any line flat, click "Export", press
   Cmd+Z, then press Escape, then Space.
   - **Expect:** Cmd+Z leaves the paper folded behind the dialog;
     Escape closes the dialog, and the toolbar stays shown; Space opens
     the dialog again, as focus has gone back to "Export".
8. **Do:** in the dev tools' device mode (iPhone 12 Pro), reload, fold
   any line flat, and click "Export".
   - **Expect:** the dialog fits the screen, with its text box, "Copy"
     and "Close" in view and the JSON scrolling within the box; the
     page does not scroll sideways; "Close" closes it.
9. **Do:** look over the console after steps 1 to 8.
   - **Expect:** no errors or warnings.

## Audit

- **2026-11-14T14:05:33Z** — **drafted**: the JSON design format with
  fraction coordinates, half-turn angles and notes, its reader and writer,
  the blintz round-tripped into a radio, and the Export dialog with Copy.
- **2026-11-17T18:11:45Z** — **revised**: an angle’s fraction may have a denominator of
  up to 36, since Plan 19’s snap step may shrink from 15° to 10° or 5°;
  ruled by the Lead Developer via /feed-me.
- **2026-11-18T17:01:51Z** — **reviewed**: no Major finding; Minor fixes
  applied unattended: the Blintz radio’s `value` is the file’s `id`, not
  `blintz`, which design-radios.js would have thrown on (Decision 5,
  Step 2, Manual QA 6); Export writes the folds before the target’s
  position and is disabled at 0, as Manual QA 3 and 4 read (Decision 4);
  toFraction() takes its bound, with `FRACTION_TOLERANCE` and the 16 and
  36 bounds named, and writeDesignFile()’s arguments run A-Z (Decision
  2); the dialog sits outside `.controls`, its `<textarea>` labelled, and
  holds the keys while open (Decision 4, Manual QA 7); the widest reach
  is the heart’s 0.1189 m; Step 3’s grep and awk lines fixed; Agent QA
  added for the reader on a 2:1 sheet, the bounds and refusals, and the
  served JSON type; Manual QA adds a phone and a console step. Step 1’s
  QA, run against a throwaway module written from Decision 2, passes and
  catches 21 mutants.
- **2026-11-18T17:11:12Z** — **reviewed**: round 2, no Major finding;
  round 1’s edits hold against the code and one another. Minor fixes
  applied unattended: Step 1’s Agent QA 2 checks the two-space indent,
  QA 3 refuses `1/0`, `0.5` and `+1`, and a new QA 5 reads a snapped
  105° back exactly, which Decision 2 now gives as the reason for
  `(n × unit) / d`; Escape leaves the toolbar as it was, shown or
  hidden (Decision 4, Step 3). Step 1’s QA, run verbatim against a
  fresh throwaway module, passes and catches all 29 mutants tried.
- **2026-11-18T17:18:23Z** — **implemented**: Steps 1 to 3; added
  `docs/src/designs/design-file.js` and `docs/src/designs/blintz.json`
  (written in Node through writeDesignFile() from Plan 15’s session, plus
  a closing newline); changed `list.js`, `index.html`, `main.css`,
  `sandbox-bar.js` and `main.js`. Each check failed first for the
  expected reason. Agent QA: Step 1’s 1 to 5, Step 2’s 1 to 3 and Step
  3’s 1 and 2 pass as written. The dialog’s Close is a submit button in a
  `<form method="dialog">`; a refused clipboard write rejects unhandled,
  reaching the console, with no message on the button. Manual QA 1 now
  names the dialog’s line and that the text shows from its top; the rest
  unchanged.
- **2026-11-18T17:18:23Z** — **verified**: agent checks pass: 4 modules parse, no long
  lines but `index.html`’s three exempt ones, all changed files served
  with status 200 (`blintz.json` as `application/json`), vendored
  checksums match; browser not run.
- **2026-11-18T17:24:13Z** — **quality-checked**: Fixed: no fix-tier
  finding; first-run polish in new code: writeDesignFile() passes `note`
  as is, since JSON.stringify() writes no key for an undefined value, in
  place of a conditional spread that a mutant showed to be equivalent
  (`design-file.js`; `blintz.json` still byte-identical to the writer’s
  output); Step 1’s Agent QA 4 adds a whole number and a hair below 0
  (expects `0,1,false`), catching a writer that starts its denominators
  at 2 or writes `-0`, which no QA caught before; Manual QA 3 scrolls the
  text box down before Close and expects the re-export from its top;
  Manual QA 7 presses Space after Escape and expects the dialog again,
  proving focus returns to Export. Deferred: no on-screen word when the
  clipboard refuses, the rejection reaching the console unhandled, which
  swallows nothing and leaves Decision 4’s select-by-hand path (the plan
  names no message); a Copy resolving after Close can show “Copied” for
  up to 1.5 s on the next open (negligible race); readDesignFile() throws
  a TypeError without the file’s `id` on a malformed shape (no `steps`,
  a point not an array), as only repo files reach it; Plan 21’s Step 1
  Agent QA 2 filters `d.id !== "blintz"`, stale now the id is a UUID.
  Verified fine: against the HTML spec, Escape’s `keydown` fires before
  the close request and closes the dialog unless cancelled, so
  controls-toggle.js sees the dialog open and onEscape() returns true
  without preventDefault(); the Undo and Redo listener returns before
  preventDefault() while open; no other key listener is on `document`
  (pick.js’s is on the canvas, inert under the modal); showModal()
  focuses the first sequentially focusable descendant, the read-only
  `<textarea>`; closing a modal dialog refocuses its previously focused
  element, Export; mutation run on `design-file.js`: of 25 mutants, 24
  caught once QA 4 grew, the 25th the equivalent `note` spread, removed; all
  Agent QA blocks pass; agent checks pass. No Three.js sweep needed:
  nothing in the scene, animation loop, disposal or resize changed.
- **2026-11-18T17:48:07Z** — **done**: manual QA passed, run by the Lead
  Developer after /orchestrate-plan, the Wall round trip included; the
  Blintz radio kept as the sixth design.
