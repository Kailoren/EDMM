/**
 * Mineable hotspot commodities, categorized by mining method (surface/laser vs core),
 * derived from the user's reference spreadsheet: only rows with "Has Hotspot" = TRUE
 * are included, since non-hotspot commodities (Gold, Cobalt, Water, etc.) aren't
 * relevant to this picker. Method split comes from the sheet's per-ring-type
 * Core/Surface/Sub-surface Deposit columns; a mineral lands in both lists only when
 * the sheet shows a genuine TRUE for both methods in at least one ring type
 * (Bromellite, Low Temperature Diamonds, Painite, Platinum).
 */
export const LASER_MINING_MINERALS = [
	"Bromellite",
	"Low Temperature Diamonds",
	"Painite",
	"Platinum",
	"Tritium"
] as const;

export const CORE_MINING_MINERALS = [
	"Alexandrite",
	"Benitoite",
	"Bromellite",
	"Grandidierite",
	"Low Temperature Diamonds",
	"Monazite",
	"Musgravite",
	"Painite",
	"Platinum",
	"Rhodplumsite",
	"Serendibite",
	"Void Opals"
] as const;

export const ALL_MINING_MINERALS: ReadonlySet<string> = new Set([...LASER_MINING_MINERALS, ...CORE_MINING_MINERALS]);
