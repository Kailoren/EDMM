/**
 * Reconciles a ring folder's book-manifest.json against what's actually on disk -
 * needed after the Good Rock/Undo re-entrancy race (fixed in sessionState.busy)
 * left some manifests with duplicate or phantom shot entries that don't match the
 * real .png files in the folder.
 *
 * Drops manifest entries with no matching file, adds any .png files present on disk
 * but missing from the manifest (using the file's mtime as capturedAt), and collapses
 * duplicate entries for the same filename down to one.
 *
 * Usage: npx tsx scripts/repairManifest.ts "<path to a ring folder>"
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { readManifest, writeManifest } from "../src/store/bookManifest.js";

async function main(): Promise<void> {
	const folder = process.argv[2];
	if (!folder) {
		console.error('Usage: npx tsx scripts/repairManifest.ts "<path to a ring folder>"');
		process.exit(1);
	}
	if (!existsSync(folder)) {
		console.error(`Folder not found: ${folder}`);
		process.exit(1);
	}

	const manifest = readManifest(folder, { starSystem: "", body: "", ring: "" });
	const filesOnDisk = new Set(readdirSync(folder).filter((f) => /^\d+\.png$/.test(f)));

	const seen = new Set<string>();
	const keptEntries = [];
	let droppedPhantom = 0;
	let droppedDuplicate = 0;

	for (const entry of manifest.shots) {
		if (!filesOnDisk.has(entry.file)) {
			droppedPhantom++;
			continue;
		}
		if (seen.has(entry.file)) {
			droppedDuplicate++;
			continue;
		}
		seen.add(entry.file);
		keptEntries.push(entry);
	}

	let addedOrphan = 0;
	for (const file of filesOnDisk) {
		if (!seen.has(file)) {
			keptEntries.push({ file, capturedAt: statSync(`${folder}/${file}`).mtime.toISOString() });
			addedOrphan++;
		}
	}

	keptEntries.sort((a, b) => a.file.localeCompare(b.file));
	manifest.shots = keptEntries;
	writeManifest(folder, manifest);

	console.log(`Dropped ${droppedPhantom} phantom entries (no matching file).`);
	console.log(`Dropped ${droppedDuplicate} duplicate entries for the same file.`);
	console.log(`Added ${addedOrphan} files found on disk but missing from the manifest.`);
	console.log(`Manifest now lists ${manifest.shots.length} shot(s), matching what's on disk.`);
}

void main();
