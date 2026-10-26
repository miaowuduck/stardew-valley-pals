import type {
	SelectorOption,
	StardewFrame,
	StardewAnimation,
	StardewPersona,
	StardewSpeciesDefinition,
} from "../core/types";
import { NPC_TYPE_PREFIX, isNpcSpeciesType } from "../core/types";
import { getStardewPetAsset, StardewPetSpriteKey } from "./pet-assets";
import { getStardewNpcAsset } from "./npc-assets";

export type {
	StardewFrame,
	StardewAnimation,
	StardewPersona,
	StardewSpeciesDefinition,
};
export { NPC_TYPE_PREFIX, isNpcSpeciesType };

function A(frames: StardewFrame[], fps: number, options: { loop?: boolean; flip?: boolean; span?: StardewAnimation["span"]; transitionOut?: StardewAnimation["transitionOut"] } = {}): StardewAnimation {
	return { frames, fps, ...options };
}

function createVariantSpecies(
	base: StardewSpeciesDefinition,
	index: number,
	label: string,
	offset: [number, number]
): StardewSpeciesDefinition {
	return {
		...base,
		id: `${base.id}/${index}`,
		label: `${base.label} ${label}`,
		variantOffset: offset,
	};
}

// ===== 基础动画定义 =====

const catAnimations: StardewSpeciesDefinition["animations"] = {
	idle: A([[0, 4], [1, 4], [2, 4]], 5, { loop: false }),
	moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
	moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
	moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
	moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
	special: A([[0, 5], [1, 5], [2, 5], [3, 5], [0, 5], [2, 4]], 5, { loop: false }),
	sleep: A([[0, 7], [1, 7]], 1),
};

const chickenAnimations: StardewSpeciesDefinition["animations"] = {
	idle: A([[0, 0]], 5, { loop: false }),
	moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
	moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
	moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
	moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
	special: A([[0, 6], [1, 6], [2, 6], [1, 6], [2, 6], [1, 6], [0, 6], [0, 0]], 5, { loop: false }),
	sleep: A([[0, 4], [1, 4]], 1, { loop: false }),
};

const dogAnimations: StardewSpeciesDefinition["animations"] = {
	idle: A([[0, 5], [1, 5], [2, 5], [3, 5]], 5, { loop: false }),
	moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
	moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
	moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
	moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
	special: A([[1, 6], [0, 6], [2, 6], [3, 5]], 5, { loop: false }),
	sleep: A([[0, 7], [1, 7]], 1),
};

const parrotAnimations: StardewSpeciesDefinition["animations"] = {
	idle: A([[0, 0]], 5, { loop: false }),
	moveUp: A([[8, 0], [9, 0], [10, 0]], 5),
	moveRight: A([[2, 0], [3, 0], [4, 0]], 5, { flip: true }),
	moveDown: A([[5, 0], [6, 0], [7, 0]], 5),
	moveLeft: A([[2, 0], [3, 0], [4, 0]], 5),
	special: A([[0, 0], [1, 0], [0, 0], [1, 0], [0, 0]], 5, { loop: false }),
};

const junimoAnimations: StardewSpeciesDefinition["animations"] = {
	idle: A([[0, 0]], 5, { loop: false }),
	moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]], 8),
	moveRight: A([[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2]], 8),
	moveLeft: A([[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2]], 8, { flip: true }),
	moveUp: A([[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4]], 8),
	special: [A([[4, 3], [5, 3], [6, 3], [7, 3]], 10), A([[4, 5], [5, 5], [6, 5], [7, 5]], 10)],
	sleep: A([[4, 1], [5, 1], [6, 1], [7, 1]], 1),
};

// ===== 变体生成 =====

// Cat: 6种，横向排列，frameSize=32，单个体 4列×8行
const catBase: StardewSpeciesDefinition = {
	id: "stardew/cat",
	label: "Cat",
	sprite: "cat",
	frameSize: 32,
	scale: 1,
	moveDist: 26,
	animations: catAnimations,
	persona: {
		identity: "A beloved farm cat",
		temperament: "Finicky and alert—naps by day, prowls by night",
		rantStyle: "Purrs with lazy wisdom, as if sharing secrets from a hundred harvest moons",
	},
};
const catVariants = [
	catBase,
	createVariantSpecies(catBase, 1, "Gray", [4, 0]),
	createVariantSpecies(catBase, 2, "Orange", [8, 0]),
	createVariantSpecies(catBase, 3, "White", [12, 0]),
	createVariantSpecies(catBase, 4, "Yellow", [16, 0]),
	createVariantSpecies(catBase, 5, "Purple", [20, 0]),
];

// Chicken: 8种，横向排列，frameSize=16，单个体 4列×7行
const chickenBase: StardewSpeciesDefinition = {
	id: "stardew/chicken",
	label: "Chicken",
	sprite: "chicken",
	scale: 1,
	moveDist: 18,
	animations: chickenAnimations,
	persona: {
		identity: "A hardworking farm chicken",
		temperament: "Early to rise, earnest, and peckishly punctual",
		rantStyle: "Clucks with urgency about daily chores—the sun's been up for hours, you know!",
	},
};
const chickenVariants = [
	chickenBase,
	createVariantSpecies(chickenBase, 1, "Small-Yellow", [4, 0]),
	createVariantSpecies(chickenBase, 2, "Blue", [8, 0]),
	createVariantSpecies(chickenBase, 3, "Small-Blue", [12, 0]),
	createVariantSpecies(chickenBase, 4, "Orange", [16, 0]),
	createVariantSpecies(chickenBase, 5, "Small-Orange", [20, 0]),
	createVariantSpecies(chickenBase, 6, "Brown", [24, 0]),
	createVariantSpecies(chickenBase, 7, "Small-Brown", [28, 0]),
];

// Dog: 6种，横向排列，frameSize=32，单个体 4列×9行
const dogBase: StardewSpeciesDefinition = {
	id: "stardew/dog",
	label: "Dog",
	sprite: "dog",
	frameSize: 32,
	scale: 1,
	moveDist: 28,
	animations: dogAnimations,
	persona: {
		identity: "A loyal farm dog",
		temperament: "Energetic and protective—never misses a chance to be part of the action",
		rantStyle: "Barks encouragement like a faithful old friend who always has your back",
	},
};
const dogVariants = [
	dogBase,
	createVariantSpecies(dogBase, 1, "Black", [4, 0]),
	createVariantSpecies(dogBase, 2, "Orange", [8, 0]),
	createVariantSpecies(dogBase, 3, "Brown", [12, 0]),
	createVariantSpecies(dogBase, 4, "Yellow", [16, 0]),
	createVariantSpecies(dogBase, 5, "Purple", [20, 0]),
];

// Parrot: 5种，竖向排列，frameSize=24，单个体 11列×1行
const parrotBase: StardewSpeciesDefinition = {
	id: "stardew/parrot",
	label: "Parrot",
	sprite: "parrot",
	frameSize: 24,
	scale: 1,
	moveDist: 22,
	animations: parrotAnimations,
	persona: {
		identity: "A chatty parrot from Ginger Island",
		temperament: "Lively, quick-tongued, and a master of mimicry",
		rantStyle: "Squawks in a pirate's rasp, repeating gossip it overheard on the docks",
	},
};
const parrotVariants = [
	parrotBase,
	createVariantSpecies(parrotBase, 1, "Small", [0, 1]),
	createVariantSpecies(parrotBase, 2, "Colourful", [0, 2]),
	createVariantSpecies(parrotBase, 3, "Small-Colourful", [0, 3]),
	createVariantSpecies(parrotBase, 4, "Golden", [0, 4]),
];

// Junimo: 11种有效（4×3排列，最后一格透明），frameSize=16，单个体 8列×6行
const junimoBase: StardewSpeciesDefinition = {
	id: "stardew/junimo",
	label: "Junimo",
	sprite: "junimo",
	frameSize: 16,
	scale: 1,
	moveDist: 20,
	animations: junimoAnimations,
	persona: {
		identity: "A mysterious Junimo spirit of the forest",
		temperament: "Gentle and shy—it watches everything with quiet, ancient curiosity",
		rantStyle: "Whispers like rustling leaves, weaving strange little words from another world",
	},
};
const junimoVariants = [
	junimoBase,
	createVariantSpecies(junimoBase, 1, "Black", [8, 0]),
	createVariantSpecies(junimoBase, 2, "Gray", [16, 0]),
	createVariantSpecies(junimoBase, 3, "Pink", [24, 0]),
	createVariantSpecies(junimoBase, 4, "Red", [0, 6]),
	createVariantSpecies(junimoBase, 5, "Orange", [8, 6]),
	createVariantSpecies(junimoBase, 6, "Yellow", [16, 6]),
	createVariantSpecies(junimoBase, 7, "Green", [24, 6]),
	createVariantSpecies(junimoBase, 8, "Cyan", [0, 12]),
	createVariantSpecies(junimoBase, 9, "Purple", [8, 12]),
	createVariantSpecies(junimoBase, 10, "Brown", [16, 12]),
	// 第12个 [24, 12] 全透明，跳过
];

const speciesList: StardewSpeciesDefinition[] = [
	...catVariants,
	...chickenVariants,
	{
		id: "stardew/cow",
		label: "Cow",
		sprite: "cow",
		frameSize: 32,
		scale: 1,
		moveDist: 16,
		animations: {
			idle: A([[0, 0]], 5, { loop: false }),
			moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
			moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
			moveLeft: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5, { flip: true }),
			moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
			special: A([[0, 4], [1, 4], [3, 4], [2, 4], [3, 4], [1, 4], [0, 4]], 5, { loop: false }),
			sleep: A([[0, 3], [1, 3]], 4),
		},
		persona: {
			identity: "A gentle barn cow",
			temperament: "Placid, patient, and content with the simple pleasures of the pasture",
			rantStyle: "Offers advice as slowly as she chews her cud—steady and full of quiet certainty",
		},
	},
	...dogVariants,
	{
		id: "stardew/duck",
		label: "Duck",
		sprite: "duck",
		frameSize: 16,
		scale: 1,
		moveDist: 20,
		animations: {
			idle: A([[0, 0]], 5, { loop: false }),
			moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
			moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
			moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
			moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
			special: A([[0, 6], [1, 6], [2, 6], [3, 6], [2, 6], [3, 6], [2, 6], [1, 6], [0, 6]], 5, { loop: false }),
			sleep: A([[0, 7], [1, 7]], 1),
		},
		persona: {
			identity: "A cheerful pond duck",
			temperament: "Quirky and curious—always splashing into the next thing",
			rantStyle: "Quacks in fits and starts, darting from one thought to the next like ripples on a pond",
		},
	},
	{
		id: "stardew/dino",
		label: "Dinosaur",
		sprite: "dino",
		frameSize: 16,
		scale: 1,
		moveDist: 24,
		animations: {
			idle: A([[0, 0]], 5, { loop: false }),
			moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
			moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
			moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
			moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
			special: A([[0, 6], [1, 6], [2, 6], [3, 6], [0, 6], [0, 0]], 5, { loop: false }),
			sleep: A([[0, 4], [1, 4]], 4),
		},
		persona: {
			identity: "A peculiar prehistoric lizard",
			temperament: "Proud and unpredictable—it still walks like it owns the valley",
			rantStyle: "Roars with dramatic flair, as if narrating the lost epoch it came from",
		},
	},
	...parrotVariants,
	...junimoVariants,
	{
		id: "stardew/turtle",
		label: "Turtle",
		sprite: "turtle",
		frameSize: 32,
		scale: 1,
		moveDist: 12,
		animations: {
			idle: A([[0, 4]], 5, { loop: false }),
			moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 2),
			moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 2),
			moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 2),
			moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 2),
			special: A([[0, 6], [1, 6], [2, 6], [3, 6]], 5),
			sleep: A([[0, 4], [1, 4], [2, 4], [3, 4], [0, 5]], 5, { loop: false }),
		},
		persona: {
			identity: "A wise old turtle",
			temperament: "Patient and steady—never rushed, never late, always exactly on time",
			rantStyle: "Doles out counsel at a glacial pace, each word weighed like a polished stone",
		},
	},
];

// ===== NPC 定义 =====
// NPC 贴图：16x32 帧，4 列。Row 0-3 为行走动画（下/右/上/左），第 4 行起为
// 额外姿态，由 NPC_EXTRA_ANIMATIONS 逐角色策展。
// Row 0: 下, Row 1: 右, Row 2: 上, Row 3: 左

const npcAnimations: StardewSpeciesDefinition["animations"] = {
	idle: A([[0, 0]], 5, { loop: false }),
	moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
	moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
	moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
	moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
};

// 第 4 行起的额外动作，逐角色目检接触表（scripts/make-contact-sheets.py）后策展，
// 并经 scripts/analyze-edges.py 逐格像素分析确认组合帧边界。
// 帧坐标含义见每条末尾注释（用了哪些行、跳过了哪些行）。
// 规则：婚纱/正装帧一律不用；整行填充色（Shane r9-10）、全透明行（Maru r8）、
// 孤立空白/填充格一律避开；移动联动行（转身/背面行走）不作原地动画。
// 特殊帧型（StardewAnimation 的对应字段）：
// - span {w:2}：横向 32 宽组合帧（Clint 打铁、Elliott 钓鱼竿），人物默认在左格，
//   在右格时设 anchorX:1；拆开单格会只剩砧板碎片/竿尖。
// - span {h:2}：竖向 64 高组合帧（Pam 拖把、Dick/Willy 钓鱼线），人物在上格。
// - 往返/跨行序列用显式帧列表表达（如 Alex 举重 r7c2→r7c3→r8c0→r7c3）。
// - transitionOut: "reverse"：离开该动画时倒放一遍再切换（如下蹲后起身）。
// - travel：侧向移动联动行，行走时随机替代普通走姿（仅水平移动）。
// 帧率分档（有动画的条目按动作快慢逐条设定，整体偏慢以强调"场景感"）：
// - 1–2 fps：慢节奏持续动作与手上劳作（阅读、冥想、钓鱼、抽烟、思考、
//   烹饪、拖地、扫地、雕刻、作画、搅拌、打铁、喝水、摘帽）
// - 3 fps：动态动作（跳绳、健身操、舞蹈、焊接、沙滩玩耍、机器操作、
//   收银、说话手势、举重、拍手）
// travel 3 fps（比行走帧的 5 fps 更舒缓）。
// 所有引用帧由 scripts/verify-frames.py 校验为真实素材（含 span 区域每格）。
// gesture 仅保留"震惊"反应帧（Clint/Linus/Maru/Morris/Pierre/Robin），其余角色的
// 手势帧经导出 GIF 人工复查（scripts/export-animations.py → scripts/out/anim-review/）
// 观感不佳，一律不配 gesture；同样经人工复查弃用的素材在条目注释中标注。
// Dwarf/Krobus/Sandy 的图集只有行走帧，无任何额外动作（不复用行走帧冒充）。
// 缺 gesture/rest/activity 键的角色由调用方兜底链（gesture → special → idle）兼容。
const NPC_EXTRA_ANIMATIONS: Record<string, StardewSpeciesDefinition["animations"]> = {
	Abigail: {
		activity: [
			A([[0, 4], [1, 4], [2, 4], [3, 4]], 2),
			A([[0, 12], [1, 12]], 2),
		],
	}, // r4 吹笛；r12 弹吉他(2帧)；r9-11 婚纱跳过；无坐姿行
	Alex: {
		rest: A([[0, 9], [1, 9], [2, 9]], 2),
		activity: A([[2, 7], [3, 7], [0, 8], [3, 7]], 3),
	}, // r9c0-2 坐姿阅读(3帧)；举重跨行往返序列: r7c2→r7c3→r8c0→r7c3；r4-5 橄榄球转身(移动联动)未用；r11 背面行走；r12 正装
	Caroline: {
		activity: A([[0, 4], [0, 4], [1, 4], [1, 4], [0, 4], [0, 4], [2, 4], [2, 4]], 3),
	}, // r4c0-2 原地健身(背→右→背→左, 每拍重复2帧, 与原版 caroline_exercise 一致)；无坐姿行
	Clint: {
		gesture: A([[3, 9]], 3, { loop: false }),
		activity: [
			A([[0, 4], [2, 4]], 2, { span: { w: 2, h: 1 } }),
			A([[0, 8], [2, 8], [0, 9]], 2, { span: { w: 2, h: 1, anchorX: 1 } }),
			A([[0, 5], [2, 5]], 2, { span: { w: 2, h: 1 } }),
		],
	}, // r9c3 单帧正面震惊(灰脸)；打铁全是 32 宽组合帧：r4 敲砧(砧板在右格, c0-1/c2-3 两帧)；r8c0→r8c2→r9c0 抡锤上举→挥下→下砸(人物均在右格)；r5 查看铁条；r6-7 为两组 32x64 四格组合, 当前 span 无法完整表达, 弃用
	Dick: {
		activity: [
			A([[0, 4], [1, 4], [2, 4], [3, 4]], 2, { span: { w: 1, h: 2 } }),
			A([[0, 7], [1, 7], [2, 7], [3, 7]], 2),
		],
	}, // r4+r5 竖向组合钓鱼(人物在上格, 鱼线/浮漂垂入下格, 拆开会只剩浮漂)；r7 侧面喝水；r6 坐姿帧人工复查弃用
	Elliott: {
		rest: A([[2, 7]], 2),
		activity: [
			A([[0, 10], [2, 10]], 2, { span: { w: 2, h: 1 } }),
			A([[0, 5], [1, 5], [2, 5]], 2),
			A([[0, 9], [1, 9]], 2),
		],
	}, // r10 横向组合钓鱼(c0-1/c2-3 两帧, 鱼竿伸入右格, 拆开就是悬空竿尖)；r5 侧面阅读3帧(c3空)；r7c2 单帧正面坐姿；r9 戴墨镜侧面摆动2帧(c2-3填充)；r6/r11 背面行走(移动联动)；r12 正装
	Emily: {
		rest: A([[0, 6], [1, 6]], 2),
		activity: [
			A([[0, 12], [1, 12], [2, 12], [3, 12]], 3),
			A([[0, 13], [1, 13], [2, 13], [3, 13]], 3),
		],
	}, // r6c0-1 打坐(c2-3 站立弃用)；r12/r13 两组正面跳舞；r4/r5/r8 转身舞(移动联动)未用；r9-11 婚纱
	Evelyn: {
		rest: A([[0, 4]], 1),
	}, // r4 四向坐姿姿势组, 仅 c0 侧坐可用作定格
	George: {
		rest: A([[0, 4]], 1),
	}, // r4c0 轮椅坐姿, 唯一可用帧(c1 空, c2-3 填充)
	Gus: {
		activity: A([[0, 4], [1, 4], [2, 4], [3, 4]], 2),
	}, // r4 烹饪/上菜
	Haley: {
		activity: [
			A([[3, 5]], 2),
			A([[2, 7], [3, 7]], 2),
		],
	}, // r5c3 侧面举相机定格、r7c2-3 正面举相机；r8 侧面拍照人工复查弃用；其余转身/过渡帧未用；r9-11 婚纱；无坐姿
	Harvey: {
		rest: A([[0, 10], [1, 10]], 2),
		activity: A([[3, 9], [2, 10], [3, 10]], 2),
	}, // r10c0-1 侧面坐姿阅读/翻页(rest)；正面阅读: r9c3→r10c2→r10c3；r4/r8-9 其余为混合朝向姿势组；r6/r7/r11 移动联动未用；r12 正装
	Jas: {
		activity: A([[0, 4], [1, 4], [2, 4], [3, 4]], 3),
	}, // r4 跳绳；r5 蹲下→侧坐人工复查弃用
	Jodi: {
		activity: [
			A([[0, 4], [1, 4]], 2),
			A([[0, 5], [1, 5], [2, 5], [3, 5]], 3),
		],
	}, // r4c0-1 背对灶台烹饪(每格自包含, 非 span)；r4c3 与 r5c0 完全重复不插入；r5 原地健身操
	Leah: {
		rest: A([[0, 7], [1, 7]], 1),
		activity: [
			A([[0, 4], [1, 4], [2, 4], [3, 4]], 2),
			A([[0, 8], [1, 8], [2, 8], [3, 8]], 2),
		],
	}, // r7c0-1 正面坐姿(c2-3 抱臂站立未用)；r4 侧面雕刻；r8 正面画架工作；r5 作画人工复查弃用；r9-11 婚纱
	Linus: {
		gesture: A([[2, 5]], 4, { loop: false }),
	}, // r5c2 单帧正面震惊反应；r5c0-1 侧面进食人工复查弃用；r4 不同装束正面姿势未用(避免装束跳变)
	Marcello: {
		activity: A([[0, 4], [1, 4]], 2),
	}, // r4c0-1 摘帽致意(仅2帧, c2-3 填充)
	Marnie: {
		activity: [
			A([[0, 5], [1, 5], [2, 5], [3, 5]], 2),
			A([[0, 6], [1, 6], [2, 6], [3, 6]], 3),
		],
	}, // r5 侧面喝水；r6 原地跳绳
	Maru: {
		gesture: A([[3, 6]], 4, { loop: false }),
		activity: [
			A([[0, 4], [1, 4], [2, 4], [3, 4]], 3),
			A([[0, 5], [1, 5], [2, 5], [3, 5]], 3),
		],
	}, // r6c3 单帧正面震惊(c2 非震惊弃用)；r4 侧面机器操作, r5 焊接火花；r7 转身(移动联动)未用；r8 全透明；r9-11 婚纱；无坐姿行
	Morris: {
		gesture: A([[3, 4]], 4, { loop: false }),
		activity: [
			A([[0, 4], [1, 4], [2, 4]], 2),
			A([[0, 5], [1, 5], [2, 5], [3, 5]], 3),
		],
	}, // r4c3 单帧正面震惊；r4c0-2 同向警觉反应(头顶感叹号, 完整单格)；r5 同向原地说话手势；无坐姿/休息帧
	Pam: {
		activity: A([[0, 4], [1, 4], [2, 4], [3, 4]], 2, { span: { w: 1, h: 2 } }),
	}, // r4+r5 竖向组合拖地(人物在上格, 拖把杆/头垂入下格, 拆开会只剩拖把头)；r6c0 单帧正面(c1-3 填充)
	Penny: {
		rest: A([[0, 6], [1, 6]], 1),
		activity: A([[1, 7], [2, 7]], 2),
	}, // r6c0-1 背向靠背椅坐姿阅读(c2-3 站立反应帧弃用)；r7c1-2 背面持书/翻页(仅4像素差异, 2fps 防闪烁)；r4 正面阅读人工复查弃用；r7/r8 其余混合朝向、换装或反应帧未用；r9-11 婚纱
	Pierre: {
		gesture: A([[0, 4]], 4, { loop: false }),
		activity: A([[1, 5], [2, 5]], 2),
	}, // r4c0 单帧正面震惊举手；r4c1-3 侧向移步伸臂(腿部交替, 不作原地 activity)；r5c1-2 侧向站立思考/说话手势(c0 过渡步、c3 正面收尾不混入)；无坐姿
	Robin: {
		gesture: A([[3, 4]], 4, { loop: false }),
		activity: [
			A([[0, 6], [1, 6], [2, 6]], 2),
			A([[0, 7], [1, 7], [2, 7], [3, 7]], 3),
			A([[0, 8], [1, 8], [2, 8], [3, 8]], 3),
		],
	}, // r4c3 单帧正面震惊；r6 取 c0-2 同朝右原地抡锤(c3 朝左弃用)；r7 原地健身；r8 正面拍手；r5 锯木人工复查弃用；无坐姿，图集仅 r0-r8
	Sam: {
		activity: [
			A([[0, 10], [1, 10], [2, 10], [1, 10]], 2),
			A([[1, 6], [2, 6], [3, 6]], 2),
		],
		travel: A([[0, 7], [1, 7], [2, 7]], 3),
	}, // r10 往返扫地(c3 空, 重复 c1 形成 ping-pong)；r6c1-3 正面滑板；r7c0-2 右向蹬板滑行(准备→蹬地→收腿)；r5 吉他、r9 持板侧立人工复查弃用；r8 腾空技巧段未用；r11 背面行走；r12 正装
	Sebastian: {
		activity: [
			A([[0, 5], [1, 5], [2, 5], [3, 5]], 2),
			A([[0, 7], [1, 7], [2, 7], [3, 7]], 2),
		],
	}, // r5 侧面抽烟；r7 骑车坐姿待机(原地, 不设 travel)；r6 台球、r8+r9c0 电脑人工复查弃用；r9c1-3 道具特效/r10 混合朝向剧情/r11 背面载具未用；r12 正装跳过；无通用 rest
	Shane: {
		activity: [
			A([[0, 5], [1, 5], [2, 5], [3, 5], [0, 6], [1, 6]], 2),
			A([[0, 7], [1, 7]], 2),
		],
	}, // r5→r6c1 正面喝酒；r7c0-1 抱鸡；r4 摄影、r6c2-3 侧向喝酒、r7c2→r8c1 足球、r8c2-3 侧跪人工复查弃用；r9-10 整行填充、r11 背面行走、r12 正装跳过
	Shane_JojaMart: {
		activity: [
			A([[0, 4], [1, 4], [2, 4], [3, 4]], 3),
			A([[0, 5], [1, 5], [2, 5], [3, 5], [0, 6], [1, 6], [2, 6], [3, 6]], 3),
		],
	}, // r4 正面收银手势；r5→r6 正面操作→侧身递物→回正跨行序列；无坐姿/休息帧
	Toddler: {
		travel: A([[0, 5], [1, 5], [2, 5], [3, 5]], 2),
	}, // r5 右向爬行作 travel；r4 正面张臂人工复查弃用；无坐姿/原地活动行
	Toddler_dark: {
		travel: A([[0, 5], [1, 5], [2, 5], [3, 5]], 2),
	}, // 布局同 Toddler（已逐张核对）
	Toddler_girl: {
		travel: A([[0, 5], [1, 5], [2, 5], [3, 5]], 2),
	}, // 布局同 Toddler（已逐张核对）
	Toddler_girl_dark: {
		travel: A([[0, 5], [1, 5], [2, 5], [3, 5]], 2),
	}, // 布局同 Toddler_girl（已逐张核对）
	Vincent: {
		rest: A([[0, 6]], 1),
		activity: [
			A([[2, 4], [2, 4], [2, 4], [2, 4], [3, 4], [3, 4], [3, 4], [3, 4]], 3),
			A([[0, 2], [1, 5], [0, 2], [0, 5]], 3),
		],
	}, // r6c0 侧坐阅读单帧 rest(c1-3 填充)；r4c2-3 沙滩玩耍每拍重复4帧；舞蹈跨行序列: r2c0→r5c1→r2c0→r5c0(与原版一致)；r4c0-1 背身举手未用；r5c2-3 正面玩耍人工复查弃用
	Willy: {
		activity: [
			A([[0, 4], [1, 4], [2, 4], [3, 4]], 2, { span: { w: 1, h: 2 } }),
			A([[0, 7], [1, 7], [2, 7], [3, 7]], 2),
		],
	}, // 图集与 Dick 逐字节一致：r4+r5 竖向组合钓鱼(人物上格, 鱼线/浮漂垂入下格)；r7 侧面喝水；r6 坐姿帧人工复查弃用
	Wizard: {
		activity: A([[0, 5], [1, 5], [2, 5], [1, 5]], 2),
	}, // r5 坩埚搅拌, 回插 c1 形成平滑往返(c3 空)；r4 施法手势人工复查弃用；无阅读/坐姿行, 全部单格无需 span
};

function N(name: string, visitHours: [number, number], persona: StardewPersona): StardewSpeciesDefinition {
	return {
		id: `${NPC_TYPE_PREFIX}${name}`,
		label: name,
		sprite: name,
		frameWidth: 16,
		frameHeight: 32,
		scale: 1.5,
		moveDist: 22,
		animations: { ...npcAnimations, ...(NPC_EXTRA_ANIMATIONS[name] ?? {}) },
		persona,
		visitHours,
	};
}

// Personas are deliberately terse: a voice direction plus one sample line
// in the character's own words. This keeps AI output sounding like actual
// Stardew dialogue files instead of flowery prose.
const npcList: StardewSpeciesDefinition[] = [
	N("Abigail", [13, 22], {
		identity: "Pierre's daughter; purple hair, plays flute, hunts monsters in the mines",
		temperament: "Adventurous, a little moody, hates being told to act like a lady",
		rantStyle: "Casual and daring, talks about the mines, video games, and rain. Example: 'I ate an amethyst once. Don't judge me.'",
	}),
	N("Alex", [8, 18], {
		identity: "The town jock; lives with his grandparents, trains for gridball",
		temperament: "Cocky on the surface, secretly soft about his dog Dusty and his late mom",
		rantStyle: "Sporty slang, calls you 'buddy', brags then gets unexpectedly sincere. Example: 'You look like you could use a workout, buddy. No offense.'",
	}),
	N("Caroline", [9, 17], {
		identity: "Pierre's wife, Abigail's mom; grows tea in her sunroom",
		temperament: "Warm, restless, quietly wishes life were a little more exciting",
		rantStyle: "Friendly mom-chat about gardening and family, with a wistful edge. Example: 'Some days I just want to lock the shop and go for a long walk.'",
	}),
	N("Clint", [9, 23], {
		identity: "The blacksmith; upgrades your tools, sweet on Emily",
		temperament: "Gruff, awkward, lonelier than he admits",
		rantStyle: "Short workman sentences about metal and tools, trailing off when feelings come up. Example: 'I'm good with metal. People, not so much.'",
	}),
	N("Demetrius", [9, 20], {
		identity: "Robin husband; the valley's scientist, studies the local ecosystem",
		temperament: "Analytical, well-meaning, terrible at reading the room",
		rantStyle: "Precise and clinical, turns everything into an observation or a hypothesis. Example: 'Fascinating. This warrants further study.'",
	}),
	N("Dick", [6, 17], {
		identity: "A young angler who practically lives on the docks",
		temperament: "Easygoing, sun-baked, always halfway into a fishing story",
		rantStyle: "Laid-back dock talk, everything comes back to the one that got away. Example: 'You should've seen the size of it. Swear on my tackle box.'",
	}),
	{ ...N("Dwarf", [10, 18], {
		identity: "A small being from the mines; speaks Dwarvish, wary of humans",
		temperament: "Suspicious but curious, slowly warming to the surface world",
		rantStyle: "Halting, old-fashioned phrasing, like someone still learning your language. Example: 'You... are not like other humans. This is good.'",
	}), frameHeight: 24 },
	N("Elliott", [10, 22], {
		identity: "A novelist living alone in a beach cabin; dramatic hair, dramatic soul",
		temperament: "Romantic, flowery, takes art very seriously",
		rantStyle: "Lush literary sentences, but keep it to one breath. Example: 'Ah, the written word! A lighthouse for the soul.'",
	}),
	N("Emily", [10, 23], {
		identity: "Saloon barmaid, Haley's sister; dyes her own hair, talks to parrots",
		temperament: "Bubbly, spiritual, wonderfully weird",
		rantStyle: "Bright free-association about auras, dreams, and fabric. Example: 'Your aura is looking really teal today. That's a good sign!'",
	}),
	N("Evelyn", [8, 17], {
		identity: "The town grandma; George's wife, Alex's grandmother, bakes cookies",
		temperament: "Sweet, nurturing, always feeding someone",
		rantStyle: "Gentle grandmother fussing, offers cookies and local gossip. Example: 'You're too skinny, dear. Have a cookie.'",
	}),
	N("George", [8, 15], {
		identity: "Evelyn's cranky husband; wheelchair-bound, yells at the TV",
		temperament: "Grumpy, stubborn, secretly kind underneath decades of bristle",
		rantStyle: "Grumbling complaints about noise, kids, and modern nonsense. Example: 'Bah. In my day we didn't need all this... whatever this is.'",
	}),
	N("Gus", [12, 24], {
		identity: "Owns the Stardrop Saloon; cooks for the whole town",
		temperament: "Jovial, generous, worries about Pam's tab and Emily's safety",
		rantStyle: "Warm host energy, always about to offer you today's special. Example: 'Sit down, relax. First rule of the saloon: nobody drinks sad.'",
	}),
	N("Haley", [11, 19], {
		identity: "Emily's sister; photographer, loves fashion and pink",
		temperament: "Vain and snarky at first, genuinely sweet once you know her",
		rantStyle: "Slightly sassy, judges appearances, obsessed with good lighting. Example: 'Ugh, this lighting is tragic. Hold still, I need a photo.'",
	}),
	N("Harvey", [9, 17], {
		identity: "The town doctor; runs the clinic, flies model planes",
		temperament: "Gentle, anxious, a bit awkward about being everyone's doctor",
		rantStyle: "Soft doctor-voice, health advice delivered apologetically. Example: 'Have you been sleeping enough? Sorry, occupational hazard.'",
	}),
	N("Jas", [9, 17], {
		identity: "Little girl at Marnie's ranch; Vincent's best friend, scared of her godfather Shane",
		temperament: "Shy, sweet, sees the world with kid logic",
		rantStyle: "Small, innocent sentences about school, animals, and fairy tales. Example: 'Do you think rabbits go to school too?'",
	}),
	N("Jodi", [9, 19], {
		identity: "Sam and Vincent's mom; keeps house, misses having her own hobbies",
		temperament: "Tired but loving, classic suburban mom",
		rantStyle: "Warm mom-chatter about chores, the boys, and casseroles. Example: 'One day the boys will cook for ME. A mother can dream.'",
	}),
	N("Kent", [9, 20], {
		identity: "Jodi's husband; came back from the war last year",
		temperament: "Quiet, haunted, slowly relearning ordinary life",
		rantStyle: "Few words, long pauses, ordinary things said with weight. Example: 'It's quiet here. That's... good. Quiet is good.'",
	}),
	{ ...N("Krobus", [0, 24], {
		identity: "A gentle shadow person living in the sewers; sells rare goods on Fridays",
		temperament: "Timid, polite, terrified of hostile humans but desperate for friends",
		rantStyle: "Careful, hushed politeness from someone not used to being spoken to kindly. Example: 'You... visit me? Most humans throw rocks.'",
	}), frameHeight: 24 },
	N("Leah", [10, 20], {
		identity: "Sculptor in a forest cabin; left the city to make real art",
		temperament: "Grounded, creative, determined not to sell out",
		rantStyle: "Plain-spoken artist talk about wood, ideas, and making rent. Example: 'The sculpture's not working, but I think the failure is saying something.'",
	}),
	N("Lewis", [8, 22], {
		identity: "Mayor of Pelican Town for twenty years; nobody's ever run against him",
		temperament: "Proud, proper, a little vain, one or two secrets he'd rather keep",
		rantStyle: "Official small-town mayor voice that occasionally slips into something personal. Example: 'As mayor, I take great pride in— ahem. You didn't see anything.'",
	}),
	N("Linus", [6, 19], {
		identity: "Lives in a tent by the lake; the town mostly ignores him",
		temperament: "Serene, self-sufficient, quietly wounded by how people treat him",
		rantStyle: "Calm, simple wisdom about nature and not needing much. Example: 'People throw away good things. I just pick them up.'",
	}),
	N("Marcello", [12, 24], {
		identity: "The Wizard's young apprentice in the tower",
		temperament: "Earnest, over his head, thrilled by every spark of magic",
		rantStyle: "Nervous apprentice babble about spells gone slightly wrong. Example: 'The book says this incantation is perfectly safe. Probably.'",
	}),
	N("Marnie", [9, 21], {
		identity: "Runs the ranch south of town; Shane's aunt, sells animals and hay",
		temperament: "Warm, scatterbrained, loves her animals more than people",
		rantStyle: "Folksy barn talk, calls every animal 'sweetie'. Example: 'The cows were extra cuddly this morning. Best part of my day.'",
	}),
	N("Maru", [9, 17], {
		identity: "Demetrius's daughter; nurse at the clinic, builds gadgets in her spare time",
		temperament: "Bright, inventive, optimistic engineer energy",
		rantStyle: "Enthusiastic tinkerer talk, half science half glee. Example: 'I almost got the radio working! Only two small explosions.'",
	}),
	N("Morris", [9, 23], {
		identity: "JojaMart branch manager; always recruiting for the Joja team",
		temperament: "Corporate, smiling, faintly sinister in a customer-service way",
		rantStyle: "Polished sales-speak and membership pitches. Example: 'Have you considered a Joja membership? Five thousand gold is a small price for happiness.'",
	}),
	N("Pam", [10, 24], {
		identity: "Penny's mom; drives the bus, drinks at the saloon every night",
		temperament: "Loud, rough-around-the-edges, fiercely loyal to her daughter",
		rantStyle: "Bar-stool bluntness, big laugh, zero filter. Example: '*hic* You're alright. Anyone ever tell you that?'",
	}),
	N("Penny", [9, 18], {
		identity: "Tutors Jas and Vincent; lives with Pam in the trailer",
		temperament: "Gentle, bookish, quietly dreams of a better home",
		rantStyle: "Soft, thoughtful sentences about books and the kids. Example: 'The kids made me a card today. I might have cried a little.'",
	}),
	N("Pierre", [9, 17], {
		identity: "Owns the general store; competes with JojaMart, closed Wednesdays",
		temperament: "Hardworking shopkeeper, a bit tightly wound, loves a good sale",
		rantStyle: "Merchant patter about stock, prices, and beating Joja. Example: 'Locally grown, fairly priced. That's the Pierre guarantee.'",
	}),
	N("Robin", [9, 20], {
		identity: "The town carpenter; Demetrius's wife, Sebastian and Maru's mom",
		temperament: "Cheerful, capable, always in the middle of building something",
		rantStyle: "Upbeat handywoman energy, measuring twice and cutting once. Example: 'Give me a hammer and a weekend and I can fix anything. Almost.'",
	}),
	N("Sam", [10, 21], {
		identity: "Jodi's son; skates, plays guitar in a band, works part-time at JojaMart",
		temperament: "Sunny, easygoing, allergic to taking things seriously",
		rantStyle: "Casual skater-boy talk about music, snacks, and weekend plans. Example: 'Dude, when the band makes it big, you're getting free tickets.'",
	}),
	N("Sandy", [9, 23], {
		identity: "Runs the Oasis shop out in the Calico Desert",
		temperament: "Warm, unflappable, has seen every kind of traveler",
		rantStyle: "Relaxed desert-shopkeeper friendliness. Example: 'Welcome to the Oasis! Drink water. Everyone forgets to drink water.'",
	}),
	N("Sebastian", [15, 22], {
		identity: "Robin's son; freelance programmer, lives in the basement, rides a motorcycle",
		temperament: "Introverted, sardonic, dreams of moving to the city",
		rantStyle: "Low, dry, self-deprecating; talks about code, rain, and getting out of town. Example: 'Another all-nighter... at least the compiler doesn't judge me.'",
	}),
	N("Shane", [9, 23], {
		identity: "Marnie's nephew; rents a room at the ranch, raises blue chickens",
		temperament: "Grumpy, self-loathing, slowly learning to hope",
		rantStyle: "Blunt, weary, surprised by his own moments of softness. Example: 'Don't mind me. I'm just... trying my best, I guess.'",
	}),
	N("Shane_JojaMart", [9, 17], {
		identity: "Shane in his JojaMart uniform, stocking shelves for minimum wage",
		temperament: "Bored, irritable, counting the hours till the saloon",
		rantStyle: "Dead-eyed retail sighs and muttered complaints. Example: 'Welcome to JojaMart. ...That's the script. I don't write it.'",
	}),
	N("Toddler", [9, 18], {
		identity: "One of the town's littlest kids",
		temperament: "Innocent, bouncy, newly verbal",
		rantStyle: "Simple excited kid-babble. Example: 'I saw a bug THIS big!'",
	}),
	N("Toddler_dark", [9, 18], {
		identity: "One of the town's littlest kids",
		temperament: "Playful, curious, tiny bit mischievous",
		rantStyle: "Simple excited kid-babble. Example: 'Wanna see what I found? It's a secret.'",
	}),
	N("Toddler_girl", [9, 18], {
		identity: "One of the town's littlest kids",
		temperament: "Sweet, lively, princess energy in a small package",
		rantStyle: "Simple excited kid-babble. Example: 'I'm gonna be a butterfly when I grow up!'",
	}),
	N("Toddler_girl_dark", [9, 18], {
		identity: "One of the town's littlest kids",
		temperament: "Gentle, shy, wide-eyed",
		rantStyle: "Simple excited kid-babble. Example: 'Shhh... the bunny is sleeping.'",
	}),
	N("Vincent", [9, 17], {
		identity: "Jodi's youngest; collects bugs, idolizes his big brother Sam",
		temperament: "Hyper, innocent, pockets full of worms",
		rantStyle: "Breathless little-kid excitement about gross and cool things. Example: 'Look! A worm! You can have it if you want!'",
	}),
	N("Willy", [6, 17], {
		identity: "Old fisherman; runs the fish shop on the docks",
		temperament: "Hearty, patient, salt of the earth",
		rantStyle: "Slow seadog yarns about tides, bait, and legendary catches. Example: 'The sea gives and the sea takes, lad. Mostly takes.'",
	}),
	N("Wizard", [6, 23], {
		identity: "M. Rasmodius; studies the arcane in his tower west of the forest",
		temperament: "Aloof, cryptic, mildly exasperated by mortals",
		rantStyle: "Measured arcane pronouncements, every word deliberate. Example: 'The spirits whisper of your arrival. They are... cautiously optimistic.'",
	}),
];

const speciesById = new Map(
	[...speciesList, ...npcList].map((species) => [species.id, species])
);

export const STARDEW_SPECIES_OPTIONS: SelectorOption[] = [...speciesList, ...npcList].map((species) => {
	const moveAnim = toAnimation(species.animations.moveRight) ?? toAnimation(species.animations.moveDown);
	const fw = species.frameWidth || species.frameSize || 16;
	const fh = species.frameHeight || species.frameSize || 16;
	const spriteUrl = isNpcSpeciesType(species.id)
		? getStardewNpcAsset(species.sprite)
		: getStardewPetAsset(species.sprite as StardewPetSpriteKey);
	return {
		value: species.id,
		label: species.label,
		requiresName: !isNpcSpeciesType(species.id),
		spriteData: moveAnim ? {
			url: spriteUrl,
			scale: species.scale,
			frameWidth: fw,
			frameHeight: fh,
			variantOffset: species.variantOffset,
			moveFrames: moveAnim.frames,
			fps: moveAnim.fps,
		} : undefined,
	};
});

export function toAnimation(animation: StardewAnimation | StardewAnimation[] | undefined): StardewAnimation | undefined {
	if (!animation) return undefined;
	if (!Array.isArray(animation)) return animation;
	// Pick a random variant when multiple animations are defined (e.g. Junimo special)
	return animation[Math.floor(Math.random() * animation.length)];
}

export function getStardewSpeciesDefinition(type: string): StardewSpeciesDefinition | undefined {
	return speciesById.get(type);
}

export function isStardewSpecies(type: string): boolean {
	return speciesById.has(type);
}

export function getStardewSpeciesPersona(type: string) {
	return speciesById.get(type)?.persona;
}

export function getNpcSpeciesList(): StardewSpeciesDefinition[] {
	return npcList;
}

export function getStardewSpeciesSprite(type: string): string {
	const species = speciesById.get(type);
	if (!species) {
		throw new Error(`Unknown Stardew species: ${type}`);
	}
	if (isNpcSpeciesType(type)) {
		return getStardewNpcAsset(species.sprite);
	}
	return getStardewPetAsset(species.sprite as StardewPetSpriteKey);
}
