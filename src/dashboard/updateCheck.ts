import streamDeck from "@elgato/streamdeck";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO = "Kailoren/EDMM";
const CHECK_TIMEOUT_MS = 5000;

export interface UpdateCheckState {
	checked: boolean;
	updateAvailable: boolean;
	currentVersion: string;
	latestVersion: string | null;
	releaseUrl: string | null;
}

const state: UpdateCheckState = {
	checked: false,
	updateAvailable: false,
	currentVersion: readOwnVersion(),
	latestVersion: null,
	releaseUrl: null
};

export function getUpdateCheckState(): UpdateCheckState {
	return state;
}

/** Fire-and-forget on startup, same never-throw pattern as the journal/dashboard startup calls. */
export async function checkForUpdate(): Promise<void> {
	try {
		const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
			headers: { Accept: "application/vnd.github+json" },
			signal: AbortSignal.timeout(CHECK_TIMEOUT_MS)
		});
		if (!res.ok) return;

		const data = (await res.json()) as { tag_name?: string; html_url?: string };
		const latestVersion = data.tag_name?.replace(/^v/i, "");
		if (!latestVersion) return;

		state.latestVersion = latestVersion;
		state.releaseUrl = data.html_url ?? `https://github.com/${REPO}/releases/latest`;
		state.updateAvailable = isNewerVersion(latestVersion, state.currentVersion);
	} catch (err) {
		streamDeck.logger.warn("Update check failed (non-fatal):", err);
	} finally {
		state.checked = true;
	}
}

/** manifest.json sits next to bin/ in the packaged plugin, so this stays in sync automatically. */
function readOwnVersion(): string {
	try {
		const manifestPath = join(__dirname, "..", "manifest.json");
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { Version?: string };
		return manifest.Version ?? "0.0.0.0";
	} catch {
		return "0.0.0.0";
	}
}

function isNewerVersion(latest: string, current: string): boolean {
	const latestParts = latest.split(".").map(Number);
	const currentParts = current.split(".").map(Number);
	const len = Math.max(latestParts.length, currentParts.length);
	for (let i = 0; i < len; i++) {
		const l = latestParts[i] ?? 0;
		const c = currentParts[i] ?? 0;
		if (l > c) return true;
		if (l < c) return false;
	}
	return false;
}
