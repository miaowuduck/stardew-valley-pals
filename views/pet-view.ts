import { ItemView, WorkspaceLeaf } from "obsidian";
import type PetPlugin from "../main";
import type { PetInstance } from "../core/types";
import { getBackgroundAsset } from "../pets/pet-assets";
import { createRenderablePet } from "../pets/factory";
import type { RenderablePet } from "../pets/factory";

import { createRantLoopScheduler, createViewRantLoopOptions } from "../ui/rant-loop";

export const VIEW_TYPE_PET = "pet-view";

export class PetView extends ItemView {
	plugin: PetPlugin;
	pets: { id: string; type: string; pet: RenderablePet }[] = [];
	private resizeObserver?: ResizeObserver;
	private resizeTimeout?: number;
	private rantLoop: ReturnType<typeof createRantLoopScheduler> | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: PetPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_PET;
	}

	getDisplayText() {
		return `${this.app.vault.getName()} Pets`;
	}

	getIcon() {
		return "";
	}

	async onOpen() {
		if (this.plugin.instanceData.overlayMode) {
			window.setTimeout(() => this.leaf.detach(), 0);
			return;
		}

		// Hide headers for a clean pet panel
		const viewHeader = this.containerEl.querySelector(".view-header") as HTMLElement | null;
		if (viewHeader) viewHeader.addClass("pet-view-header-hidden");

		const tabsEl = this.containerEl.closest(".workspace-tabs") as HTMLElement | null;
		const tabHeaderContainer = tabsEl?.querySelector(":scope > .workspace-tab-header-container") as HTMLElement | null;
		if (tabHeaderContainer) tabHeaderContainer.addClass("pet-view-tab-header-hidden");
		const tabContainer = tabsEl?.querySelector(":scope > .workspace-tab-container") as HTMLElement | null;
		if (tabContainer) tabContainer.addClass("pet-view-tab-container-clean");

		this.updateView();
		this.setupResizeObserver();
		this.startRantLoop();
	}

	updateView() {
		const container = this.containerEl.children[1];
		let wrapper = container.querySelector(".pet-view-wrapper") as HTMLDivElement;
		if (!wrapper) {
			wrapper = container.createDiv({ cls: "pet-view-wrapper" });
		}

		this.updateBackground(wrapper);

		const currentPetList = this.plugin.getPetList();
		const existingPetIds = new Set(this.pets.map((p) => p.id));
		for (const pet of currentPetList) {
			if (!existingPetIds.has(pet.id)) {
				this.addPetToView(wrapper, pet);
			}
		}

		this.updateEmptyState(wrapper);
	}

	updateBackground(wrapper: HTMLElement) {
		const background = this.plugin.getSelectedBackground();

		wrapper.querySelector(".pet-view-background")?.remove();

		if (background === "none") return;

		try {
			const backgroundUrl = getBackgroundAsset(background);
			if (["wood_dark", "wood_light", "wood_orange"].includes(background)) {
				wrapper.createEl("div", {
					cls: "pet-view-background pet-view-background-tiled",
				}).style.backgroundImage = `url('${backgroundUrl}')`;
			} else {
				wrapper.createEl("img", {
					attr: { src: backgroundUrl, alt: "Background" },
					cls: "pet-view-background",
				});
			}
		} catch (error) {
			console.error(`Failed to load background: ${background}`, error);
		}


	}

	private updateEmptyState(wrapper: HTMLElement) {
		const existingEmpty = wrapper.querySelector(".pet-empty-state");
		const petCount = this.pets.length;

		if (petCount === 0) {
			if (!existingEmpty) {
				const emptyState = wrapper.createDiv({ cls: "pet-empty-state" });
				emptyState.createDiv({ cls: "pet-empty-state-icon", text: "🐾" });
				emptyState.createDiv({ cls: "pet-empty-state-title", text: "No pets yet!" });
				emptyState.createDiv({
					cls: "pet-empty-state-desc",
					text: 'Use the ribbon icon or the "Add a pet" command to bring in your first companion.',
				});
				const addButton = emptyState.createEl("button", {
					cls: "pet-empty-state-button",
					text: "Add a pet",
				});
				addButton.addEventListener("click", () => {
					this.plugin.showAddPetCommand();
				});
			}
		} else {
			existingEmpty?.remove();
		}
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

	addPetToView(wrapper: Element, singlePet: PetInstance) {
		try {
			const pet = createRenderablePet(
				wrapper,
				singlePet.type,
				this.plugin.getSelectedBackground(),
				singlePet.id,
				this.plugin.instanceData.petSize,
				singlePet.name,
				() => this.plugin.getPageRantText("rightclick", singlePet.type),
				this.plugin.instanceData.petSpeed,
				this.plugin.getSpeechEnabledProvider(),
			);
			if (pet) {
				this.pets.push({ id: singlePet.id, type: singlePet.type, pet });
				this.updateEmptyState(this.getWrapper());
			}
		} catch (error) {
			console.error(`Failed to create pet ${singlePet.id}:`, error);
		}
	}

	removePet(id: string) {
		const index = this.pets.findIndex((p) => p.id === id);
		if (index !== -1) {
			void this.pets[index].pet.destroy();
			this.pets.splice(index, 1);
		}
		this.updateEmptyState(this.getWrapper());
	}

	removeAllPets() {
		for (const { pet } of this.pets) {
			void pet.destroy();
		}
		this.pets = [];
		this.updateEmptyState(this.getWrapper());
	}

	getWrapper(): HTMLElement {
		const wrapper = this.containerEl.querySelector(".pet-view-wrapper") as HTMLElement;
		if (!wrapper) throw new Error("pet-view-wrapper not found");
		return wrapper;
	}

	resetPets() {
		for (const { pet } of this.pets) {
			void pet.clampToContainer();
		}
	}

	private setupResizeObserver() {
		const container = this.containerEl.children[1] as HTMLElement | undefined;
		if (!container || typeof ResizeObserver === "undefined") return;

		let initialized = false;
		let lastWidth = 0;
		let lastHeight = 0;

		this.resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			const { width, height } = entry.contentRect;

			if (!initialized) {
				initialized = true;
				lastWidth = width;
				lastHeight = height;
				return;
			}

			if (width === lastWidth && height === lastHeight) return;
			lastWidth = width;
			lastHeight = height;

			if (this.resizeTimeout !== undefined) {
				window.clearTimeout(this.resizeTimeout);
			}
			this.resizeTimeout = window.setTimeout(() => {
				this.resizeTimeout = undefined;
				this.resetPets();
			}, 250);
		});
		this.resizeObserver.observe(container);
	}

	async onClose() {
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = undefined;
		}
		if (this.resizeTimeout !== undefined) {
			window.clearTimeout(this.resizeTimeout);
			this.resizeTimeout = undefined;
		}
		this.rantLoop?.stop();
		this.rantLoop = null;
		await Promise.all(this.pets.map(({ pet }) => pet.destroy()));
	}

	private startRantLoop() {
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
