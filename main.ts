import { Plugin, Notice, WorkspaceLeaf, MarkdownView, ConfirmationModal, TFile } from "obsidian";
import type {
	PetInstance,
	PetPluginData,
	RantResult,
	SelectorOption,
	UiLanguagePreference,
} from "./core/types";
import { isNpcSpeciesType } from "./core/types";
import {
	DEFAULT_DATA,
	DEEPSEEK_BASE_URL,
	DEEPSEEK_DEFAULT_MODEL,
	DEFAULT_BASE_URL,
	ONBOARDING_VERSION,
	getFallbackBanterDialogue,
	getFallbackRantText,
	getNewNoteMessages,
} from "./core/constants";
import type { BanterLine } from "./core/constants";
import { getUiLanguage, resolveUiLanguage, setUiLanguage, t } from "./core/i18n";
import { getDefaultOverlayMode, isMobileUi } from "./core/platform";
import { classifyAiError, describeAiError } from "./ai/errors";
import {
	isDeepSeekEndpoint,
	isLocalEndpoint,
	normalizeBaseUrl,
} from "./ai/provider";
import { getAiErrorCopy } from "./ui/ai-error-copy";
import { DeepSeekSetupModal } from "./ui/onboarding";
import { computeVisitors } from "./core/npc-schedule";
import { getStardewSpeciesDefinition } from "./pets/stardew-species";
import { PetView, VIEW_TYPE_PET } from "./views/pet-view";
import { OverlayPetView } from "./views/overlay-view";
import { PetSettingTab } from "./ui/settings";
import { SelectorModal } from "./ui/modals";
import { generateDialogue, generatePageRantText, extractMemory, initModel } from "./ai/chat";
import { STARDEW_SPECIES_OPTIONS, getStardewSpeciesPersona } from "./pets/stardew-species";
import { getSpeciesLabel } from "./pets/species-i18n";
import type OpenAI from "openai";

export type { PetInstance };

const MAX_NPC_MEMORIES = 10;
const VISITOR_SYNC_INTERVAL_MS = 60 * 1000;

export default class PetPlugin extends Plugin {
	instanceData!: PetPluginData;
	private recentActivity: { ts: number; type: "modify" | "create" | "open"; path: string }[] = [];
	private chatmodel: OpenAI | null = null;
	private overlayView: OverlayPetView | null = null;
	private lastMarkdownView: MarkdownView | null = null;
	private ribbonEl: HTMLElement | null = null;
	private deepseekModelMigrated = false;
	/** Villagers currently in town under schedule mode (in-memory, recomputed from the clock). */
	private currentVisitors: PetInstance[] = [];
	protected readonly PETS: SelectorOption[] = STARDEW_SPECIES_OPTIONS;

	// ── Lifecycle ──────────────────────────────────────────────

	async onload(): Promise<void> {
		await this.loadSettings();
		this.refreshChatModel({ quiet: true });

		const wasFirstRun = !this.instanceData.firstRunComplete;
		if (wasFirstRun) {
			this.instanceData.firstRunComplete = true;
			await this.saveData(this.instanceData);
		}

		this.registerView(VIEW_TYPE_PET, (leaf) => new PetView(leaf, this));
		this.registerActivityTracking();
		this.registerCommands();
		this.registerNewNoteNotices();
		this.addSettingTab(new PetSettingTab(this.app, this));

		// Keep villager visits in sync with the clock (no-op when schedule mode is off)
		this.registerInterval(window.setInterval(() => this.syncVisitors(), VISITOR_SYNC_INTERVAL_MS));

		this.ribbonEl = this.addRibbonIcon("cat", t("ribbon.togglePetView"), () => {
			void this.togglePets();
		});

		this.app.workspace.onLayoutReady(async () => {
			// Compute today's visitors before views render so they show up immediately
			this.syncVisitors();

			if (this.instanceData.overlayMode) {
				await this.closeView();
				this.overlayView = new OverlayPetView(this);
				for (const pet of this.getPetList()) {
					this.overlayView.addPet(pet);
				}
				this.overlayView.startRantLoop();
			} else {
				if (isMobileUi()) {
					// A vault synced from desktop may have saved the pet panel in
					// the left sidebar, which is unreachable on mobile. Drop it; the
					// user can reopen it as a main-area tab from the ribbon/command.
					for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PET)) {
						if (leaf.getRoot() !== this.app.workspace.rootSplit) leaf.detach();
					}
				} else if (this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length === 0) {
					// Desktop keeps its dockable panel visible across restarts.
					await this.openView();
				}
			}
			this.maybeShowMobileGestureTip();
			this.registerEvent(
				this.app.workspace.on("active-leaf-change", (leaf) =>
					this.handleActiveLeafChange(leaf),
				),
			);

			if (this.deepseekModelMigrated) {
				new Notice(t("notices.deepseekModelMigrated"), 8000);
			}

			// First run: offer the DeepSeek wizard only when there is no AI
			// config yet. Skipping closes it permanently (onboardingVersion).
			if (wasFirstRun && !this.hasUsableAiConfig()) {
				window.setTimeout(() => {
					new DeepSeekSetupModal(this.app, this).open();
				}, 250);
			}
		});
	}

	onunload() {
		if (this.overlayView) {
			this.overlayView.destroy();
			this.overlayView = null;
		}
	}

	// ── Settings persistence ───────────────────────────────────

	async loadSettings() {
		const raw = (await this.loadData() ?? {}) as Record<string, unknown>;
		// Clean up stale fields from removed features
		delete raw.animatedBackground;
		delete raw.selectedBackground;
		delete raw.petSpeechEnabled;
		delete raw.pageRantMinMinutes;
		delete raw.pageRantMaxMinutes;

		const nonempty = (value: unknown): value is string =>
			typeof value === "string" && value.trim() !== "";
		const hasAiConfig = ["openAiApiKey", "openAiBaseUrl", "selectedModel"]
			.some((key) => nonempty(raw[key]));
		const rawBase = nonempty(raw.openAiBaseUrl) ? raw.openAiBaseUrl.trim() : undefined;
		const rawModel = nonempty(raw.selectedModel) ? raw.selectedModel.trim() : undefined;
		const rawIsDeepSeek = rawBase ? /api\.deepseek\.com/i.test(rawBase) : false;

		// Preserve an existing provider. Only brand-new installs get DeepSeek
		// defaults, so upgrading never silently switches anyone's endpoint.
		const legacyOpenAiBase = "https://api.openai.com/v1";
		const legacyOpenAiModel = "gpt-5-mini";
		// A new mobile install starts with pets floating over the note; desktop
		// keeps its dockable panel. An existing preference always wins (vaults
		// synced from another device keep their chosen mode).
		const rawOverlay = typeof raw.overlayMode === "boolean" ? raw.overlayMode : undefined;
		const defaults: Partial<PetPluginData> = {
			...DEFAULT_DATA,
			overlayMode: rawOverlay ?? getDefaultOverlayMode(),
			openAiBaseUrl: hasAiConfig
				? (rawBase ?? legacyOpenAiBase)
				: DEEPSEEK_BASE_URL,
			selectedModel: hasAiConfig
				? (rawModel ?? (rawIsDeepSeek ? DEEPSEEK_DEFAULT_MODEL : legacyOpenAiModel))
				: DEEPSEEK_DEFAULT_MODEL,
		};
		this.instanceData = Object.assign({}, defaults, raw) as PetPluginData;

		let needsSave = false;

		if (typeof this.instanceData.overlayMode !== "boolean") {
			this.instanceData.overlayMode = getDefaultOverlayMode();
			needsSave = true;
		}

		// Normalize blank values that may have slipped through older saves.
		if (!this.instanceData.openAiBaseUrl?.trim()) {
			this.instanceData.openAiBaseUrl = defaults.openAiBaseUrl ?? DEEPSEEK_BASE_URL;
			needsSave = true;
		}
		// Repair common endpoint typos (`http:/`, missing /v1, full
		// /chat/completions URL) so local servers work without guesswork.
		const normalizedBaseUrl = normalizeBaseUrl(this.instanceData.openAiBaseUrl);
		if (normalizedBaseUrl && normalizedBaseUrl !== this.instanceData.openAiBaseUrl) {
			this.instanceData.openAiBaseUrl = normalizedBaseUrl;
			needsSave = true;
		}
		if (!this.instanceData.selectedModel?.trim()) {
			this.instanceData.selectedModel = defaults.selectedModel ?? DEEPSEEK_DEFAULT_MODEL;
			needsSave = true;
		}

		// DeepSeek retired deepseek-chat / deepseek-reasoner in 2026.
		if (
			/api\.deepseek\.com/i.test(this.instanceData.openAiBaseUrl) &&
			(this.instanceData.selectedModel === "deepseek-chat" ||
				this.instanceData.selectedModel === "deepseek-reasoner")
		) {
			this.instanceData.selectedModel = DEEPSEEK_DEFAULT_MODEL;
			this.deepseekModelMigrated = true;
			needsSave = true;
		}

		if (!this.instanceData.nextPetIdCounters) {
			this.instanceData.nextPetIdCounters = {};
		}
		if (!this.instanceData.npcMemories) {
			this.instanceData.npcMemories = {};
		}

		// Interface language: `auto` follows Obsidian; anything else is an
		// explicit override. Resolve before deriving other defaults.
		const pref = this.instanceData.uiLanguage;
		if (pref !== "auto" && pref !== "zh" && pref !== "en") {
			this.instanceData.uiLanguage = "auto";
			needsSave = true;
		}
		setUiLanguage(resolveUiLanguage(this.instanceData.uiLanguage ?? "auto"));

		// Brand-new users get AI dialogue in their interface language.
		if (!("useChinesePrompt" in raw) && raw.firstRunComplete !== true) {
			this.instanceData.useChinesePrompt = resolveUiLanguage(
				this.instanceData.uiLanguage ?? "auto",
			) === "zh";
			needsSave = true;
		}

		// Existing users should not be surprised by a new onboarding modal.
		if (raw.firstRunComplete === true && raw.onboardingVersion === undefined) {
			this.instanceData.onboardingVersion = ONBOARDING_VERSION;
			needsSave = true;
		}

		// Clean up counters for species that no longer exist
		for (const type of Object.keys(this.instanceData.nextPetIdCounters)) {
			if (!getStardewSpeciesDefinition(type)) {
				delete this.instanceData.nextPetIdCounters[type];
				needsSave = true;
			}
		}

		this.migratePets();

		if (needsSave) {
			await this.saveData(this.instanceData);
		}
	}

	/**
	 * Enforce villager rules on stored data:
	 * - one instance per villager, always with their official name
	 * - no stored villagers at all while schedule mode manages them
	 */
	private migratePets() {
		const seenNpcTypes = new Set<string>();
		this.instanceData.pets = this.instanceData.pets.filter((pet) => {
			if (!isNpcSpeciesType(pet.type)) return true;
			if (this.instanceData.npcScheduleEnabled) return false;
			if (seenNpcTypes.has(pet.type)) return false;
			seenNpcTypes.add(pet.type);
			const def = getStardewSpeciesDefinition(pet.type);
			if (def) pet.name = def.label;
			return true;
		});
	}

	private updateSetting<K extends keyof PetPluginData>(key: K, value: PetPluginData[K]): void {
		this.instanceData[key] = value;
		void this.saveData(this.instanceData);
	}

	// ── AI configuration ───────────────────────────────────────

	/**
	 * The model every AI call should use. Never fall back to a DeepSeek model
	 * when the configured endpoint is something else — sending `deepseek-flash`
	 * to a local server just produces a confusing "model not found".
	 */
	getSelectedModel(): string {
		const selected = this.instanceData.selectedModel?.trim();
		if (selected && selected !== "none") return selected;
		return isDeepSeekEndpoint(this.instanceData.openAiBaseUrl)
			? DEEPSEEK_DEFAULT_MODEL
			: "";
	}

	/** Rebuild the live OpenAI client after any key/endpoint/model change. */
	refreshChatModel(opts: { quiet?: boolean } = {}): boolean {
		const model = this.getSelectedModel();
		const baseUrl = normalizeBaseUrl(
			this.instanceData.openAiBaseUrl || DEFAULT_BASE_URL,
		);

		if (!model) {
			this.chatmodel = null;
			if (!opts.quiet) new Notice(t("notices.enterModelFirst"));
			return false;
		}

		const keyName = this.instanceData.openAiApiKey?.trim();
		const key = keyName ? this.app.secretStorage.getSecret(keyName) : null;
		// Ollama and friends usually don't authenticate. For a local endpoint,
		// an empty key is a valid configuration; the SDK gets a placeholder.
		if (!key && !isLocalEndpoint(baseUrl)) {
			this.chatmodel = null;
			if (!opts.quiet) new Notice(t("notices.selectSecretFirst"));
			return false;
		}
		try {
			this.chatmodel = initModel(key, baseUrl);
			return true;
		} catch (e) {
			console.warn("Failed to initialize chat model:", e);
			this.chatmodel = null;
			if (!opts.quiet) new Notice(t("notices.aiInitFailed"));
			return false;
		}
	}

	/** Persist a config patch and refresh the client in one step. */
	async applyAiConfig(
		patch: Partial<Pick<PetPluginData, "openAiApiKey" | "openAiBaseUrl" | "selectedModel">>,
		opts: { quiet?: boolean; save?: boolean } = {},
	): Promise<boolean> {
		Object.assign(this.instanceData, patch);
		if (opts.save !== false) {
			await this.saveData(this.instanceData);
		}
		return this.refreshChatModel({ quiet: opts.quiet ?? true });
	}

	/** True when the endpoint, key (if required), and model are usable. */
	hasUsableAiConfig(): boolean {
		const baseUrl = normalizeBaseUrl(this.instanceData.openAiBaseUrl);
		const name = this.instanceData.openAiApiKey?.trim();
		const key = name ? this.app.secretStorage.getSecret(name) : null;
		if (!key && !isLocalEndpoint(baseUrl)) return false;
		const model = this.getSelectedModel();
		return !!model && model !== "none";
	}

	isDeepSeekConfigured(): boolean {
		return this.hasUsableAiConfig() &&
			isDeepSeekEndpoint(this.instanceData.openAiBaseUrl);
	}

	async markOnboardingSeen(): Promise<void> {
		if (this.instanceData.onboardingVersion === ONBOARDING_VERSION) return;
		this.instanceData.onboardingVersion = ONBOARDING_VERSION;
		await this.saveData(this.instanceData);
	}

	async markDeepSeekSetupComplete(): Promise<void> {
		this.instanceData.deepseekSetupComplete = true;
		this.instanceData.onboardingVersion = ONBOARDING_VERSION;
		await this.saveData(this.instanceData);
	}

	updateUiLanguage(pref: UiLanguagePreference, opts: { silent?: boolean } = {}): void {
		this.instanceData.uiLanguage = pref;
		void this.saveData(this.instanceData);
		setUiLanguage(resolveUiLanguage(pref));

		const label = t("ribbon.togglePetView");
		this.ribbonEl?.setAttribute("aria-label", label);
		this.ribbonEl?.setAttribute("data-tooltip", label);

		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PET)) {
			if (leaf.view instanceof PetView) leaf.view.refreshLocalizedUi();
		}
		if (!opts.silent) {
			new Notice(t("notices.languageRestartHint"), 8000);
		}
	}

	/** Reset settings without touching pets or what villagers remember. */
	async resetSettingsToDefaults(): Promise<void> {
		const previousOverlay = this.instanceData.overlayMode;
		const preserved: Partial<PetPluginData> = {
			pets: this.instanceData.pets,
			nextPetIdCounters: this.instanceData.nextPetIdCounters,
			npcMemories: this.instanceData.npcMemories,
			firstRunComplete: true,
			onboardingVersion: this.instanceData.onboardingVersion ?? ONBOARDING_VERSION,
			mobileGestureTipSeen: this.instanceData.mobileGestureTipSeen ?? false,
		};
		Object.assign(this.instanceData, DEFAULT_DATA, preserved, {
			deepseekSetupComplete: false,
		});
		setUiLanguage(resolveUiLanguage(this.instanceData.uiLanguage ?? "auto"));
		await this.saveData(this.instanceData);
		if (this.instanceData.overlayMode !== previousOverlay) {
			// Applying the mode through setOverlayMode tears down/creates the
			// matching view; just flipping the flag would leave the old one alive.
			const nextOverlay = this.instanceData.overlayMode;
			this.instanceData.overlayMode = previousOverlay;
			await this.setOverlayMode(nextOverlay);
		}
		this.refreshChatModel({ quiet: true });
		this.syncVisitors();
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PET)) {
			if (leaf.view instanceof PetView) leaf.view.refreshLocalizedUi();
		}
	}

	// ── Activity tracking ──────────────────────────────────────

	private registerActivityTracking() {
		this.registerEvent(
			this.app.vault.on("modify", (file) => this.recordActivity("modify", file.path)),
		);
		this.registerEvent(
			this.app.vault.on("create", (file) => this.recordActivity("create", file.path)),
		);
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) this.recordActivity("open", activeFile.path);

				// Track last active MarkdownView so we can read selection
				// even after focus moves to a non-editor leaf (e.g. pet-view).
				if (leaf?.view instanceof MarkdownView) {
					this.lastMarkdownView = leaf.view;
				}
			}),
		);
	}

	private recordActivity(type: "modify" | "create" | "open", path: string) {
		const ts = Date.now();
		this.recentActivity.push({ ts, type, path });
		const cutoff = Date.now() - 15 * 60 * 1000;
		this.recentActivity = this.recentActivity.filter((e) => e.ts >= cutoff);
	}

	getRecentActivitySummary(minutes = 10): string {
		const cutoff = Date.now() - minutes * 60 * 1000;
		const recent = this.recentActivity.filter((e) => e.ts >= cutoff);
		if (recent.length === 0) {
			return this.instanceData.useChinesePrompt
				? `过去 ${minutes} 分钟内没有可见的编辑或打开记录。`
				: `No edits or file opens detected in the last ${minutes} minutes.`;
		}

		const map = new Map<string, Set<string>>();
		for (const ev of recent) {
			const name = ev.path.split("/").pop() || ev.path;
			if (!map.has(ev.type)) map.set(ev.type, new Set());
			map.get(ev.type)!.add(name);
		}

		const parts: string[] = [];
		const labels = this.instanceData.useChinesePrompt
			? { modify: "修改了", create: "新建", open: "打开了" }
			: { modify: "modified", create: "created", open: "opened" };
		const separator = this.instanceData.useChinesePrompt ? "；" : "; ";

		for (const type of Object.keys(labels)) {
			const label = labels[type as keyof typeof labels];
			if (map.has(type)) {
				const files = Array.from(map.get(type)!).slice(0, 6).join(", ");
				parts.push(`${label}：${files}`);
			}
		}

		if (recent.length > 6) {
			parts.push(this.instanceData.useChinesePrompt ? "以及其他活动" : "and other activity");
		}

		return parts.join(separator);
	}

	// ── Page context ───────────────────────────────────────────

	/**
	 * The note the AI should talk about. On mobile the pet panel is a main-area
	 * tab, so it can be the active leaf and `getActiveFile()` returns null;
	 * on a cold start it can even be active before any markdown view was seen.
	 */
	private getContextFile(): TFile | null {
		const active = this.app.workspace.getActiveFile();
		if (active) return active;

		if (this.lastMarkdownView?.file) return this.lastMarkdownView.file;

		// Cold start with the pet tab restored as active: use an open note
		// instead of falling back to the pet view's own title. Deferred views
		// report `file === null`, so read the path from the leaf's view state.
		const recent = this.app.workspace.getMostRecentLeaf();
		if (recent?.view instanceof MarkdownView && recent.view.file) {
			return recent.view.file;
		}
		for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
			if (leaf.view instanceof MarkdownView && leaf.view.file) return leaf.view.file;
			const path = (leaf.getViewState()?.state as { file?: string } | undefined)?.file;
			if (path) {
				const file = this.app.vault.getAbstractFileByPath(path);
				if (file instanceof TFile) return file;
			}
		}
		return null;
	}

	getCurrentPageLabel(): string {
		const file = this.getContextFile();
		if (file) return file.basename;
		return this.app.workspace.getMostRecentLeaf()?.view?.getDisplayText?.() ?? t("notices.currentPage");
	}

	private async getCurrentPageContextSnippet(maxChars: number): Promise<string> {
		const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (mdView) {
			try {
				const editor = (mdView as { editor?: { getSelection?: () => string; getCursor?: () => { line: number }; lineCount?: () => number; getLine?: (n: number) => string } }).editor;
				if (editor?.getCursor && editor?.getLine) {
					const cursor = editor.getCursor();
					const lineCount = editor.lineCount?.() ?? 9999;
					const startLine = Math.max(0, cursor.line - 8);
					const endLine = Math.min(lineCount - 1, cursor.line + 8);
					const lines: string[] = [];
					for (let i = startLine; i <= endLine; i++) {
						lines.push(editor.getLine(i) || "");
					}
					const snippet = lines.join("\n");
					return snippet.length > maxChars ? `${snippet.slice(0, maxChars)}\n...[内容已截断]` : snippet;
				}
			} catch (error) {
				console.error("Failed to read editor content for context snippet:", error);
			}
		}

		const activeFile = this.getContextFile();
		if (!activeFile) return "";

		try {
			const rawContent = await this.app.vault.cachedRead(activeFile);
			const normalized = rawContent.replace(/\r\n/g, "\n").trim();
			if (!normalized) return "";
			return normalized.length <= maxChars ? normalized : `${normalized.slice(0, maxChars)}\n...[内容已截断]`;
		} catch (error) {
			console.error("Failed to read current page content:", error);
			return "";
		}
	}

	// ── Page rant (AI speech) ──────────────────────────────────

	async getPageRantText(trigger: "timer" | "rightclick", petType?: string): Promise<RantResult> {
		const pageLabel = this.getCurrentPageLabel();
		const npcName = petType ? (getStardewSpeciesDefinition(petType)?.label ?? petType) : "a villager";

		// Capture selected text or caret vicinity.
		// When the pet lives in a sidebar leaf (PetView), right-clicking it
		// switches the active leaf away from the editor, so we fall back to
		// the last known MarkdownView tracked via active-leaf-change.
		let selectedText = "";
		const mdView =
			this.app.workspace.getActiveViewOfType(MarkdownView) ??
			this.lastMarkdownView;
		if (mdView) {
			try {
				const editor = (mdView as { editor?: { getSelection?: () => string; getCursor?: () => { line: number }; getLine?: (n: number) => string } }).editor;
				if (editor) {
					const sel = editor.getSelection?.();
					if (sel && sel.trim()) {
						selectedText = sel.length > 1000 ? `${sel.slice(0, 1000)}\n...[已截断]` : sel;
					} else if (editor.getCursor && editor.getLine) {
						const cursor = editor.getCursor();
						const lines = [
							cursor.line > 0 ? editor.getLine(cursor.line - 1) : "",
							editor.getLine(cursor.line) || "",
							editor.getLine(cursor.line + 1) || "",
						].filter(Boolean);
						const snippet = lines.join("\n");
						selectedText = snippet.length > 1000 ? `${snippet.slice(0, 1000)}\n...[已截断]` : snippet;
					}
				}
			} catch (e) {
				console.warn("Failed to read editor selection for page rant:", e);
			}
		}

		const pageContext = await this.getCurrentPageContextSnippet(this.instanceData.pageRantContextChars || 1200);
		const activitySummary = this.getRecentActivitySummary(10);

		let generated: RantResult = { text: "" };
		try {
			generated = await generatePageRantText(
				pageLabel, trigger, selectedText, pageContext,
				this.instanceData.pageRantContextChars || 1200, activitySummary,
				npcName,
				petType ? getStardewSpeciesPersona(petType) : undefined,
				petType ? this.getNpcMemories(petType) : [],
				this.chatmodel, this.getSelectedModel(),
				this.instanceData.useChinesePrompt ?? false,
			);
		} catch (e: unknown) {
			const baseUrl = normalizeBaseUrl(this.instanceData.openAiBaseUrl);
			const copy = getAiErrorCopy(classifyAiError(e), { baseUrl });
			console.error(
				`[Stardew Valley Pals] Page rant generation failed\n${describeAiError(e, {
					endpoint: baseUrl,
					model: this.getSelectedModel(),
				})}`,
			);
			new Notice(t("notices.aiCallFailed", { error: copy.short }), 5000);
		}

		if (generated.text) {
			void this.maybeExtractMemory(petType);
			return generated;
		}
		return { text: getFallbackRantText(pageLabel, trigger, this.instanceData.useChinesePrompt ?? false) };
	}

	// ── Banter (villager conversations) ────────────────────────

	async getBanterDialogue(typeA: string, typeB: string): Promise<BanterLine[]> {
		const nameA = getStardewSpeciesDefinition(typeA)?.label ?? typeA;
		const nameB = getStardewSpeciesDefinition(typeB)?.label ?? typeB;
		const pageLabel = this.getCurrentPageLabel();
		const pageContext = await this.getCurrentPageContextSnippet(this.instanceData.pageRantContextChars || 1200);

		let lines = await generateDialogue(
			nameA, getStardewSpeciesPersona(typeA), this.getNpcMemories(typeA),
			nameB, getStardewSpeciesPersona(typeB), this.getNpcMemories(typeB),
			pageLabel, pageContext,
			this.chatmodel, this.getSelectedModel(),
			this.instanceData.useChinesePrompt ?? false,
		);

		if (lines.length === 0) {
			lines = getFallbackBanterDialogue(nameA, nameB, this.instanceData.useChinesePrompt ?? false);
		}

		void this.maybeExtractMemory(Math.random() < 0.5 ? typeA : typeB);
		return lines;
	}

	// ── Core memories ──────────────────────────────────────────

	getNpcMemories(type: string): string[] {
		return this.instanceData.npcMemories?.[type] ?? [];
	}

	async addNpcMemory(type: string, fact: string): Promise<void> {
		if (!this.instanceData.npcMemories) this.instanceData.npcMemories = {};
		const list = this.instanceData.npcMemories[type] ?? [];
		const normalized = fact.trim();
		if (!normalized) return;
		// Skip duplicates / near-duplicates
		if (list.some((m) => m === normalized || m.includes(normalized) || normalized.includes(m))) {
			return;
		}
		list.push(normalized);
		if (list.length > MAX_NPC_MEMORIES) list.splice(0, list.length - MAX_NPC_MEMORIES);
		this.instanceData.npcMemories[type] = list;
		await this.saveData(this.instanceData);
	}

	async clearNpcMemories(type?: string): Promise<void> {
		if (!this.instanceData.npcMemories) this.instanceData.npcMemories = {};
		if (type) {
			delete this.instanceData.npcMemories[type];
		} else {
			this.instanceData.npcMemories = {};
		}
		await this.saveData(this.instanceData);
	}

	/** Occasionally distill a durable fact about the user after an NPC speaks. */
	private async maybeExtractMemory(petType?: string): Promise<void> {
		if (!petType || !isNpcSpeciesType(petType)) return;
		if (!this.instanceData.memoryEnabled) return;
		if (!this.chatmodel) return;
		if (Math.random() > 1 / 3) return;

		const npcName = getStardewSpeciesDefinition(petType)?.label ?? petType;
		const pageLabel = this.getCurrentPageLabel();
		const pageContext = await this.getCurrentPageContextSnippet(1500);
		const fact = await extractMemory(
			pageLabel, pageContext, npcName, this.getNpcMemories(petType),
			this.chatmodel, this.getSelectedModel(),
			this.instanceData.useChinesePrompt ?? false,
		);
		if (fact) {
			await this.addNpcMemory(petType, fact);
		}
	}

	// ── Commands ───────────────────────────────────────────────

	private registerCommands() {
		this.addCommand({
			id: "toggle-pets",
			name: t("ribbon.togglePetView"),
			callback: () => {
				void this.togglePets();
			},
		});
		this.addCommand({
			id: "add-pet-dropdown",
			name: t("commands.addPet"),
			callback: () => this.showAddPetCommand(),
		});
		this.addCommand({
			id: "clear-all-pets",
			name: t("commands.removeAllPets"),
			callback: () => {
				const modal = new ConfirmationModal(this.app);
				modal.setTitle(t("confirm.removeAllPets.title"));
				modal.setContent(t("confirm.removeAllPets.body"));
				modal.addButton((btn) => {
					btn.setButtonText(t("confirm.removeAllPets.button"))
						.setDestructive()
						.onClick(async () => {
							await this.clearAllPets();
							new Notice(t("notices.allPetsRemoved"));
						});
				});
				modal.addCancelButton();
				modal.open();
			},
		});
		this.addCommand({
			id: "remove-pet-by-id",
			name: t("commands.removePet"),
			callback: () => {
				const options = this.instanceData.pets.map((pet) => {
					const typeLabel = getStardewSpeciesDefinition(pet.type)?.label ?? pet.type;
					return {
						value: pet.id,
						label: `${pet.name} (${getSpeciesLabel(pet.type, typeLabel)})`,
					};
				});
				new SelectorModal(this.app, options, async (value: string) => {
					await this.removePetById(value);
				}).open();
			},
		});
		this.addCommand({
			id: "setup-deepseek-ai",
			name: t("commands.setupDeepSeek"),
			callback: () => {
				new DeepSeekSetupModal(this.app, this).open();
			},
		});
	}

	private registerNewNoteNotices() {
		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(
				this.app.vault.on("create", () => {
					const messages = getNewNoteMessages(getUiLanguage() === "zh");
					const msg = messages[Math.floor(Math.random() * messages.length)];
					new Notice(msg);
				}),
			);
		});
	}

	showAddPetCommand(onComplete?: () => void) {
		const scheduleMode = this.instanceData.npcScheduleEnabled;
		const presentNpcTypes = new Set(
			this.getPetList()
				.filter((p) => isNpcSpeciesType(p.type))
				.map((p) => p.type),
		);
		const options = this.PETS.map((option) => {
			const localized = {
				...option,
				label: getSpeciesLabel(option.value, option.label),
			};
			if (!isNpcSpeciesType(option.value)) return localized;
			if (scheduleMode) {
				return { ...localized, disabled: true, disabledReason: t("notices.scheduleOnly") };
			}
			if (presentNpcTypes.has(option.value)) {
				return { ...localized, disabled: true, disabledReason: t("notices.alreadyInTown") };
			}
			return localized;
		});

		new SelectorModal(this.app, options, async (value: string, name: string) => {
			await this.addPet(value, name);
			if (onComplete) {
				// Defer to the next macrotask so the modal has time to close
				// before the caller refreshes UI that sits behind the modal.
				window.setTimeout(() => onComplete(), 0);
			}
		}).open();
	}

	// ── View management ────────────────────────────────────────

	/** Ribbon icon and the `toggle-pets` command share this. */
	async togglePets(): Promise<void> {
		if (this.instanceData.overlayMode) {
			if (this.overlayView) {
				this.overlayView.destroy();
				this.overlayView = null;
			} else {
				this.overlayView = new OverlayPetView(this);
				for (const pet of this.getPetList()) {
					this.overlayView.addPet(pet);
				}
				this.overlayView.startRantLoop();
			}
			return;
		}
		const isOpen = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length > 0;
		if (isOpen) await this.closeView();
		else await this.openView();
	}

	async openView() {
		if (this.instanceData.overlayMode) return;
		const { workspace } = this.app;
		const existing = workspace.getLeavesOfType(VIEW_TYPE_PET)[0];
		if (existing) {
			// Desktop docks the pet panel in the left sidebar. A vault synced
			// between devices can carry that layout to mobile, where a sidebar
			// leaf is hidden — move it into the main area instead.
			if (isMobileUi() && existing.getRoot() !== workspace.rootSplit) {
				existing.detach();
			} else {
				await workspace.revealLeaf(existing);
				return;
			}
		}
		const leaf = isMobileUi()
			? workspace.getLeaf("tab")
			: workspace.getLeftLeaf(true);
		if (leaf) {
			await leaf.setViewState({ type: VIEW_TYPE_PET, active: true });
			await workspace.revealLeaf(leaf);
		}
	}

	async closeView() {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PET)) {
			leaf.detach();
		}
	}

	async setOverlayMode(enabled: boolean): Promise<void> {
		if (this.instanceData.overlayMode === enabled) return;
		this.instanceData.overlayMode = enabled;
		await this.saveData(this.instanceData);

		if (enabled) {
			await this.closeView();
			this.overlayView = new OverlayPetView(this);
			this.overlayView.startRantLoop();
			for (const pet of this.getPetList()) {
				this.overlayView.addPet(pet);
			}
		} else {
			this.overlayView?.destroy();
			this.overlayView = null;
			await this.openView();
		}
	}

	private addPetToViews(pet: PetInstance): void {
		if (this.instanceData.overlayMode) {
			this.overlayView?.addPet(pet);
			return;
		}
		// Panel mode: only touch open views; a closed view picks the pet up on next open
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PET)) {
			const view = leaf.view;
			if (view instanceof PetView) {
				view.addPetToView(view.getWrapper(), pet);
			}
		}
	}

	private removePetFromViews(id: string): void {
		if (this.instanceData.overlayMode) {
			this.overlayView?.removePet(id);
			return;
		}
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PET)) {
			if (leaf.view instanceof PetView) leaf.view.removePet(id);
		}
	}

	// ── Villager schedule mode ─────────────────────────────────

	async setNpcScheduleEnabled(enabled: boolean): Promise<void> {
		if (this.instanceData.npcScheduleEnabled === enabled) return;
		this.instanceData.npcScheduleEnabled = enabled;

		if (enabled) {
			// Manual villagers go home; the schedule takes over
			const manualNpcs = this.instanceData.pets.filter((p) => isNpcSpeciesType(p.type));
			if (manualNpcs.length > 0) {
				this.instanceData.pets = this.instanceData.pets.filter((p) => !isNpcSpeciesType(p.type));
				for (const npc of manualNpcs) {
					this.removePetFromViews(npc.id);
				}
				new Notice(t("notices.villagerVisitsEnabled"));
			}
			await this.saveData(this.instanceData);
			this.syncVisitors();
		} else {
			await this.saveData(this.instanceData);
			const leaving = this.currentVisitors;
			this.currentVisitors = [];
			for (const visitor of leaving) {
				this.removePetFromViews(visitor.id);
			}
			if (leaving.length > 0) {
				new Notice(t("notices.villagerVisitsDisabled"));
			}
		}
	}

	/** Bring the in-town villager roster in line with the current clock time. */
	syncVisitors(): void {
		if (!this.instanceData.npcScheduleEnabled) return;

		const targetIds = computeVisitors(new Date(), this.instanceData.maxVisitors || 3);

		// Arrivals
		for (const id of targetIds) {
			if (this.currentVisitors.some((v) => v.id === id)) continue;
			const def = getStardewSpeciesDefinition(id);
			if (!def) continue;
			const visitor: PetInstance = { id, type: id, name: def.label };
			this.currentVisitors.push(visitor);
			this.addPetToViews(visitor);
			new Notice(t("notices.villagerArrived", { name: def.label }));
		}

		// Departures
		for (const visitor of [...this.currentVisitors]) {
			if (targetIds.includes(visitor.id)) continue;
			this.currentVisitors = this.currentVisitors.filter((v) => v.id !== visitor.id);
			this.removePetFromViews(visitor.id);
			new Notice(t("notices.villagerLeft", { name: visitor.name }));
		}

		// A scheduled visitor may be the first pet a mobile user ever sees.
		this.maybeShowMobileGestureTip();
	}

	getCurrentVisitors(): PetInstance[] {
		return this.currentVisitors;
	}

	// ── Mobile onboarding ──────────────────────────────────────

	/** Explain touch gestures once, as soon as there is a pet to touch. */
	private maybeShowMobileGestureTip(): void {
		if (!isMobileUi() || this.instanceData.mobileGestureTipSeen) return;
		if (this.getPetList().length === 0) return;

		this.instanceData.mobileGestureTipSeen = true;
		void this.saveData(this.instanceData);
		window.setTimeout(() => {
			new Notice(t("notices.mobileGestureTip"), 10000);
		}, 800);
	}

	// ── Pet CRUD ───────────────────────────────────────────────

	async addPet(type: string, name: string): Promise<void> {
		const def = getStardewSpeciesDefinition(type);
		if (!def) return;

		let id: string;
		if (isNpcSpeciesType(type)) {
			// Villagers are unique characters with fixed names
			if (this.instanceData.npcScheduleEnabled) {
				new Notice(t("notices.villagerScheduleConflict", { name: def.label }));
				return;
			}
			if (this.instanceData.pets.some((p) => p.type === type)) {
				new Notice(t("notices.villagerAlreadyInTown", { name: def.label }));
				return;
			}
			id = type;
			name = def.label;
		} else {
			if (!(type in this.instanceData.nextPetIdCounters)) {
				this.instanceData.nextPetIdCounters[type] = 1;
			}
			id = `${type}-${this.instanceData.nextPetIdCounters[type]}`;
			this.instanceData.nextPetIdCounters[type]++;
		}

		this.instanceData.pets.push({ id, type, name });
		await this.saveData(this.instanceData);
		this.maybeShowMobileGestureTip();

		if (this.instanceData.overlayMode) {
			this.overlayView?.addPet({ id, type, name });
			return;
		}

		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		if (leaves.length === 0) await this.openView();
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof PetView) {
				view.addPetToView(view.getWrapper(), { id, type, name });
			}
		}
	}

	async removePetById(id: string): Promise<void> {
		this.instanceData.pets = this.instanceData.pets.filter((p) => p.id !== id);
		await this.saveData(this.instanceData);
		this.removePetFromViews(id);
	}

	async clearAllPets(): Promise<void> {
		this.instanceData.pets = [];
		for (const type in this.instanceData.nextPetIdCounters) {
			this.instanceData.nextPetIdCounters[type] = 1;
		}
		await this.saveData(this.instanceData);

		if (this.instanceData.overlayMode) {
			this.overlayView?.removeAllPets();
			return;
		}
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PET)) {
			if (leaf.view instanceof PetView) leaf.view.removeAllPets();
		}
	}

	// ── Pet list ───────────────────────────────────────────────

	/** All rendered companions: stored pets plus schedule-mode visitors. */
	getPetList(): PetInstance[] {
		return [...(this.instanceData.pets || []), ...this.currentVisitors];
	}

	getCleanLabel(id: string): string {
		const desired = id.split("/").pop() ?? "";
		const match = desired.match(/^(.*)-(\d+)$/);
		if (!match) return desired;
		const [, base] = match;
		return base
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	}

	/** Shared speech check used by views and the rant-loop scheduler. Animals never speak. */
	isSpeechEnabled(type: string): boolean {
		if (!isNpcSpeciesType(type)) return false;
		return this.instanceData.npcSpeechEnabled ?? true;
	}

	/** Returns a closure for createRenderablePet's speechEnabledProvider parameter. */
	getSpeechEnabledProvider(): (isNPC: boolean) => boolean {
		return (isNPC: boolean) =>
			isNPC ? (this.instanceData.npcSpeechEnabled ?? true) : false;
	}

	// ── Settings updaters ──────────────────────────────────────

	updateOpenAiApiKey(v: string) {
		void this.applyAiConfig({ openAiApiKey: v.trim() });
	}

	updateOpenAiBaseUrl(v: string) {
		void this.applyAiConfig({
			openAiBaseUrl: normalizeBaseUrl(v) || DEFAULT_BASE_URL,
		});
	}
	updateChinesePrompt(v: boolean) { this.updateSetting("useChinesePrompt", v); }
	updatePageRantEnabled(v: boolean) { this.updateSetting("pageRantEnabled", v); }
	updateNpcSpeechEnabled(v: boolean) { this.updateSetting("npcSpeechEnabled", v); }
	updateBanterEnabled(v: boolean) { this.updateSetting("banterEnabled", v); }
	updateBanterPercent(v: number) { this.updateSetting("banterPercent", Math.max(0, Math.min(100, Math.round(v)))); }
	updateMemoryEnabled(v: boolean) { this.updateSetting("memoryEnabled", v); }
	updatePageRantPerHour(v: number) { this.updateSetting("pageRantPerHour", Math.max(0.5, Math.min(60, v))); }
	updatePageRantContextChars(v: number) { this.updateSetting("pageRantContextChars", v); }
	updatePageRantOnlyWhenFocused(v: boolean) { this.updateSetting("pageRantOnlyWhenFocused", v); }

	updateMaxVisitors(v: number): void {
		this.updateSetting("maxVisitors", Math.max(1, Math.min(6, Math.round(v))));
		this.syncVisitors();
	}

	updateChosenModel(selectedModel: string): void {
		const trimmed = selectedModel.trim();
		const model = trimmed ||
			(isDeepSeekEndpoint(this.instanceData.openAiBaseUrl)
				? DEEPSEEK_DEFAULT_MODEL
				: "");
		if (!model) {
			this.instanceData.selectedModel = "";
			void this.saveData(this.instanceData);
			this.chatmodel = null;
			new Notice(t("notices.enterModelFirst"));
			return;
		}
		void this.applyAiConfig({ selectedModel: model }, { quiet: true }).then((ok) => {
			new Notice(ok
				? t("notices.modelSet", { model })
				: t("notices.modelInitFailed"));
		});
	}

	updatePetSize(value: number): void {
		this.updateSetting("petSize", value);
		if (this.instanceData.overlayMode) {
			this.overlayView?.updatePetSize();
			return;
		}
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PET)) {
			if (leaf.view instanceof PetView) leaf.view.updatePetSize();
		}
	}

	updatePetSpeed(value: number): void {
		this.updateSetting("petSpeed", value);
		if (this.instanceData.overlayMode) {
			this.overlayView?.updatePetSpeed();
			return;
		}
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PET)) {
			if (leaf.view instanceof PetView) leaf.view.updatePetSpeed();
		}
	}

	// ── Leaf management ────────────────────────────────────────

	private getPetLeaf(): WorkspaceLeaf | null {
		return this.app.workspace.getLeavesOfType(VIEW_TYPE_PET)[0] ?? null;
	}

	private sidebarOf(leaf: WorkspaceLeaf): "left" | "right" | null {
		const root = leaf.getRoot();
		if (root === this.app.workspace.leftSplit) return "left";
		if (root === this.app.workspace.rightSplit) return "right";
		return null;
	}

	private petLeafHasSiblings(leaf: WorkspaceLeaf): boolean {
		const parent = (leaf as { parent?: unknown }).parent;
		if (!parent) return false;
		const iterate = (
			this.app.workspace as unknown as {
				iterateLeaves?: (cb: (l: WorkspaceLeaf) => unknown, item: unknown) => unknown;
			}
		).iterateLeaves;
		if (typeof iterate !== "function") return false;

		let hasSibling = false;
		iterate.call(this.app.workspace, (l: WorkspaceLeaf) => { if (l !== leaf) hasSibling = true; }, parent);
		return hasSibling;
	}

	private handleActiveLeafChange(active: WorkspaceLeaf | null): void {
		if (this.instanceData.overlayMode || !active) return;
		if (active.view.getViewType() === VIEW_TYPE_PET) return;

		const activeSide = this.sidebarOf(active);
		if (!activeSide) return;

		const petLeaf = this.getPetLeaf();
		if (!petLeaf || this.sidebarOf(petLeaf) !== activeSide) return;
		if (!this.petLeafHasSiblings(petLeaf)) return;

		petLeaf.detach();
	}
}
