import {
	PluginSettingTab,
	App,
	Setting,
	Notice,
	ConfirmationModal,
	SecretComponent,
} from "obsidian";
import type PetPlugin from "../main";
import { initModel } from "../ai/chat";
import { getStardewSpeciesDefinition } from "../pets/stardew-species";
import { DEFAULT_DATA } from "../core/constants";

// ── Helpers ──────────────────────────────────────────────────────

/** Creates a labeled slider with a live value display. */
function addSlider(
	container: HTMLElement,
	opts: {
		name: string;
		desc: string;
		value: number;
		min: number;
		max: number;
		step: number | "any";
		format: (v: number) => string;
		onChange: (v: number) => void;
	},
) {
	new Setting(container)
		.setName(opts.name)
		.setDesc(opts.desc)
		.addSlider((slider) => {
			slider
				.setLimits(opts.min, opts.max, opts.step)
				.setValue(opts.value)
				.setDynamicTooltip();

			const display = slider.sliderEl.parentElement?.createEl("span", {
				text: opts.format(slider.getValue()),
				cls: "pet-setting-slider-value",
			});

			slider.onChange((v) => {
				display?.setText(opts.format(v));
				opts.onChange(v);
			});
		});
}

/** Renders a section heading with an optional description. */
function sectionHeading(
	container: HTMLElement,
	title: string,
	description?: string,
) {
	const heading = new Setting(container).setName(title).setHeading();
	if (description) {
		heading.descEl.createEl("p", {
			text: description,
			cls: "setting-item-description",
		});
	}
}

// ── Settings Tab ─────────────────────────────────────────────────

export class PetSettingTab extends PluginSettingTab {
	plugin: PetPlugin;

	constructor(app: App, plugin: PetPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// ═══════════════════════════════════════════════════════════
		// Section 1 — Display
		// ═══════════════════════════════════════════════════════════
		sectionHeading(
			containerEl,
			"Display",
			"Control how pets appear in your vault.",
		);

		// Overlay mode
		new Setting(containerEl)
			.setName("Overlay mode")
			.setDesc(
				"Pets roam freely across the entire Obsidian window on a transparent overlay. " +
					"Disable to keep pets in a dockable side panel with a background scene.",
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.instanceData.overlayMode ?? false)
					.onChange(async (v) => {
						await this.plugin.setOverlayMode(v);
						this.display();
					});
			});

		// Background
		if (this.plugin.instanceData.overlayMode) {
			new Setting(containerEl)
				.setName("Background")
				.setDesc(
					"Not available in overlay mode. Disable overlay mode to pick a background scene.",
				)
				.addDropdown((dd) => dd.addOption("", "—").setDisabled(true));
		} else {
			new Setting(containerEl)
				.setName("Background")
				.setDesc("Choose a background scene for the pet side panel.")
				.addDropdown((dd) => {
					dd.addOption("none", "None")
						.addOption("dirt", "Dirt")
						.addOption("grass", "Grass")
						.addOption("grass_fall", "Grass (Fall)")
						.addOption("sand", "Sand")
						.addOption("snow", "Snow")
						.addOption("wood_broken", "Wood (Broken)")
						.addOption("wood_dark", "Wood (Dark)")
						.addOption("wood_light", "Wood (Light)")
						.addOption("wood_orange", "Wood (Orange)")
						.setValue(this.plugin.instanceData.selectedBackground)
						.onChange(async (v) => {
							await this.plugin.chooseBackground(v);
						});
				});
		}

		// Pet size
		addSlider(containerEl, {
			name: "Pet size",
			desc: "Scale all pets from half to triple size.",
			value: this.plugin.instanceData.petSize ?? 1,
			min: 0.5,
			max: 3,
			step: 0.1,
			format: (v) => `${v.toFixed(1)}x`,
			onChange: (v) => this.plugin.updatePetSize(v),
		});

		// Movement speed
		addSlider(containerEl, {
			name: "Movement speed",
			desc: "How quickly pets wander around. Higher = faster.",
			value: this.plugin.instanceData.petSpeed ?? 1,
			min: 0.5,
			max: 3,
			step: 0.1,
			format: (v) => `${v.toFixed(1)}x`,
			onChange: (v) => this.plugin.updatePetSpeed(v),
		});

		// ═══════════════════════════════════════════════════════════
		// Section 2 — My Pets
		// ═══════════════════════════════════════════════════════════
		sectionHeading(
			containerEl,
			"My Pets",
			"Manage the companions living in your vault.",
		);

		const pets = this.plugin.instanceData.pets;

		if (pets.length === 0) {
			const empty = containerEl.createDiv({
				cls: "pet-settings-empty",
			});
			empty.createDiv({ cls: "pet-settings-empty-icon", text: "🐾" });
			empty.createEl("p", {
				text: "No pets yet! Click the button below to bring in your first companion.",
				cls: "pet-settings-empty-text",
			});
		} else {
			for (const pet of pets) {
				const def = getStardewSpeciesDefinition(pet.type);
				const speciesLabel = def?.label ?? pet.type;
				new Setting(containerEl)
					.setName(pet.name)
					.setDesc(`Type: ${speciesLabel}`)
					.addButton((btn) => {
						btn.setButtonText("Remove")
							.setWarning()
							.onClick(async () => {
								await this.plugin.removePetById(pet.id);
								this.display();
							});
					});
			}
		}

		// Add pet button
		new Setting(containerEl)
			.setName("Add a new pet")
			.setDesc(
				"Choose from cats, dogs, parrots, junimos, and 35+ Stardew Valley NPCs.",
			)
			.addButton((btn) => {
				btn.setButtonText("Add Pet")
					.setCta()
					.onClick(() => {
						this.plugin.showAddPetCommand(() => this.display());
					});
			});

		// Clear all pets
		if (pets.length > 0) {
			new Setting(containerEl)
				.setName("Remove all pets")
				.setDesc(
					"Permanently remove every pet and NPC from your vault.",
				)
				.addButton((btn) => {
					btn.setButtonText("Clear All")
						.setWarning()
						.onClick(() => {
							new ConfirmationModal(this.app, {
								title: "Remove all pets?",
								body: "This will permanently remove every pet and NPC from your vault. This cannot be undone.",
								onConfirm: async () => {
									await this.plugin.clearAllPets();
									this.display();
									new Notice(
										"All pets have been removed.",
									);
								},
							}).open();
						});
				});
		}

		// ═══════════════════════════════════════════════════════════
		// Section 3 — AI Configuration
		// ═══════════════════════════════════════════════════════════
		sectionHeading(
			containerEl,
			"AI Configuration",
			"Connect to an OpenAI-compatible API for intelligent speech bubbles.",
		);

		// API key
		new Setting(containerEl)
			.setName("API key secret")
			.setDesc(
				"Select a secret from Obsidian's SecretStorage. Create one via the vault's security settings first.",
			)
			.addComponent((el) =>
				new SecretComponent(this.app, el)
					.setValue(
						this.plugin.instanceData.openAiApiKey || "",
					)
					.onChange(async (v) => {
						this.plugin.updateOpenAiApiKey(v);
					}),
			);

		// API endpoint
		new Setting(containerEl)
			.setName("API endpoint")
			.setDesc(
				"OpenAI-compatible base URL. Use the default for OpenAI, or change for DeepSeek / custom providers.",
			)
			.addText((text) => {
				text
					.setValue(
						this.plugin.instanceData.openAiBaseUrl ||
							"https://api.openai.com/v1",
					)
					.setPlaceholder("https://api.openai.com/v1")
					.onChange(async (v) => {
						this.plugin.updateOpenAiBaseUrl(
							v.trim() || "https://api.openai.com/v1",
						);
					});
			});

		// Model
		new Setting(containerEl)
			.setName("Model")
			.setDesc(
				"Model name for your provider, e.g. gpt-4o-mini, deepseek-chat, deepseek-v4-flash.",
			)
			.addText((text) => {
				text
					.setValue(
						this.plugin.instanceData.selectedModel ||
							"gpt-5-mini",
					)
					.setPlaceholder("gpt-4o-mini")
					.onChange(async (v) => {
						this.plugin.updateChosenModel(v);
					});
			});

		// Chinese prompt
		new Setting(containerEl)
			.setName("Chinese language")
			.setDesc(
				"Generate speech bubbles in Chinese. Disable for English.",
			)
			.addToggle((toggle) => {
				toggle
					.setValue(
						this.plugin.instanceData.useChinesePrompt ??
							false,
					)
					.onChange((v) => {
						this.plugin.updateChinesePrompt(v);
					});
			});

		// Test connection
		new Setting(containerEl)
			.setName("Test connection")
			.setDesc(
				"Send a minimal request to verify your API key, endpoint, and model.",
			)
			.addButton((btn) => {
				btn.setButtonText("Test Connection")
					.setCta()
					.onClick(async () => {
						const keyName =
							this.plugin.instanceData.openAiApiKey?.trim();
						const key = keyName
							? this.app.secretStorage.getSecret(
									keyName,
								)
							: null;
						const baseUrl =
							this.plugin.instanceData.openAiBaseUrl?.trim();
						const model =
							this.plugin.instanceData.selectedModel?.trim();

						if (!key) {
							new Notice(
								"Please select an API key secret first.",
								5000,
							);
							return;
						}
						if (!baseUrl) {
							new Notice(
								"Please enter an API endpoint.",
								5000,
							);
							return;
						}
						if (!model) {
							new Notice(
								"Please enter a model name.",
								5000,
							);
							return;
						}

						btn.setButtonText("Testing…");
						btn.setDisabled(true);

						try {
							const client = initModel(key, baseUrl);
							const resp =
								await client.chat.completions.create({
									model,
									messages: [
										{
											role: "user",
											content:
												"Say 'ok'",
										},
									],
									max_tokens: 20,
								});
							const reply =
								resp.choices[0]?.message?.content?.trim() ||
								"";
							new Notice(
								reply
									? `✅ Connected — "${reply}"`
									: "✅ Connection successful!",
								6000,
							);
						} catch (e: unknown) {
							const msg =
								(e as { message?: string })
									?.message || String(e);
							console.error(
								"API test failed:",
								e,
							);
							new Notice(
								`❌ Connection failed: ${msg}`,
								8000,
							);
						} finally {
							btn.setButtonText("Test Connection");
							btn.setDisabled(false);
						}
					});
			});

		// ═══════════════════════════════════════════════════════════
		// Section 4 — Speech Bubbles
		// ═══════════════════════════════════════════════════════════
		sectionHeading(
			containerEl,
			"Speech Bubbles",
			"Control which companions can speak and when.",
		);

		new Setting(containerEl)
			.setName("Pet speech")
			.setDesc(
				"Allow regular pets (cats, dogs, chickens, etc.) to show speech bubbles.",
			)
			.addToggle((toggle) => {
				toggle
					.setValue(
						this.plugin.instanceData.petSpeechEnabled ?? true,
					)
					.onChange((v) => {
						this.plugin.updatePetSpeechEnabled(v);
					});
			});

		new Setting(containerEl)
			.setName("NPC speech")
			.setDesc(
				"Allow Stardew Valley NPCs to show speech bubbles with their unique personalities.",
			)
			.addToggle((toggle) => {
				toggle
					.setValue(
						this.plugin.instanceData.npcSpeechEnabled ?? true,
					)
					.onChange((v) => {
						this.plugin.updateNpcSpeechEnabled(v);
					});
			});

		// ═══════════════════════════════════════════════════════════
		// Section 5 — Automatic Rants
		// ═══════════════════════════════════════════════════════════
		sectionHeading(
			containerEl,
			"Automatic Rants",
			"Pets and NPCs can periodically comment on your notes using AI. Configure timing and context.",
		);

		// Enable
		new Setting(containerEl)
			.setName("Enable automatic rants")
			.setDesc(
				"Pets and NPCs will occasionally speak up on their own based on the timer below.",
			)
			.addToggle((toggle) => {
				toggle
					.setValue(
						this.plugin.instanceData.pageRantEnabled ??
							false,
					)
					.onChange((v) => {
						this.plugin.updatePageRantEnabled(v);
					});
			});

		// Only when focused
		new Setting(containerEl)
			.setName("Only rant when focused")
			.setDesc(
				"Suppress automatic rants while Obsidian is in the background. Right-click rants are always allowed.",
			)
			.addToggle((toggle) => {
				toggle
					.setValue(
						this.plugin.instanceData
							.pageRantOnlyWhenFocused ?? true,
					)
					.onChange((v) => {
						this.plugin.updatePageRantOnlyWhenFocused(
							v,
						);
					});
			});

		// Interval min
		addSlider(containerEl, {
			name: "Minimum interval",
			desc: "Shortest time between automatic speech bubbles.",
			value:
				this.plugin.instanceData.pageRantMinMinutes ?? 5,
			min: 1,
			max: 180,
			step: 1,
			format: (v) => `${v} min`,
			onChange: (v) =>
				this.plugin.updatePageRantMinMinutes(v),
		});

		// Interval max
		addSlider(containerEl, {
			name: "Maximum interval",
			desc: "Longest time between automatic speech bubbles. The actual delay is random between min and max.",
			value:
				this.plugin.instanceData.pageRantMaxMinutes ?? 20,
			min: 1,
			max: 180,
			step: 1,
			format: (v) => `${v} min`,
			onChange: (v) =>
				this.plugin.updatePageRantMaxMinutes(v),
		});

		// Context chars
		addSlider(containerEl, {
			name: "Page context length",
			desc: "Characters from your current note sent to the AI. More = better awareness, but costs more tokens.",
			value:
				this.plugin.instanceData.pageRantContextChars ??
				1200,
			min: 100,
			max: 10000,
			step: 100,
			format: (v) => `${v} chars`,
			onChange: (v) =>
				this.plugin.updatePageRantContextChars(v),
		});

		// ═══════════════════════════════════════════════════════════
		// Section 6 — Danger Zone
		// ═══════════════════════════════════════════════════════════
		sectionHeading(
			containerEl,
			"Danger Zone",
			"Reset all settings to their defaults. Your pets are not affected.",
		);

		new Setting(containerEl)
			.setName("Reset settings")
			.setDesc(
				"Restores every setting to its original value. Pets stay right where they are.",
			)
			.addButton((btn) => {
				btn.setButtonText("Reset to Defaults")
					.setWarning()
					.onClick(() => {
						new ConfirmationModal(this.app, {
							title:
								"Reset settings to defaults?",
							body: "All settings will be restored to their original values. Your pets will not be removed.",
							onConfirm: async () => {
								Object.assign(
									this.plugin
										.instanceData,
									DEFAULT_DATA,
								);
								await this.plugin.saveData(
									this.plugin
										.instanceData,
								);
								this.display();
								new Notice(
									"Settings have been reset to defaults.",
								);
							},
						}).open();
					});
			});
	}
}
