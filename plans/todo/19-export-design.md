---
title: Export a Sandbox session as a JSON design
description: Adds the JSON design file format with fraction coordinates and notes, an Export button that writes a session out as one, and the converter that loads such a file as a design, proven by the blintz round-tripped into a radio.
type: plan
---

## Context

- The last of the five Basic Sandbox Mode plans but one, on
  [Plan 18](./18-fold-angle.md), whose angles it writes out, and before
  [Plan 20](./20-standing-folds.md). It delivers the research's
  [export as a design](./13-sandbox-mode-research.md#6-export-as-a-design)
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
   finished angle as a fraction of a half turn, `"1"` for flat, and an
   optional `note`. Keys are written A-Z, as the repo orders
   properties. A coordinate is a fraction of the sheet's width for x
   and height for y, in lowest terms, such as `"0"`, `"1/2"` or
   `"-3/8"`: lattice points are exact fractions with a denominator of
   at most 16, and the writer refuses a value that is not, which no
   lattice fold produces. The blintz, as Plan 15's Agent QA cuts it:

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
   object a design module builds, resolving each fraction with
   sheetSize() and each `halfTurns` into `targetRadians` through
   createFold(), with `"all"` layers, and throws, naming the file's
   `id`, on an unknown `format`, a fraction that does not parse, or a
   `type` that is neither fold type; writeDesignFile(pattern, session,
   id, note) returns the JSON text, indented by two spaces, from a
   session's folds. Fractions pass through toFraction(valueMeters,
   unitMeters) and fromFraction(text, unitMeters).
3. **A JSON design is loaded by a static import**,
   `import BLINTZ_FILE from "./blintz.json" with { type: "json" };` in
   `docs/src/designs/list.js`, converted at load and listed as any
   design is. The file lives beside the design modules, under
   `docs/src/designs/`, and is part of the site. A static import keeps
   the design list synchronous; a browser older than the Baseline
   would stop the page, which the page already asks of import maps
   and `:has()`.
4. **The Export button** joins the sandbox bar after Unfold, enabled
   whenever the session has a fold. It opens a `<dialog>`, through
   `showModal()`, holding a read-only `<textarea>` with the text, a
   "Copy" button that calls `navigator.clipboard.writeText()` and says
   "Copied" for `COPIED_SECONDS = 1.5`, a line saying what to do with
   the text, and a "Close" button. One path for every browser: the
   dialog is not a fallback but the export itself, and selecting the
   text by hand works where the clipboard call is refused.
5. **The round trip ships the blintz** as `docs/src/designs/blintz.json`,
   written by the agent through writeDesignFile() in Node from the
   session Plan 15's Agent QA builds, with the id above generated once,
   and a "Blintz" radio after Heart. The Lead Developer may keep it as
   the page's sixth design or remove the radio at done-plan; the file
   stays either way as the converter's fixture.

## Steps

### Step 1: The format's reader and writer [P]

- Adds `docs/src/designs/design-file.js` (Decisions 1, 2).
- It should read a file into a design whose cut sheet matches the
  session's exactly (Agent QA 1).
- It should write a session as the format, fractions in lowest terms,
  keys A-Z (Agent QA 2).
- It should refuse a bad format, fraction or type by name
  (Agent QA 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { createHash } from "node:crypto"; import { readDesignFile } from "./docs/src/designs/design-file.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const file = { aspect: 1, colorId: "blue", format: "pureland-design/1", id: "x", steps: [[["0", "1/2"], ["1/2", "0"]], [["0", "-1/2"], ["-1/2", "0"]], [["-1/2", "0"], ["0", "1/2"]], [["1/2", "0"], ["0", "-1/2"]]].map(([from, to]) => ({ from, halfTurns: "1", to, type: "valley" })) }; const d = readDesignFile(file); const s = cutSheet(d); console.log(d.id, d.colorId, Object.isFrozen(d.steps), d.steps[0].targetRadians === Math.PI, createHash("sha256").update(JSON.stringify([s.faces, s.creaseLines, s.centres, s.bridges])).digest("hex").slice(0, 16));'`
   Expect: `x blue true true 9c554b19b654ceaa` (the blintz's faces, as Plan 15's Agent QA hashes them)
2. Do: `node --input-type=module -e 'import { writeDesignFile } from "./docs/src/designs/design-file.js"; import { PATTERNS } from "./docs/src/sandbox/patterns.js"; import { createSession, foldAt } from "./docs/src/sandbox/session.js"; const p = PATTERNS[3]; const s = foldAt(createSession(), 0, { from: [0.2121320343559643 * 0.375, 0.05303300858899107], targetRadians: Math.PI / 2, to: [0.2121320343559643 * 0.375, -0.05303300858899107], type: "mountain" }); const text = writeDesignFile(p, s, "id-1", "A wall"); const file = JSON.parse(text); console.log(Object.keys(file).join(","), Object.keys(file.steps[0]).join(","), JSON.stringify(file.steps[0]), file.aspect, file.colorId, file.note);'`
   Expect: `aspect,colorId,format,id,note,steps from,halfTurns,to,type {"from":["3/8","1/2"],"halfTurns":"1/2","to":["3/8","-1/2"],"type":"mountain"} 2 pink A wall`
3. Do: `node --input-type=module -e 'import { readDesignFile } from "./docs/src/designs/design-file.js"; const base = { aspect: 1, colorId: "blue", format: "pureland-design/1", id: "bad", steps: [{ from: ["0", "1/2"], halfTurns: "1", to: ["1/2", "0"], type: "valley" }] }; for (const file of [{ ...base, format: "other/9" }, { ...base, steps: [{ ...base.steps[0], from: ["x", "0"] }] }, { ...base, steps: [{ ...base.steps[0], type: "crease" }] }]) { try { readDesignFile(file); console.log("no error"); } catch (e) { console.log(e.message); } }'`
   Expect: three lines, each naming `"bad"` and, in turn, the format
   `other/9`, the fraction `x`, and the type `crease`

### Step 2: The blintz, round-tripped

- Adds `docs/src/designs/blintz.json`, changes
  `docs/src/designs/list.js` (the import and the conversion) and
  `docs/index.html` (the "Blintz" radio after Heart), per Decisions 3
  and 5.
- It should list six designs, the blintz last, and cut it as the
  session did (Agent QA 1; Manual QA 5).
- It should leave the camera's reach as it is: the blintz reaches
  0.1061 m, under the pencil's (Agent QA 1).

**Agent QA**

1. Do: `node --input-type=module -e 'import { createHash } from "node:crypto"; import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius } from "./docs/src/fold/pose.js"; const b = DESIGNS.at(-1); const s = cutSheet(b); console.log(DESIGNS.length, b.id.length, b.colorId, s.faces.length, maxPaperRadius(s).toFixed(4), Math.max(...DESIGNS.map((d) => maxPaperRadius(cutSheet(d)))).toFixed(4), createHash("sha256").update(JSON.stringify([s.faces, s.creaseLines, s.centres, s.bridges])).digest("hex").slice(0, 16));'`
   Expect: `6 36 blue 5 0.1061 0.1211 9c554b19b654ceaa` (a UUID is 36 characters; the widest reach stays the pencil's)
2. Do: `grep -o 'with { type: "json" }' docs/src/designs/list.js | wc -l; grep -o 'value="blintz"' docs/index.html | wc -l; node --check docs/src/designs/list.js`
   Expect: `1`, `1`, then nothing

### Step 3: The Export button and its dialog

- Changes `docs/index.html` (the button and the `<dialog>`),
  `docs/styles/main.css` (the dialog), `docs/src/ui/sandbox-bar.js`
  (the button, the dialog, the clipboard) and `docs/src/main.js` (the
  text from the session), per Decision 4.
- It should open a dialog holding the session as the format, with the
  pattern's aspect and colour and every fold's angle (Manual QA 1, 2,
  3).
- It should copy the text to the clipboard on "Copy", and say so
  (Manual QA 2).
- It should disable Export with no fold in the session (Manual QA 4).

**Agent QA**

1. Do: `grep -o '<dialog[^>]*>\|data-export\|data-copy\|showModal\|clipboard.writeText' docs/index.html docs/src/ui/sandbox-bar.js | sort -u | wc -l`
   Expect: `5`
2. Do: `node --check docs/src/ui/sandbox-bar.js && node --check docs/src/main.js; awk 'length > 80 { print FILENAME ":" FNR }' docs/src/ui/sandbox-bar.js docs/src/main.js docs/src/designs/design-file.js docs/styles/main.css docs/index.html | grep -v "index.html:9$"`
   Expect: prints nothing.

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
   - **Expect:** a dialog opens over the page with a text box of JSON:
     `"format": "pureland-design/1"`, an `id` of 36 characters,
     `"aspect": 1`, `"colorId": "blue"`, and five steps whose `from`
     and `to` are fractions such as `"1/2"`, the first four with
     `"halfTurns": "1"` and the last with `"1/2"`. The page behind
     cannot be clicked.
2. **Do:** click "Copy", then paste into the console's input line.
   - **Expect:** the button reads "Copied" for a moment; the paste is
     the same JSON.
3. **Do:** click "Close", click "Undo" twice, then "Export" again.
   - **Expect:** the dialog closes; the new export has three steps.
4. **Do:** click "Unfold", and look at the sandbox bar.
   - **Expect:** "Export" is greyed out with no folds in the session.
5. **Do:** click "Presentation", then "Blintz".
   - **Expect:** a sixth design button after Heart; the paper unfolds,
     turns blue, and folds its four corners to the centre, with four
     dashed valley lines showing as it folds.
6. **Do:** paste the JSON from step 2 into a new file,
   `docs/src/designs/wall.json`, add an import for it in `list.js`
   beside the blintz's with the id `wall`, and a radio
   `value="wall"` with the label "Wall"; reload and click "Wall".
   - **Expect:** the blintz folds, then its centre fold stands up at a
     right angle, in blue. Delete the file, the import and the radio
     afterwards.
   - **Why:** the whole round trip, by hand, with an angle in it.
7. **Do:** press Escape with the dialog open.
   - **Expect:** the dialog closes, and the toolbar stays shown.

## Audit

- **2026-11-14T14:05:33Z** — **drafted**: the JSON design format with
  fraction coordinates, half-turn angles and notes, its reader and writer,
  the blintz round-tripped into a radio, and the Export dialog with Copy.
