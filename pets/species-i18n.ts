import { getUiLanguage } from "../core/i18n";
import { NPC_TYPE_PREFIX, isNpcSpeciesType } from "../core/types";

const NPC_ZH: Record<string, string> = {
	Abigail: "阿比盖尔",
	Alex: "亚历克斯",
	Caroline: "卡洛琳",
	Clint: "克林特",
	Demetrius: "德米特里厄斯",
	Dwarf: "矮人",
	Elliott: "艾利欧特",
	Emily: "艾米丽",
	Evelyn: "艾芙琳",
	George: "乔治",
	Gus: "格斯",
	Haley: "海莉",
	Harvey: "哈维",
	Jas: "贾斯",
	Jodi: "乔迪",
	Kent: "肯特",
	Krobus: "科罗布斯",
	Leah: "莉亚",
	Lewis: "刘易斯",
	Linus: "莱纳斯",
	Marcello: "马塞洛",
	Marnie: "玛妮",
	Maru: "玛鲁",
	Morris: "莫里斯",
	Pam: "帕姆",
	Penny: "潘妮",
	Pierre: "皮埃尔",
	Robin: "罗宾",
	Sam: "山姆",
	Sandy: "桑迪",
	Sebastian: "塞巴斯蒂安",
	Shane: "谢恩",
	Shane_JojaMart: "谢恩（JojaMart）",
	Toddler: "小孩",
	Toddler_dark: "小孩（深肤色）",
	Toddler_girl: "小女孩",
	Toddler_girl_dark: "小女孩（深肤色）",
	Vincent: "文森特",
	Willy: "威利",
	Wizard: "法师",
};

const PET_BASE_ZH: Record<string, string> = {
	Cat: "猫",
	Chicken: "鸡",
	Dog: "狗",
	Parrot: "鹦鹉",
	Junimo: "祝尼魔",
	Cow: "牛",
	Duck: "鸭",
	Dinosaur: "恐龙",
	Turtle: "乌龟",
};

const VARIANT_ZH: Record<string, string> = {
	Gray: "灰色",
	Orange: "橘色",
	White: "白色",
	Yellow: "黄色",
	Purple: "紫色",
	Blue: "蓝色",
	Brown: "棕色",
	Black: "黑色",
	Small: "小",
	Colourful: "彩色",
	Golden: "金色",
	Pink: "粉色",
	Red: "红色",
	Green: "绿色",
	Cyan: "青色",
	"Small-Yellow": "小黄",
	"Small-Blue": "小蓝",
	"Small-Orange": "小橘",
	"Small-Brown": "小棕",
	"Small-Colourful": "小彩",
};

/**
 * Localize a species label at render time. NPC `label`s stay English in the
 * data (AI prompts use them), so only the display name is translated here.
 */
export function getSpeciesLabel(type: string, fallbackLabel: string): string {
	if (getUiLanguage() !== "zh") return fallbackLabel;

	if (isNpcSpeciesType(type)) {
		const name = type.slice(NPC_TYPE_PREFIX.length);
		return NPC_ZH[name] ?? fallbackLabel;
	}

	const parts = fallbackLabel.split(" ");
	const base = PET_BASE_ZH[parts[0]];
	if (!base) return fallbackLabel;
	if (parts.length === 1) return base;

	const variant = VARIANT_ZH[parts.slice(1).join(" ")];
	return variant ? `${base}（${variant}）` : fallbackLabel;
}
