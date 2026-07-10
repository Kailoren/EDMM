import { EventEmitter } from "node:events";
import { readdirSync, statSync, watch, type FSWatcher } from "node:fs";
import { open, type FileHandle } from "node:fs/promises";
import { join } from "node:path";

const POLL_INTERVAL_MS = 3000;
const JOURNAL_FILE_PATTERN = /^Journal\.(.+)\.log$/;

/**
 * Tails the newest `Journal.*.log` file in a Saved Games\...\Elite Dangerous folder,
 * emitting one "event" per parsed JSON line and following file rotation as new
 * sessions start. Emits "error" for I/O problems (missing directory, etc.) without
 * throwing, since a game restart / folder hiccup shouldn't crash the plugin process.
 */
export class JournalTailer extends EventEmitter {
	private readonly journalDir: string;
	private currentFile: string | null = null;
	private offset = 0;
	private pendingLine = "";
	private dirWatcher: FSWatcher | null = null;
	private pollTimer: NodeJS.Timeout | null = null;
	private reading = false;
	private readonly pollIntervalMs: number;

	constructor(journalDir: string, pollIntervalMs: number = POLL_INTERVAL_MS) {
		super();
		this.journalDir = journalDir;
		this.pollIntervalMs = pollIntervalMs;
	}

	start(): void {
		this.checkForNewestFile();
		this.pollTimer = setInterval(() => this.checkForNewestFile(), this.pollIntervalMs);
		// fs.watch on Windows can silently drop events under rapid file churn, so it is
		// used only as a low-latency nudge; the poll above is the reliable fallback.
		try {
			// Filtered to actual journal files: this directory also holds Status.json,
			// Cargo.json, NavRoute.json etc., which Elite Dangerous rewrites several times
			// a second during flight - reacting to those too was causing a full directory
			// rescan on every one of those unrelated writes.
			this.dirWatcher = watch(this.journalDir, (_eventType, filename) => {
				if (!filename || JOURNAL_FILE_PATTERN.test(filename)) {
					this.checkForNewestFile();
				}
			});
		} catch (err) {
			this.emit("error", err);
		}
	}

	stop(): void {
		if (this.pollTimer) {
			clearInterval(this.pollTimer);
			this.pollTimer = null;
		}
		this.dirWatcher?.close();
		this.dirWatcher = null;
	}

	private checkForNewestFile(): void {
		let files: string[];
		try {
			files = readdirSync(this.journalDir);
		} catch (err) {
			this.emit("error", err);
			return;
		}

		let newest: { path: string; mtime: number } | null = null;
		for (const name of files) {
			if (!JOURNAL_FILE_PATTERN.test(name)) {
				continue;
			}
			const full = join(this.journalDir, name);
			try {
				const stat = statSync(full);
				if (!newest || stat.mtimeMs > newest.mtime) {
					newest = { path: full, mtime: stat.mtimeMs };
				}
			} catch {
				// file disappeared between readdir and stat; ignore
			}
		}
		if (!newest) {
			return;
		}

		if (newest.path !== this.currentFile) {
			this.currentFile = newest.path;
			this.offset = 0;
			this.pendingLine = "";
		}
		void this.readNewData();
	}

	private async readNewData(): Promise<void> {
		if (this.reading || !this.currentFile) {
			return;
		}
		this.reading = true;
		let handle: FileHandle | null = null;
		try {
			handle = await open(this.currentFile, "r");
			const stat = await handle.stat();
			if (stat.size < this.offset) {
				// File was replaced/truncated unexpectedly; restart from the top.
				this.offset = 0;
				this.pendingLine = "";
			}
			if (stat.size <= this.offset) {
				return;
			}

			const length = stat.size - this.offset;
			const buffer = Buffer.alloc(length);
			await handle.read(buffer, 0, length, this.offset);
			this.offset = stat.size;

			const chunk = this.pendingLine + buffer.toString("utf8");
			const lines = chunk.split("\n");
			// The last split segment may be an incomplete line if we read mid-write;
			// hold onto it and prepend it to the next read instead of parsing it now.
			this.pendingLine = lines.pop() ?? "";

			for (const line of lines) {
				this.handleLine(line);
			}
		} catch (err) {
			this.emit("error", err);
		} finally {
			await handle?.close();
			this.reading = false;
		}
	}

	private handleLine(line: string): void {
		const trimmed = line.trim();
		if (!trimmed) {
			return;
		}
		let parsed: Record<string, unknown>;
		try {
			parsed = JSON.parse(trimmed);
		} catch {
			// Shouldn't happen for a complete line, but a torn write is possible; skip it.
			return;
		}
		this.emit("event", parsed);
	}
}
