import { getNpcSpeciesList } from "../pets/stardew-species";

/** True if a visit window covers the given hour. Windows may wrap past midnight (e.g. [20, 2]). */
export function isVisitingAt(visitHours: [number, number] | undefined, hour: number): boolean {
	if (!visitHours) return false;
	const [start, end] = visitHours;
	if (start === end) return true;
	if (start < end) return hour >= start && hour < end;
	// Wrapped window, e.g. 20:00 → 02:00
	return hour >= start || hour < end;
}

/** Deterministic PRNG seeded from a string (mulberry32). */
function seededRandom(seed: string): () => number {
	let h = 1779033703;
	for (let i = 0; i < seed.length; i++) {
		h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	let a = h >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function dateSeed(now: Date): string {
	return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

/**
 * Computes which villagers are in town right now, in schedule mode.
 *
 * Every villager whose visit window covers the current hour is eligible;
 * a date-seeded shuffle picks up to `maxVisitors` of them, so the roster
 * is stable within a day and rotates daily.
 */
export function computeVisitors(now: Date, maxVisitors: number): string[] {
	const hour = now.getHours();
	const eligible = getNpcSpeciesList()
		.filter((npc) => isVisitingAt(npc.visitHours, hour))
		.map((npc) => npc.id);

	const rand = seededRandom(dateSeed(now));
	// Fisher–Yates shuffle with the seeded RNG
	for (let i = eligible.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[eligible[i], eligible[j]] = [eligible[j], eligible[i]];
	}

	return eligible.slice(0, Math.max(0, maxVisitors));
}
