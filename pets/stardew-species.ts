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

function A(frames: StardewFrame[], fps: number, options: { loop?: boolean; flip?: boolean } = {}): StardewAnimation {
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
// NPC 贴图：16x32 帧，4 列，只使用前 4 行（行走动画），多余行舍去
// Row 0: 下, Row 1: 右, Row 2: 上, Row 3: 左

const npcAnimations: StardewSpeciesDefinition["animations"] = {
	idle: A([[0, 0]], 5, { loop: false }),
	moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
	moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
	moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
	moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
};

function N(name: string, persona: StardewPersona): StardewSpeciesDefinition {
	return {
		id: `${NPC_TYPE_PREFIX}${name}`,
		label: name,
		sprite: name,
		frameWidth: 16,
		frameHeight: 32,
		scale: 1.5,
		moveDist: 22,
		animations: npcAnimations,
		persona,
	};
}

const npcList: StardewSpeciesDefinition[] = [
	N("Abigail", {
		identity: "Pierre's purple-haired daughter",
		temperament: "Rebellious and curious—she'd rather explore a cave than sit still",
		rantStyle: "Talks like she's describing a hidden dungeon level, always chasing the next adventure",
	}),
	N("Alex", {
		identity: "A born athlete living with his grandparents",
		temperament: "Confident and competitive, but more sensitive than he lets on",
		rantStyle: "Calls things out like a sports commentator, sizing up every challenge as a game to win",
	}),
	N("Caroline", {
		identity: "Pierre's wife and Abigail's mother",
		temperament: "Warm and optimistic, with the free spirit of someone who's wandered far",
		rantStyle: "Chats like a neighbor swapping stories over the garden fence, voice light as a summer breeze",
	}),
	N("Clint", {
		identity: "Pelican Town's hardworking blacksmith",
		temperament: "Quiet and reserved—his hands speak louder than he ever does",
		rantStyle: "Mutters to himself at the anvil, blunt and to the point, with the warmth of hot iron",
	}),
	N("Demetrius", {
		identity: "A scientist living in the mountain cabin",
		temperament: "Logical and precise—he'd analyze a friendship like a lab experiment",
		rantStyle: "Describes things like he's reading a research abstract, every word chosen with care",
	}),
	N("Dick", {
		identity: "A young angler with salt in his veins",
		temperament: "Jovial and optimistic—he's got a sea story for every occasion",
		rantStyle: "Talks like he's leaning against the dock railing, voice rough but welcoming as the tide",
	}),
	{ ...N("Dwarf", {
		identity: "A mysterious little creature from deep within the mines",
		temperament: "Wary and secretive, yet endlessly curious about the surface world above",
		rantStyle: "Speaks like something that crawled out of the earth—strange phrasing, older than dust",
	}), frameHeight: 24 },
	N("Elliott", {
		identity: "A romantic writer living in a shack on the beach",
		temperament: "Elegant and passionate—every day is a page in his novel",
		rantStyle: "Orates like he's reciting poetry to the sea, every sentence lush and carefully composed",
	}),
	N("Emily", {
		identity: "The Stardrop Saloon's barmaid and Haley's spirited older sister",
		temperament: "Bubbly, warm, and delightfully unpredictable—her mind dances to its own music",
		rantStyle: "Bounces from thought to thought with cheerful sincerity, saying exactly what pops into her head",
	}),
	N("Evelyn", {
		identity: "George's devoted wife and Alex's doting grandmother",
		temperament: "Kindhearted and nurturing—she shows love through fresh-baked cookies",
		rantStyle: "Natters like a grandmother in her kitchen, fussing over you with flour-dusted hands",
	}),
	N("George", {
		identity: "A gruff old-timer who rarely leaves his wheelchair—or his opinions—unspoken",
		temperament: "Stubborn and cantankerous on the outside, surprisingly tender within",
		rantStyle: "Grumbles at the screen like a cranky grandpa yelling at the TV, with a soft spot he’d never admit to",
	}),
	N("Gus", {
		identity: "The jovial owner and head chef of the Stardrop Saloon",
		temperament: "Generous and welcoming—nobody leaves his bar hungry or unhappy",
		rantStyle: "Talks like he's recommending today's special, voice warm as fresh chowder by the fire",
	}),
	N("Haley", {
		identity: "Emily's fashion-forward younger sister",
		temperament: "A little vain and sharp-tongued, but sweetness hides beneath the polish",
		rantStyle: "Flipping through an imaginary magazine, picking at flaws with a barb wrapped in a smile",
	}),
	N("Harvey", {
		identity: "Pelican Town's dedicated—and slightly anxious—doctor",
		temperament: "Gentle and meticulous, though he worries more than his patients do",
		rantStyle: "Fusses like a doctor in his clinic, gentle but fretful, always reminding you to take care",
	}),
	N("Jas", {
		identity: "A sweet little girl who lives on Marnie's Ranch",
		temperament: "Shy and soft-spoken—she finds more comfort in flowers than in crowds",
		rantStyle: "Whispers like a child exploring the meadow, innocent and full of wonder at every little thing",
	}),
	N("Jodi", {
		identity: "Sam and Vincent's hardworking mother",
		temperament: "Diligent and kind, though the years have left her a touch weary",
		rantStyle: "Talks to herself while washing dishes, half-lost in thoughts of chores and distant dreams",
	}),
	N("Kent", {
		identity: "A recently returned soldier and Jodi's husband",
		temperament: "Quiet and withdrawn—he's still finding his footing back in civilian life",
		rantStyle: "Watches from the corner of the room, speaking only when it counts, every word heavy with weight",
	}),
	{ ...N("Krobus", {
		identity: "A shy shadow creature who calls the sewers home",
		temperament: "Timid and gentle—the darkness hides the kindest heart in the valley",
		rantStyle: "Speaks like a creature peeking out from a grate, quiet and careful, curious about human ways",
	}), frameHeight: 24 },
	N("Leah", {
		identity: "A sculptor who lives in a cozy cabin in Cindersap Forest",
		temperament: "Independent and down-to-earth—she finds beauty in wood grain and wildflowers",
		rantStyle: "Talks with simple, earthy warmth, like she's just discovered the perfect piece of driftwood",
	}),
	N("Lewis", {
		identity: "Pelican Town's longtime mayor",
		temperament: "Dutiful and proper—he carries the weight of the town on his shoulders",
		rantStyle: "Speaks like he's shuffling through paperwork, official yet tinged with private loneliness",
	}),
	N("Linus", {
		identity: "A wild man who lives in a tent north of town",
		temperament: "At peace with the world and utterly unconcerned with what others think",
		rantStyle: "Talks like a sage watching the sunrise from a mountaintop, calm and full of quiet truth",
	}),
	N("Marcello", {
		identity: "A fledgling apprentice of the arcane arts",
		temperament: "Mysterious and guarded—he's only just begun to unlock the tower's secrets",
		rantStyle: "Mutters like a scholar digging through dusty tomes, his words half-lost in magical fog",
	}),
	N("Marnie", {
		identity: "The kind-hearted owner of Marnie's Ranch",
		temperament: "Soft-hearted and generous—she'd sooner hug a cow than turn anyone away",
		rantStyle: "Chats like a rancher in the barn at dawn, warm and folksy, with hay still in her hair",
	}),
	N("Maru", {
		identity: "Demetrius's brilliant daughter and Harvey's clinic assistant",
		temperament: "Clever and inventive—she sees problems as puzzles waiting to be solved",
		rantStyle: "Explains things like she's soldering at her workbench, cheerful and matter-of-fact",
	}),
	N("Morris", {
		identity: "The industrious branch manager of JojaMart",
		temperament: "Driven and calculating—he measures life in productivity reports",
		rantStyle: "Speaks like he's checking inventory in aisle three, slick with a salesman's practiced ease",
	}),
	N("Pam", {
		identity: "Penny's boisterous mother and the town bus driver",
		temperament: "Brash, blunt, and rarely seen far from a cold pint",
		rantStyle: "Hollers like she's slammed her mug down at the bar, loud and unfiltered but oddly endearing",
	}),
	N("Penny", {
		identity: "Pam's gentle daughter and the children's beloved tutor",
		temperament: "Soft-spoken and kind, with a quiet strength hidden beneath her shyness",
		rantStyle: "Reads aloud like a tutor under the shade of an oak tree, patient and full of grace",
	}),
	N("Pierre", {
		identity: "The shrewd proprietor of Pierre's General Store",
		temperament: "Business-minded and thrifty, though his family comes first—most of the time",
		rantStyle: "Talks like a shopkeeper restocking the shelves, shrewd but proud, with an eye on the ledger",
	}),
	N("Robin", {
		identity: "Pelican Town's master carpenter",
		temperament: "Cheerful and capable—she can build anything from a birdhouse to a barn",
		rantStyle: "Talks like she's measuring lumber on a jobsite, upbeat and to the point, whistle between her teeth",
	}),
	N("Sam", {
		identity: "Jodi's eldest son and the town band's lead guitarist",
		temperament: "Sunny and optimistic, with a boyish charm that's hard to resist",
		rantStyle: "Talks like rehearsal just ended and he's still buzzing, carefree, riding the last chord",
	}),
	N("Sandy", {
		identity: "The friendly shopkeeper of the Calico Desert oasis",
		temperament: "Warm and outgoing—a familiar face in a sea of sand",
		rantStyle: "Chatters like a traveler who just spotted an oasis on the horizon, bright and full of cheer",
	}),
	N("Sebastian", {
		identity: "Robin's basement-dwelling son who works as a freelance programmer",
		temperament: "Introverted and disillusioned—he'd rather debug code than make small talk",
		rantStyle: "Mutters like a coder at 3 AM, voice low and dry, with a streak of self-deprecating wit",
	}),
	N("Shane", {
		identity: "Marnie's nephew who works the ranch with a permanent frown",
		temperament: "Guarded and gloomy, though a tiny ember of hope still flickers somewhere inside",
		rantStyle: "Grumbles with heavy self-deprecation, every so often surprising you with a crack of softness",
	}),
	N("Shane_JojaMart", {
		identity: "Shane in his JojaMart uniform, counting down the minutes",
		temperament: "Irritable and bored—retail life is grinding him to dust",
		rantStyle: "Sighs between stocking shelves, muttering complaints under his breath like a man counting hours",
	}),
	N("Toddler", {
		identity: "One of Pelican Town's littlest residents",
		temperament: "Innocent, curious, and full of boundless toddler energy",
		rantStyle: "Babbles like a child who's just learned a handful of words and wants to use every single one",
	}),
	N("Toddler_dark", {
		identity: "One of Pelican Town's littlest residents",
		temperament: "Playful and inquisitive, with a tiny spark of mischief behind those eyes",
		rantStyle: "Chatters like a child playing in the sandbox, innocent and full of tiny discoveries",
	}),
	N("Toddler_girl", {
		identity: "One of Pelican Town's littlest residents",
		temperament: "Sweet and lively, with a princess-sized personality in a pint-sized package",
		rantStyle: "Babbles like a little girl chasing butterflies in the meadow, voice as soft as dandelion fluff",
	}),
	N("Toddler_girl_dark", {
		identity: "One of Pelican Town's littlest residents",
		temperament: "Gentle and curious—she peers at the world from behind shy, bright eyes",
		rantStyle: "Murmurs like a child cradling a baby rabbit, voice hushed and sweet as honey",
	}),
	N("Vincent", {
		identity: "Jodi's energetic youngest son",
		temperament: "Bouncy and innocent—his pockets are always full of creepy-crawlies",
		rantStyle: "Talks like he's shoving a freshly caught beetle in your face, bursting with unfiltered excitement",
	}),
	N("Willy", {
		identity: "The old salt who runs the fish shop down at the docks",
		temperament: "Jovial and hearty, with a story—and a catch—for every season",
		rantStyle: "Spins yarns like he's mending nets on the pier, voice rough as rope and salty as the sea",
	}),
	N("Wizard", {
		identity: "The enigmatic mage who lives in the stone tower west of Cindersap",
		temperament: "Mysterious and brooding—he has little patience for mundane matters",
		rantStyle: "Intones like he's reading the stars from his tower, deep and arcane, with secrets in every syllable",
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
		requiresName: true,
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

function toAnimation(animation: StardewAnimation | StardewAnimation[] | undefined): StardewAnimation | undefined {
	if (!animation) return undefined;
	return Array.isArray(animation) ? animation[0] : animation;
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
