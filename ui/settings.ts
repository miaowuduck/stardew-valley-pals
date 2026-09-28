import {
	App,
	ConfirmationModal,
	Notice,
	PluginSettingTab,
	SecretComponent,
} from "obsidian";
import type {
	SettingDefinitionItem,
	SettingDefinitionList,
} from "obsidian";
import type PetPlugin from "../main";
import type { PetPluginData } from "../core/types";
import { initModel } from "../ai/chat";
import { getStardewSpeciesDefinition } from "../pets/stardew-species";
import { DEFAULT_DATA } from "../core/constants";

type SettingKey = Extract<keyof PetPluginData, string>;

const DEFAULT_BASE_URL = "https://api.openai.com/v1";

// ── Settings Tab ─────────────────────────────────────────────────

export class PetSettingTab extends PluginSettingTab {
	plugin: PetPlugin;

	constructor(app: App, plugin: PetPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Settings live on `plugin.instanceData`, not `plugin.settings`,
	 * so control values are read from there.
	 */
	getControlValue(key: string): unknown {
		return this.plugin.instanceData[key as SettingKey];
	}

	/**
	 * Route writes through the plugin's update methods so side effects
	 * (view resizing, villager sync, model re-init) still run.
	 */
	async setControlValue(key: string, value: unknown): Promise<void> {
		const plugin = this.plugin;
		switch (key as SettingKey) {
			case "overlayMode":
				await plugin.setOverlayMode(value as boolean);
				break;
			case "petSize":
				plugin.updatePetSize(value as number);
				break;
			case "petSpeed":
				plugin.updatePetSpeed(value as number);
				break;
			case "npcScheduleEnabled":
				await plugin.setNpcScheduleEnabled(value as boolean);
				// The visitor roster changed — rebuild dynamic rows.
				this.update();
				break;
			case "maxVisitors":
				plugin.updateMaxVisitors(value as number);
				break;
			case "openAiApiKey":
				plugin.updateOpenAiApiKey(value as string);
				break;
			case "openAiBaseUrl":
				plugin.updateOpenAiBaseUrl(
					(value as string).trim() || DEFAULT_BASE_URL,
				);
				break;
			case "selectedModel":
				plugin.updateChosenModel(value as string);
				break;
			case "useChinesePrompt":
				plugin.updateChinesePrompt(value as boolean);
				break;
			case "npcSpeechEnabled":
				plugin.updateNpcSpeechEnabled(value as boolean);
				break;
			case "banterEnabled":
				plugin.updateBanterEnabled(value as boolean);
				break;
			case "banterPercent":
				plugin.updateBanterPercent(value as number);
				break;
			case "memoryEnabled":
				plugin.updateMemoryEnabled(value as boolean);
				break;
			case "pageRantEnabled":
				plugin.updatePageRantEnabled(value as boolean);
				break;
			case "pageRantOnlyWhenFocused":
				plugin.updatePageRantOnlyWhenFocused(value as boolean);
				break;
			case "pageRantPerHour":
				plugin.updatePageRantPerHour(value as number);
				break;
			case "pageRantContextChars":
				plugin.updatePageRantContextChars(value as number);
				break;
			default:
				(plugin.instanceData as unknown as Record<string, unknown>)[
					key
				] = value;
				await plugin.saveData(plugin.instanceData);
		}
	}

	getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
		const data = this.plugin.instanceData;
		const memories = this.memoryList();

		return [
			// ── Display ─────────────────────────────────────────
			{
				type: "group",
				heading: "Display",
				items: [
					{
						name: "Overlay mode",
						desc: "Pets roam freely across the entire Obsidian window on a transparent overlay. Disable to keep pets in a dockable side panel.",
						control: {
							type: "toggle",
							key: "overlayMode",
							defaultValue: false,
						},
					},
					{
						name: "Pet size",
						desc: "Scale all pets from half to triple size.",
						control: {
							type: "slider",
							key: "petSize",
							min: 0.5,
							max: 3,
							step: 0.1,
							defaultValue: 1,
							displayFormat: (v) => `${v.toFixed(1)}x`,
						},
					},
					{
						name: "Movement speed",
						desc: "How quickly pets wander around. Higher = faster.",
						control: {
							type: "slider",
							key: "petSpeed",
							min: 0.5,
							max: 3,
							step: 0.1,
							defaultValue: 1,
							displayFormat: (v) => `${v.toFixed(1)}x`,
						},
					},
				],
			},

			// ── My pets ───────────────────────────────────────
			this.petList(),
			{
				name: "Remove all pets",
				desc: "Permanently remove every pet and NPC from your vault.",
				visible: () => data.pets.length > 0,
				render: (setting) => {
					setting.addButton((btn) => {
						btn.setButtonText("Clear all")
							.setDestructive()
							.onClick(() => {
								this.confirm(
									"Remove all pets?",
									"This will permanently remove every pet and NPC from your vault. This cannot be undone.",
									"Clear all",
									async () => {
										await this.plugin.clearAllPets();
										this.update();
										new Notice(
											"All pets have been removed.",
										);
									},
								);
							});
					});
				},
			},

			// ── Villager visits ───────────────────────────────
			{
				type: "group",
				heading: "Villager visits",
				items: [
					{
						name: "Scheduled visits",
						desc: "Villagers arrive and leave automatically according to their own visiting hours. Manually added villagers go home while this is on. Pets are unaffected.",
						control: {
							type: "toggle",
							key: "npcScheduleEnabled",
							defaultValue: false,
						},
					},
					{
						name: "Max visitors",
						desc: "How many villagers can be in town at the same time.",
						visible: () => data.npcScheduleEnabled,
						control: {
							type: "slider",
							key: "maxVisitors",
							min: 1,
							max: 6,
							step: 1,
							defaultValue: 3,
							displayFormat: (v) => `${v}`,
						},
					},
					{
						name: "Currently in town",
						desc: this.visitorSummary(),
						visible: () => data.npcScheduleEnabled,
					},
				],
			},

			// ── AI configuration ──────────────────────────────
			{
				type: "group",
				heading: "AI configuration",
				items: [
					{
						name: "API key secret",
						desc: "Select a secret from Obsidian's SecretStorage. Create one via the vault's security settings first.",
						render: (setting) => {
							setting.addComponent((el) =>
								new SecretComponent(this.app, el)
									.setValue(data.openAiApiKey || "")
									.onChange((v) => {
										this.plugin.updateOpenAiApiKey(v);
									}),
							);
						},
					},
					{
						name: "API endpoint",
						desc: "OpenAI-compatible base URL. Use the default for OpenAI, or change for DeepSeek / custom providers.",
						control: {
							type: "text",
							key: "openAiBaseUrl",
							placeholder: DEFAULT_BASE_URL,
							defaultValue: DEFAULT_BASE_URL,
						},
					},
					{
						name: "Model",
						desc: "Model name for your provider, e.g. gpt-4o-mini, deepseek-chat, deepseek-v4-flash.",
						control: {
							type: "text",
							key: "selectedModel",
							placeholder: "gpt-4o-mini",
							defaultValue: "gpt-5-mini",
						},
					},
					{
						name: "Chinese language",
						desc: "Generate speech bubbles in Chinese. Disable for English.",
						control: {
							type: "toggle",
							key: "useChinesePrompt",
							defaultValue: false,
						},
					},
					{
						name: "Test connection",
						desc: "Send a minimal request to verify your API key, endpoint, and model.",
						render: (setting) => {
							setting.addButton((btn) => {
								btn.setButtonText("Test connection")
									.setCta()
									.onClick(() => this.testConnection(btn));
							});
						},
					},
				],
			},

			// ── Speech bubbles ────────────────────────────────
			{
				type: "group",
				heading: "Speech bubbles",
				items: [
					{
						name: "NPC speech",
						desc: "Allow Stardew Valley villagers to show speech bubbles with their unique personalities. Animals stay silent — they express themselves with hearts.",
						control: {
							type: "toggle",
							key: "npcSpeechEnabled",
							defaultValue: true,
						},
					},
					{
						name: "Villager conversations",
						desc: "Two villagers occasionally walk up to each other, face off, and chat on the automatic speech timer. Nearby animals gather to watch.",
						control: {
							type: "toggle",
							key: "banterEnabled",
							defaultValue: true,
						},
					},
				],
			},

			// ── Villager memory ───────────────────────────────
			{
				type: "group",
				heading: "Villager memory",
				items: [
					{
						name: "Core memories",
						desc: "After speaking, a villager may distill a durable fact about you (e.g. a long-term project) and remember it in future conversations.",
						control: {
							type: "toggle",
							key: "memoryEnabled",
							defaultValue: true,
						},
					},
				],
			},
			...(memories ? [memories] : []),
			{
				name: "Clear all memories",
				desc: "Every villager forgets everything they learned about you.",
				visible: () => this.hasMemories(),
				render: (setting) => {
					setting.addButton((btn) => {
						btn.setButtonText("Clear all")
							.setDestructive()
							.onClick(() => {
								this.confirm(
									"Clear all villager memories?",
									"Every villager will forget what they learned about you. This cannot be undone.",
									"Clear all",
									async () => {
										await this.plugin.clearNpcMemories();
										this.update();
										new Notice(
											"All villager memories cleared.",
										);
									},
								);
							});
					});
				},
			},

			// ── Automatic rants ───────────────────────────────
			{
				type: "group",
				heading: "Automatic rants",
				items: [
					{
						name: "Enable automatic rants",
						desc: "Villagers will occasionally speak up on their own, at the average rate set below.",
						control: {
							type: "toggle",
							key: "pageRantEnabled",
							defaultValue: false,
						},
					},
					{
						name: "Only rant when focused",
						desc: "Suppress automatic rants while Obsidian is in the background. Right-click rants are always allowed.",
						control: {
							type: "toggle",
							key: "pageRantOnlyWhenFocused",
							defaultValue: true,
						},
					},
					{
						name: "Messages per hour",
						desc: "Average number of automatic speech bubbles per hour. Timing varies naturally around this rate.",
						control: {
							type: "slider",
							key: "pageRantPerHour",
							min: 0.5,
							max: 60,
							step: 0.5,
							defaultValue: 4,
							displayFormat: (v) => `${v}/hr`,
						},
					},
					{
						name: "Conversation frequency",
						desc: "Percentage of automatic speech events that become a chat between two villagers instead of a solo comment.",
						control: {
							type: "slider",
							key: "banterPercent",
							min: 0,
							max: 100,
							step: 5,
							defaultValue: 40,
							displayFormat: (v) => `${v}%`,
							disabled: () => !data.banterEnabled,
						},
					},
					{
						name: "Page context length",
						desc: "Characters from your current note sent to the AI. More = better awareness, but costs more tokens.",
						control: {
							type: "slider",
							key: "pageRantContextChars",
							min: 100,
							max: 10000,
							step: 100,
							defaultValue: 1200,
							displayFormat: (v) => `${v} chars`,
						},
					},
				],
			},

			// ── Danger zone ───────────────────────────────────
			{
				type: "group",
				heading: "Danger zone",
				items: [
					{
						name: "Reset settings",
						desc: "Restores every setting to its original value. Pets stay right where they are.",
						render: (setting) => {
							setting.addButton((btn) => {
								btn.setButtonText("Reset to defaults")
									.setDestructive()
									.onClick(() => {
										this.confirm(
											"Reset settings to defaults?",
											"All settings will be restored to their original values. Your pets will not be removed.",
											"Reset to defaults",
											async () => {
												Object.assign(
													this.plugin.instanceData,
													DEFAULT_DATA,
												);
												await this.plugin.saveData(
													this.plugin.instanceData,
												);
												this.update();
												new Notice(
													"Settings have been reset to defaults.",
												);
											},
										);
									});
							});
						},
					},
				],
			},
		];
	}

	// ── Definition builders ────────────────────────────────────

	/** The user's pets as a manageable list with add/delete affordances. */
	private petList(): SettingDefinitionList<SettingKey> {
		const pets = this.plugin.instanceData.pets;
		return {
			type: "list",
			heading: "My pets",
			emptyState: createFragment((frag) => {
				const empty = frag.createDiv({ cls: "pet-settings-empty" });
				empty.createDiv({
					cls: "pet-settings-empty-icon",
					text: "🐾",
				});
				empty.createEl("p", {
					text: "No pets yet! Add your first companion with the add button.",
					cls: "pet-settings-empty-text",
				});
			}),
			addItem: {
				name: "Add pet",
				action: () => {
					this.plugin.showAddPetCommand(() => this.update());
				},
			},
			onDelete: async (index) => {
				const pet = pets[index];
				if (!pet) return;
				await this.plugin.removePetById(pet.id);
				this.update();
			},
			items: pets.map((pet) => ({
				name: pet.name,
				desc: `Type: ${
					getStardewSpeciesDefinition(pet.type)?.label ?? pet.type
				}`,
				searchable: false,
			})),
		};
	}

	/** Per-villager memory rows, or null when nobody remembers anything yet. */
	private memoryList(): SettingDefinitionList<SettingKey> | null {
		const npcMemories = this.plugin.instanceData.npcMemories ?? {};
		const entries = Object.keys(npcMemories)
			.map((type) => ({ type, memories: npcMemories[type] }))
			.filter((entry) => entry.memories.length > 0);

		if (entries.length === 0) return null;

		return {
			type: "list",
			onDelete: async (index) => {
				const entry = entries[index];
				if (!entry) return;
				await this.plugin.clearNpcMemories(entry.type);
				this.update();
			},
			items: entries.map(({ type, memories }) => ({
				name:
					getStardewSpeciesDefinition(type)?.label ?? type,
				desc: `${memories.length} ${
					memories.length === 1 ? "memory" : "memories"
				}: ${memories.join(" · ")}`,
				searchable: false,
			})),
		};
	}

	private hasMemories(): boolean {
		const npcMemories = this.plugin.instanceData.npcMemories ?? {};
		return Object.keys(npcMemories).some(
			(type) => npcMemories[type].length > 0,
		);
	}

	private visitorSummary(): string {
		const visitors = this.plugin.getCurrentVisitors();
		if (visitors.length === 0) {
			return "Nobody right now — check back at a different hour. Each villager keeps their own schedule.";
		}
		return visitors.map((v) => v.name).join(", ");
	}

	// ── Imperative helpers ─────────────────────────────────────

	/** Opens a confirmation modal with a destructive confirm button. */
	private confirm(
		title: string,
		body: string,
		confirmText: string,
		onConfirm: () => void | Promise<void>,
	): void {
		const modal = new ConfirmationModal(this.app);
		modal.setTitle(title);
		modal.setContent(body);
		modal.addButton((btn) => {
			btn.setButtonText(confirmText)
				.setDestructive()
				.onClick(() => onConfirm());
		});
		modal.addCancelButton();
		modal.open();
	}

	private async testConnection(
		btn: { setButtonText: (t: string) => void; setDisabled: (d: boolean) => void },
	): Promise<void> {
		const keyName = this.plugin.instanceData.openAiApiKey?.trim();
		const key = keyName
			? this.app.secretStorage.getSecret(keyName)
			: null;
		const baseUrl = this.plugin.instanceData.openAiBaseUrl?.trim();
		const model = this.plugin.instanceData.selectedModel?.trim();

		if (!key) {
			new Notice("Please select an API key secret first.", 5000);
			return;
		}
		if (!baseUrl) {
			new Notice("Please enter an API endpoint.", 5000);
			return;
		}
		if (!model) {
			new Notice("Please enter a model name.", 5000);
			return;
		}

		btn.setButtonText("Testing…");
		btn.setDisabled(true);

		try {
			const client = initModel(key, baseUrl);
			const resp = await client.chat.completions.create({
				model,
				messages: [{ role: "user", content: "Say 'ok'" }],
				max_tokens: 20,
			});
			const reply = resp.choices[0]?.message?.content?.trim() || "";
			new Notice(
				reply
					? `✅ Connected — "${reply}"`
					: "✅ Connection successful!",
				6000,
			);
		} catch (e: unknown) {
			const msg = (e as { message?: string })?.message || String(e);
			console.error("API test failed:", e);
			new Notice(`❌ Connection failed: ${msg}`, 8000);
		} finally {
			btn.setButtonText("Test connection");
			btn.setDisabled(false);
		}
	}
}
