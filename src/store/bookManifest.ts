import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RingLocation } from "../session/sessionState.js";

const MANIFEST_FILENAME = "book-manifest.json";
const SHOT_FILENAME_PATTERN = /^(\d+)\.png$/;

export interface ShotEntry {
	file: string;
	capturedAt: string;
	note?: string;
}

export interface BookManifest {
	starSystem: string;
	body: string;
	ring: string;
	mineral?: string;
	shots: ShotEntry[];
}

export function manifestPathFor(folder: string): string {
	return join(folder, MANIFEST_FILENAME);
}

export function readManifest(folder: string, location: RingLocation): BookManifest {
	const path = manifestPathFor(folder);
	if (existsSync(path)) {
		try {
			return JSON.parse(readFileSync(path, "utf8")) as BookManifest;
		} catch {
			// corrupt manifest; fall through and start a fresh one rather than crash
		}
	}
	return { starSystem: location.starSystem, body: location.body, ring: location.ring, shots: [] };
}

export function writeManifest(folder: string, manifest: BookManifest): void {
	writeFileSync(manifestPathFor(folder), JSON.stringify(manifest, null, 2), "utf8");
}

export function addShot(folder: string, location: RingLocation, file: string, mineral?: string | null): BookManifest {
	const isNewManifest = !existsSync(manifestPathFor(folder));
	const manifest = readManifest(folder, location);
	if (isNewManifest && mineral) {
		manifest.mineral = mineral;
	}
	manifest.shots.push({ file, capturedAt: new Date().toISOString() });
	writeManifest(folder, manifest);
	return manifest;
}

export function removeShot(folder: string, location: RingLocation, file: string): BookManifest {
	const manifest = readManifest(folder, location);
	manifest.shots = manifest.shots.filter((shot) => shot.file !== file);
	writeManifest(folder, manifest);
	return manifest;
}

/** Highest existing sequential screenshot index in the folder's manifest, or 0 if empty/new. */
export function maxShotIndex(folder: string, location: RingLocation): number {
	const manifest = readManifest(folder, location);
	let max = 0;
	for (const shot of manifest.shots) {
		const match = SHOT_FILENAME_PATTERN.exec(shot.file);
		if (match) {
			max = Math.max(max, parseInt(match[1], 10));
		}
	}
	return max;
}

export function shotFilename(index: number): string {
	return `${String(index).padStart(4, "0")}.png`;
}

/** Name of the annotated copy that sits alongside an original shot, e.g. "0004.png" -> "0004-annotated.png". */
export function annotatedFilename(file: string): string {
	return file.replace(/\.png$/, "-annotated.png");
}

export function updateShotNote(folder: string, file: string, note: string): boolean {
	const path = manifestPathFor(folder);
	if (!existsSync(path)) {
		return false;
	}
	const manifest = JSON.parse(readFileSync(path, "utf8")) as BookManifest;
	const shot = manifest.shots.find((s) => s.file === file);
	if (!shot) {
		return false;
	}
	shot.note = note;
	writeManifest(folder, manifest);
	return true;
}
