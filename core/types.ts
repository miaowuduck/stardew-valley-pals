// ── Plugin data types ──────────────────────────────────────────

export interface PetInstance {
	id: string;
	type: string;
	name: string;
}

export interface PetPluginData {
	selectedBackground: string;
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
	petSpeechEnabled: boolean;
	npcSpeechEnabled: boolean;
	firstRunComplete?: boolean;
}

// ── UI types ───────────────────────────────────────────────────

export interface SelectorOption {
	value: string;
	label: string;
	requiresName?: boolean;
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
};

// ── NPC helpers ────────────────────────────────────────────────

export const NPC_TYPE_PREFIX = "stardew/npc/";

export function isNpcSpeciesType(type: string): boolean {
	return type.startsWith(NPC_TYPE_PREFIX);
}
