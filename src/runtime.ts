import streamDeck from "@elgato/streamdeck";
import { findJournalDir } from "./journal/findJournalDir.js";
import { JournalTailer } from "./journal/journalTailer.js";
import { SessionState } from "./session/sessionState.js";

export const sessionState = new SessionState();

const journalDir = findJournalDir();
streamDeck.logger.info(`Watching Elite Dangerous journal directory: ${journalDir}`);

export const journalTailer = new JournalTailer(journalDir);
journalTailer.on("event", (evt: Record<string, unknown>) => sessionState.handleJournalEvent(evt));
journalTailer.on("error", (err: unknown) => streamDeck.logger.error("Journal tailer error:", err));
