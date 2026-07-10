import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { join } from "node:path";
import { captureGameWindow } from "../capture/screenshot.js";
import { sessionState } from "../runtime.js";
import { addShot, shotFilename } from "../store/bookManifest.js";

@action({ UUID: "com.kailo.edminingbook.goodrock" })
export class GoodRockAction extends SingletonAction {
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (!sessionState.active || !sessionState.site || !sessionState.folder || sessionState.busy) {
			await ev.action.showAlert();
			return;
		}

		// Snapshot before the first await: End Session could otherwise clear these
		// out from under an in-flight capture.
		const { site, folder, mineral } = sessionState;
		sessionState.busy = true;
		try {
			const filename = shotFilename(sessionState.nextShotIndex);
			const fullPath = join(folder, filename);

			const result = await captureGameWindow(fullPath);
			if (!result.ok) {
				streamDeck.logger.error(`Good Rock capture failed: ${result.reason}`);
				await ev.action.showAlert();
				return;
			}

			addShot(folder, site, filename, mineral);
			sessionState.recordShot(fullPath);
			await ev.action.showOk();
		} finally {
			sessionState.busy = false;
		}
	}
}
