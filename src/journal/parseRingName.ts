export interface RingIdentity {
	body: string;
	ring: string;
}

const RING_PATTERN = /^(.*) ([A-Za-z]) Ring$/;

/**
 * Splits a journal `Body` value into its parent body and ring, e.g.
 * "Wolf 359 6 A Ring" + starSystem "Wolf 359" -> { body: "Wolf 359 - Body 6", ring: "A Ring" }.
 * Returns null when the body is not a ring (e.g. a planet or star).
 */
export function parseRingName(bodyName: string, starSystem: string): RingIdentity | null {
	const match = RING_PATTERN.exec(bodyName);
	if (!match) {
		return null;
	}
	return { body: formatBodyLabel(starSystem, match[1]), ring: `${match[2].toUpperCase()} Ring` };
}

/**
 * Journal body designations repeat the star system name verbatim (e.g. "HIP 104026 2"),
 * which is redundant once shown alongside the system and makes for an overly long,
 * hard-to-read button title. This strips that prefix and reformats it as "System - Body N".
 */
function formatBodyLabel(starSystem: string, rawBody: string): string {
	if (rawBody === starSystem) {
		return starSystem;
	}
	const prefix = `${starSystem} `;
	if (rawBody.startsWith(prefix)) {
		const designation = rawBody.slice(prefix.length).trim();
		if (designation) {
			return `${starSystem} - Body ${designation}`;
		}
	}
	return rawBody;
}
