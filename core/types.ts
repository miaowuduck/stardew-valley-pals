// ── Plugin data types ──────────────────────────────────────────

export interface PetInstance {
	id: string;
	type: string;
	name: string;
}

export interface PetPluginData {
	pets: PetInstance[];
	nextPetIdCounters: Record<string, number>;
	petSize: number;
	petSpeed: number;
	overlayMode: boolean;
	openAiApiKey: string;   // SecretStorage name, not the raw key
	openAiBaseUrl: string;
	pageRantEnabled: boolean;
	pageRantMinMinutes: number;
	pageRantMaxMinutes: number;
	pageRantContextChars: number;
	pageRantOnlyWhenFocused?: boolean;
	selectedModel?: string;
	useChinesePrompt?: boolean;
	npcSpeechEnabled: boolean;
	/** Villagers arrive/leave automatically on their own daily schedule. */
	npcScheduleEnabled: boolean;
	/** Max villagers present at once in schedule mode. */
	maxVisitors: number;
	/** Allow two villagers to walk up to each other and chat. */
	banterEnabled: boolean;
	/** Let villagers form long-term memories about the user's notes. */
	memoryEnabled: boolean;
	/** Per-NPC core memories, keyed by NPC species type. */
	npcMemories: Record<string, string[]>;
	firstRunComplete?: boolean;
}

// ── UI types ───────────────────────────────────────────────────

export interface SelectorOption {
	value: string;
	label: string;
	requiresName?: boolean;
	/** Greyed-out in the selector; clicking does nothing. */
	disabled?: boolean;
	/** Shown under the label when disabled (e.g. "Already in town"). */
	disabledReason?: string;
	/** When present the modal renders as an animated sprite grid instead of text buttons. */
	spriteData?: {
		url: string;
		scale: number;
		frameWidth: number;
		frameHeight: number;
		variantOffset?: [number, number];
		moveFrames: StardewFrame[];
		fps: number;
	};
}

// ── Species / animation types ──────────────────────────────────

export type StardewFrame = [number, number];

export type StardewAnimation = {
	frames: StardewFrame[];
	fps: number;
	loop?: boolean;
	flip?: boolean;
};

export type StardewPersona = {
	identity: string;
	temperament: string;
	rantStyle: string;
};

export type StardewSpeciesDefinition = {
	id: string;
	label: string;
	sprite: string;
	frameSize?: number;
	frameWidth?: number;
	frameHeight?: number;
	scale: number;
	moveDist: number;
	animations: Record<string, StardewAnimation | StardewAnimation[]>;
	persona: StardewPersona;
	variantOffset?: [number, number];
	/** Daily visiting window [startHour, endHour]; may wrap past midnight (e.g. [20, 2]). NPCs only. */
	visitHours?: [number, number];
};

// ── NPC helpers ────────────────────────────────────────────────

export const NPC_TYPE_PREFIX = "stardew/npc/";

export function isNpcSpeciesType(type: string): boolean {
	return type.startsWith(NPC_TYPE_PREFIX);
}
