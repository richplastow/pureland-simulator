/**
 * @fileoverview
 * The paper sheet: a two-tone, flat-shaded mesh with a fine grain on both
 * sides, turned to its sheet's starting pose and posed along its sequence
 * of folds and turn-overs, with its printed lines, a design's crease
 * pattern or a pattern's lattice, on both sides, whose front colour fades
 * to another on request, and a strip that lights one lattice line.
 */

import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DataTexture,
  DoubleSide,
  DynamicDrawUsage,
  EqualStencilFunc,
  FrontSide,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NoColorSpace,
  RepeatWrapping,
  ReplaceStencilOp,
  SRGBColorSpace,
  Sphere,
  Vector3,
} from "three";
import { smoothstep } from "../fold/easing.js";
import { viewTurnRadiansAt, writePaperPositions } from "../fold/pose.js";
import { writeStripPositions } from "../sandbox/line-pick.js";
import { drawFoldLines } from "./fold-lines.js";
import { createGrainPixels, GRAIN_TEXTURE_PX, grainRepeat } from "./grain.js";

const LIT_LINE_CORNERS = 4; // two at each end of each segment's strip

// The time a lit line takes to grow from nothing to its full width, or to
// shrink back, in seconds; as long as a toolbar choice's hover fade.
const LIT_LINE_GROW_SECONDS = 0.15;

const LIT_LINE_INDICES_PER_SEGMENT = 6; // two triangles per segment's strip

// The most segments of one side or the other a lit line shows: more than a
// line crosses on any pattern's paper in practice; any beyond go unlit.
const LIT_LINE_MAX_SEGMENTS = 32;

// The lit line's place among the transparent objects, which draw in order
// of `renderOrder` before depth: above the fold-line meshes' default 0, so
// it draws after them.
const LIT_LINE_RENDER_ORDER = 1;

// The lit line's full width on the sheet, in metres: six times the printed
// line's 0.5 mm, `FOLD_LINE_WIDTH_MM` in fold-lines.js; tuned by eye.
const LIT_LINE_WIDTH_METERS = 0.003;

const PAPER_BACK_COLOR = 0xf4f1ea; // off-white, whatever the front's colour

// The value the paper writes into the stencil buffer wherever it draws, and
// the lit line draws only where it finds; the renderer clears the buffer
// to 0 each frame.
const PAPER_STENCIL_REF = 1;

// Scratch for a lit segment's ink as it is written, created once.
const inkColor = new Color();

/** #### Creates the paper sheet, flat, from a cut sheet
 * - Each face has its own vertices and a fan of triangles; each bridging
 *   strip is two triangles joining the edges of two faces at a crease.
 * - The front, back and two fold-line meshes share one geometry, whose
 *   positions are rewritten in place as the paper folds.
 * - Each fold-line mesh shows the sheet's printed lines on its side,
 *   drawn into a canvas of its own, through UVs that follow sheet
 *   coordinates, so each back line lies beneath its front line.
 *   Transparent, each draws after the opaque paper, at the depth of its
 *   side's mesh, which Material's default `depthFunc`, LessEqualDepth,
 *   lets it pass. Both start hidden, so their textures upload only once
 *   shown.
 * - The front's lines are black and unlit, a `map`. The back's are a
 *   coverage mask, the `alphaMap` of a lit material in the front's colour,
 *   so they take the front's colour and darken in shade with the paper.
 * - The front mesh alone casts shadows, the whole sheet both ways up, and
 *   the front, back and back-line meshes receive them, so the paper
 *   shadows itself. The front-line mesh neither casts nor receives: it is
 *   unlit, and its lines are black already.
 * - The bounding sphere is set once per geometry, to hold the paper over
 *   its whole fold sequence.
 * - The meshes sit in five nested groups: `group`, outermost, which the
 *   drag spins; `leanGroup`, within it, which leans the whole design about
 *   the line of sight; `turnGroup`, within that, which turns the paper over
 *   about the design's own upright axis, leaned with it; `startGroup`,
 *   within that, which turns the sheet to its starting pose, its
 *   side about its upright axis and then its roll about the line of sight;
 *   and `stretchGroup`, innermost, whose scale stretches the flat sheet
 *   between two sheets' shapes. Each group's transform is then free for
 *   its own job, and the pose, outside the stretch, turns a part-stretched
 *   sheet without shearing it.
 * - The front's colour fades from the one showing to another through two
 *   scratch colours, mixed in Three.js's working colour space, and the
 *   back's lines follow it; the back's colour never changes.
 * - One grain texture is the `map` of both sides, multiplying each side's
 *   colour. Its repeat follows the sheet's size and stretch, centred on the
 *   sheet's centre, so the grain keeps its true size and holds still while
 *   the sheet changes shape. It lives as long as the page, so it is never
 *   disposed of.
 * - The lit lines, strips that createLitLine() sets out, one per segment
 *   in the ink of the printed line beneath, sit in `stretchGroup` beside
 *   the meshes, in the posed paper's frame. Two lines can be lit at once,
 *   the active line, which a pick holds, and the hover's; each grows from
 *   nothing as it is lit and shrinks back as it goes out. So three sets of
 *   strips take turns: one on the active line, one growing on the hovered
 *   line, and one shrinking on the line lit before.
 * @param frontColor The front's colour at creation, as a hex number in
 *   sRGB.
 * @param radiusMeters The largest distance from the origin that the paper
 *   reaches over every design's fold sequence, from maxPaperRadius(), in
 *   metres.
 * @param sheet The sheet that cutSheet() returns.
 * @returns The `group` to add to the scene; `leanRotation`,
 *   `leanGroup`'s `rotation`, for writeLean(); `startRotation`,
 *   `startGroup`'s `rotation`, for writeStartPose(); `stretchScale`, the
 *   inner group's `scale`, for writeStretchScale(); fitGrain(), which fits
 *   the grain to the sheet's size and stretch, to call after each
 *   writeStretchScale(); startFrontColorFade(), which sets the front's next
 *   colour, and setFrontColorFade(), which fades the front towards it;
 *   setLinesVisibility(), which fades both sides' fold lines;
 *   setSequencePosition(), which poses the paper along its sequence of
 *   steps and turns it over; setSheet(), which swaps in another sheet's
 *   geometry, and setPrintedLines(), which redraws the printed lines for
 *   it; lightLine(), which lights the hovered line, and clearLitLine(),
 *   which puts it out; lightActiveLine(), which lights the active line, and
 *   clearActiveLine(), which puts it out; stepLitLines(), which grows and
 *   shrinks the lit lines; and
 *   `stretchGroup`, the innermost group, whose frame is the posed paper's,
 *   for picking.
 */
export const createPaper = (frontColor, radiusMeters, sheet) => {
  let shown = createSheetGeometry(radiusMeters, sheet);
  const frontLinesCanvas = document.createElement("canvas");
  drawFoldLines(frontLinesCanvas, sheet, "front");
  const frontLinesMaterial = new MeshBasicMaterial({
    map: createLinesTexture(frontLinesCanvas, SRGBColorSpace),
    opacity: 0,
    side: FrontSide,
    transparent: true,
  });
  const frontLinesMesh = new Mesh(shown.geometry, frontLinesMaterial);
  frontLinesMesh.visible = false;

  // The mask's green channel scales the opacity, so its white lines show in
  // the material's colour, and its black ground not at all.
  const backLinesCanvas = document.createElement("canvas");
  drawFoldLines(backLinesCanvas, sheet, "back");
  const backLinesMaterial = new MeshLambertMaterial({
    alphaMap: createLinesTexture(backLinesCanvas, NoColorSpace),
    color: frontColor,
    flatShading: true,
    opacity: 0,
    side: BackSide,
    transparent: true,
  });
  const backLinesMesh = new Mesh(shown.geometry, backLinesMaterial);
  backLinesMesh.receiveShadow = true;
  backLinesMesh.visible = false;

  const grainTexture = createGrainTexture();
  const frontMaterial = createPaperMaterial(
    frontColor,
    grainTexture,
    FrontSide,
  );
  const backMaterial = createPaperMaterial(
    PAPER_BACK_COLOR,
    grainTexture,
    BackSide,
  );

  // Left at null, a FrontSide material casts with its back faces only, so
  // draw the whole sheet into the shadow map, both ways up, from the front.
  frontMaterial.shadowSide = DoubleSide;
  const frontMesh = new Mesh(shown.geometry, frontMaterial);
  frontMesh.castShadow = true;
  frontMesh.receiveShadow = true;
  const backMesh = new Mesh(shown.geometry, backMaterial);
  backMesh.receiveShadow = true;
  const meshes = [frontMesh, backMesh, frontLinesMesh, backLinesMesh];
  // The three sets of strips, and those lighting the active line and the
  // hovered line, or null; a set lighting neither shrinks away. One set
  // lights both when the hover is over the active line.
  const strips = [
    createLitLine(radiusMeters),
    createLitLine(radiusMeters),
    createLitLine(radiusMeters),
  ];
  let activeStrip = null;
  let hoverStrip = null;
  const stretchGroup = new Group();
  stretchGroup.add(...meshes, ...strips.map(({ mesh }) => mesh));

  // Order `ZYX` turns the sheet about its upright axis, `y`, to show its
  // side, then rolls it about the line of sight, `z`, as seen.
  const startGroup = new Group();
  startGroup.rotation.order = "ZYX";
  startGroup.add(stretchGroup);
  const turnGroup = new Group();
  turnGroup.add(startGroup);

  // Outside `turnGroup`, so a turn-over turns the paper about the design's
  // own upright axis, leaned, rather than the screen's.
  const leanGroup = new Group();
  leanGroup.add(turnGroup);
  const group = new Group();
  group.add(leanGroup);

  // The front colour fade's start and end, created once and reused. Both
  // start as the front's colour, so a fade before the first start changes
  // nothing.
  const fadeFromColor = new Color(frontColor);
  const fadeToColor = new Color(frontColor);

  /** #### Puts the active line out, shrinking it over the next frames
   * - Allocates nothing.
   */
  const clearActiveLine = () => {
    activeStrip = null;
    writeGrowing();
  };

  /** #### Puts the hovered line out, shrinking it over the next frames
   * - Allocates nothing, so it is safe on every pointer move.
   */
  const clearLitLine = () => {
    hoverStrip = null;
    writeGrowing();
  };

  /** #### Fits the grain's repeat to the sheet showing and its stretch
   * - Sets each axis's repeat to the sheet's stretched size in tiles, so a
   *   millimetre of grain is a millimetre of paper whatever the sheet's
   *   shape, and a sheet swapped in shows the same grain as the one before.
   * - The texture's matrix follows its `repeat` by itself, as the renderer
   *   refreshes it on every frame.
   * - Allocates nothing, so it is safe on the per-frame path.
   */
  const fitGrain = () => {
    grainTexture.repeat.set(
      grainRepeat(shown.sheet.widthMeters, stretchGroup.scale.x),
      grainRepeat(shown.sheet.heightMeters, stretchGroup.scale.y),
    );
  };

  /** #### Lights the active line as bold strips over its printed line
   * - As lightLine() lights the hovered line, on a set of strips of its
   *   own, so the active line stays lit while the hover moves on. A line
   *   that the hover or a shrinking set already lights keeps that set, and
   *   grows on from where it is.
   * - Allocates nothing.
   * @param backInk The ink over the back's printed lines, as a hex number
   *   in sRGB.
   * @param centre The stage's centre, `[x, y]` in metres in the folded
   *   plane, which the pose slides the paper by.
   * @param frontInk The ink over the front's printed lines, likewise.
   * @param line The line, with `from` and `to`, `[x, y]` in metres in the
   *   folded plane.
   * @param segments The line's segments, as litSegments() lists them for
   *   the side the camera is on.
   */
  const lightActiveLine = (backInk, centre, frontInk, line, segments) => {
    activeStrip = takeStrip(centre, hoverStrip, line, segments, strips);
    writeGrowing();
    writeLitColors(activeStrip, backInk, frontInk);
  };

  /** #### Lights the hovered line as bold strips over its printed line
   * - One strip per segment, each in the ink of the printed line it
   *   covers: `frontInk` where the paper shows its front, whose lines are
   *   black, or where a border between front and back runs along it; and
   *   `backInk` where it shows only its back, whose lines take the paper's
   *   colour. So the printed line seems to swell, segment by segment.
   * - The strips grow from nothing over the next frames, as
   *   stepLitLines() writes them, along the line's crossing extent, in the
   *   posed paper's frame. The line hovered before shrinks away on its own
   *   set of strips; the same segments lit again, perhaps in other inks,
   *   grow back from where they are, and the active line's set serves the
   *   hover too. Segments past `LIT_LINE_MAX_SEGMENTS` are left unlit.
   * - The paper must be at rest, folded flat, so the line lies in the
   *   plane the strips are drawn in.
   * - Allocates nothing, so it is safe on every pointer move.
   * @param backInk The ink over the back's printed lines, as a hex number
   *   in sRGB.
   * @param centre The stage's centre, `[x, y]` in metres in the folded
   *   plane, which the pose slides the paper by.
   * @param frontInk The ink over the front's printed lines, likewise.
   * @param line The line, with `from` and `to`, `[x, y]` in metres in the
   *   folded plane.
   * @param segments The line's segments, as litSegments() lists them for
   *   the side the camera is on.
   */
  const lightLine = (backInk, centre, frontInk, line, segments) => {
    hoverStrip = takeStrip(centre, activeStrip, line, segments, strips);
    writeGrowing();
    writeLitColors(hoverStrip, backInk, frontInk);
  };

  /** #### Grows the lit lines and shrinks the lines before, by a frame's time
   * - Writes a strip only while its width changes, so at rest it writes
   *   nothing.
   * - Allocates nothing, so it is safe on the per-frame path.
   * @param deltaSeconds The time since the last frame, in seconds.
   */
  const stepLitLines = (deltaSeconds) => {
    for (let i = 0; i < strips.length; i++) {
      stepLitStrip(deltaSeconds, strips[i]);
    }
  };

  /** #### Sets each set of strips growing if it lights a line, else shrinking
   * - Allocates nothing.
   */
  const writeGrowing = () => {
    for (let i = 0; i < strips.length; i++) {
      const strip = strips[i];
      strip.isGrowing = strip === activeStrip || strip === hoverStrip;
    }
  };

  /** #### Mixes the front's colour, eased, from the fade's start to its end
   * - Copies the colour to the back's lines, so they fade in step.
   * - Allocates nothing, so it is safe on the per-frame path.
   * @param progress From 0 (the start colour) to 1 (the end colour), linear
   *   in time.
   */
  const setFrontColorFade = (progress) => {
    frontMaterial.color.lerpColors(
      fadeFromColor,
      fadeToColor,
      smoothstep(progress),
    );
    backLinesMaterial.color.copy(frontMaterial.color);
  };

  /** #### Fades both sides' fold lines, eased, hiding them altogether at 0
   * - Allocates nothing, so it is safe on the per-frame path.
   * @param visibility From 0 (hidden) to 1 (shown), linear in time.
   */
  const setLinesVisibility = (visibility) => {
    const opacity = smoothstep(visibility);
    frontLinesMaterial.opacity = opacity;
    backLinesMaterial.opacity = opacity;
    frontLinesMesh.visible = opacity > 0;
    backLinesMesh.visible = opacity > 0;
  };

  /** #### Redraws the printed lines for another sheet's pattern of lines
   * - Redraws both sides' fold-line canvases for the sheet, gives each
   *   material a new texture of its canvas, the front's `map` and the
   *   back's `alphaMap`, and disposes of the old textures: a texture's
   *   storage is allocated on its first upload, so it cannot take a
   *   canvas of another size.
   * - Allocates, and uploads two textures, so call it only when the
   *   printed lines change, which a change of the sheet's `designId`
   *   brings: a sandbox fold keeps the pattern's lattice.
   * @param nextSheet The sheet that cutSheet() or cutSession() returns.
   */
  const setPrintedLines = (nextSheet) => {
    const oldFrontTexture = frontLinesMaterial.map;
    drawFoldLines(frontLinesCanvas, nextSheet, "front");
    frontLinesMaterial.map = createLinesTexture(
      frontLinesCanvas,
      SRGBColorSpace,
    );
    oldFrontTexture.dispose();

    const oldBackTexture = backLinesMaterial.alphaMap;
    drawFoldLines(backLinesCanvas, nextSheet, "back");
    backLinesMaterial.alphaMap = createLinesTexture(
      backLinesCanvas,
      NoColorSpace,
    );
    oldBackTexture.dispose();
  };

  /** #### Poses the paper at a point in its sequence of steps
   * - Writes the folds' pose into the geometry, and the turn-overs' turn
   *   into `turnGroup`'s rotation about its upright axis, which passes
   *   through the origin, where the folded shape stays centred.
   * - Allocates nothing, so it is safe on the per-frame path.
   * @param sequencePosition From 0 (flat) to the sheet's step count:
   *   whole steps done, plus the linear progress through the next.
   */
  const setSequencePosition = (sequencePosition) => {
    writePaperPositions(shown.positions, sequencePosition, shown.sheet);
    shown.positionAttribute.needsUpdate = true;
    turnGroup.rotation.y = viewTurnRadiansAt(sequencePosition, shown.sheet);
  };

  /** #### Swaps in another sheet, a design's or a pattern's, posed flat
   * - Gives every mesh the new geometry, then disposes of the old one,
   *   which frees its attributes on the GPU; the materials stay.
   * - Keeps the printed lines: call setPrintedLines() as well when the
   *   new sheet prints other lines. The new geometry carries the same
   *   sheet-coordinate UVs, so the lines may be showing.
   * - Refits the grain to the new sheet, at the stretch scale written so
   *   far; call fitGrain() again once the new stretch scale is written.
   * - Allocates, so call it only when the sheet changes, at rest.
   * @param nextSheet The sheet that cutSheet() or cutSession() returns.
   */
  const setSheet = (nextSheet) => {
    const oldGeometry = shown.geometry;
    shown = createSheetGeometry(radiusMeters, nextSheet);
    for (const mesh of meshes) mesh.geometry = shown.geometry;
    oldGeometry.dispose();
    fitGrain();
  };

  /** #### Starts the front's fade from the colour showing to another
   * - The colour showing may be part-way through a fade, so a change
   *   mid-fade heads for the new colour from wherever the last one reached.
   * - Changes no colour itself: setFrontColorFade() then runs the fade from
   *   0 to 1.
   * - Allocates nothing.
   * @param color The colour to fade to, as a hex number in sRGB.
   */
  const startFrontColorFade = (color) => {
    fadeFromColor.copy(frontMaterial.color);
    fadeToColor.setHex(color);
  };

  fitGrain();

  return {
    clearActiveLine,
    clearLitLine,
    fitGrain,
    group,
    leanRotation: leanGroup.rotation,
    lightActiveLine,
    lightLine,
    setFrontColorFade,
    setLinesVisibility,
    setPrintedLines,
    setSequencePosition,
    setSheet,
    startFrontColorFade,
    startRotation: startGroup.rotation,
    stepLitLines,
    stretchGroup,
    stretchScale: stretchGroup.scale,
  };
};

/** #### Creates the grain texture, a seamless tile repeated across the paper
 * - DataTexture defaults to nearest filtering with no mipmaps, which would
 *   shimmer as the paper turns, so it filters linearly between mipmaps.
 * - Its colour space stays NoColorSpace: the grain multiplies a colour,
 *   and is not one itself.
 * - Its `center` is the tile's centre, so the transform is
 *   `repeat × (uv − 0.5) + 0.5` and the sheet's centre shows the tile's.
 * @returns The texture, set to upload on its first use.
 */
const createGrainTexture = () => {
  const texture = new DataTexture(
    createGrainPixels(),
    GRAIN_TEXTURE_PX,
    GRAIN_TEXTURE_PX,
  );
  texture.center.set(0.5, 0.5);
  texture.generateMipmaps = true;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
};

/** #### Creates a texture of a canvas holding fold lines
 * - CanvasTexture's constructor takes no colour space, so it is set after.
 * @param canvas The canvas, already drawn.
 * @param colorSpace SRGBColorSpace for the front's `map`, a colour, or
 *   NoColorSpace for the back's `alphaMap`, a coverage mask read linearly.
 * @returns The texture.
 */
const createLinesTexture = (canvas, colorSpace) => {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = colorSpace;

  return texture;
};

/** #### Creates a lit line, flat strips that light one line's segments
 * - Two triangles over four corners per segment, up to
 *   `LIT_LINE_MAX_SEGMENTS`, which writeStripPositions() rewrites in place
 *   as the strips grow or shrink, and a colour per corner, its segment's
 *   ink, so it allocates nothing. Its draw range covers the segments lit.
 * - Its bounding sphere, at the origin, holds the whole paper, so it is
 *   set once: frustum culling computes a sphere only while it is null,
 *   and would otherwise keep the first strip's.
 * - Unlit and graphic, as the Fold Buttons are, and double-sided, so it
 *   shows from the back. Transparent, it joins the transparent list,
 *   where `LIT_LINE_RENDER_ORDER` draws it after the fold-line meshes;
 *   with no depth test or write, it draws over every layer and hides
 *   nothing drawn after it. It neither casts nor receives a shadow.
 * - It draws only where the stencil buffer holds `PAPER_STENCIL_REF`,
 *   which the paper writes wherever it draws, so a capped end, or a
 *   band's corner where the paper's outline crosses it, is clipped to the
 *   paper on screen, as a thicker printed line would be.
 * - Starts hidden, on no line. Its geometry and material live as long as
 *   the page, so they are never disposed of.
 * @param radiusMeters The bounding sphere's radius, in metres.
 * @returns The strips' state, which stepLitStrip() steps: their `centre`,
 *   `line` and `segments`, null until a line is lit; `isGrowing`, true
 *   while they grow towards or rest at full width; `progress`, from 0 (no
 *   width) to 1 (full width), linear in time; their `mesh`; and the mesh's
 *   `colorAttribute` and `positionAttribute`, and the `colors` and
 *   `positions` arrays behind them.
 */
const createLitLine = (radiusMeters) => {
  const cornerCount = LIT_LINE_CORNERS * LIT_LINE_MAX_SEGMENTS;
  const colors = new Float32Array(3 * cornerCount);
  const colorAttribute = new BufferAttribute(colors, 3);
  const positions = new Float32Array(3 * cornerCount);
  const positionAttribute = new BufferAttribute(positions, 3).setUsage(
    DynamicDrawUsage,
  );

  // Two triangles per segment, each corner pair straddling one end of it.
  const indices = [];
  for (let first = 0; first < cornerCount; first += LIT_LINE_CORNERS) {
    indices.push(first, first + 1, first + 2, first + 2, first + 1, first + 3);
  }
  const geometry = new BufferGeometry()
    .setAttribute("color", colorAttribute)
    .setAttribute("position", positionAttribute)
    .setIndex(indices);
  geometry.boundingSphere = new Sphere(new Vector3(), radiusMeters);
  const material = new MeshBasicMaterial({
    depthTest: false,
    depthWrite: false,
    side: DoubleSide,
    stencilFunc: EqualStencilFunc,
    stencilRef: PAPER_STENCIL_REF,
    stencilWrite: true,
    transparent: true,
    vertexColors: true,
  });
  const mesh = new Mesh(geometry, material);
  mesh.renderOrder = LIT_LINE_RENDER_ORDER;
  mesh.visible = false;

  return {
    centre: null,
    colorAttribute,
    colors,
    isGrowing: false,
    line: null,
    mesh,
    positionAttribute,
    positions,
    progress: 0,
    segments: null,
  };
};

/** #### Creates a matte, flat-shaded material for one side of the paper
 * - Flat shading derives each normal from screen-space derivatives, so it
 *   faces the camera whichever side is showing.
 * - Writes `PAPER_STENCIL_REF` into the stencil buffer wherever it draws,
 *   so the lit line, which draws only there, keeps within the paper's
 *   outline on screen.
 * @param color The side's colour, as a hex number.
 * @param map The grain texture, which multiplies the colour.
 * @param side FrontSide or BackSide.
 * @returns The material.
 */
const createPaperMaterial = (color, map, side) =>
  new MeshLambertMaterial({
    color,
    flatShading: true,
    map,
    side,
    stencilRef: PAPER_STENCIL_REF,
    stencilWrite: true,
    stencilZPass: ReplaceStencilOp,
  });

/** #### Creates the geometry of a cut sheet, posed flat
 * - Its bounding sphere, at the origin, holds every design's fold sequence,
 *   so it is never recomputed.
 * - Its `uv` attribute holds each vertex's sheet coordinates scaled to 0
 *   to 1, `u = x / width + 0.5` and `v = y / height + 0.5`, so a bridging
 *   strip, which reuses its faces' vertices, carries its crease's UVs.
 * @param radiusMeters The bounding sphere's radius, in metres.
 * @param sheet The sheet that cutSheet() returns.
 * @returns The `geometry`, its `positionAttribute` and the `positions`
 *   array behind it, and the `sheet` it was made from.
 */
const createSheetGeometry = (radiusMeters, sheet) => {
  const vertexCount = sheet.faces.reduce(
    (count, { polygon }) => count + polygon.length,
    0,
  );
  const positions = new Float32Array(3 * vertexCount);
  writePaperPositions(positions, 0, sheet);
  const positionAttribute = new BufferAttribute(positions, 3).setUsage(
    DynamicDrawUsage,
  );

  // Lambert's vertex shader reads `normal`, though flat shading ignores it.
  const normals = new Float32Array(3 * vertexCount);
  for (let i = 0; i < vertexCount; i++) normals[3 * i + 2] = 1;

  const uvs = new Float32Array(2 * vertexCount);
  let vertex = 0;
  for (const { polygon } of sheet.faces) {
    for (const [x, y] of polygon) {
      uvs[2 * vertex] = x / sheet.widthMeters + 0.5;
      uvs[2 * vertex + 1] = y / sheet.heightMeters + 0.5;
      vertex++;
    }
  }

  const geometry = new BufferGeometry()
    .setAttribute("position", positionAttribute)
    .setAttribute("normal", new BufferAttribute(normals, 3))
    .setAttribute("uv", new BufferAttribute(uvs, 2))
    .setIndex(createTriangleIndices(sheet));
  geometry.boundingSphere = new Sphere(new Vector3(), radiusMeters);

  return { geometry, positionAttribute, positions, sheet };
};

/** #### Lists the vertex indices of every triangle of the paper
 * - Every triangle runs anticlockwise seen from the front of the paper, so
 *   the front material draws the front.
 * @param sheet The sheet that cutSheet() returns.
 * @returns Three indices per triangle.
 */
const createTriangleIndices = (sheet) => {
  const indices = [];
  let firstVertex = 0;
  for (const { polygon } of sheet.faces) {
    for (let i = 1; i < polygon.length - 1; i++) {
      indices.push(firstVertex, firstVertex + i, firstVertex + i + 1);
    }
    firstVertex += polygon.length;
  }

  // A strip lies between its two edges, so it runs from one face's edge,
  // backwards, to the other's.
  for (const [a0, a1, b0, b1] of sheet.bridges) {
    indices.push(a1, a0, b0, a1, b0, b1);
  }

  return indices;
};

/** #### Grows or shrinks one lit-line strip by a frame's time
 * - Grows towards full width while `isGrowing`, and shrinks to nothing
 *   otherwise, over `LIT_LINE_GROW_SECONDS`, eased; hidden at no width.
 * - Writes nothing once the strip reaches the width it is heading for.
 * - Allocates nothing, so it is safe on the per-frame path.
 * @param deltaSeconds The time since the last frame, in seconds.
 * @param strip The strip's state, as createLitLine() returns it.
 */
const stepLitStrip = (deltaSeconds, strip) => {
  const step = deltaSeconds / LIT_LINE_GROW_SECONDS;
  if (strip.isGrowing) {
    if (strip.progress === 1) return;
    strip.progress = Math.min(strip.progress + step, 1);
  } else {
    if (strip.progress === 0) return;
    strip.progress = Math.max(strip.progress - step, 0);
  }

  strip.mesh.visible = strip.progress > 0;
  if (!strip.mesh.visible) return;

  const widthMeters = smoothstep(strip.progress) * LIT_LINE_WIDTH_METERS;
  const { line, segments } = strip;

  // A capped end runs on by half the width, a square cap, as a fraction of
  // the line: enough to reach the paper's outline wherever it meets the
  // line at 45° or more, as every lattice line and paper edge does, and
  // the stencil clips whatever runs past it.
  const capFraction =
    widthMeters /
    2 /
    Math.hypot(line.to[0] - line.from[0], line.to[1] - line.from[1]);
  const count = Math.min(segments.length, LIT_LINE_MAX_SEGMENTS);
  for (let i = 0; i < count; i++) {
    const { capsFrom, capsTo, fromFraction, toFraction } = segments[i];
    writeStripPositions(
      strip.centre,
      line,
      strip.positions,
      widthMeters,
      LIT_LINE_CORNERS * i,
      capsFrom ? fromFraction - capFraction : fromFraction,
      capsTo ? toFraction + capFraction : toFraction,
    );
  }
  strip.positionAttribute.needsUpdate = true;
};

/** #### Returns the set of strips to light a line with, set up for it
 * - A set already on the line's segments, growing or shrinking, keeps
 *   them, so the line grows on from where it is; it may be the other
 *   role's set, which then lights the line for both.
 * - Otherwise the set with the least width, other than the other role's,
 *   is set up afresh on the line, from no width: a set already gone, if
 *   there is one, or else the one shrinking furthest, cut short.
 * - Allocates nothing.
 * @param centre The stage's centre, `[x, y]` in metres in the folded
 *   plane.
 * @param keep The set lighting the other role's line, or null; never
 *   set up afresh.
 * @param line The line, with `from` and `to`, `[x, y]` in metres in the
 *   folded plane.
 * @param segments The line's segments, as litSegments() lists them.
 * @param strips The three sets, as createLitLine() returns each.
 * @returns The set.
 */
const takeStrip = (centre, keep, line, segments, strips) => {
  let taken = null;
  for (let i = 0; i < strips.length; i++) {
    const strip = strips[i];
    if (strip.segments === segments) return strip;
    if (strip !== keep && (taken === null || strip.progress < taken.progress)) {
      taken = strip;
    }
  }

  taken.centre = centre;
  taken.line = line;
  taken.progress = 0;
  taken.segments = segments;
  taken.mesh.geometry.setDrawRange(
    0,
    LIT_LINE_INDICES_PER_SEGMENT *
      Math.min(segments.length, LIT_LINE_MAX_SEGMENTS),
  );

  return taken;
};

/** #### Writes each lit segment's ink into its strip's corners
 * - `frontInk` for a segment that takes the front's ink, as litSegments()
 *   marks it, `backInk` for one that takes the back's, converted to the
 *   working colour space, which vertex colours are read in, through the
 *   scratch `inkColor`.
 * - Allocates nothing, so it is safe on every pointer move.
 * @param strip The strips' state, as createLitLine() returns it, with its
 *   `segments`.
 * @param backInk The ink over the back's printed lines, as a hex number
 *   in sRGB.
 * @param frontInk The ink over the front's printed lines, likewise.
 */
const writeLitColors = (strip, backInk, frontInk) => {
  const { colors, segments } = strip;
  const count = Math.min(segments.length, LIT_LINE_MAX_SEGMENTS);
  for (let i = 0; i < count; i++) {
    inkColor.setHex(segments[i].takesFrontInk ? frontInk : backInk);
    for (let corner = 0; corner < LIT_LINE_CORNERS; corner++) {
      const at = 3 * (LIT_LINE_CORNERS * i + corner);
      colors[at] = inkColor.r;
      colors[at + 1] = inkColor.g;
      colors[at + 2] = inkColor.b;
    }
  }
  strip.colorAttribute.needsUpdate = true;
};
