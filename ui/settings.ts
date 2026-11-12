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
import { probeChatModel } from "../ai/chat";
import { classifyAiError, describeAiError } from "../ai/errors";
import {
	isLocalEndpoint,
	normalizeBaseUrl,
} from "../ai/provider";
import { AiErrorModal } from "./ai-error-modal";
import { getAiErrorCopy } from "./ai-error-copy";
import { DeepSeekSetupModal } from "./onboarding";
import { getStardewSpeciesDefinition } from "../pets/stardew-species";
import { getSpeciesLabel } from "../pets/species-i18n";
import { DEFAULT_BASE_URL } from "../core/constants";
import { t, tMobile } from "../core/i18n";
import { isMobileUi } from "../core/platform";

type SettingKey = Extract<keyof PetPluginData, string>;

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
			case "uiLanguage":
				plugin.updateUiLanguage(value as "auto" | "zh" | "en");
				this.update();
				break;
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
					normalizeBaseUrl(value as string) || DEFAULT_BASE_URL,
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
				heading: t("settings.group.display"),
				items: [
					{
						name: t("settings.language.name"),
						desc: t("settings.language.desc"),
						control: {
							type: "dropdown",
							key: "uiLanguage",
							options: {
								auto: t("settings.language.auto"),
								en: t("settings.language.en"),
								zh: t("settings.language.zh"),
							},
							defaultValue: "auto",
						},
					},
					{
						name: t("settings.overlayMode.name"),
						desc: tMobile(
							"settings.overlayMode.desc",
							"settings.overlayMode.descMobile",
						),
						control: {
							type: "toggle",
							key: "overlayMode",
							defaultValue: false,
						},
					},
					{
						name: t("settings.petSize.name"),
						desc: t("settings.petSize.desc"),
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
						name: t("settings.petSpeed.name"),
						desc: t("settings.petSpeed.desc"),
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
					{
						name: t("settings.touch.name"),
						desc: t("settings.touch.desc"),
						visible: () => isMobileUi(),
					},
				],
			},

			// ── My pets ───────────────────────────────────────
			this.petList(),
			{
				name: t("settings.removeAllPets.name"),
				desc: t("settings.removeAllPets.desc"),
				visible: () => data.pets.length > 0,
				render: (setting) => {
					setting.addButton((btn) => {
						btn.setButtonText(t("settings.removeAllPets.button"))
							.setDestructive()
							.onClick(() => {
								this.confirm(
									t("confirm.removeAllPets.title"),
									t("confirm.removeAllPets.body"),
									t("confirm.removeAllPets.button"),
									async () => {
										await this.plugin.clearAllPets();
										this.update();
										new Notice(
											t("notices.allPetsRemoved"),
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
				heading: t("settings.group.villagerVisits"),
				items: [
					{
						name: t("settings.scheduledVisits.name"),
						desc: t("settings.scheduledVisits.desc"),
						control: {
							type: "toggle",
							key: "npcScheduleEnabled",
							defaultValue: false,
						},
					},
					{
						name: t("settings.maxVisitors.name"),
						desc: t("settings.maxVisitors.desc"),
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
						name: t("settings.currentlyInTown.name"),
						desc: this.visitorSummary(),
						visible: () => data.npcScheduleEnabled,
					},
				],
			},

			// ── AI configuration ──────────────────────────────
			{
				type: "group",
				heading: t("settings.group.ai"),
				items: [
					{
						name: t("settings.aiSetup.name"),
						desc: this.plugin.isDeepSeekConfigured()
							? t("settings.aiSetup.readyDesc")
							: this.plugin.hasUsableAiConfig()
								? t("settings.aiSetup.otherProviderDesc")
								: t("settings.aiSetup.desc"),
						render: (setting) => {
							setting.addButton((btn) => {
								btn.setButtonText(
									this.plugin.isDeepSeekConfigured()
										? t("settings.aiSetup.reconfigure")
										: t("settings.aiSetup.button"),
								)
									.setCta()
									.onClick(() => {
										new DeepSeekSetupModal(this.app, this.plugin, {
											onDone: () => this.update(),
										}).open();
									});
							});
						},
					},
					{
						name: t("settings.apiKey.name"),
						desc: t("settings.apiKey.desc"),
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
						name: t("settings.apiEndpoint.name"),
						desc: t("settings.apiEndpoint.desc"),
						control: {
							type: "text",
							key: "openAiBaseUrl",
							placeholder: DEFAULT_BASE_URL,
							defaultValue: DEFAULT_BASE_URL,
						},
					},
					{
						name: t("settings.model.name"),
						desc: t("settings.model.desc"),
						control: {
							type: "text",
							key: "selectedModel",
							placeholder: "deepseek-flash",
							defaultValue: "deepseek-flash",
						},
					},
					{
						name: t("settings.aiDialogueChinese.name"),
						desc: t("settings.aiDialogueChinese.desc"),
						control: {
							type: "toggle",
							key: "useChinesePrompt",
							defaultValue: false,
						},
					},
					{
						name: t("settings.testConnection.name"),
						desc: t("settings.testConnection.desc"),
						render: (setting) => {
							setting.addButton((btn) => {
								btn.setButtonText(t("settings.testConnection.button"))
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
				heading: t("settings.group.speech"),
				items: [
					{
						name: t("settings.npcSpeech.name"),
						desc: t("settings.npcSpeech.desc"),
						control: {
							type: "toggle",
							key: "npcSpeechEnabled",
							defaultValue: true,
						},
					},
					{
						name: t("settings.banter.name"),
						desc: t("settings.banter.desc"),
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
				heading: t("settings.group.memory"),
				items: [
					{
						name: t("settings.memory.name"),
						desc: t("settings.memory.desc"),
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
				name: t("settings.clearMemories.name"),
				desc: t("settings.clearMemories.desc"),
				visible: () => this.hasMemories(),
				render: (setting) => {
					setting.addButton((btn) => {
						btn.setButtonText(t("settings.clearMemories.button"))
							.setDestructive()
							.onClick(() => {
								this.confirm(
									t("confirm.clearMemories.title"),
									t("confirm.clearMemories.body"),
									t("confirm.clearMemories.button"),
									async () => {
										await this.plugin.clearNpcMemories();
										this.update();
										new Notice(
											t("notices.allMemoriesCleared"),
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
				heading: t("settings.group.rants"),
				items: [
					{
						name: t("settings.rants.enabled.name"),
						desc: t("settings.rants.enabled.desc"),
						control: {
							type: "toggle",
							key: "pageRantEnabled",
							defaultValue: false,
						},
					},
					{
						name: t("settings.rants.focused.name"),
						desc: tMobile(
							"settings.rants.focused.desc",
							"settings.rants.focused.descMobile",
						),
						control: {
							type: "toggle",
							key: "pageRantOnlyWhenFocused",
							defaultValue: true,
						},
					},
					{
						name: t("settings.rants.perHour.name"),
						desc: t("settings.rants.perHour.desc"),
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
						name: t("settings.rants.frequency.name"),
						desc: t("settings.rants.frequency.desc"),
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
						name: t("settings.rants.context.name"),
						desc: t("settings.rants.context.desc"),
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
				heading: t("settings.group.danger"),
				items: [
					{
						name: t("settings.reset.name"),
						desc: t("settings.reset.desc"),
						render: (setting) => {
							setting.addButton((btn) => {
								btn.setButtonText(t("settings.reset.button"))
									.setDestructive()
									.onClick(() => {
										this.confirm(
											t("confirm.reset.title"),
											t("confirm.reset.body"),
											t("confirm.reset.button"),
											async () => {
												await this.plugin.resetSettingsToDefaults();
												this.update();
												new Notice(
													t("notices.settingsReset"),
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
			heading: t("settings.myPets.heading"),
			emptyState: createFragment((frag) => {
				const empty = frag.createDiv({ cls: "pet-settings-empty" });
				empty.createDiv({
					cls: "pet-settings-empty-icon",
					text: "🐾",
				});
				empty.createEl("p", {
					text: t("settings.myPets.empty"),
					cls: "pet-settings-empty-text",
				});
			}),
			addItem: {
				name: t("settings.addPet.name"),
				action: () => {
					this.plugin.showAddPetCommand(() => this.update());
				},
			},
			onDelete: (index) => {
				const pet = pets[index];
				if (!pet) return;
				void this.plugin.removePetById(pet.id).then(() => this.update());
			},
			items: pets.map((pet) => {
				const typeLabel = getStardewSpeciesDefinition(pet.type)?.label ?? pet.type;
				return {
					name: pet.name,
					desc: t("settings.petType", {
						type: getSpeciesLabel(pet.type, typeLabel),
					}),
					searchable: false,
				};
			}),
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
			onDelete: (index) => {
				const entry = entries[index];
				if (!entry) return;
				void this.plugin.clearNpcMemories(entry.type).then(() => this.update());
			},
			items: entries.map(({ type, memories }) => {
				const typeLabel = getStardewSpeciesDefinition(type)?.label ?? type;
				return {
					name: getSpeciesLabel(type, typeLabel),
					desc: t(
						memories.length === 1
							? "settings.memory.count.one"
							: "settings.memory.count.other",
						{
							count: memories.length,
							memories: memories.join(" · "),
						},
					),
					searchable: false,
				};
			}),
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
			return t("settings.currentlyInTown.none");
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
		// Local OpenAI-compatible servers commonly accept requests without a
		// key. Don't make the user invent one just to run the test.
		const baseUrl = normalizeBaseUrl(this.plugin.instanceData.openAiBaseUrl);
		const model = this.plugin.getSelectedModel();

		if (!baseUrl) {
			new Notice(t("settings.testConnection.noEndpoint"), 5000);
			return;
		}
		if (!key && !isLocalEndpoint(baseUrl)) {
			new Notice(t("settings.testConnection.noKey"), 5000);
			return;
		}
		if (!model) {
			new Notice(t("settings.testConnection.noModel"), 5000);
			return;
		}

		btn.setButtonText(t("settings.testConnection.testing"));
		btn.setDisabled(true);

		try {
			const result = await probeChatModel(key, baseUrl, model);
			if (result.ok) {
				new Notice(
					result.reply
						? t("notices.aiTestSuccess", { reply: result.reply })
						: t("notices.aiTestSuccessNoReply"),
					6000,
				);
			} else {
				const info = classifyAiError(result.error);
				const copy = getAiErrorCopy(info, { baseUrl });
				const details = describeAiError(result.error, {
					endpoint: baseUrl,
					model,
				});
				console.error(
					`[Stardew Valley Pals] Connection test failed\n${details}`,
				);
				new Notice(
					t("notices.aiTestFailed", {
						message: `${copy.title} — ${copy.body}`,
					}),
					10000,
				);
				new AiErrorModal(this.app, copy.title, copy.body, details).open();
			}
		} finally {
			btn.setButtonText(t("settings.testConnection.button"));
			btn.setDisabled(false);
		}
	}
}
