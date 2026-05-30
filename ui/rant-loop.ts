import { isNpcSpeciesType } from "../core/types";
import type PetPlugin from "../main";

// ── Types ──────────────────────────────────────────────────────

interface RantTarget {
	type: string;
	showSpeechBubble: (text: string) => void;
}

interface RantLoopOptions {
	/** Whether automatic rants are enabled right now. */
	isEnabled: () => boolean;
	/** Whether to suppress rants when the window is not focused. */
	onlyWhenFocused: () => boolean;
	/** Minimum delay between rants in milliseconds. */
	getMinMs: () => number;
	/** Maximum delay between rants in milliseconds. */
	getMaxMs: () => number;
	/** Current list of pets/NPCs that can speak. */
	getTargets: () => RantTarget[];
	/** Produce the text a given pet type should say. */
	getRantText: (type: string) => Promise<string>;
	/** Whether speech is allowed for a given pet type. */
	isSpeechEnabled: (type: string) => boolean;
}

// ── Scheduler ──────────────────────────────────────────────────

/**
 * Creates a rant-loop scheduler that periodically picks a random pet/NPC
 * and shows a speech bubble.  Returns `{ start, stop }` — call `start()` to
 * begin the loop and `stop()` to tear it down.
 *
 * Used by both the panel (PetView) and overlay (OverlayPetView) views.
 */
export function createRantLoopScheduler(opts: RantLoopOptions) {
	let timeoutId: ReturnType<typeof activeWindow.setTimeout> | null = null;
	let stopped = false;

	function scheduleNext() {
		if (stopped) return;

		const minMs = opts.getMinMs();
		const maxMs = Math.max(minMs, opts.getMaxMs());
		const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

		timeoutId = activeWindow.setTimeout(() => {
			if (stopped) return;

			if (opts.isEnabled()) {
				if (opts.onlyWhenFocused() && !activeDocument.hasFocus()) {
					scheduleNext();
					return;
				}

				const targets = opts.getTargets();
				const target = targets[Math.floor(Math.random() * targets.length)];
				if (target && opts.isSpeechEnabled(target.type)) {
					void opts.getRantText(target.type).then((text) => {
						if (text) target.showSpeechBubble(text);
					});
				}
			}

			scheduleNext();
		}, delay);
	}

	return {
		start() {
			stopped = false;
			scheduleNext();
		},
		stop() {
			stopped = true;
			if (timeoutId !== null) {
				activeWindow.clearTimeout(timeoutId);
				timeoutId = null;
			}
		},
	};
}

// ── Shared view rant-loop factory ──────────────────────────────

/** Builds rant-loop options common to both PetView and OverlayPetView. */
export function createViewRantLoopOptions(
	plugin: PetPlugin,
	getPets: () => RantTarget[],
): RantLoopOptions {
	return {
		isEnabled: () => plugin.instanceData.pageRantEnabled,
		onlyWhenFocused: () => plugin.instanceData.pageRantOnlyWhenFocused ?? true,
		getMinMs: () => {
			const minMinutes = Math.min(
				plugin.instanceData.pageRantMinMinutes || 5,
				plugin.instanceData.pageRantMaxMinutes || 20,
			);
			return minMinutes * 60 * 1000;
		},
		getMaxMs: () => {
			const maxMinutes = Math.max(
				plugin.instanceData.pageRantMinMinutes || 5,
				plugin.instanceData.pageRantMaxMinutes || 20,
			);
			return maxMinutes * 60 * 1000;
		},
		getTargets: getPets,
		getRantText: (type: string) => plugin.getPageRantText("timer", type),
		isSpeechEnabled: (type: string) => {
			const isNPC = isNpcSpeciesType(type);
			return isNPC
				? (plugin.instanceData.npcSpeechEnabled ?? true)
				: (plugin.instanceData.petSpeechEnabled ?? true);
		},
	};
}
