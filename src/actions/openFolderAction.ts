import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { execFile } from "node:child_process";
import { mkdirSync } from "node:fs";
import { getBaseDir } from "../store/settings.js";

@action({ UUID: "com.kailo.edminingbook.openfolder" })
export class OpenFolderAction extends SingletonAction {
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const baseDir = await getBaseDir();
		mkdirSync(baseDir, { recursive: true });
		// explorer.exe's own exit code is notoriously unreliable (often non-zero even
		// on success), so this is fire-and-forget rather than treated as pass/fail.
		execFile("explorer.exe", [baseDir]);
		streamDeck.logger.info(`Opened screenshots folder: ${baseDir}`);
		await ev.action.showOk();
	}
}
