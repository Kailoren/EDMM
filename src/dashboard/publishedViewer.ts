export interface PublishedShot {
	file: string;
	capturedAt: string;
	note: string;
}

export interface PublishedManifest {
	starSystem: string;
	body: string;
	ring: string;
	mineral?: string;
	publishedAt: string;
	shots: PublishedShot[];
}

/**
 * Renders a fully standalone, read-only HTML viewer for a published book.
 * No fetch()/XHR is used for the manifest data (embedded directly as a JS
 * constant) since browsers commonly block those for file:// pages once this
 * is unzipped and opened locally - only <img src="images/...png"> is used
 * for the actual pictures, which file:// pages can load without issue.
 */
export function renderPublishedViewer(manifest: PublishedManifest): string {
	const dataJson = JSON.stringify(manifest).replace(/</g, "\\u003c");
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(manifest.starSystem)} / ${escapeHtml(manifest.body)} / ${escapeHtml(manifest.ring)}${manifest.mineral ? ` / ${escapeHtml(manifest.mineral)}` : ""}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; background: #14161a; color: #e8e8e8; display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 24px; }
  h1 { font-size: 16px; color: #9fb4d1; margin: 0 0 4px; }
  #sub { font-size: 12px; color: #6b7280; margin-bottom: 18px; }
  img { max-width: 100%; max-height: 65vh; border-radius: 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.5); }
  #controls { margin-top: 14px; display: flex; align-items: center; gap: 16px; }
  #controls button { background: #2b3a55; color: #e8e8e8; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; }
  #controls button:disabled { opacity: 0.35; cursor: default; }
  #meta { font-size: 12px; color: #9aa3af; margin-top: 8px; }
  #note { width: 100%; max-width: 700px; margin-top: 14px; background: #1c1c1c; border: 1px solid #333; border-radius: 6px; padding: 10px; font-size: 13px; white-space: pre-wrap; min-height: 1.4em; }
  #note:empty::before { content: "No notes for this shot."; color: #6b7280; font-style: italic; }
  #footer { margin-top: 24px; font-size: 11px; color: #4b5563; }
</style>
</head>
<body>
  <h1>${escapeHtml(manifest.starSystem)} / ${escapeHtml(manifest.body)} / ${escapeHtml(manifest.ring)}${manifest.mineral ? ` / ${escapeHtml(manifest.mineral)}` : ""}</h1>
  <div id="sub">Published ${escapeHtml(new Date(manifest.publishedAt).toLocaleString())}</div>
  <img id="image" />
  <div id="controls">
    <button id="prev">&larr; Prev</button>
    <span id="position"></span>
    <button id="next">Next &rarr;</button>
  </div>
  <div id="meta"></div>
  <div id="note"></div>
  <div id="footer">Published with Elite Dangerous Mining Mapper</div>
<script>
const BOOK = ${dataJson};
let index = 0;

function render() {
  const shot = BOOK.shots[index];
  document.getElementById("image").src = "images/" + shot.file;
  document.getElementById("position").textContent = (index + 1) + " / " + BOOK.shots.length;
  document.getElementById("meta").textContent = new Date(shot.capturedAt).toLocaleString();
  document.getElementById("note").textContent = shot.note || "";
  document.getElementById("prev").disabled = index === 0;
  document.getElementById("next").disabled = index === BOOK.shots.length - 1;
}

document.getElementById("prev").addEventListener("click", () => { if (index > 0) { index--; render(); } });
document.getElementById("next").addEventListener("click", () => { if (index < BOOK.shots.length - 1) { index++; render(); } });
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") document.getElementById("prev").click();
  if (e.key === "ArrowRight") document.getElementById("next").click();
});

render();
</script>
</body>
</html>
`;
}

function escapeHtml(s: string): string {
	return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
