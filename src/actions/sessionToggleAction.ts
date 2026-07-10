import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { mkdirSync } from "node:fs";
import { sessionState } from "../runtime.js";
import type { RingLocation } from "../session/sessionState.js";
import { maxShotIndex } from "../store/bookManifest.js";
import { ringFolderPath } from "../store/paths.js";
import { getBaseDir } from "../store/settings.js";

interface SessionToggleSettings {
	manualSystem?: string;
	manualBody?: string;
	manualRing?: string;
	[key: string]: string | undefined;
}

/**
 * Single toggle button: press once to lock onto the current ring and start
 * recording (state 1, "end" icon), press again to end that session (state 0,
 * "start" icon). Keeps the original "startsession" UUID so an already-placed
 * key on the user's profile picks up this behavior automatically.
 */
@action({ UUID: "com.kailo.edminingbook.startsession" })
export class SessionToggleAction extends SingletonAction<SessionToggleSettings> {
	override async onKeyDown(ev: KeyDownEvent<SessionToggleSettings>): Promise<void> {
		if (sessionState.busy) {
			await ev.action.showAlert();
			return;
		}

		if (sessionState.active) {
			sessionState.endSession();
			await ev.action.setState(0);
			await ev.action.showOk();
			return;
		}

		const location = sessionState.currentDetectedLocation() ?? manualLocationFrom(ev.payload.settings);
		if (!location) {
			await ev.action.showAlert();
			return;
		}

		sessionState.busy = true;
		try {
			const baseDir = await getBaseDir();
			const mineral = sessionState.selectedMineral;
			const folder = ringFolderPath(baseDir, location, mineral);
			mkdirSync(folder, { recursive: true });
			const startIndex = maxShotIndex(folder, location) + 1;

			sessionState.startSession(location, folder, startIndex, mineral);

			await ev.action.setState(1);
			await ev.action.showOk();
			streamDeck.logger.info(
				`Session started: ${location.starSystem} / ${location.body} / ${location.ring}` +
					(mineral ? ` [${mineral}]` : "") +
					` -> ${folder}`
			);
		} finally {
			sessionState.busy = false;
		}
	}
}

function manualLocationFrom(settings: SessionToggleSettings): RingLocation | null {
	if (settings.manualSystem?.trim() && settings.manualBody?.trim() && settings.manualRing?.trim()) {
		return {
			starSystem: settings.manualSystem.trim(),
			body: settings.manualBody.trim(),
			ring: settings.manualRing.trim()
		};
	}
	return null;
}
