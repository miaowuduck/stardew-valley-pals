import type PetPlugin from "../main";
import type { PetInstance } from "../core/types";
import { isNpcSpeciesType } from "../core/types";
import { createRenderablePet } from "../pets/factory";
import { createRantLoopScheduler, createViewRantLoopOptions } from "../ui/rant-loop";
import { createBanterRunner, DROP_ONTO_RADIUS_PX } from "../ui/banter";
import type { BanterRunner } from "../ui/banter";

export class OverlayPetView {
	private overlayEl: HTMLElement;
	private plugin: PetPlugin;
	pets: { id: string; type: string; pet: NonNullable<ReturnType<typeof createRenderablePet>> }[] = [];
	private resizeHandler: () => void;
	private resizeTimer: number | null = null;
	private rantLoop: ReturnType<typeof createRantLoopScheduler> | null = null;
	private banterRunner: BanterRunner;
	/**
	 * The document/window the overlay lives in. Always the main workspace
	 * window — never `activeDocument`, which can point at a popout (e.g. the
	 * settings window opened by Obsidian 1.14+) and would put the pets inside
	 * that popout. If the popout then closes, the pets' DOM vanishes while
	 * their behaviour loops keep running, which used to hang the renderer.
	 */
	private readonly doc: Document;
	private readonly win: Window;

	constructor(plugin: PetPlugin) {
		this.plugin = plugin;
		this.banterRunner = createBanterRunner(plugin);
		const workspaceEl = plugin.app.workspace.containerEl;
		this.doc = workspaceEl.ownerDocument;
		this.win = this.doc.defaultView ?? window;
		this.overlayEl = this.doc.body.createDiv({ cls: "pet-overlay-container" });
		this.updateOverlayBounds();

		this.resizeHandler = () => {
			if (this.resizeTimer !== null) this.win.clearTimeout(this.resizeTimer);
			this.resizeTimer = this.win.setTimeout(async () => {
				this.resizeTimer = null;
				this.updateOverlayBounds();
				await Promise.all(this.pets.map(({ pet }) => pet.clampToContainer()));
			}, 100);
		};
		this.win.addEventListener("resize", this.resizeHandler);
	}

	private updateOverlayBounds() {
		const selectors = [".titlebar", ".workspace-tab-header-container"];
		const candidates: HTMLElement[] = [];
		for (const sel of selectors) {
			candidates.push(...Array.from(this.doc.body.querySelectorAll<HTMLElement>(sel)));
		}

		const view = this.doc.defaultView ?? window;
		let topOffset = 0;
		for (const el of candidates) {
			const style = view.getComputedStyle(el);
			const region =
				style.getPropertyValue("-webkit-app-region") ||
				(style as unknown as Record<string, string>).webkitAppRegion ||
				"";
			if (region !== "drag") continue;
			const rect = el.getBoundingClientRect();
			if (rect.top > 5) continue;
			if (rect.bottom > topOffset) topOffset = rect.bottom;
		}

		// Incorporate macOS traffic light offset (since Obsidian 1.12.0)
		const trafficY = parseFloat(
			view.getComputedStyle(this.doc.body).getPropertyValue("--traffic-lights-offset-y")
		) || 0;
		if (trafficY > topOffset) topOffset = trafficY;

		this.overlayEl.setCssProps({ "--overlay-top": `${topOffset}px` });
	}

	addPet(singlePet: PetInstance) {
		try {
			const pet = createRenderablePet(
				this.overlayEl,
				singlePet.type,
				singlePet.id,
				this.plugin.instanceData.petSize,
				singlePet.name,
				() => this.plugin.getPageRantText("rightclick", singlePet.type),
				this.plugin.instanceData.petSpeed,
				this.plugin.getSpeechEnabledProvider(),
			);
			if (pet) {
				pet.onDragEnd = () => this.handleDragEnd(singlePet.id);
				this.pets.push({ id: singlePet.id, type: singlePet.type, pet });
			}
		} catch (error) {
			console.error(`Failed to create overlay pet ${singlePet.id}:`, error);
		}
	}

	/** Dropping one villager onto another forces a conversation between them. */
	private handleDragEnd(draggedId: string) {
		const dragged = this.pets.find((p) => p.id === draggedId);
		if (!dragged || !isNpcSpeciesType(dragged.type)) return;

		const pos = dragged.pet.getPosition();
		let target: (typeof this.pets)[number] | undefined;
		let bestDist = DROP_ONTO_RADIUS_PX;
		for (const entry of this.pets) {
			if (entry === dragged || !isNpcSpeciesType(entry.type) || entry.pet.isBusy()) continue;
			const ep = entry.pet.getPosition();
			const d = Math.hypot(pos.x - ep.x, pos.y - ep.y);
			if (d < bestDist) {
				bestDist = d;
				target = entry;
			}
		}
		if (target) {
			void this.banterRunner.forceRunBanter(dragged, target, this.pets);
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
			pet.setScale(this.plugin.instanceData.petSize);
		}
	}

	updatePetSpeed() {
		for (const { pet } of this.pets) {
			pet.speedMultiplier = this.plugin.instanceData.petSpeed;
		}
	}

	destroy() {
		this.win.removeEventListener("resize", this.resizeHandler);
		if (this.resizeTimer !== null) {
			this.win.clearTimeout(this.resizeTimer);
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
			createViewRantLoopOptions(
				this.plugin,
				() =>
					this.pets
						.filter((p) => !p.pet.isBusy())
						.map((p) => ({
							type: p.type,
							showSpeechBubble: (text: string) => p.pet.showSpeechBubble(text),
						})),
				() => this.banterRunner.tryRunBanter(this.pets),
			),
		);
		this.rantLoop.start();
	}
}
