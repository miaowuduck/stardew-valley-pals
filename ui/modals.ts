import { Modal, App } from "obsidian";
import type { SelectorOption } from "../core/types";

export class SelectorModal extends Modal {
	options: SelectorOption[];
	onSubmit: (value: string, name: string) => Promise<void>;
	private animationTimers: ReturnType<typeof activeWindow.setInterval>[] = [];

	constructor(
		app: App,
		options: SelectorOption[],
		onSubmit: (value: string, name: string) => Promise<void>
	) {
		super(app);
		this.options = options;
		this.onSubmit = onSubmit;
		this.modalEl.addClass("pet-settings-modal");
	}

	onOpen() {
		const { contentEl } = this;
		const hasSprites = this.options.some((o) => o.spriteData);

		if (hasSprites) {
			this.renderGrid(contentEl);
		} else {
			this.renderButtons(contentEl);
		}
	}

	// ── Grid rendering (when options have spriteData) ──────────

	private renderGrid(container: HTMLElement) {
		const grid = container.createDiv({ cls: "pet-selector-grid" });

		// Find where NPCs start to insert a divider
		const firstNpcIndex = this.options.findIndex((o) =>
			o.value.startsWith("stardew/npc/")
		);

		for (let i = 0; i < this.options.length; i++) {
			const option = this.options[i];

			// Section divider between pets and NPCs
			if (i === firstNpcIndex && firstNpcIndex > 0) {
				grid.createDiv({ cls: "pet-selector-divider" });
			}

			const card = grid.createDiv({ cls: "pet-selector-card" });

			card.addEventListener("click", () => {
				if (option.requiresName) {
					this.showNameForm(option.value);
				} else {
					void (async () => {
						await this.onSubmit(option.value, "");
						this.close();
					})();
				}
			});

			if (option.spriteData) {
				const sd = option.spriteData;
				const spriteEl = card.createDiv({ cls: "pet-selector-sprite" });

				// Load sprite sheet image to get natural dimensions
				const img = new Image();
				img.src = sd.url;
				img.onload = () => {
					const naturalW = img.naturalWidth;
					const naturalH = img.naturalHeight;

					spriteEl.setCssStyles({
						backgroundImage: `url('${sd.url}')`,
						backgroundRepeat: "no-repeat",
						imageRendering: "pixelated",
						backgroundSize: `${naturalW * sd.scale}px ${naturalH * sd.scale}px`,
						width: `${sd.frameWidth * sd.scale}px`,
						height: `${sd.frameHeight * sd.scale}px`,
					});

					// Apply first frame
					const [fx0, fy0] = sd.moveFrames[0] ?? [0, 0];
					const [ox, oy] = sd.variantOffset ?? [0, 0];
					const px0 = -((fx0 + ox) * sd.frameWidth) * sd.scale;
					const py0 = -((fy0 + oy) * sd.frameHeight) * sd.scale;
					spriteEl.setCssStyles({ backgroundPosition: `${px0}px ${py0}px` });

					// Start walking animation loop
					let frameIndex = 0;
					const interval = Math.max(16, Math.floor(1000 / sd.fps));
					const timer = activeWindow.setInterval(() => {
						frameIndex = (frameIndex + 1) % sd.moveFrames.length;
						const [fx, fy] = sd.moveFrames[frameIndex];
						const px = -((fx + ox) * sd.frameWidth) * sd.scale;
						const py = -((fy + oy) * sd.frameHeight) * sd.scale;
						spriteEl.setCssStyles({ backgroundPosition: `${px}px ${py}px` });
					}, interval);
					this.animationTimers.push(timer);
				};

				img.onerror = () => {
					spriteEl.setText("?");
				};
			}

			card.createDiv({ cls: "pet-selector-label", text: option.label });
		}
	}

	// ── Button rendering (fallback for options without sprites) ─

	private renderButtons(container: HTMLElement) {
		for (const option of this.options) {
			const button = container.createEl("button", {
				text: option.label,
				cls: "selector-button",
			});

			button.addEventListener("click", () => {
				if (option.requiresName) {
					this.showNameForm(option.value);
				} else {
					void (async () => {
						await this.onSubmit(option.value, "");
						this.close();
					})();
				}
			});
		}
	}

	// ── Name form (shared between grid and button modes) ───────

	private showNameForm(selectedValue: string) {
		const { contentEl } = this;
		contentEl.empty();
		this.clearAnimationTimers();

		const container = contentEl.createDiv({
			cls: "pet-name-form-container",
		});

		container.createDiv({
			text: "Enter a name:",
			cls: "pet-name-title setting-item-heading",
		});

		const form = container.createEl("form", {
			cls: "pet-name-form",
		});
		const input = form.createEl("input", {
			type: "text",
			placeholder: "Pet name...",
			cls: "pet-name-input",
		});
		input.focus();

		form.createEl("button", {
			type: "submit",
			text: "Submit",
			cls: "pet-name-button",
		});

		form.addEventListener("submit", (e) => {
			e.preventDefault();
			const name = input.value.trim();
			if (!name) {
				return;
			}

			void (async () => {
				await this.onSubmit(selectedValue, name);
				this.close();
			})();
		});
	}

	// ── Cleanup ───────────────────────────────────────────────

	private clearAnimationTimers() {
		for (const timer of this.animationTimers) {
			activeWindow.clearInterval(timer);
		}
		this.animationTimers = [];
	}

	onClose() {
		this.clearAnimationTimers();
		this.contentEl.empty();
	}
}
