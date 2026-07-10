import streamDeck from "@elgato/streamdeck";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { join, relative, resolve, sep } from "node:path";
import { CORE_MINING_MINERALS, LASER_MINING_MINERALS } from "../journal/mineralTaxonomy.js";
import { sessionState } from "../runtime.js";
import { annotatedFilename, type BookManifest, updateShotNote } from "../store/bookManifest.js";
import { importBookIntoLibrary } from "../store/importBook.js";
import { getBaseDir } from "../store/settings.js";
import { MINERAL_PICKER_HTML, INDEX_HTML } from "./assets.js";
import { buildPublishedBook } from "./publish.js";

export const DASHBOARD_PORT = 39871;

const SHOT_FILENAME_PATTERN = /^\d{4}\.png$/;
const MAX_ANNOTATE_BODY_BYTES = 20 * 1024 * 1024;
const MAX_SELECT_MINERAL_BODY_BYTES = 1024;

interface SiteSummary {
	starSystem: string;
	body: string;
	ring: string;
	mineral: string | null;
	path: string;
	shotCount: number;
}

export function startDashboardServer(): void {
	const server = createServer((req, res) => {
		handleRequest(req, res).catch((err) => {
			streamDeck.logger.error("Dashboard server error:", err);
			if (!res.headersSent) {
				res.writeHead(500, { "Content-Type": "text/plain" });
			}
			res.end("Internal error");
		});
	});
	server.listen(DASHBOARD_PORT, "127.0.0.1", () => {
		streamDeck.logger.info(`Book dashboard listening on http://127.0.0.1:${DASHBOARD_PORT}/`);
	});
	server.on("error", (err) => streamDeck.logger.error("Dashboard server failed to start:", err));
}

const OWN_ORIGIN = `http://127.0.0.1:${DASHBOARD_PORT}`;

/**
 * Browsers attach an Origin header to cross-site requests (and same-site ones with
 * these methods), so any request claiming a different origin than our own dashboard
 * is a forged cross-site request - some other page the user has open trying to POST
 * to our local server - and gets rejected. A request with no Origin header at all
 * (e.g. a same-machine script, or older browser edge cases) is allowed through, since
 * that's not something a malicious webpage can spoof from within a browser.
 */
function isTrustedOrigin(req: IncomingMessage): boolean {
	const origin = req.headers.origin;
	return !origin || origin === OWN_ORIGIN;
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
	const url = new URL(req.url ?? "/", `http://127.0.0.1:${DASHBOARD_PORT}`);
	const baseDir = await getBaseDir();

	if (req.method === "POST" && !isTrustedOrigin(req)) {
		res.writeHead(403, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "cross-origin requests are not allowed" }));
		return;
	}

	if (url.pathname === "/" || url.pathname === "/index.html") {
		res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
		res.end(INDEX_HTML);
		return;
	}

	if (url.pathname === "/api/tree") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify(buildTree(baseDir)));
		return;
	}

	if (url.pathname === "/api/book") {
		const rel = url.searchParams.get("path") ?? "";
		const folder = safeResolve(baseDir, rel);
		const manifestPath = folder ? join(folder, "book-manifest.json") : null;
		if (!folder || !manifestPath || !existsSync(manifestPath)) {
			res.writeHead(404, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "not found" }));
			return;
		}
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
		if (Array.isArray(manifest.shots)) {
			for (const shot of manifest.shots) {
				shot.hasAnnotation = existsSync(join(folder, annotatedFilename(shot.file)));
			}
		}
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify(manifest));
		return;
	}

	if (url.pathname === "/api/annotate" && req.method === "POST") {
		return handleAnnotate(req, res, baseDir);
	}

	if (url.pathname === "/api/note" && req.method === "POST") {
		return handleNote(req, res, baseDir);
	}

	if (url.pathname === "/api/publish") {
		return handlePublish(req, res, url, baseDir);
	}

	if (url.pathname === "/api/import" && req.method === "POST") {
		return handleImport(req, res, baseDir);
	}

	if (url.pathname === "/mineral-picker") {
		res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
		res.end(MINERAL_PICKER_HTML);
		return;
	}

	if (url.pathname === "/api/current-location") {
		const location = sessionState.currentDetectedLocation();
		const bodyContext = sessionState.currentBodyContext();
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(
			JSON.stringify({
				location,
				selectedMineral: sessionState.selectedMineral,
				rings: bodyContext ? sessionState.ringsForBody(bodyContext) : [],
				laserMinerals: LASER_MINING_MINERALS,
				coreMinerals: CORE_MINING_MINERALS
			})
		);
		return;
	}

	if (url.pathname === "/api/select-mineral" && req.method === "POST") {
		return handleSelectMineral(req, res);
	}

	if (url.pathname === "/shots") {
		const rel = url.searchParams.get("path") ?? "";
		const filePath = safeResolve(baseDir, rel);
		if (!filePath || !existsSync(filePath)) {
			res.writeHead(404);
			res.end();
			return;
		}
		res.writeHead(200, { "Content-Type": "image/png" });
		res.end(readFileSync(filePath));
		return;
	}

	res.writeHead(404, { "Content-Type": "text/plain" });
	res.end("Not found");
}

async function handleAnnotate(req: IncomingMessage, res: ServerResponse, baseDir: string): Promise<void> {
	let body: { path?: unknown; file?: unknown; image?: unknown };
	try {
		body = JSON.parse(await readBody(req, MAX_ANNOTATE_BODY_BYTES));
	} catch (err) {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: err instanceof Error ? err.message : "invalid request" }));
		return;
	}

	const folder = typeof body.path === "string" ? safeResolve(baseDir, body.path) : null;
	const file = typeof body.file === "string" ? body.file : "";
	const image = typeof body.image === "string" ? body.image : "";

	if (!folder || !existsSync(folder) || !SHOT_FILENAME_PATTERN.test(file)) {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "invalid path or file" }));
		return;
	}

	const dataUrlMatch = /^data:image\/png;base64,(.+)$/.exec(image);
	if (!dataUrlMatch) {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "expected a PNG data URL" }));
		return;
	}

	const outputPath = join(folder, annotatedFilename(file));
	writeFileSync(outputPath, Buffer.from(dataUrlMatch[1], "base64"));

	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(JSON.stringify({ ok: true }));
}

const MAX_NOTE_BODY_BYTES = 200 * 1024;

async function handleNote(req: IncomingMessage, res: ServerResponse, baseDir: string): Promise<void> {
	let body: { path?: unknown; file?: unknown; note?: unknown };
	try {
		body = JSON.parse(await readBody(req, MAX_NOTE_BODY_BYTES));
	} catch (err) {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: err instanceof Error ? err.message : "invalid request" }));
		return;
	}

	const folder = typeof body.path === "string" ? safeResolve(baseDir, body.path) : null;
	const file = typeof body.file === "string" ? body.file : "";
	const note = typeof body.note === "string" ? body.note : "";

	if (!folder || !existsSync(folder) || !SHOT_FILENAME_PATTERN.test(file)) {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "invalid path or file" }));
		return;
	}

	const ok = updateShotNote(folder, file, note);
	res.writeHead(ok ? 200 : 404, { "Content-Type": "application/json" });
	res.end(JSON.stringify({ ok }));
}

async function handlePublish(
	req: IncomingMessage,
	res: ServerResponse,
	url: URL,
	baseDir: string
): Promise<void> {
	const rel = url.searchParams.get("path") ?? "";
	const folder = safeResolve(baseDir, rel);
	const manifestPath = folder ? join(folder, "book-manifest.json") : null;

	if (!folder || !manifestPath || !existsSync(manifestPath)) {
		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "not found" }));
		return;
	}

	const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as BookManifest;
	if (!manifest.shots || manifest.shots.length === 0) {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "this site has no screenshots to publish yet" }));
		return;
	}

	const { buffer, filename } = await buildPublishedBook(folder, manifest);

	res.writeHead(200, {
		"Content-Type": "application/zip",
		"Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`
	});
	res.end(buffer);
}

const MAX_IMPORT_BODY_BYTES = 150 * 1024 * 1024;

async function handleImport(req: IncomingMessage, res: ServerResponse, baseDir: string): Promise<void> {
	let body: { code?: unknown };
	try {
		body = JSON.parse(await readBody(req, MAX_IMPORT_BODY_BYTES));
	} catch (err) {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: err instanceof Error ? err.message : "invalid request" }));
		return;
	}

	const code = typeof body.code === "string" ? body.code : "";
	if (!code) {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "expected a 'code' field" }));
		return;
	}

	const buffer = Buffer.from(code, "base64");
	if (buffer.length === 0) {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "empty submission" }));
		return;
	}

	try {
		const result = importBookIntoLibrary(baseDir, buffer);
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify(result));
	} catch (err) {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: err instanceof Error ? err.message : "invalid book file" }));
	}
}

async function handleSelectMineral(req: IncomingMessage, res: ServerResponse): Promise<void> {
	let body: { mineral?: unknown };
	try {
		body = JSON.parse(await readBody(req, MAX_SELECT_MINERAL_BODY_BYTES));
	} catch (err) {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: err instanceof Error ? err.message : "invalid request" }));
		return;
	}

	const mineral = typeof body.mineral === "string" && body.mineral.trim() ? body.mineral.trim() : null;
	sessionState.setSelectedMineral(mineral);
	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(JSON.stringify({ ok: true, mineral }));
}

function readBody(req: IncomingMessage, maxBytes: number): Promise<string> {
	return new Promise((resolvePromise, reject) => {
		const chunks: Buffer[] = [];
		let total = 0;
		req.on("data", (chunk: Buffer) => {
			total += chunk.length;
			if (total > maxBytes) {
				reject(new Error("request body too large"));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => resolvePromise(Buffer.concat(chunks).toString("utf8")));
		req.on("error", reject);
	});
}

/** Resolves `rel` against `baseDir`, refusing to escape it (guards the two disk-serving routes above). */
function safeResolve(baseDir: string, rel: string): string | null {
	const normalizedBase = resolve(baseDir);
	const resolved = resolve(normalizedBase, rel);
	if (resolved !== normalizedBase && !resolved.startsWith(normalizedBase + sep)) {
		return null;
	}
	return resolved;
}

function buildTree(baseDir: string): SiteSummary[] {
	const results: SiteSummary[] = [];
	if (!existsSync(baseDir)) {
		return results;
	}
	for (const systemName of safeReaddir(baseDir)) {
		const systemPath = join(baseDir, systemName);
		if (!isDirectory(systemPath)) continue;
		for (const bodyName of safeReaddir(systemPath)) {
			const bodyPath = join(systemPath, bodyName);
			if (!isDirectory(bodyPath)) continue;
			for (const ringName of safeReaddir(bodyPath)) {
				const ringPath = join(bodyPath, ringName);
				const ringManifestFile = join(ringPath, "book-manifest.json");
				if (existsSync(ringManifestFile)) {
					// Legacy layout: shots directly in the ring folder, no mineral tag.
					pushSite(results, baseDir, ringManifestFile, ringPath, systemName, bodyName, ringName, null);
					continue;
				}
				for (const mineralName of safeReaddir(ringPath)) {
					const mineralPath = join(ringPath, mineralName);
					if (!isDirectory(mineralPath)) continue;
					const mineralManifestFile = join(mineralPath, "book-manifest.json");
					if (!existsSync(mineralManifestFile)) continue;
					pushSite(results, baseDir, mineralManifestFile, mineralPath, systemName, bodyName, ringName, mineralName);
				}
			}
		}
	}
	return results;
}

function pushSite(
	results: SiteSummary[],
	baseDir: string,
	manifestFile: string,
	folderPath: string,
	systemName: string,
	bodyName: string,
	ringName: string,
	mineralName: string | null
): void {
	try {
		const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
		results.push({
			starSystem: manifest.starSystem ?? systemName,
			body: manifest.body ?? bodyName,
			ring: manifest.ring ?? ringName,
			mineral: manifest.mineral ?? mineralName,
			path: relative(baseDir, folderPath).split(sep).join("/"),
			shotCount: Array.isArray(manifest.shots) ? manifest.shots.length : 0
		});
	} catch {
		// corrupt manifest; skip this site rather than fail the whole listing
	}
}

function safeReaddir(dir: string): string[] {
	try {
		return readdirSync(dir);
	} catch {
		return [];
	}
}

function isDirectory(path: string): boolean {
	try {
		return statSync(path).isDirectory();
	} catch {
		return false;
	}
}
