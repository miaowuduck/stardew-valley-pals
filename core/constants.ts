import { type PetPluginData } from "./types";

// ── Default plugin data ────────────────────────────────────────

export const DEFAULT_DATA: Partial<PetPluginData> = {
	pets: [],
	nextPetIdCounters: {},
	overlayMode: false,
	petSpeed: 1,
	petSize: 1,
	useChinesePrompt: false,
	openAiApiKey: "",
	openAiBaseUrl: "https://api.openai.com/v1",
	selectedModel: "gpt-5-mini",
	pageRantEnabled: false,
	pageRantMinMinutes: 5,
	pageRantMaxMinutes: 20,
	pageRantContextChars: 1200,
	pageRantOnlyWhenFocused: true,
	npcSpeechEnabled: true,
	npcScheduleEnabled: false,
	maxVisitors: 3,
	banterEnabled: true,
	memoryEnabled: true,
	npcMemories: {},
	firstRunComplete: false,
};

// ── New-note welcome messages ──────────────────────────────────

export const NEW_NOTE_MESSAGES = [
	"A fresh note has appeared!",
	"Perfect time to write something down.",
	"New ideas are ready to grow.",
	"Nothing can stop this note now!",
	"Pause and jot it down.",
	"Fresh inspiration, right on time.",
	"This one feels worth keeping.",
	"Another note, another good start.",
	"You're moving fast today.",
	"Nice work, keep the momentum going.",
	"A little burst of inspiration!",
	"*quietly pleased*",
	"Keep it going.",
	"Woof! New note detected! 🐕",
	"Bark bark! Time to write! 🐶",
	"Paws-itively productive!",
	"Fetching new ideas! 🎾",
	"Note-worthy work!",
	"Ruff draft started!",
	"Pup-tastic productivity!",
	"Tail-wagging good writing!",
	"Who's a good writer? You are!",
	"Bone-us note unlocked! 🦴",
	"Arf arf! 🐕",
	"Woof woof! 🐶",
	"*excited bork*",
	"*tail wagging intensifies*",
	"Hop into a new note! 🐰",
	"Lettuce write! 🥬",
	"Hare-brained ideas welcome!",
	"Note-hopping along nicely!",
	"Carrot-ch all your thoughts! 🥕",
	"Hop-timistic about this note!",
	"A bright little note just landed.",
	"Write on, hooman! ✍️",
];

// ── Fallback rant templates (NPCs only — animals don't talk) ───

const NPC_TIMER_TEMPLATES_CN = [
	'《%s》？嗯……看起来挺有意思的。',
	'我刚路过看到了《%s》，这让我想起了山谷里的日子。',
	'《%s》这篇东西不错，比 Joja 的广告强多了。',
];

const NPC_CLICK_TEMPLATES_CN = [
	'哦？有什么事吗？我正盯着《%s》呢。',
	'你好啊，《%s》这篇笔记我也在看。',
];

const NPC_TIMER_TEMPLATES_EN = [
	"%s? Hmm... looks interesting.",
	"I just passed by %s. Reminds me of something back in the valley.",
	"%s is definitely more interesting than Joja's pamphlets.",
];

const NPC_CLICK_TEMPLATES_EN = [
	"Oh? Need something? I was just looking at %s.",
	"Hey there, I was reading through %s myself.",
];

export function getFallbackRantText(
	pageLabel: string,
	trigger: "timer" | "rightclick",
	useChinese: boolean,
): string {
	const templates = trigger === "timer"
		? (useChinese ? NPC_TIMER_TEMPLATES_CN : NPC_TIMER_TEMPLATES_EN)
		: (useChinese ? NPC_CLICK_TEMPLATES_CN : NPC_CLICK_TEMPLATES_EN);

	const template = templates[Math.floor(Math.random() * templates.length)];
	return template.replace(/%s/g, pageLabel);
}

// ── Fallback banter dialogues (offline) ────────────────────────
// %A% / %B% are replaced with the two speakers' names.

export interface BanterLine {
	speaker: "A" | "B";
	text: string;
}

const BANTER_CN: BanterLine[][] = [
	[
		{ speaker: "A", text: "嘿，%B%，今天过得怎么样？" },
		{ speaker: "B", text: "老样子，%A%。镇子上一切太平。" },
		{ speaker: "A", text: "那就好。回头酒馆见。" },
	],
	[
		{ speaker: "A", text: "%B%，你看到他最近写的那些东西了吗？" },
		{ speaker: "B", text: "看到了。比去年那茬防风草长势好多了。" },
	],
	[
		{ speaker: "A", text: "这种天气就适合偷个懒，对吧 %B%？" },
		{ speaker: "B", text: "%A%，这话可别被刘易斯听见。" },
		{ speaker: "A", text: "哈哈，他这会儿准在摆弄他的金雕像。" },
	],
	[
		{ speaker: "B", text: "%A%，好久不见，最近在忙什么？" },
		{ speaker: "A", text: "瞎忙呗。你懂的，日子一天天过。" },
		{ speaker: "B", text: "行，那不耽误你了。" },
	],
];

const BANTER_EN: BanterLine[][] = [
	[
		{ speaker: "A", text: "Hey %B%. How's it going?" },
		{ speaker: "B", text: "Same as always, %A%. Town's quiet." },
		{ speaker: "A", text: "Good. See you at the saloon later." },
	],
	[
		{ speaker: "A", text: "You seen what they've been writing lately, %B%?" },
		{ speaker: "B", text: "I have. Better than last year's parsnip crop." },
	],
	[
		{ speaker: "A", text: "Weather like this makes you want to slack off, huh %B%?" },
		{ speaker: "B", text: "Careful, %A%. Don't let Lewis hear you say that." },
		{ speaker: "A", text: "Ha! He's probably polishing that gold statue of his." },
	],
	[
		{ speaker: "B", text: "%A%! Haven't seen you around. Keeping busy?" },
		{ speaker: "A", text: "Oh, you know how it is. One day at a time." },
		{ speaker: "B", text: "Well, I won't keep you." },
	],
];

export function getFallbackBanterDialogue(
	nameA: string,
	nameB: string,
	useChinese: boolean,
): BanterLine[] {
	const pool = useChinese ? BANTER_CN : BANTER_EN;
	const lines = pool[Math.floor(Math.random() * pool.length)];
	return lines.map((l) => ({
		speaker: l.speaker,
		text: l.text.replace(/%A%/g, nameA).replace(/%B%/g, nameB),
	}));
}
