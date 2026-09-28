import type PetPlugin from "../main";
import type { RenderablePet } from "../pets/factory";
import { isNpcSpeciesType } from "../core/types";

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

export interface BanterPetEntry {
	type: string;
	pet: RenderablePet;
}

const SPEECH_GAP_PX = 45;     // how far apart the two villagers stand
const ONLOOKER_RADIUS = 180;  // animals this close come watch
const LINE_DURATION = 3400;   // ms each speech bubble stays up
const LINE_GAP = 300;         // pause between speakers
/** Drop one villager within this distance of another to force a chat. */
export const DROP_ONTO_RADIUS_PX = 64;

/**
 * Orchestrates villager-to-villager conversations ("banter").
 *
 * Two free NPCs walk to a meeting point, face each other, and exchange a
 * few lines of AI-generated (or fallback) dialogue. Nearby animals gather
 * to watch silently. One instance per view (panel or overlay).
 */
export function createBanterRunner(plugin: PetPlugin) {
	let running = false;

	/**
	 * Core flow: villagers `a` and `b` walk to a meeting point, face each
	 * other, and exchange a few lines of dialogue while nearby animals watch.
	 */
	async function runBanter(
		a: BanterPetEntry,
		b: BanterPetEntry,
		pets: BanterPetEntry[],
	): Promise<boolean> {
		if (running) return false;
		running = true;
		const onlookers: BanterPetEntry[] = [];

		try {
			const pa = a.pet.getPosition();
			const pb = b.pet.getPosition();
			const midX = (pa.x + pb.x) / 2;
			const midY = (pa.y + pb.y) / 2;

			// Standing spots on either side of the midpoint; the one already
			// on the left keeps the left spot so they don't cross paths.
			const [spotA, spotB] = pa.x <= pb.x
				? [{ x: midX - SPEECH_GAP_PX, y: midY }, { x: midX + SPEECH_GAP_PX, y: midY }]
				: [{ x: midX + SPEECH_GAP_PX, y: midY }, { x: midX - SPEECH_GAP_PX, y: midY }];

			// Nearby animals come to watch (silently)
			for (const entry of pets) {
				if (entry === a || entry === b) continue;
				if (isNpcSpeciesType(entry.type) || entry.pet.isBusy()) continue;
				if (distance(entry.pet.getPosition(), { x: midX, y: midY }) < ONLOOKER_RADIUS) {
					onlookers.push(entry);
				}
			}

			// Both villagers walk to the meeting point (bounded internally)
			await Promise.all([
				a.pet.walkTo(spotA.x, spotA.y),
				b.pet.walkTo(spotB.x, spotB.y),
			]);

			// Hold position and face each other
			a.pet.setPaused(true);
			b.pet.setPaused(true);
			a.pet.faceToward(b.pet.getPosition().x);
			b.pet.faceToward(a.pet.getPosition().x);

			for (const o of onlookers) {
				o.pet.setPaused(true);
				o.pet.faceToward(midX);
				o.pet.celebrate();
			}

			// Generate the conversation (falls back to offline templates)
			const lines = await plugin.getBanterDialogue(a.type, b.type);

			for (const line of lines) {
				const speaker = line.speaker === "A" ? a : b;
				speaker.pet.showSpeechBubble(line.text, LINE_DURATION);
				await wait(LINE_DURATION + LINE_GAP);
			}

			return true;
		} catch (e) {
			console.error("Banter failed:", e);
			return false;
		} finally {
			a.pet.setPaused(false);
			b.pet.setPaused(false);
			for (const o of onlookers) {
				o.pet.setPaused(false);
			}
			running = false;
		}
	}

	async function tryRunBanter(pets: BanterPetEntry[]): Promise<boolean> {
		if (running) return false;

		const freeNpcs = pets.filter((p) => isNpcSpeciesType(p.type) && !p.pet.isBusy());
		if (freeNpcs.length < 2) return false;

		// Pick two random villagers
		const shuffled = [...freeNpcs].sort(() => Math.random() - 0.5);
		return runBanter(shuffled[0], shuffled[1], pets);
	}

	/**
	 * Forced conversation: the user dragged villager `a` onto villager `b`.
	 * Manual gesture — ignores the banterEnabled setting, but still yields
	 * to a conversation already in progress.
	 */
	async function forceRunBanter(
		a: BanterPetEntry,
		b: BanterPetEntry,
		pets: BanterPetEntry[],
	): Promise<boolean> {
		if (running || a === b) return false;
		// The dragged villager is exempt; the target must be free though.
		if (b.pet.isBusy()) return false;
		return runBanter(a, b, pets);
	}

	return {
		tryRunBanter,
		forceRunBanter,
		isRunning: () => running,
	};
}

export type BanterRunner = ReturnType<typeof createBanterRunner>;
