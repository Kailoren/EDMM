import { join, resolve, sep } from "node:path";
import type { RingLocation } from "../session/sessionState.js";

// eslint-disable-next-line no-control-regex
const INVALID_WINDOWS_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
const RESERVED_WINDOWS_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

/**
 * Strips characters that are illegal in Windows path segments (system/body/ring/mineral
 * names are free text - some of it, like an imported book's manifest.json fields or a
 * mineral tag posted to the dashboard, comes from outside the plugin's own control).
 * Beyond illegal characters, a segment of only dots ("." or "..") is neutralized too -
 * those aren't caught by the character filter but would otherwise let `path.join` climb
 * out of the intended folder entirely (e.g. a malicious "book" with body/ring set to
 * ".." escaping the screenshots directory on import).
 */
export function sanitizeSegment(name: string): string {
	const cleaned = name.replace(INVALID_WINDOWS_CHARS, "_").trim();
	if (!cleaned || /^\.+$/.test(cleaned) || RESERVED_WINDOWS_NAMES.test(cleaned)) {
		return `_${cleaned || "unnamed"}`;
	}
	return cleaned;
}

export function ringFolderPath(baseDir: string, location: RingLocation, mineral?: string | null): string {
	const segments = [
		baseDir,
		sanitizeSegment(location.starSystem),
		sanitizeSegment(location.body),
		sanitizeSegment(location.ring)
	];
	if (mineral) {
		segments.push(sanitizeSegment(mineral));
	}
	const folder = join(...segments);

	// Defense in depth: even with sanitizeSegment neutralizing ".." segments, verify the
	// final path still resolves inside baseDir before ever returning it to a caller that
	// will mkdir/write into it.
	const normalizedBase = resolve(baseDir);
	const resolved = resolve(folder);
	if (resolved !== normalizedBase && !resolved.startsWith(normalizedBase + sep)) {
		throw new Error("resolved folder escapes the base screenshots directory");
	}
	return folder;
}
