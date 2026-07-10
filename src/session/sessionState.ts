import { ALL_MINING_MINERALS } from "../journal/mineralTaxonomy.js";
import { parseRingName } from "../journal/parseRingName.js";

export interface RingLocation {
	starSystem: string;
	body: string;
	ring: string;
}

function ringKey(location: RingLocation): string {
	return `${location.starSystem}|${location.body}|${location.ring}`;
}

const RING_CLASS_LABELS: Record<string, string> = {
	eRingClass_Rocky: "Rocky",
	eRingClass_Icy: "Icy",
	eRingClass_Metalic: "Metallic",
	eRingClass_MetalRich: "Metal Rich"
};

function formatRingClass(raw: unknown): string | null {
	return typeof raw === "string" ? (RING_CLASS_LABELS[raw] ?? null) : null;
}

/**
 * Tracks where the player currently is (derived live from journal events) and the
 * state of an explicit recording session (Start Session / Good Rock / Undo / End Session).
 * Recording is deliberately decoupled from "where the player is right now" so a brief,
 * noisy drop into the wrong body doesn't retarget an in-progress session's folder -
 * the site is only re-resolved when Start Session is pressed.
 */
export class SessionState {
	private lastStarSystem: string | null = null;
	private lastSystemAddress: number | null = null;
	private lastRing: RingLocation | null = null;
	/** The system/body most recently associated with a ring scan (Scan or SAASignalsFound),
	 * even if the player never physically flew into any of that body's rings. Looser than
	 * `lastRing` on purpose - Start Session still requires actually being in a ring, but the
	 * mineral picker just needs to know which body's rings to list. */
	private lastKnownBody: { starSystem: string; body: string } | null = null;
	/** Mineral hotspot types seen via SAASignalsFound, keyed by ringKey(). Best-effort
	 * suggestions for the Select Mineral picker - not authoritative about which specific
	 * hotspot the player is currently in when a ring has more than one. Set (possibly to
	 * an empty array) whenever a ring has been DSS'd, so ringsForBody() can enumerate
	 * every scanned ring even if it turned up no mineral hotspots. */
	private ringHotspots = new Map<string, string[]>();
	/** Ring type (Rocky/Icy/Metallic/Metal Rich) seen via Scan events, keyed by ringKey(). */
	private ringTypes = new Map<string, string>();

	/** Whether a recording session is currently active. */
	active = false;
	/** The location locked in when the session started. */
	site: RingLocation | null = null;
	/** The folder the session's screenshots are written to, locked in at start time
	 * so a later change to the base-directory setting can't retarget an active session. */
	folder: string | null = null;
	/** Mineral tag locked in when the session started (null if untagged), mirroring
	 * how `site`/`folder` lock in at start rather than tracking live state. */
	mineral: string | null = null;
	/** The mineral chosen via the Select Mineral picker, consumed by Start Session. */
	selectedMineral: string | null = null;
	/** The index to use for the next screenshot filename within the active session. */
	nextShotIndex = 1;
	/** Absolute paths of screenshots taken this session, most recent last (undo stack). */
	undoStack: string[] = [];
	/**
	 * Re-entrancy guard shared by Start/End Session, Good Rock, and Undo. Each of those
	 * handlers is async (capture, file I/O) and Stream Deck does not wait for one
	 * onKeyDown to finish before delivering the next, so an impatient double-press
	 * fired a second overlapping run that read the same `nextShotIndex` before the
	 * first had recorded its shot - producing a duplicate filename and, once both
	 * finished, a skipped index. Setting this while a handler is in flight and having
	 * every handler bail out (with alert feedback) when it's already set closes that gap.
	 */
	busy = false;

	/**
	 * Feeds a parsed journal line into the location tracker. Only a handful of event
	 * types matter for resolving "current system/body/ring"; everything else is ignored.
	 */
	handleJournalEvent(evt: Record<string, unknown>): void {
		const eventName = evt.event;
		switch (eventName) {
			case "FSDJump":
			case "CarrierJump": {
				const starSystem = evt.StarSystem;
				if (typeof starSystem === "string") {
					this.lastStarSystem = starSystem;
				}
				const systemAddress = evt.SystemAddress;
				if (typeof systemAddress === "number") {
					this.lastSystemAddress = systemAddress;
				}
				this.lastRing = null;
				this.lastKnownBody = null;
				break;
			}
			case "Location":
			case "SupercruiseExit": {
				const starSystem = evt.StarSystem;
				if (typeof starSystem === "string") {
					this.lastStarSystem = starSystem;
				}
				const systemAddress = evt.SystemAddress;
				if (typeof systemAddress === "number") {
					this.lastSystemAddress = systemAddress;
				}
				const body = evt.Body;
				if (typeof body === "string" && this.lastStarSystem) {
					const identity = parseRingName(body, this.lastStarSystem);
					this.lastRing = identity
						? { starSystem: this.lastStarSystem, body: identity.body, ring: identity.ring }
						: null;
					if (identity) {
						this.lastKnownBody = { starSystem: this.lastStarSystem, body: identity.body };
					}
				} else {
					this.lastRing = null;
				}
				break;
			}
			case "SupercruiseEntry": {
				this.lastRing = null;
				break;
			}
			case "SAASignalsFound": {
				const systemAddress = evt.SystemAddress;
				const bodyName = evt.BodyName;
				const signals = evt.Signals;
				if (
					typeof systemAddress === "number" &&
					systemAddress === this.lastSystemAddress &&
					typeof bodyName === "string" &&
					this.lastStarSystem &&
					Array.isArray(signals)
				) {
					const identity = parseRingName(bodyName, this.lastStarSystem);
					if (identity) {
						const minerals = signals
							.map((s) => (s && typeof s === "object" ? (s as Record<string, unknown>) : null))
							.map((s) => (typeof s?.Type_Localised === "string" ? s.Type_Localised : s?.Type))
							.filter((name): name is string => typeof name === "string" && ALL_MINING_MINERALS.has(name));
						const key = ringKey({ starSystem: this.lastStarSystem, body: identity.body, ring: identity.ring });
						this.ringHotspots.set(key, minerals);
						this.lastKnownBody = { starSystem: this.lastStarSystem, body: identity.body };
					}
				}
				break;
			}
			case "Scan": {
				const systemAddress = evt.SystemAddress;
				const rings = evt.Rings;
				if (
					typeof systemAddress === "number" &&
					systemAddress === this.lastSystemAddress &&
					this.lastStarSystem &&
					Array.isArray(rings)
				) {
					for (const ring of rings) {
						if (!ring || typeof ring !== "object") continue;
						const ringInfo = ring as Record<string, unknown>;
						const name = ringInfo.Name;
						const ringClass = ringInfo.RingClass;
						if (typeof name !== "string") continue;
						const identity = parseRingName(name, this.lastStarSystem);
						if (!identity) continue;
						const key = ringKey({ starSystem: this.lastStarSystem, body: identity.body, ring: identity.ring });
						const type = formatRingClass(ringClass);
						if (type) {
							this.ringTypes.set(key, type);
						}
						this.lastKnownBody = { starSystem: this.lastStarSystem, body: identity.body };
					}
				}
				break;
			}
			default:
				break;
		}
	}

	/** Best-effort mineral hotspot types known for a ring, from a prior SAASignalsFound scan. */
	hotspotsFor(location: RingLocation): string[] {
		return this.ringHotspots.get(ringKey(location)) ?? [];
	}

	/** Every ring of the same system/body that's been DSS'd so far, sorted by ring name. */
	ringsForBody(body: { starSystem: string; body: string }): { ring: string; type: string | null; hotspots: string[] }[] {
		const prefix = `${body.starSystem}|${body.body}|`;
		const rings: { ring: string; type: string | null; hotspots: string[] }[] = [];
		for (const [key, hotspots] of this.ringHotspots) {
			if (!key.startsWith(prefix)) continue;
			rings.push({ ring: key.slice(prefix.length), type: this.ringTypes.get(key) ?? null, hotspots });
		}
		rings.sort((a, b) => a.ring.localeCompare(b.ring));
		return rings;
	}

	/** The ring the player is currently in, or null if not currently in one. */
	currentDetectedLocation(): RingLocation | null {
		return this.lastRing;
	}

	/**
	 * The system/body to show rings for in the mineral picker: prefers the ring the
	 * player is physically in right now, but falls back to the last body that was
	 * DSS'd even from a distance (no need to have flown into any specific ring yet).
	 */
	currentBodyContext(): { starSystem: string; body: string } | null {
		if (this.lastRing) {
			return { starSystem: this.lastRing.starSystem, body: this.lastRing.body };
		}
		return this.lastKnownBody;
	}

	/** The most recently known star system, even if not currently in a ring. */
	currentStarSystem(): string | null {
		return this.lastStarSystem;
	}

	/**
	 * Starts (or restarts) a recording session at the given location, resuming the
	 * screenshot index from `startIndex` (the caller is expected to have scanned the
	 * target folder for the current max index so revisits append rather than overwrite).
	 */
	startSession(location: RingLocation, folder: string, startIndex: number, mineral: string | null = null): void {
		this.active = true;
		this.site = location;
		this.folder = folder;
		this.mineral = mineral;
		this.nextShotIndex = startIndex;
		this.undoStack = [];
	}

	endSession(): void {
		this.active = false;
		this.site = null;
		this.folder = null;
		this.mineral = null;
		this.undoStack = [];
		// Force a conscious reselect (or explicit "no mineral") before the next session,
		// rather than silently carrying the last ring's tag over to a new one.
		this.selectedMineral = null;
	}

	setSelectedMineral(mineral: string | null): void {
		this.selectedMineral = mineral;
	}

	recordShot(path: string): void {
		this.undoStack.push(path);
		this.nextShotIndex += 1;
	}

	/** Pops and returns the most recent shot's path, or null if the stack is empty. */
	popLastShot(): string | null {
		return this.undoStack.pop() ?? null;
	}
}
