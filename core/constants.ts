import { type PetPluginData, type SelectorOption } from "./types";

// ── Default plugin data ────────────────────────────────────────

export const DEFAULT_DATA: Partial<PetPluginData> = {
	selectedBackground: "none",
	pets: [],
	nextPetIdCounters: {},
	overlayMode: false,
	petSpeed: 1,
	useChinesePrompt: false,
	openAiBaseUrl: "https://api.openai.com/v1",
	pageRantEnabled: false,
	pageRantMinMinutes: 5,
	pageRantMaxMinutes: 20,
	pageRantContextChars: 1200,
	pageRantOnlyWhenFocused: true,
	petSpeechEnabled: true,
	npcSpeechEnabled: true,
	petSize: 1,
	firstRunComplete: false,
};

// ── Background options ─────────────────────────────────────────

export const BACKGROUNDS: SelectorOption[] = [
	{ value: "none", label: "None" },
	{ value: "dirt", label: "Dirt" },
	{ value: "grass", label: "Grass" },
	{ value: "grass_fall", label: "Grass (Fall)" },
	{ value: "sand", label: "Sand" },
	{ value: "snow", label: "Snow" },
	{ value: "wood_broken", label: "Wood (Broken)" },
	{ value: "wood_dark", label: "Wood (Dark)" },
	{ value: "wood_light", label: "Wood (Light)" },
	{ value: "wood_orange", label: "Wood (Orange)" },
];

// ── Legacy background migration map ────────────────────────────

export const LEGACY_BACKGROUND_MAP: Record<string, string> = {
	"backgrounds/snowbg-1.png": "snow",
	"backgrounds/snowbg-2.png": "snow",
	"backgrounds/summerbg-1.png": "grass",
	"backgrounds/summerbg-2.png": "grass",
	"backgrounds/summerbg-3.png": "grass",
	"backgrounds/templebg-1.png": "sand",
	"backgrounds/templebg-2.png": "sand",
	"backgrounds/castlebg-1.png": "wood_dark",
	"backgrounds/castlebg-2.png": "wood_light",
	"snow.gif": "snow",
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

// ── Fallback rant templates ────────────────────────────────────

const NPC_TIMER_TEMPLATES_CN = [
	'《%s》？嗯……看起来挺有意思的。',
	'我刚路过看到了《%s》，这让我想起了星露谷的日子。',
	'《%s》这篇东西不错，比 Joja 的广告强多了。',
];

const NPC_CLICK_TEMPLATES_CN = [
	'哦？有什么事吗？我正盯着《%s》呢。',
	'你好啊，%s 这篇笔记我也在看。',
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

const PET_TIMER_TEMPLATES_CN = [
	'这个页面《%s》看起来很忙，但我怀疑它其实在偷偷摸鱼。',
	'《%s》正在努力工作，我看得出来，只是效率像在打盹。',
	'我盯着《%s》半天了，它的进度条好像一直在原地散步。',
	'《%s》今天也在认真营业，不过节奏有点像慢动作回放。',
];

const PET_CLICK_TEMPLATES_CN = [
	'你点我干嘛？我刚想吐槽《%s》呢。',
	'右键我也没用，%s 这页的工作量还是很可疑。',
	'《%s》看起来很忙，我正准备帮你吐槽它。',
];

const PET_TIMER_TEMPLATES_EN = [
	"This page, %s, looks busy, but I suspect it's secretly taking snack breaks.",
	"%s is working hard. The pace just feels like a slow afternoon in the valley.",
	"I've been watching %s for a while now, and its progress bar seems to be power-napping.",
	"%s is clearly on the job, but the workflow has a very relaxed rhythm.",
];

const PET_CLICK_TEMPLATES_EN = [
	"Hey, why the right click? I was just about to roast %s.",
	"Right-click noted. %s still looks suspiciously overworked.",
	"I can explain this page's job, but first: %s is giving me busy-but-not-that-busy vibes.",
];

export const FALLBACK_RANT_TEMPLATES = {
	npcTimerCn: NPC_TIMER_TEMPLATES_CN,
	npcClickCn: NPC_CLICK_TEMPLATES_CN,
	npcTimerEn: NPC_TIMER_TEMPLATES_EN,
	npcClickEn: NPC_CLICK_TEMPLATES_EN,
	petTimerCn: PET_TIMER_TEMPLATES_CN,
	petClickCn: PET_CLICK_TEMPLATES_CN,
	petTimerEn: PET_TIMER_TEMPLATES_EN,
	petClickEn: PET_CLICK_TEMPLATES_EN,
};

export function getFallbackRantText(
	pageLabel: string,
	trigger: "timer" | "rightclick",
	useChinese: boolean,
	isNPC: boolean,
): string {
	let templates: string[];

	if (isNPC) {
		templates = trigger === "timer"
			? (useChinese ? NPC_TIMER_TEMPLATES_CN : NPC_TIMER_TEMPLATES_EN)
			: (useChinese ? NPC_CLICK_TEMPLATES_CN : NPC_CLICK_TEMPLATES_EN);
	} else {
		templates = trigger === "timer"
			? (useChinese ? PET_TIMER_TEMPLATES_CN : PET_TIMER_TEMPLATES_EN)
			: (useChinese ? PET_CLICK_TEMPLATES_CN : PET_CLICK_TEMPLATES_EN);
	}

	const template = templates[Math.floor(Math.random() * templates.length)];
	return template.replace(/%s/g, pageLabel);
}
