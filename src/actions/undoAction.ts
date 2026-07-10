import { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { unlinkSync } from "node:fs";
import { basename } from "node:path";
import { sessionState } from "../runtime.js";
import { removeShot } from "../store/bookManifest.js";

@action({ UUID: "com.kailo.edminingbook.undo" })
export class UndoAction extends SingletonAction {
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (!sessionState.active || !sessionState.site || !sessionState.folder || sessionState.busy) {
			await ev.action.showAlert();
			return;
		}

		const { site, folder } = sessionState;
		sessionState.busy = true;
		try {
			const lastShotPath = sessionState.popLastShot();
			if (!lastShotPath) {
				await ev.action.showAlert();
				return;
			}

			try {
				unlinkSync(lastShotPath);
			} catch {
				// already gone from disk somehow; still remove it from the manifest below
			}
			removeShot(folder, site, basename(lastShotPath));
			await ev.action.showOk();
		} finally {
			sessionState.busy = false;
		}
	}
}
