/**
 * Manual verification tool for the screenshot capture module - run against any
 * window by process name before wiring it into Stream Deck. For Elite Dangerous
 * itself, run with no args (defaults to EliteDangerous64).
 *
 * Usage: npx tsx scripts/testCapture.ts [processName] [outputPath]
 */
import { join } from "node:path";
import { captureGameWindow } from "../src/capture/screenshot.js";

async function main(): Promise<void> {
	const processName = process.argv[2];
	const outputPath = process.argv[3] ?? join(process.cwd(), "scratch", "capture-test.png");

	const result = processName
		? await captureGameWindow(outputPath, processName)
		: await captureGameWindow(outputPath);

	console.log(result);
	process.exit(result.ok ? 0 : 1);
}

void main();
