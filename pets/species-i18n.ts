import { getUiLanguage } from "../core/i18n";
import { isNpcSpeciesType } from "../core/types";

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
 * Localize a pet label at render time. NPC names are proper nouns and stay
 * as-is; their `label` is also used in AI prompts, which remain English.
 */
export function getSpeciesLabel(type: string, fallbackLabel: string): string {
	if (isNpcSpeciesType(type) || getUiLanguage() !== "zh") return fallbackLabel;

	const parts = fallbackLabel.split(" ");
	const base = PET_BASE_ZH[parts[0]];
	if (!base) return fallbackLabel;
	if (parts.length === 1) return base;

	const variant = VARIANT_ZH[parts.slice(1).join(" ")];
	return variant ? `${base}（${variant}）` : fallbackLabel;
}
