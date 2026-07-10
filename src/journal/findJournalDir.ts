import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SAVED_GAMES_GUID = "{4C5C32FF-BB9D-43b0-B5B4-2D72E54EAAA4}";

/**
 * Resolves the "Saved Games\Frontier Developments\Elite Dangerous" journal directory.
 * The Saved Games known folder is user-relocatable, so it is read from the registry
 * rather than assumed to sit under the user's home directory.
 */
export function findJournalDir(): string {
	const savedGames = resolveSavedGamesDir();
	return join(savedGames, "Frontier Developments", "Elite Dangerous");
}

function resolveSavedGamesDir(): string {
	try {
		const output = execFileSync(
			"reg",
			[
				"query",
				"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders",
				"/v",
				SAVED_GAMES_GUID
			],
			{ encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
		);
		const match = output.match(/REG_(?:EXPAND_)?SZ\s+(.+)/);
		if (match) {
			const raw = match[1].trim();
			const expanded = expandEnvVars(raw);
			if (existsSync(expanded)) {
				return expanded;
			}
		}
	} catch {
		// fall through to default below
	}
	return join(homedir(), "Saved Games");
}

function expandEnvVars(value: string): string {
	return value.replace(/%([^%]+)%/g, (_, name: string) => process.env[name] ?? `%${name}%`);
}
