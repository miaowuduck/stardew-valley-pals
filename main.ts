import { Plugin, Notice, WorkspaceLeaf, MarkdownView, ConfirmationModal } from "obsidian";
import type { PetInstance, PetPluginData, SelectorOption } from "./core/types";
import { isNpcSpeciesType } from "./core/types";
import { DEFAULT_DATA, NEW_NOTE_MESSAGES, getFallbackRantText, getFallbackBanterDialogue } from "./core/constants";
import type { BanterLine } from "./core/constants";
import { computeVisitors } from "./core/npc-schedule";
import { getStardewSpeciesDefinition } from "./pets/stardew-species";
import { PetView, VIEW_TYPE_PET } from "./views/pet-view";
import { OverlayPetView } from "./views/overlay-view";
import { PetSettingTab } from "./ui/settings";
import { SelectorModal } from "./ui/modals";
import { generateDialogue, generatePageRantText, extractMemory, initModel } from "./ai/chat";
import { STARDEW_SPECIES_OPTIONS, getStardewSpeciesPersona } from "./pets/stardew-species";
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
	/** Villagers currently in town under schedule mode (in-memory, recomputed from the clock). */
	private currentVisitors: PetInstance[] = [];
	protected readonly PETS: SelectorOption[] = STARDEW_SPECIES_OPTIONS;

	// ── Lifecycle ──────────────────────────────────────────────

	async onload(): Promise<void> {
		await this.loadSettings();
		this.initChatModel();

		if (!this.instanceData.firstRunComplete) {
			this.instanceData.firstRunComplete = true;
			await this.saveData(this.instanceData);
			this.app.workspace.onLayoutReady(() => {
				new Notice(
					"Welcome to Stardew Valley in Obsidian! Use the ribbon icon or the \"Add a pet\" command to bring in your first companion.",
					8000,
				);
			});
		}

		this.registerView(VIEW_TYPE_PET, (leaf) => new PetView(leaf, this));
		this.registerActivityTracking();
		this.registerCommands();
		this.registerNewNoteNotices();
		this.addSettingTab(new PetSettingTab(this.app, this));

		// Keep villager visits in sync with the clock (no-op when schedule mode is off)
		this.registerInterval(window.setInterval(() => this.syncVisitors(), VISITOR_SYNC_INTERVAL_MS));

		this.addRibbonIcon("cat", "Toggle pet view", async () => {
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
			} else {
				const isOpen = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length > 0;
				if (isOpen) await this.closeView();
				else await this.openView();
			}
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
				if (this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length === 0) {
					await this.openView();
				}
			}
			this.registerEvent(
				this.app.workspace.on("active-leaf-change", (leaf) =>
					this.handleActiveLeafChange(leaf),
				),
			);
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
		this.instanceData = Object.assign({}, DEFAULT_DATA, raw) as PetPluginData;

		if (!this.instanceData.nextPetIdCounters) {
			this.instanceData.nextPetIdCounters = {};
		}
		if (!this.instanceData.npcMemories) {
			this.instanceData.npcMemories = {};
		}

		// Clean up counters for species that no longer exist
		for (const type of Object.keys(this.instanceData.nextPetIdCounters)) {
			if (!getStardewSpeciesDefinition(type)) {
				delete this.instanceData.nextPetIdCounters[type];
			}
		}

		this.migratePets();
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

	// ── Init ───────────────────────────────────────────────────

	private initChatModel() {
		if (!this.instanceData.selectedModel || this.instanceData.selectedModel === "none") return;
		const keyName = this.instanceData.openAiApiKey?.trim();
		const key = keyName ? this.app.secretStorage.getSecret(keyName) : null;
		if (!key) return;
		try {
			this.chatmodel = initModel(
				key,
				this.instanceData.openAiBaseUrl,
			);
		} catch (e) {
			console.warn("Failed to initialize chat model:", e);
			new Notice("Could not initialize AI model. Check API keys and model selection in settings.");
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

	getCurrentPageLabel(): string {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) return activeFile.basename;
		return this.app.workspace.getMostRecentLeaf()?.view?.getDisplayText?.() ?? "当前页面";
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

		const activeFile = this.app.workspace.getActiveFile();
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

	async getPageRantText(trigger: "timer" | "rightclick", petType?: string): Promise<string> {
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

		let generated = "";
		try {
			generated = await generatePageRantText(
				pageLabel, trigger, selectedText, pageContext,
				this.instanceData.pageRantContextChars || 1200, activitySummary,
				npcName,
				petType ? getStardewSpeciesPersona(petType) : undefined,
				petType ? this.getNpcMemories(petType) : [],
				this.chatmodel, this.instanceData.selectedModel || "gpt-5-mini",
				this.instanceData.useChinesePrompt ?? false,
			);
		} catch (e: unknown) {
			const errMsg = (e as { message?: string })?.message || String(e);
			console.error("Page rant generation failed:", e);
			new Notice(`AI 模型调用失败，使用离线吐槽: ${errMsg}`, 5000);
		}

		if (generated) {
			void this.maybeExtractMemory(petType);
			return generated;
		}
		return getFallbackRantText(pageLabel, trigger, this.instanceData.useChinesePrompt ?? false);
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
			this.chatmodel, this.instanceData.selectedModel || "gpt-5-mini",
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
			this.chatmodel, this.instanceData.selectedModel || "gpt-5-mini",
			this.instanceData.useChinesePrompt ?? false,
		);
		if (fact) {
			await this.addNpcMemory(petType, fact);
		}
	}

	// ── Commands ───────────────────────────────────────────────

	private registerCommands() {
		this.addCommand({
			id: "add-pet-dropdown",
			name: "Add a pet",
			callback: () => this.showAddPetCommand(),
		});
		this.addCommand({
			id: "clear-all-pets",
			name: "Remove all pets",
			callback: () => {
				const modal = new ConfirmationModal(this.app);
				modal.setTitle("Remove all pets?");
				modal.setContent(
					"This will remove every pet and NPC from your vault. This action cannot be undone. Continue?",
				);
				modal.addButton((btn) => {
					btn.setButtonText("Remove all")
						.setDestructive()
						.onClick(async () => {
							await this.clearAllPets();
							new Notice("All pets have been removed.");
						});
				});
				modal.addCancelButton();
				modal.open();
			},
		});
		this.addCommand({
			id: "remove-pet-by-id",
			name: "Remove a specific pet",
			callback: () => {
				const options = this.instanceData.pets.map((pet) => ({
					value: pet.id,
					label: `${pet.name} (${this.getCleanLabel(pet.id)})`,
				}));
				new SelectorModal(this.app, options, async (value: string) => {
					await this.removePetById(value);
				}).open();
			},
		});
	}

	private registerNewNoteNotices() {
		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(
				this.app.vault.on("create", () => {
					const msg = NEW_NOTE_MESSAGES[Math.floor(Math.random() * NEW_NOTE_MESSAGES.length)];
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
			if (!isNpcSpeciesType(option.value)) return option;
			if (scheduleMode) {
				return { ...option, disabled: true, disabledReason: "Visits on a schedule" };
			}
			if (presentNpcTypes.has(option.value)) {
				return { ...option, disabled: true, disabledReason: "Already in town" };
			}
			return option;
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

	async openView() {
		if (this.instanceData.overlayMode) return;
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_PET);
		if (leaves.length > 0) {
			await workspace.revealLeaf(leaves[0]);
			return;
		}
		const leaf = workspace.getLeftLeaf(true);
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
				new Notice("Villager visits enabled — manually added villagers have gone home for now.");
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
				new Notice("Villager visits disabled — the visitors have gone home.");
			}
		}
	}

	/** Bring the in-town villager roster in line with the current clock time. */
	syncVisitors(): void {
		if (!this.instanceData.npcScheduleEnabled) return;

		const targetIds = computeVisitors(new Date(), this.instanceData.maxVisitors || 3);
		const cn = this.instanceData.useChinesePrompt ?? false;

		// Arrivals
		for (const id of targetIds) {
			if (this.currentVisitors.some((v) => v.id === id)) continue;
			const def = getStardewSpeciesDefinition(id);
			if (!def) continue;
			const visitor: PetInstance = { id, type: id, name: def.label };
			this.currentVisitors.push(visitor);
			this.addPetToViews(visitor);
			new Notice(cn ? `${def.label} 来到了你的笔记旁。` : `${def.label} is in town.`);
		}

		// Departures
		for (const visitor of [...this.currentVisitors]) {
			if (targetIds.includes(visitor.id)) continue;
			this.currentVisitors = this.currentVisitors.filter((v) => v.id !== visitor.id);
			this.removePetFromViews(visitor.id);
			new Notice(cn ? `${visitor.name} 回家了。` : `${visitor.name} headed home.`);
		}
	}

	getCurrentVisitors(): PetInstance[] {
		return this.currentVisitors;
	}

	// ── Pet CRUD ───────────────────────────────────────────────

	async addPet(type: string, name: string): Promise<void> {
		const def = getStardewSpeciesDefinition(type);
		if (!def) return;

		let id: string;
		if (isNpcSpeciesType(type)) {
			// Villagers are unique characters with fixed names
			if (this.instanceData.npcScheduleEnabled) {
				new Notice(`${def.label} visits on their own schedule while villager visits are enabled.`);
				return;
			}
			if (this.instanceData.pets.some((p) => p.type === type)) {
				new Notice(`${def.label} is already in town.`);
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

	updateOpenAiApiKey(v: string) { this.updateSetting("openAiApiKey", v); }
	updateOpenAiBaseUrl(v: string) { this.updateSetting("openAiBaseUrl", v); }
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
		this.instanceData.selectedModel = selectedModel.trim() || "gpt-5-mini";
		void this.saveData(this.instanceData);

		try {
			const keyName = this.instanceData.openAiApiKey?.trim();
			const key = keyName ? this.app.secretStorage.getSecret(keyName) : null;
			if (!key) {
				new Notice("Select an API key secret in settings first.");
				this.chatmodel = null;
				return;
			}
			this.chatmodel = initModel(
				key,
				this.instanceData.openAiBaseUrl,
			);
			new Notice(`Model set to ${this.instanceData.selectedModel}.`);
		} catch (e) {
			console.error("Failed to initialize model after selection:", e);
			new Notice("Could not initialize model. Check API key, endpoint, and model.");
			this.chatmodel = null;
		}
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
