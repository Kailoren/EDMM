export const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Elite Dangerous Mining Mapper</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; background: #0a0a0a; color: #eae4da; display: flex; height: 100vh; }
  #sites { width: 320px; overflow-y: auto; border-right: 1px solid #3a2410; padding: 8px; }
  #sites h1 { font-size: 15px; margin: 4px 8px 12px; color: #FF7500; }
  #mineralFilter { margin: 0 8px 12px; }
  #mineralFilter select { width: 100%; background: #120e08; border: 1px solid #5a3a15; color: #eae4da; border-radius: 6px; padding: 6px; font-size: 12px; }
  .system-header { padding: 8px 10px; cursor: pointer; font-weight: 600; font-size: 13px; border-radius: 6px; display: flex; justify-content: space-between; }
  .system-header:hover { background: #2a1a0a; }
  .system-header .arrow { color: #9c7a55; transition: transform 0.1s; }
  .system-group.collapsed .arrow { transform: rotate(-90deg); }
  .system-group.collapsed .body-group { display: none; }
  .body-group { margin-left: 10px; }
  .body-header { padding: 6px 10px; font-size: 12px; color: #FF7500; }
  .site { padding: 6px 10px 6px 20px; border-radius: 6px; cursor: pointer; margin-bottom: 2px; }
  .site:hover { background: #2a1a0a; }
  .site.active { background: #7a3d00; }
  .site .sub { font-size: 12px; color: #d9b48f; }
  .site .count { float: right; color: #6ee7a0; font-size: 12px; }
  #viewer { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; position: relative; overflow: auto; }
  #viewCanvas { max-width: 100%; max-height: 62vh; border-radius: 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.5); cursor: crosshair; touch-action: none; }
  #viewer .empty { color: #9c7a55; font-size: 14px; }
  .import-box { background: #140f08; border: 1px solid #3a2410; border-radius: 8px; padding: 20px; max-width: 460px; margin: 0 auto 16px; text-align: left; }
  .import-box h2 { font-size: 15px; margin: 0 0 8px; color: #FF7500; }
  .import-box p { font-size: 12px; color: #b89470; margin: 0 0 12px; }
  .import-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
  .import-box input[type="file"] { color: #eae4da; font-size: 12px; }
  .import-box textarea { width: 100%; min-height: 70px; background: #120e08; border: 1px solid #5a3a15; color: #eae4da; border-radius: 6px; padding: 8px; font-family: monospace; font-size: 11px; resize: vertical; box-sizing: border-box; }
  .import-box button { background: #7a3d00; color: #eae4da; border: none; padding: 7px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }
  .import-box button:hover { background: #a35400; }
  #importStatus { font-size: 12px; margin-top: 4px; min-height: 16px; }
  #importStatus.error { color: #f87171; }
  #importStatus.ok { color: #6ee7a0; }
  .placeholder-hint { color: #9c7a55; font-size: 13px; text-align: center; }
  #toolbar { margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px; background: #140f08; padding: 8px 12px; border-radius: 8px; max-width: 90vw; }
  .toolbar-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }
  #toolbar label { font-size: 12px; color: #b89470; display: flex; align-items: center; gap: 4px; }
  #toolbar select, #toolbar input[type="color"] { background: #120e08; border: 1px solid #5a3a15; color: #eae4da; border-radius: 4px; padding: 3px; }
  .tool-btn, #toolbar button { background: #7a3d00; color: #eae4da; border: 2px solid transparent; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; }
  #toolbar button.tool-btn.active { background: #FF7500; border-color: #ffb066; font-weight: 600; }
  #controls { margin-top: 14px; display: flex; align-items: center; gap: 16px; }
  #controls button { background: #7a3d00; color: #eae4da; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; }
  #controls button:disabled { opacity: 0.35; cursor: default; }
  #meta { font-size: 12px; color: #b89470; text-align: center; margin-top: 6px; }
  #notesWrap { width: 100%; max-width: 700px; margin-top: 12px; display: flex; flex-direction: column; gap: 4px; }
  #notes { width: 100%; min-height: 70px; background: #120e08; border: 1px solid #5a3a15; color: #eae4da; border-radius: 6px; padding: 8px; font-family: inherit; font-size: 13px; resize: vertical; box-sizing: border-box; }
  #notesStatus { font-size: 11px; color: #6ee7a0; text-align: right; min-height: 14px; }
  #publishWrap { width: 100%; max-width: 700px; margin-top: 16px; padding-top: 12px; border-top: 1px solid #3a2410; display: flex; flex-direction: column; gap: 6px; }
  .publish-row { display: flex; align-items: center; justify-content: center; gap: 10px; }
  #publishWrap button { background: #7a3d00; color: #eae4da; border: none; padding: 7px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }
  #publishStatus { font-size: 12px; color: #6ee7a0; }
  #title { position: absolute; top: 16px; left: 20px; font-size: 13px; color: #FF7500; }
  #saveStatus { font-size: 12px; color: #6ee7a0; min-width: 60px; }
  .text-input-overlay { position: fixed; z-index: 1000; padding: 4px; border: 2px dashed #FF7500; background: transparent; resize: none; box-sizing: border-box; }
  .confirm-bar { position: fixed; z-index: 1001; display: flex; gap: 6px; }
  .confirm-bar button { border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }
  .confirm-bar .confirm-btn { background: #2f7d3c; color: #fff; }
  .confirm-bar .cancel-btn { background: #7d2f2f; color: #fff; }
  #viewCanvas.tool-move { cursor: grab; }
  #viewCanvas.tool-move.dragging { cursor: grabbing; }
  #viewCanvas.tool-text { cursor: text; }
  #viewCanvas.tool-erase { cursor: cell; }
  .resize-handle { position: fixed; z-index: 1002; width: 12px; height: 12px; background: #FF7500; border: 2px solid #fff; border-radius: 2px; box-sizing: border-box; }
  .resize-nw, .resize-se { cursor: nwse-resize; }
  .resize-ne, .resize-sw { cursor: nesw-resize; }
</style>
</head>
<body>
  <div id="sites">
    <h1>Recorded Hotspots</h1>
    <div id="mineralFilter">
      <select id="mineralFilterSelect">
        <option value="">All minerals</option>
      </select>
    </div>
  </div>
  <div id="viewer">
    <div id="title"></div>
    <div class="empty" id="placeholder">
      <div class="import-box">
        <h2>Import a Shared Book</h2>
        <p>Upload a .zip someone sent you to add it to your library.</p>
        <div class="import-row">
          <input type="file" id="importZipFile" accept=".zip" />
          <button id="importZipBtn">Import File</button>
        </div>
        <div id="importStatus"></div>
      </div>
      <div class="placeholder-hint">Or pick a hotspot on the left to page through its screenshots.</div>
    </div>
    <div id="toolbar" style="display:none">
      <div class="toolbar-row">
        <button id="toolPen" class="tool-btn active" title="Freehand drawing">Pen</button>
        <button id="toolText" class="tool-btn" title="Drag to draw a text box, then type">Text</button>
        <button id="toolMove" class="tool-btn" title="Drag to reposition; double-click to edit text and resize">Move</button>
        <button id="toolErase" class="tool-btn" title="Click a pen stroke or text box to delete it entirely">Erase</button>
        <label>Color <input id="color" type="color" value="#ff3b30" /></label>
        <label>Font
          <select id="fontFamily">
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
            <option value="Impact">Impact</option>
          </select>
        </label>
        <label>Size
          <select id="fontSize">
            <option value="16">16</option>
            <option value="24" selected>24</option>
            <option value="32">32</option>
            <option value="48">48</option>
          </select>
        </label>
        <label><input id="bold" type="checkbox" /> Bold</label>
        <label><input id="outline" type="checkbox" checked /> Outline</label>
      </div>
      <div class="toolbar-row">
        <label><input id="backdrop" type="checkbox" /> Backdrop</label>
        <label>Backdrop color <input id="backdropColor" type="color" value="#000000" /></label>
        <label>Opacity <input id="backdropOpacity" type="range" min="0" max="100" value="60" style="width:70px" /></label>
        <button id="undoAnnotation" title="Undo the last pen stroke, text box, or move">Undo</button>
        <button id="redoAnnotation" title="Redo the last undone action">Redo</button>
        <button id="clearAnnotations">Clear</button>
        <button id="saveAnnotation">Save</button>
        <span id="saveStatus"></span>
      </div>
    </div>
    <canvas id="viewCanvas" style="display:none"></canvas>
    <div id="controls" style="display:none">
      <button id="prev">&larr; Prev</button>
      <span id="position"></span>
      <button id="next">Next &rarr;</button>
    </div>
    <div id="notesWrap" style="display:none">
      <textarea id="notes" placeholder="Notes for this screenshot..."></textarea>
      <span id="notesStatus"></span>
    </div>
    <div id="publishWrap" style="display:none">
      <div class="publish-row">
        <button id="downloadBook" title="Download this hotspot's finished book as a .zip, with a bundled offline viewer">Download Book (.zip)</button>
        <span id="publishStatus"></span>
      </div>
    </div>
    <div id="meta"></div>
  </div>
<script>
let sites = [];
let currentBook = null;
let currentIndex = 0;
let currentTool = "pen";
let ctx = null;
let originalCanvas = document.createElement("canvas");
let originalCtx = null;
let drawing = false;
// Pen strokes are kept as vector objects (like text boxes), not baked into pixels,
// so the eraser can remove one specific stroke - clicking a stroke deletes the whole
// line rather than rubbing out pixels along the cursor's path.
let strokes = [];
let currentStroke = null;
let textDragStart = null;
let textBoxes = [];
let draftBox = null;
let moveState = null;
let undoStack = [];
let redoStack = [];
const MAX_UNDO = 20;
let notesDirty = false;

async function loadSites() {
  const res = await fetch("/api/tree");
  sites = await res.json();
  populateMineralFilter();
  renderSites();
}

function populateMineralFilter() {
  const select = document.getElementById("mineralFilterSelect");
  const previous = select.value;
  const minerals = [...new Set(sites.map((s) => s.mineral).filter(Boolean))].sort();
  select.innerHTML = '<option value="">All minerals</option>' +
    minerals.map((m) => '<option value="' + escapeHtml(m) + '">' + escapeHtml(m) + '</option>').join("");
  if (minerals.includes(previous)) select.value = previous;
}

function renderSites() {
  const filterMineral = document.getElementById("mineralFilterSelect").value;
  const filteredSites = filterMineral ? sites.filter((s) => s.mineral === filterMineral) : sites;

  const container = document.getElementById("sites");
  container.querySelectorAll(".system-group").forEach((el) => el.remove());

  const bySystem = new Map();
  for (const site of filteredSites) {
    if (!bySystem.has(site.starSystem)) bySystem.set(site.starSystem, new Map());
    const byBody = bySystem.get(site.starSystem);
    if (!byBody.has(site.body)) byBody.set(site.body, []);
    byBody.get(site.body).push(site);
  }

  for (const [starSystem, byBody] of bySystem) {
    const group = document.createElement("div");
    group.className = "system-group";

    const header = document.createElement("div");
    header.className = "system-header";
    const totalShots = [...byBody.values()].flat().reduce((sum, s) => sum + s.shotCount, 0);
    header.innerHTML = '<span>' + escapeHtml(starSystem) + '</span><span class="arrow">&#9662; ' + totalShots + '</span>';
    header.addEventListener("click", () => group.classList.toggle("collapsed"));
    group.appendChild(header);

    const bodyGroup = document.createElement("div");
    bodyGroup.className = "body-group";
    for (const [body, ringSites] of byBody) {
      const bodyHeader = document.createElement("div");
      bodyHeader.className = "body-header";
      bodyHeader.textContent = body;
      bodyGroup.appendChild(bodyHeader);

      for (const site of ringSites) {
        const el = document.createElement("div");
        el.className = "site";
        const label = site.mineral ? site.ring + " · " + site.mineral : site.ring;
        el.innerHTML = '<span class="count">' + site.shotCount + '</span>' +
          '<div class="sub">' + escapeHtml(label) + '</div>';
        el.addEventListener("click", () => selectSite(site, el));
        bodyGroup.appendChild(el);
      }
    }
    group.appendChild(bodyGroup);
    container.appendChild(group);
  }
}

async function selectSite(site, el) {
  saveNoteIfDirty();
  document.querySelectorAll(".site").forEach((n) => n.classList.remove("active"));
  el.classList.add("active");
  const res = await fetch("/api/book?path=" + encodeURIComponent(site.path));
  currentBook = await res.json();
  currentBook.path = site.path;
  currentIndex = 0;
  document.getElementById("title").textContent = site.starSystem + " / " + site.body + " / " + site.ring;
  document.getElementById("publishStatus").textContent = "";
  render();
}

function annotatedName(file) {
  return file.replace(/\\.png$/, "-annotated.png");
}

function saveNoteIfDirty() {
  if (!notesDirty || !currentBook) return;
  const shot = currentBook.shots[currentIndex];
  const note = document.getElementById("notes").value;
  shot.note = note;
  notesDirty = false;
  const status = document.getElementById("notesStatus");
  status.textContent = "Saving...";
  fetch("/api/note", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: currentBook.path, file: shot.file, note })
  }).then((res) => {
    status.textContent = res.ok ? "Saved" : "Save failed";
  }).catch(() => {
    status.textContent = "Save failed";
  });
}

function render() {
  const placeholder = document.getElementById("placeholder");
  const canvas = document.getElementById("viewCanvas");
  const toolbar = document.getElementById("toolbar");
  const controls = document.getElementById("controls");
  const notesWrap = document.getElementById("notesWrap");
  const publishWrap = document.getElementById("publishWrap");
  const meta = document.getElementById("meta");
  const position = document.getElementById("position");
  document.getElementById("saveStatus").textContent = "";
  document.getElementById("notesStatus").textContent = "";

  if (!currentBook || !currentBook.shots || currentBook.shots.length === 0) {
    placeholder.style.display = "block";
    canvas.style.display = "none";
    toolbar.style.display = "none";
    controls.style.display = "none";
    notesWrap.style.display = "none";
    publishWrap.style.display = "none";
    meta.textContent = "";
    return;
  }

  placeholder.style.display = "none";
  canvas.style.display = "block";
  toolbar.style.display = "flex";
  controls.style.display = "flex";
  notesWrap.style.display = "flex";
  publishWrap.style.display = "flex";

  const shot = currentBook.shots[currentIndex];
  undoStack = [];
  redoStack = [];
  loadImageOnto(shot.hasAnnotation ? annotatedName(shot.file) : shot.file);

  position.textContent = (currentIndex + 1) + " / " + currentBook.shots.length;
  meta.textContent = new Date(shot.capturedAt).toLocaleString() + (shot.hasAnnotation ? " (annotated)" : "");
  document.getElementById("prev").disabled = currentIndex === 0;
  document.getElementById("next").disabled = currentIndex === currentBook.shots.length - 1;

  document.getElementById("notes").value = shot.note || "";
  notesDirty = false;
}

function loadImageOnto(filename) {
  const img = new Image();
  img.onload = () => {
    viewCanvas.width = img.naturalWidth;
    viewCanvas.height = img.naturalHeight;
    originalCanvas.width = img.naturalWidth;
    originalCanvas.height = img.naturalHeight;
    originalCtx = originalCanvas.getContext("2d");
    originalCtx.drawImage(img, 0, 0);
    ctx = viewCanvas.getContext("2d");
    strokes = [];
    currentStroke = null;
    textBoxes = [];
    draftBox = null;
    redrawAll();
  };
  img.src = "/shots?path=" + encodeURIComponent(currentBook.path + "/" + filename) + "&t=" + Date.now();
}

function drawStroke(stroke) {
  if (stroke.points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function redrawAll() {
  if (!ctx || !originalCtx) return;
  ctx.clearRect(0, 0, viewCanvas.width, viewCanvas.height);
  ctx.drawImage(originalCanvas, 0, 0);
  strokes.forEach((stroke) => drawStroke(stroke));
  if (currentStroke) drawStroke(currentStroke);
  textBoxes.forEach((box, i) => {
    if (draftBox && draftBox.editingIndex === i) return;
    drawTextBox(box.text, box, box.options);
  });
  if (draftBox) {
    // The text itself is rendered by the (transparently-styled) textarea overlay
    // sitting on top, not here - drawing it on the canvas too would double it up
    // visibly underneath whatever the user is currently typing. Only the backdrop
    // fill (if enabled) is genuinely canvas-only, so that's previewed live here.
    drawBackdrop(draftBox, draftBox.options);
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "#FF7500";
    ctx.lineWidth = 1;
    ctx.strokeRect(draftBox.left, draftBox.top, draftBox.width, draftBox.height);
    ctx.restore();
  }
}

function canvasCoords(e) {
  const canvas = document.getElementById("viewCanvas");
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
}

function setTool(tool) {
  currentTool = tool;
  document.getElementById("toolPen").classList.toggle("active", tool === "pen");
  document.getElementById("toolText").classList.toggle("active", tool === "text");
  document.getElementById("toolMove").classList.toggle("active", tool === "move");
  document.getElementById("toolErase").classList.toggle("active", tool === "erase");
  viewCanvas.classList.toggle("tool-move", tool === "move");
  viewCanvas.classList.toggle("tool-text", tool === "text");
  viewCanvas.classList.toggle("tool-erase", tool === "erase");
}

function getCanvasScale() {
  const rect = viewCanvas.getBoundingClientRect();
  return { x: rect.width / viewCanvas.width, y: rect.height / viewCanvas.height };
}

function canvasToScreenRect(box) {
  const rect = viewCanvas.getBoundingClientRect();
  const scale = getCanvasScale();
  return {
    left: rect.left + box.left * scale.x,
    top: rect.top + box.top * scale.y,
    width: box.width * scale.x,
    height: box.height * scale.y
  };
}

function hitTestTextBoxes(x, y) {
  for (let i = textBoxes.length - 1; i >= 0; i--) {
    const b = textBoxes[i];
    if (x >= b.left && x <= b.left + b.width && y >= b.top && y <= b.top + b.height) return i;
  }
  return -1;
}

function distanceToSegment(px, py, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(px - a.x, py - a.y);
  let t = ((px - a.x) * dx + (py - a.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

function hitTestStroke(x, y) {
  for (let i = strokes.length - 1; i >= 0; i--) {
    const stroke = strokes[i];
    const tolerance = stroke.lineWidth / 2 + 8;
    for (let j = 0; j < stroke.points.length - 1; j++) {
      if (distanceToSegment(x, y, stroke.points[j], stroke.points[j + 1]) <= tolerance) {
        return i;
      }
    }
  }
  return -1;
}

function currentSnapshot() {
  return {
    strokes: JSON.parse(JSON.stringify(strokes)),
    textBoxes: JSON.parse(JSON.stringify(textBoxes))
  };
}

function pushUndoSnapshot() {
  undoStack.push(currentSnapshot());
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack = [];
}

function undo() {
  const snapshot = undoStack.pop();
  if (!snapshot) return;
  redoStack.push(currentSnapshot());
  strokes = snapshot.strokes;
  textBoxes = snapshot.textBoxes;
  redrawAll();
}

function redo() {
  const snapshot = redoStack.pop();
  if (!snapshot) return;
  undoStack.push(currentSnapshot());
  strokes = snapshot.strokes;
  textBoxes = snapshot.textBoxes;
  redrawAll();
}

function applyTextareaFont(textarea, opts) {
  // The canvas is frequently displayed smaller than its actual pixel resolution
  // (it's scaled to fit the viewport), so the on-screen font size has to be scaled
  // by the same ratio, or text in the editor renders at the wrong size relative to
  // what the same font-size value produces once drawn onto the canvas's real pixels.
  const scale = getCanvasScale();
  textarea.style.fontFamily = opts.fontFamily;
  textarea.style.fontSize = Math.round(opts.fontSize * scale.y) + "px";
  textarea.style.fontWeight = opts.bold ? "bold" : "normal";
  textarea.style.color = opts.color;
  textarea.style.lineHeight = Math.round(opts.fontSize * 1.25 * scale.y) + "px";
}

function applyOptionsToToolbar(opts) {
  document.getElementById("color").value = opts.color;
  document.getElementById("fontFamily").value = opts.fontFamily;
  document.getElementById("fontSize").value = String(opts.fontSize);
  document.getElementById("bold").checked = opts.bold;
  document.getElementById("outline").checked = opts.outline;
  document.getElementById("backdrop").checked = opts.backdrop;
  document.getElementById("backdropColor").value = opts.backdropColor;
  document.getElementById("backdropOpacity").value = String(Math.round(opts.backdropOpacity * 100));
}

function wrapText(measureCtx, text, maxWidth) {
  const words = text.split(/\\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (line && measureCtx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawBackdrop(box, opts) {
  if (!opts.backdrop) return;
  ctx.save();
  ctx.globalAlpha = opts.backdropOpacity;
  ctx.fillStyle = opts.backdropColor;
  ctx.fillRect(box.left, box.top, box.width, box.height);
  ctx.restore();
}

function drawTextLines(text, box, opts) {
  ctx.font = (opts.bold ? "bold " : "") + opts.fontSize + "px " + opts.fontFamily;
  ctx.textBaseline = "top";
  const lineHeight = Math.round(opts.fontSize * 1.25);
  let y = box.top + 4;
  for (const paragraph of text.split("\\n")) {
    const lines = wrapText(ctx, paragraph, box.width - 8);
    for (const line of lines) {
      if (opts.outline) {
        ctx.lineWidth = Math.max(2, Math.floor(opts.fontSize / 8));
        ctx.strokeStyle = "#000000";
        ctx.strokeText(line, box.left + 4, y);
      }
      ctx.fillStyle = opts.color;
      ctx.fillText(line, box.left + 4, y);
      y += lineHeight;
    }
  }
}

function drawTextBox(text, box, opts) {
  drawBackdrop(box, opts);
  drawTextLines(text, box, opts);
}

function currentTextOptions() {
  return {
    color: document.getElementById("color").value,
    bold: document.getElementById("bold").checked,
    outline: document.getElementById("outline").checked,
    fontFamily: document.getElementById("fontFamily").value,
    fontSize: parseInt(document.getElementById("fontSize").value, 10),
    backdrop: document.getElementById("backdrop").checked,
    backdropColor: document.getElementById("backdropColor").value,
    backdropOpacity: parseInt(document.getElementById("backdropOpacity").value, 10) / 100
  };
}

const LIVE_PREVIEW_IDS = ["color", "fontFamily", "fontSize", "bold", "outline", "backdrop", "backdropColor", "backdropOpacity"];

function openTextBoxEditor(box, editingIndex) {
  draftBox = {
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
    text: box.text || "",
    options: { ...box.options },
    editingIndex: editingIndex == null ? null : editingIndex
  };
  redrawAll();

  const textarea = document.createElement("textarea");
  textarea.className = "text-input-overlay";
  textarea.value = draftBox.text;
  document.body.appendChild(textarea);

  const confirmBar = document.createElement("div");
  confirmBar.className = "confirm-bar";
  confirmBar.innerHTML = '<button type="button" class="confirm-btn">Confirm</button><button type="button" class="cancel-btn">Cancel</button>';
  document.body.appendChild(confirmBar);

  const handles = {};
  ["nw", "ne", "sw", "se"].forEach((corner) => {
    const handle = document.createElement("div");
    handle.className = "resize-handle resize-" + corner;
    document.body.appendChild(handle);
    handles[corner] = handle;
  });

  function positionOverlays() {
    const rect = canvasToScreenRect(draftBox);
    textarea.style.left = rect.left + "px";
    textarea.style.top = rect.top + "px";
    textarea.style.width = rect.width + "px";
    textarea.style.height = rect.height + "px";
    confirmBar.style.left = rect.left + "px";
    confirmBar.style.top = (rect.top + rect.height + 6) + "px";
    const corners = {
      nw: [rect.left, rect.top],
      ne: [rect.left + rect.width, rect.top],
      sw: [rect.left, rect.top + rect.height],
      se: [rect.left + rect.width, rect.top + rect.height]
    };
    for (const corner of Object.keys(handles)) {
      const [hx, hy] = corners[corner];
      handles[corner].style.left = (hx - 6) + "px";
      handles[corner].style.top = (hy - 6) + "px";
    }
  }
  positionOverlays();
  applyTextareaFont(textarea, draftBox.options);

  // Focusing synchronously inside the pointerup that triggers this is unreliable -
  // some browsers apply the event's own default focus handling *after* this runs,
  // stealing focus back before the user can type. Deferring to the next tick lets
  // that default handling finish first.
  setTimeout(() => { textarea.focus(); textarea.select(); }, 0);

  function updatePreview() {
    draftBox.text = textarea.value;
    draftBox.options = currentTextOptions();
    applyTextareaFont(textarea, draftBox.options);
    redrawAll();
  }

  let handleDrag = null;
  function onHandlePointerMove(ev) {
    if (!handleDrag) return;
    const scale = getCanvasScale();
    const dx = (ev.clientX - handleDrag.startClientX) / scale.x;
    const dy = (ev.clientY - handleDrag.startClientY) / scale.y;
    const resized = applyResize(handleDrag.startBox, handleDrag.corner, dx, dy);
    Object.assign(draftBox, resized);
    positionOverlays();
    applyTextareaFont(textarea, draftBox.options);
    redrawAll();
  }
  function onHandlePointerUp() {
    handleDrag = null;
    window.removeEventListener("pointermove", onHandlePointerMove);
    window.removeEventListener("pointerup", onHandlePointerUp);
  }
  Object.keys(handles).forEach((corner) => {
    handles[corner].addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      handleDrag = { corner, startClientX: ev.clientX, startClientY: ev.clientY, startBox: { ...draftBox } };
      window.addEventListener("pointermove", onHandlePointerMove);
      window.addEventListener("pointerup", onHandlePointerUp);
    });
  });

  function finish(commit) {
    textarea.removeEventListener("input", updatePreview);
    LIVE_PREVIEW_IDS.forEach((id) => document.getElementById(id).removeEventListener("input", updatePreview));
    window.removeEventListener("pointermove", onHandlePointerMove);
    window.removeEventListener("pointerup", onHandlePointerUp);
    textarea.remove();
    confirmBar.remove();
    Object.values(handles).forEach((h) => h.remove());
    if (commit) {
      if (draftBox.text.trim()) {
        pushUndoSnapshot();
        const finalBox = {
          left: draftBox.left,
          top: draftBox.top,
          width: draftBox.width,
          height: draftBox.height,
          text: draftBox.text,
          options: draftBox.options
        };
        if (editingIndex == null) textBoxes.push(finalBox);
        else textBoxes[editingIndex] = finalBox;
      } else if (editingIndex != null) {
        // Confirmed with the text cleared out while editing an existing box: treat
        // that as "remove this annotation" rather than silently leaving it unchanged.
        pushUndoSnapshot();
        textBoxes.splice(editingIndex, 1);
      }
    }
    draftBox = null;
    redrawAll();
  }

  textarea.addEventListener("input", updatePreview);
  LIVE_PREVIEW_IDS.forEach((id) => document.getElementById(id).addEventListener("input", updatePreview));
  textarea.addEventListener("keydown", (ev) => {
    ev.stopPropagation();
    if (ev.key === "Escape") finish(false);
  });
  confirmBar.querySelector(".confirm-btn").addEventListener("click", () => finish(true));
  confirmBar.querySelector(".cancel-btn").addEventListener("click", () => finish(false));
}

function finalizeTextBox(x1, y1, x2, y2) {
  let left = Math.min(x1, x2);
  let top = Math.min(y1, y2);
  let width = Math.abs(x2 - x1);
  let height = Math.abs(y2 - y1);
  const MIN_DRAG = 16;
  if (width < MIN_DRAG && height < MIN_DRAG) {
    // Treat as a simple click rather than a drag: drop a sensibly-sized default box.
    width = 240;
    height = 70;
  }
  left = Math.max(0, Math.min(left, viewCanvas.width - 20));
  top = Math.max(0, Math.min(top, viewCanvas.height - 20));
  width = Math.min(width, viewCanvas.width - left);
  height = Math.min(height, viewCanvas.height - top);
  openTextBoxEditor({ left, top, width, height, text: "", options: currentTextOptions() }, null);
}

function applyResize(startBox, corner, dx, dy) {
  const MIN = 30;
  let { left, top, width, height } = startBox;
  if (corner.includes("w")) {
    left = startBox.left + dx;
    width = startBox.width - dx;
  }
  if (corner.includes("e")) {
    width = startBox.width + dx;
  }
  if (corner.includes("n")) {
    top = startBox.top + dy;
    height = startBox.height - dy;
  }
  if (corner.includes("s")) {
    height = startBox.height + dy;
  }
  if (width < MIN) {
    if (corner.includes("w")) left = startBox.left + startBox.width - MIN;
    width = MIN;
  }
  if (height < MIN) {
    if (corner.includes("n")) top = startBox.top + startBox.height - MIN;
    height = MIN;
  }
  left = Math.max(0, left);
  top = Math.max(0, top);
  width = Math.min(width, viewCanvas.width - left);
  height = Math.min(height, viewCanvas.height - top);
  return { left, top, width, height };
}

document.getElementById("toolPen").addEventListener("click", () => setTool("pen"));
document.getElementById("toolText").addEventListener("click", () => setTool("text"));
document.getElementById("toolMove").addEventListener("click", () => setTool("move"));
document.getElementById("toolErase").addEventListener("click", () => setTool("erase"));

const viewCanvas = document.getElementById("viewCanvas");
viewCanvas.addEventListener("pointerdown", (e) => {
  if (!ctx || draftBox) return;
  const [x, y] = canvasCoords(e);

  if (currentTool === "text") {
    e.preventDefault();
    textDragStart = { x, y };
    return;
  }

  if (currentTool === "move") {
    e.preventDefault();
    const idx = hitTestTextBoxes(x, y);
    if (idx !== -1) {
      pushUndoSnapshot();
      moveState = { index: idx, offsetX: x - textBoxes[idx].left, offsetY: y - textBoxes[idx].top };
      viewCanvas.classList.add("dragging");
    }
    return;
  }

  if (currentTool === "erase") {
    e.preventDefault();
    const textIdx = hitTestTextBoxes(x, y);
    if (textIdx !== -1) {
      pushUndoSnapshot();
      textBoxes.splice(textIdx, 1);
      redrawAll();
      return;
    }
    const strokeIdx = hitTestStroke(x, y);
    if (strokeIdx !== -1) {
      pushUndoSnapshot();
      strokes.splice(strokeIdx, 1);
      redrawAll();
    }
    return;
  }

  pushUndoSnapshot();
  drawing = true;
  currentStroke = { points: [{ x, y }], color: document.getElementById("color").value, lineWidth: 4 };
});
viewCanvas.addEventListener("pointermove", (e) => {
  if (textDragStart) {
    const [x, y] = canvasCoords(e);
    redrawAll();
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#FF7500";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      Math.min(textDragStart.x, x),
      Math.min(textDragStart.y, y),
      Math.abs(x - textDragStart.x),
      Math.abs(y - textDragStart.y)
    );
    ctx.restore();
    return;
  }
  if (moveState) {
    const [x, y] = canvasCoords(e);
    const box = textBoxes[moveState.index];
    box.left = Math.max(0, Math.min(x - moveState.offsetX, viewCanvas.width - box.width));
    box.top = Math.max(0, Math.min(y - moveState.offsetY, viewCanvas.height - box.height));
    redrawAll();
    return;
  }
  if (!drawing || !currentStroke) return;
  const [x, y] = canvasCoords(e);
  currentStroke.points.push({ x, y });
  redrawAll();
});
viewCanvas.addEventListener("dblclick", (e) => {
  if (currentTool !== "move" || draftBox) return;
  const [x, y] = canvasCoords(e);
  const idx = hitTestTextBoxes(x, y);
  if (idx === -1) return;
  const box = textBoxes[idx];
  applyOptionsToToolbar(box.options);
  openTextBoxEditor(
    { left: box.left, top: box.top, width: box.width, height: box.height, text: box.text, options: box.options },
    idx
  );
});
window.addEventListener("pointerup", (e) => {
  if (drawing) {
    if (currentStroke && currentStroke.points.length > 1) {
      strokes.push(currentStroke);
    } else {
      // Nothing was actually drawn (a click with no drag) - drop the snapshot
      // taken for it rather than leaving a no-op entry in the undo history.
      undoStack.pop();
    }
    currentStroke = null;
    drawing = false;
    redrawAll();
    return;
  }
  if (moveState) {
    moveState = null;
    viewCanvas.classList.remove("dragging");
    return;
  }
  if (textDragStart) {
    const [x, y] = canvasCoords(e);
    const start = textDragStart;
    textDragStart = null;
    redrawAll();
    finalizeTextBox(start.x, start.y, x, y);
  }
});

document.getElementById("undoAnnotation").addEventListener("click", () => undo());
document.getElementById("redoAnnotation").addEventListener("click", () => redo());

document.getElementById("clearAnnotations").addEventListener("click", () => {
  if (!currentBook) return;
  pushUndoSnapshot();
  const shot = currentBook.shots[currentIndex];
  loadImageOnto(shot.file);
});

document.getElementById("saveAnnotation").addEventListener("click", async () => {
  if (!currentBook || !ctx) return;
  const shot = currentBook.shots[currentIndex];
  const status = document.getElementById("saveStatus");
  status.textContent = "Saving...";
  try {
    const res = await fetch("/api/annotate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: currentBook.path,
        file: shot.file,
        image: viewCanvas.toDataURL("image/png")
      })
    });
    if (!res.ok) throw new Error("save failed");
    shot.hasAnnotation = true;
    status.textContent = "Saved";
  } catch (err) {
    status.textContent = "Save failed";
  }
});

document.getElementById("downloadBook").addEventListener("click", () => {
  if (!currentBook) return;
  window.location.href = "/api/publish?path=" + encodeURIComponent(currentBook.path);
});

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function submitImport(code) {
  const status = document.getElementById("importStatus");
  status.className = "";
  status.textContent = "Importing...";
  try {
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "import failed");
    status.className = "ok";
    status.textContent = "Imported " + data.starSystem + " / " + data.body + " / " + data.ring +
      " (" + data.addedCount + " shot" + (data.addedCount === 1 ? "" : "s") + " added).";
    await loadSites();
  } catch (err) {
    status.className = "error";
    status.textContent = "Import failed: " + err.message;
  }
}

document.getElementById("importZipBtn").addEventListener("click", async () => {
  const input = document.getElementById("importZipFile");
  const file = input.files && input.files[0];
  if (!file) {
    const status = document.getElementById("importStatus");
    status.className = "error";
    status.textContent = "Choose a .zip file first.";
    return;
  }
  const code = await readFileAsBase64(file);
  await submitImport(code);
});

document.getElementById("prev").addEventListener("click", () => { if (currentIndex > 0) { saveNoteIfDirty(); currentIndex--; render(); } });
document.getElementById("next").addEventListener("click", () => { if (currentBook && currentIndex < currentBook.shots.length - 1) { saveNoteIfDirty(); currentIndex++; render(); } });
document.getElementById("notes").addEventListener("input", () => { notesDirty = true; });
document.getElementById("notes").addEventListener("blur", saveNoteIfDirty);
window.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if (e.key === "ArrowLeft") document.getElementById("prev").click();
  if (e.key === "ArrowRight") document.getElementById("next").click();
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

document.getElementById("mineralFilterSelect").addEventListener("change", renderSites);

loadSites();
</script>
</body>
</html>
`;

export const MINERAL_PICKER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Select Mineral</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; background: #0a0a0a; color: #eae4da; padding: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  #sub { font-size: 13px; color: #b89470; margin-bottom: 12px; }
  #selectionBanner { font-size: 13px; margin-bottom: 18px; padding: 8px 12px; border-radius: 6px; }
  #selectionBanner.none { background: #2a1806; color: #f2b366; border: 1px solid #6b4020; }
  #selectionBanner.set { background: #1f3a28; color: #6ee7a0; border: 1px solid #2f7d3c; }
  .ring-block { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #3a2410; }
  .ring-block h2 { font-size: 15px; color: #FF7500; margin: 0 0 12px; }
  .ring-block h2 .ring-type { color: #9c7a55; font-weight: normal; }
  .columns { display: flex; gap: 32px; flex-wrap: wrap; }
  .column h3 { font-size: 13px; color: #FF7500; margin: 0 0 10px; }
  .mineral-grid { display: flex; flex-direction: column; gap: 6px; min-width: 220px; }
  .mineral-btn { background: #2a1a0a; border: 1px solid #4a3018; color: #eae4da; border-radius: 6px; padding: 8px 12px; text-align: left; cursor: pointer; font-size: 14px; }
  .mineral-btn:hover { background: #7a3d00; }
  .mineral-btn.suggested { border-color: #6ee7a0; color: #6ee7a0; }
  .mineral-btn.active { background: #2f7d3c; border-color: #2f7d3c; color: #fff; }
  #clearRow { margin-top: 8px; }
  #clearBtn { background: #7d2f2f; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; }
  #status { margin-top: 16px; font-size: 13px; color: #6ee7a0; min-height: 1.2em; }
  #status.error { color: #f28b82; }
</style>
</head>
<body>
  <h1>Select Mineral</h1>
  <div id="sub">Tags the next session with a mineral, so its screenshots go into their own subfolder within the ring.</div>
  <div id="selectionBanner"></div>
  <div id="ringsContainer"></div>
  <div id="clearRow"><button id="clearBtn">Clear Selection</button></div>
  <div id="status"></div>
<script>
let selectedMineral = null;

function mineralButton(name, grid, hotspots) {
  const btn = document.createElement("button");
  btn.className = "mineral-btn";
  btn.textContent = name;
  if (hotspots.includes(name)) btn.classList.add("suggested");
  if (name === selectedMineral) btn.classList.add("active");
  btn.addEventListener("click", () => selectMineral(name));
  grid.appendChild(btn);
}

function renderRingBlock(container, title, hotspots, laserMinerals, coreMinerals) {
  const block = document.createElement("div");
  block.className = "ring-block";

  const heading = document.createElement("h2");
  heading.textContent = title;
  block.appendChild(heading);

  const columns = document.createElement("div");
  columns.className = "columns";

  const laserColumn = document.createElement("div");
  laserColumn.className = "column";
  laserColumn.innerHTML = "<h3>Laser Mining</h3>";
  const laserGrid = document.createElement("div");
  laserGrid.className = "mineral-grid";
  laserColumn.appendChild(laserGrid);

  const coreColumn = document.createElement("div");
  coreColumn.className = "column";
  coreColumn.innerHTML = "<h3>Core Mining</h3>";
  const coreGrid = document.createElement("div");
  coreGrid.className = "mineral-grid";
  coreColumn.appendChild(coreGrid);

  for (const name of laserMinerals) mineralButton(name, laserGrid, hotspots);
  for (const name of coreMinerals) mineralButton(name, coreGrid, hotspots);

  columns.appendChild(laserColumn);
  columns.appendChild(coreColumn);
  block.appendChild(columns);
  container.appendChild(block);
}

async function selectMineral(mineral) {
  const status = document.getElementById("status");
  status.className = "";
  status.textContent = "Saving...";
  try {
    const res = await fetch("/api/select-mineral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mineral })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "failed to select mineral");
    status.textContent = mineral
      ? "Selected: " + mineral + " - go back and press Start Session."
      : "Selection cleared.";
    selectedMineral = mineral;
    document.querySelectorAll(".mineral-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.textContent === mineral);
    });
    renderBanner();
  } catch (err) {
    status.className = "error";
    status.textContent = "Failed to save selection.";
  }
}

function renderBanner() {
  const banner = document.getElementById("selectionBanner");
  if (selectedMineral) {
    banner.className = "set";
    banner.textContent = "Selected: " + selectedMineral;
  } else {
    banner.className = "none";
    banner.textContent = "No mineral selected";
  }
}

document.getElementById("clearBtn").addEventListener("click", () => selectMineral(null));

async function init() {
  const res = await fetch("/api/current-location");
  const data = await res.json();
  selectedMineral = data.selectedMineral || null;
  renderBanner();

  const container = document.getElementById("ringsContainer");
  const rings = data.rings || [];

  if (rings.length === 0) {
    renderRingBlock(container, "No DSS data for this body yet - pick manually below", [], data.laserMinerals, data.coreMinerals);
    return;
  }

  for (const r of rings) {
    const title = r.ring + (r.type ? " · " + r.type : "");
    renderRingBlock(container, title, r.hotspots || [], data.laserMinerals, data.coreMinerals);
  }
}

init();
</script>
</body>
</html>
`;
