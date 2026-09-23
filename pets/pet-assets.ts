import heartAssetPng from "../assets/misc/heart.png";
import catSprite from "../assets/stardew/pets/cat.png";
import chickenSprite from "../assets/stardew/pets/chicken.png";
import cowSprite from "../assets/stardew/pets/cow.png";
import dinoSprite from "../assets/stardew/pets/dino.png";
import dogSprite from "../assets/stardew/pets/dog.png";
import duckSprite from "../assets/stardew/pets/duck.png";
import junimoSprite from "../assets/stardew/pets/junimo.png";
import parrotSprite from "../assets/stardew/pets/parrot.png";
import turtleSprite from "../assets/stardew/pets/turtle.png";

export const stardewPetSprites = {
	cat: catSprite,
	chicken: chickenSprite,
	cow: cowSprite,
	dino: dinoSprite,
	dog: dogSprite,
	duck: duckSprite,
	junimo: junimoSprite,
	parrot: parrotSprite,
	turtle: turtleSprite,
};

export type StardewPetSpriteKey = keyof typeof stardewPetSprites;

export function getStardewPetAsset(petType: StardewPetSpriteKey): string {
	const asset = stardewPetSprites[petType];
	if (!asset) {
		throw new Error(`Unknown Stardew pet asset: ${petType}`);
	}
	return asset;
}

export const heartAsset = heartAssetPng;
