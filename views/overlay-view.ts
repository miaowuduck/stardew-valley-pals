import type PetPlugin from "../main";
import type { PetInstance } from "../core/types";
import { createRenderablePet } from "../pets/factory";
import { createRantLoopScheduler, createViewRantLoopOptions } from "../ui/rant-loop";

export class OverlayPetView {
	private overlayEl: HTMLElement;
	private plugin: PetPlugin;
	pets: { id: string; type: string; pet: NonNullable<ReturnType<typeof createRenderablePet>> }[] = [];
	private resizeHandler: () => void;
	private resizeTimer: ReturnType<typeof setTimeout> | null = null;
	private rantLoop: ReturnType<typeof createRantLoopScheduler> | null = null;

	constructor(plugin: PetPlugin) {
		this.plugin = plugin;
		this.overlayEl = activeDocument.body.createDiv({ cls: "pet-overlay-container" });
		this.updateOverlayBounds();

		this.resizeHandler = () => {
			if (this.resizeTimer !== null) activeWindow.clearTimeout(this.resizeTimer);
			this.resizeTimer = activeWindow.setTimeout(async () => {
				this.resizeTimer = null;
				this.updateOverlayBounds();
				await Promise.all(this.pets.map(({ pet }) => pet.clampToContainer()));
			}, 100);
		};
		window.addEventListener("resize", this.resizeHandler);
	}

	private updateOverlayBounds() {
		const selectors = [".titlebar", ".workspace-tab-header-container"];
		const candidates: HTMLElement[] = [];
		for (const sel of selectors) {
			candidates.push(...Array.from(activeDocument.body.querySelectorAll<HTMLElement>(sel)));
		}

		let topOffset = 0;
		for (const el of candidates) {
			const style = getComputedStyle(el);
			const region =
				style.getPropertyValue("-webkit-app-region") ||
				(style as unknown as Record<string, string>).webkitAppRegion ||
				"";
			if (region !== "drag") continue;
			const rect = el.getBoundingClientRect();
			if (rect.top > 5) continue;
			if (rect.bottom > topOffset) topOffset = rect.bottom;
		}

		this.overlayEl.setCssProps({ "--overlay-top": `${topOffset}px` });
	}

	addPet(singlePet: PetInstance) {
		try {
			const pet = createRenderablePet(
				this.overlayEl,
				singlePet.type,
				"overlay",
				singlePet.id.replace(/^pets\//, ""),
				this.plugin.instanceData.petSize,
				singlePet.name,
				() => this.plugin.getPageRantText("rightclick", singlePet.type),
				this.plugin.instanceData.petSpeed,
				(isNPC: boolean) =>
					isNPC
						? (this.plugin.instanceData.npcSpeechEnabled ?? true)
						: (this.plugin.instanceData.petSpeechEnabled ?? true),
			);
			if (pet) {
				this.pets.push({ id: singlePet.id, type: singlePet.type, pet });
			}
		} catch (error) {
			console.error(`Failed to create overlay pet ${singlePet.id}:`, error);
		}
	}

	removePet(id: string) {
		const index = this.pets.findIndex((p) => p.id === id);
		if (index !== -1) {
			void this.pets[index].pet.destroy();
			this.pets.splice(index, 1);
		}
	}

	removeAllPets() {
		for (const { pet } of this.pets) {
			void pet.destroy();
		}
		this.pets = [];
	}

	updatePetSize() {
		for (const { pet } of this.pets) {
			pet.scale = this.plugin.instanceData.petSize;
			pet.petEl?.setCssProps({ "--scale": `${this.plugin.instanceData.petSize}` });
		}
	}

	updatePetSpeed() {
		for (const { pet } of this.pets) {
			pet.speedMultiplier = this.plugin.instanceData.petSpeed;
		}
	}

	destroy() {
		window.removeEventListener("resize", this.resizeHandler);
		if (this.resizeTimer !== null) {
			activeWindow.clearTimeout(this.resizeTimer);
			this.resizeTimer = null;
		}
		this.rantLoop?.stop();
		this.rantLoop = null;
		for (const { pet } of this.pets) {
			void pet.destroy();
		}
		this.overlayEl.remove();
	}

	startRantLoop() {
		this.rantLoop = createRantLoopScheduler(
			createViewRantLoopOptions(this.plugin, () =>
				this.pets.map((p) => ({
					type: p.type,
					showSpeechBubble: (text: string) => p.pet.showSpeechBubble(text),
				})),
			),
		);
		this.rantLoop.start();
	}
}
