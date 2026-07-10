/**
 * Dev tool: exercises JournalTailer + SessionState against fixture .log files
 * without needing Elite Dangerous or Stream Deck running. Covers:
 *  - normal line-by-line ingestion
 *  - a deliberately split ("torn") JSON line across two reads
 *  - file rotation mid-stream (a newer Journal.*.log appearing)
 *
 * Run with: npm run replay
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JournalTailer } from "../src/journal/journalTailer.js";
import { SessionState } from "../src/session/sessionState.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "sample-journals");

const POLL_MS = 200;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

let failures = 0;
function assertEqual<T>(actual: T, expected: T, label: string): void {
	const ok = JSON.stringify(actual) === JSON.stringify(expected);
	console.log(`${ok ? "PASS" : "FAIL"} - ${label}`);
	if (!ok) {
		failures++;
		console.log(`   expected: ${JSON.stringify(expected)}`);
		console.log(`   actual:   ${JSON.stringify(actual)}`);
	}
}

async function main(): Promise<void> {
	const journalDir = mkdtempSync(join(tmpdir(), "ed-journal-replay-"));
	console.log(`Using scratch journal dir: ${journalDir}`);

	const session = new SessionState();
	const tailer = new JournalTailer(journalDir, POLL_MS);
	tailer.on("event", (evt) => session.handleJournalEvent(evt));
	tailer.on("error", (err) => console.error("tailer error:", err));
	tailer.start();

	// --- Case 1: normal flow with a deliberately torn final line ---
	const session1Path = join(fixturesDir, "session1.log");
	const session1Lines = readFileSync(session1Path, "utf8").trimEnd().split("\n");
	const allButLast = session1Lines.slice(0, -1).join("\n") + "\n";
	const lastLine = session1Lines[session1Lines.length - 1];
	const tornPoint = Math.floor(lastLine.length / 2);

	const file1 = join(journalDir, "Journal.2026-07-05T200000.01.log");
	writeFileSync(file1, allButLast + lastLine.slice(0, tornPoint));

	await sleep(POLL_MS * 3);
	assertEqual(
		session.currentDetectedLocation(),
		null,
		"Case 1a: torn final line not yet parsed, no ring resolved"
	);

	appendFileSync(file1, lastLine.slice(tornPoint) + "\n");
	await sleep(POLL_MS * 3);
	assertEqual(
		session.currentDetectedLocation(),
		{ starSystem: "Wolf 359", body: "Wolf 359 - Body 6", ring: "A Ring" },
		"Case 1b: completed line parsed, ring resolved after repair"
	);
	assertEqual(session.currentStarSystem(), "Wolf 359", "Case 1c: star system tracked");

	// --- Case 2: rotation - a newer journal file appears mid-session ---
	const session2Path = join(fixturesDir, "session2.log");
	const session2Content = readFileSync(session2Path, "utf8");
	const file2 = join(journalDir, "Journal.2026-07-05T210000.01.log");
	writeFileSync(file2, session2Content);

	await sleep(POLL_MS * 4);
	assertEqual(
		session.currentDetectedLocation(),
		{
			starSystem: "Col 285 Sector YZ-A d13",
			body: "Col 285 Sector YZ-A d13 - Body 2",
			ring: "A Ring"
		},
		"Case 2: tailer switched to the newer (rotated) journal file"
	);

	tailer.stop();
	rmSync(journalDir, { recursive: true, force: true });

	console.log("");
	if (failures > 0) {
		console.log(`${failures} check(s) failed.`);
		process.exit(1);
	}
	console.log("All checks passed.");
}

void main();
