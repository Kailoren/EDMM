import streamDeck from "@elgato/streamdeck";
import { homedir } from "node:os";
import { join } from "node:path";

export interface GlobalSettings {
	baseDir?: string;
	[key: string]: string | undefined;
}

function defaultBaseDir(): string {
	return join(homedir(), "Pictures", "EliteMiningBook");
}

export async function getBaseDir(): Promise<string> {
	const settings = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
	return settings.baseDir?.trim() || defaultBaseDir();
}

export async function setBaseDir(path: string): Promise<void> {
	const settings = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
	await streamDeck.settings.setGlobalSettings<GlobalSettings>({ ...settings, baseDir: path });
}
