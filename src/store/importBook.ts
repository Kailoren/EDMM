import AdmZip from "adm-zip";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { RingLocation } from "../session/sessionState.js";
import { maxShotIndex, readManifest, shotFilename, writeManifest } from "./bookManifest.js";
import { ringFolderPath } from "./paths.js";

interface ImportedShot {
	file: string;
	capturedAt: string;
	note: string;
}

interface ImportedManifest {
	starSystem: string;
	body: string;
	ring: string;
	mineral?: string;
	shots: ImportedShot[];
}

const IMAGE_ENTRY_PATTERN = /^images\/([^/]+\.png)$/;
const SHOT_FILE_PATTERN = /^\d+\.png$/;

function validateImportedManifest(raw: unknown): ImportedManifest {
	if (typeof raw !== "object" || raw === null) {
		throw new Error("manifest.json is not a JSON object");
	}
	const m = raw as Record<string, unknown>;

	for (const field of ["starSystem", "body", "ring"] as const) {
		if (typeof m[field] !== "string" || !(m[field] as string).trim()) {
			throw new Error(`manifest.json is missing a valid "${field}"`);
		}
	}
	if (!Array.isArray(m.shots) || m.shots.length === 0) {
		throw new Error("manifest.json has no shots");
	}

	const shots: ImportedShot[] = m.shots.map((entry, i) => {
		if (typeof entry !== "object" || entry === null) {
			throw new Error(`shots[${i}] is not an object`);
		}
		const shot = entry as Record<string, unknown>;
		if (typeof shot.file !== "string" || !SHOT_FILE_PATTERN.test(shot.file)) {
			throw new Error(`shots[${i}].file is missing or not a valid filename`);
		}
		if (typeof shot.capturedAt !== "string" || !shot.capturedAt) {
			throw new Error(`shots[${i}].capturedAt is missing`);
		}
		return {
			file: shot.file,
			capturedAt: shot.capturedAt,
			note: typeof shot.note === "string" ? shot.note : ""
		};
	});

	return {
		starSystem: (m.starSystem as string).trim(),
		body: (m.body as string).trim(),
		ring: (m.ring as string).trim(),
		mineral: typeof m.mineral === "string" && m.mineral.trim() ? m.mineral.trim() : undefined,
		shots
	};
}

export interface ImportResult {
	starSystem: string;
	body: string;
	ring: string;
	addedCount: number;
	/** Relative path (matches the shape /api/tree already returns), so the client can select this site right away. */
	path: string;
}

/**
 * Imports a shared book's zip into the local library. Merges into whatever folder
 * that system/body/ring already maps to (creating it if new) using the same
 * "continue numbering from the current max" logic Save Snapshot already relies on,
 * so imported shots never collide with the user's own screenshots of the same ring.
 */
export function importBookIntoLibrary(baseDir: string, zipBuffer: Buffer): ImportResult {
	let zip: AdmZip;
	try {
		zip = new AdmZip(zipBuffer);
	} catch {
		throw new Error("not a valid zip file");
	}

	const entries = zip.getEntries();
	if (entries.length === 0) {
		throw new Error("zip archive is empty");
	}

	const manifestEntry = zip.getEntry("manifest.json");
	if (!manifestEntry) {
		throw new Error("zip does not contain a manifest.json");
	}

	let raw: unknown;
	try {
		raw = JSON.parse(zip.readAsText(manifestEntry));
	} catch {
		throw new Error("manifest.json is not valid JSON");
	}
	const manifest = validateImportedManifest(raw);

	const images = new Map<string, Buffer>();
	for (const entry of entries) {
		if (entry.isDirectory) continue;
		const match = IMAGE_ENTRY_PATTERN.exec(entry.entryName);
		if (match) {
			images.set(match[1], entry.getData());
		}
	}
	for (const shot of manifest.shots) {
		if (!images.has(shot.file)) {
			throw new Error(`manifest references "${shot.file}" but the zip has no matching image`);
		}
	}

	const location: RingLocation = { starSystem: manifest.starSystem, body: manifest.body, ring: manifest.ring };
	const folder = ringFolderPath(baseDir, location, manifest.mineral ?? null);
	mkdirSync(folder, { recursive: true });

	let nextIndex = maxShotIndex(folder, location) + 1;
	const bookManifest = readManifest(folder, location);
	if (manifest.mineral && !bookManifest.mineral) {
		bookManifest.mineral = manifest.mineral;
	}

	for (const shot of manifest.shots) {
		const newFile = shotFilename(nextIndex);
		writeFileSync(join(folder, newFile), images.get(shot.file) as Buffer);
		bookManifest.shots.push({
			file: newFile,
			capturedAt: shot.capturedAt,
			note: shot.note || undefined
		});
		nextIndex++;
	}
	writeManifest(folder, bookManifest);

	return {
		starSystem: manifest.starSystem,
		body: manifest.body,
		ring: manifest.ring,
		addedCount: manifest.shots.length,
		path: relative(baseDir, folder).split(sep).join("/")
	};
}
