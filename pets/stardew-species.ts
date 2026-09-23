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

function N(name: string, visitHours: [number, number], persona: StardewPersona): StardewSpeciesDefinition {
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
