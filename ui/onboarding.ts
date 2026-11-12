import { App, Modal, Notice, SecretComponent } from "obsidian";
import type PetPlugin from "../main";
import { t, tMobile, getUiLanguage } from "../core/i18n";
import {
	DEEPSEEK_BASE_URL,
	DEEPSEEK_DEFAULT_MODEL,
	DEEPSEEK_SECRET_ID,
} from "../core/constants";
import { probeChatModel } from "../ai/chat";
import { classifyAiError } from "../ai/errors";
import type { AiErrorInfo } from "../ai/errors";
import { getAiErrorCopy } from "./ai-error-copy";

const DEEPSEEK_CONSOLE_URL = "https://platform.deepseek.com/";
const DEEPSEEK_SIGN_IN_URL = "https://platform.deepseek.com/sign_in";
const DEEPSEEK_TOP_UP_URL = "https://platform.deepseek.com/top_up";
const DEEPSEEK_API_KEYS_URL = "https://platform.deepseek.com/api_keys";

type OnboardingStep =
	| "welcome"
	| "signup"
	| "topup"
	| "apiKey"
	| "connect"
	| "done";

const STEPS: OnboardingStep[] = [
	"welcome",
	"signup",
	"topup",
	"apiKey",
	"connect",
	"done",
];

const STEP_LABELS: Record<OnboardingStep, Parameters<typeof t>[0]> = {
	welcome: "onboarding.step.welcome",
	signup: "onboarding.step.signup",
	topup: "onboarding.step.topup",
	apiKey: "onboarding.step.apiKey",
	connect: "onboarding.step.connect",
	done: "onboarding.step.done",
};

export interface DeepSeekSetupModalOptions {
	startStep?: OnboardingStep;
	onDone?: () => void;
}

/**
 * Beginner-friendly DeepSeek setup. Walks through sign-in, top-up, key
 * creation, and connection testing, then stores the key in SecretStorage.
 */
export class DeepSeekSetupModal extends Modal {
	private readonly plugin: PetPlugin;
	private readonly options: DeepSeekSetupModalOptions;

	private step: OnboardingStep;
	private keyDraft = "";
	private useExistingSecret = false;
	private selectedSecret = "";
	private revealKey = false;
	private testState: "idle" | "testing" | "success" | "error" = "idle";
	private errorInfo: AiErrorInfo | null = null;
	private validationError: string | null = null;
	private closed = false;
	private testRunId = 0;

	constructor(app: App, plugin: PetPlugin, options: DeepSeekSetupModalOptions = {}) {
		super(app);
		this.plugin = plugin;
		this.options = options;
		this.step = options.startStep ?? "welcome";
	}

	onOpen(): void {
		this.modalEl.addClass("pet-onboarding-modal");
		void this.plugin.markOnboardingSeen();
		this.render();
	}

	onClose(): void {
		this.closed = true;
		this.testRunId++;
		this.keyDraft = "";
		this.selectedSecret = "";
		this.contentEl.empty();
		this.options.onDone?.();
	}

	// ── Render shell ───────────────────────────────────────────

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();

		const shell = contentEl.createDiv({ cls: "pet-onboarding-shell" });

		const header = shell.createDiv({ cls: "pet-onboarding-header" });
		const titleRow = header.createDiv({ cls: "pet-onboarding-title-row" });
		titleRow.createDiv({ cls: "pet-onboarding-kicker", text: "🐾 " + t("onboarding.title") });
		this.renderLanguageToggle(titleRow);
		this.renderStepIndicator(header);

		const body = shell.createDiv({ cls: "pet-onboarding-content" });
		switch (this.step) {
			case "welcome": this.renderWelcome(body); break;
			case "signup": this.renderSignup(body); break;
			case "topup": this.renderTopup(body); break;
			case "apiKey": this.renderApiKey(body); break;
			case "connect": this.renderConnect(body); break;
			case "done": this.renderDone(body); break;
		}

		this.renderFooter(shell);
	}

	private renderLanguageToggle(container: HTMLElement): void {
		const group = container.createDiv({ cls: "pet-onboarding-lang-toggle" });
		const current = getUiLanguage();
		const choices: { pref: "zh" | "en"; label: string }[] = [
			{ pref: "zh", label: "中文" },
			{ pref: "en", label: "EN" },
		];
		for (const choice of choices) {
			const btn = group.createEl("button", {
				text: choice.label,
				cls: current === choice.pref ? "is-active" : "",
			});
			btn.addEventListener("click", () => {
				if (getUiLanguage() === choice.pref) return;
				this.plugin.updateUiLanguage(choice.pref, { silent: true });
				this.render();
			});
		}
	}

	private renderStepIndicator(container: HTMLElement): void {
		const index = STEPS.indexOf(this.step);
		const indicator = container.createDiv({ cls: "pet-onboarding-step-indicator" });
		indicator.setAttribute(
			"aria-label",
			t("onboarding.stepIndicator", { current: index + 1, total: STEPS.length }),
		);

		STEPS.forEach((step, i) => {
			const dot = indicator.createDiv({
				cls: [
					"pet-onboarding-step-dot",
					i === index ? "is-active" : "",
					i < index ? "is-done" : "",
				].filter(Boolean).join(" "),
			});
			dot.setAttribute("title", t(STEP_LABELS[step]));
			dot.createSpan({ cls: "pet-onboarding-step-label", text: t(STEP_LABELS[step]) });
		});
	}

	private renderFooter(shell: HTMLElement): void {
		const footer = shell.createDiv({ cls: "pet-onboarding-footer" });
		if (this.step === "done") return;

		const left = footer.createDiv({ cls: "pet-onboarding-footer-left" });
		const right = footer.createDiv({ cls: "pet-onboarding-footer-right" });

		const skip = left.createEl("button", {
			text: t("onboarding.nav.skip"),
			cls: "pet-onboarding-skip",
		});
		skip.addEventListener("click", () => this.close());

		if (STEPS.indexOf(this.step) > 0) {
			const back = right.createEl("button", { text: t("onboarding.nav.back") });
			back.addEventListener("click", () => this.goTo(STEPS[STEPS.indexOf(this.step) - 1]));
		}

		if (this.step === "welcome") {
			const start = right.createEl("button", {
				text: t("onboarding.welcome.start"),
				cls: "mod-cta",
			});
			start.addEventListener("click", () => this.goTo("signup"));
		} else if (this.step !== "connect") {
			const next = right.createEl("button", {
				text: t("onboarding.nav.next"),
				cls: "mod-cta",
			});
			next.addEventListener("click", () => this.goTo(STEPS[STEPS.indexOf(this.step) + 1]));
		}
	}

	private goTo(step: OnboardingStep): void {
		this.step = step;
		this.validationError = null;
		this.testState = "idle";
		this.errorInfo = null;
		this.render();
	}

	// ── Steps ──────────────────────────────────────────────────

	private stepHeading(container: HTMLElement, title: string, lede?: string): void {
		container.createEl("h2", { cls: "pet-onboarding-title", text: title });
		if (lede) container.createDiv({ cls: "pet-onboarding-lede", text: lede });
	}

	private paragraph(container: HTMLElement, text: string): void {
		container.createEl("p", { cls: "pet-onboarding-body", text });
	}

	private callout(
		container: HTMLElement,
		variant: "info" | "warning" | "success" | "error",
		title: string,
		body?: string,
	): HTMLElement {
		const callout = container.createDiv({
			cls: `pet-onboarding-callout pet-onboarding-callout--${variant}`,
		});
		callout.createDiv({ cls: "pet-onboarding-callout-title", text: title });
		if (body) callout.createDiv({ cls: "pet-onboarding-callout-body", text: body });
		return callout;
	}

	private renderWelcome(container: HTMLElement): void {
		this.stepHeading(container, t("onboarding.welcome.title"), t("onboarding.welcome.lede"));
		this.paragraph(container, t("onboarding.welcome.body"));
		this.callout(container, "info", t("onboarding.welcome.optional"));

		if (this.plugin.hasUsableAiConfig() && !this.plugin.isDeepSeekConfigured()) {
			this.callout(container, "warning", t("onboarding.welcome.switchWarning"));
		}

		const haveKey = container.createEl("button", {
			text: t("onboarding.welcome.haveKey"),
			cls: "pet-onboarding-text-button",
		});
		haveKey.addEventListener("click", () => this.goTo("connect"));
	}

	private renderSignup(container: HTMLElement): void {
		this.stepHeading(container, t("onboarding.signup.title"), t("onboarding.signup.lede"));
		this.paragraph(container, t("onboarding.signup.body1"));
		this.paragraph(container, t("onboarding.signup.body2"));
		this.renderLinkRow(container, DEEPSEEK_SIGN_IN_URL);
	}

	private renderTopup(container: HTMLElement): void {
		this.stepHeading(container, t("onboarding.topup.title"), t("onboarding.topup.lede"));
		this.paragraph(container, t("onboarding.topup.body1"));
		this.paragraph(container, t("onboarding.topup.body2"));
		this.paragraph(container, t("onboarding.topup.body3"));
		this.callout(container, "info", t("onboarding.topup.warning"));
		this.renderLinkRow(container, DEEPSEEK_TOP_UP_URL);
	}

	private renderApiKey(container: HTMLElement): void {
		this.stepHeading(container, t("onboarding.apiKey.title"), t("onboarding.apiKey.lede"));
		this.paragraph(container, t("onboarding.apiKey.body1"));
		this.paragraph(container, t("onboarding.apiKey.body2"));
		this.callout(container, "warning", t("onboarding.apiKey.warning"));
		this.renderLinkRow(container, DEEPSEEK_API_KEYS_URL);
	}

	private renderConnect(container: HTMLElement): void {
		this.stepHeading(container, t("onboarding.connect.title"), t("onboarding.connect.lede"));
		this.paragraph(container, t("onboarding.connect.body"));

		const toggle = container.createDiv({ cls: "pet-onboarding-mode-toggle" });
		const newBtn = toggle.createEl("button", {
			text: t("onboarding.connect.modeNew"),
			cls: this.useExistingSecret ? "" : "is-active",
		});
		newBtn.addEventListener("click", () => {
			if (this.useExistingSecret) {
				this.useExistingSecret = false;
				this.render();
			}
		});
		const existingBtn = toggle.createEl("button", {
			text: t("onboarding.connect.modeExisting"),
			cls: this.useExistingSecret ? "is-active" : "",
		});
		existingBtn.addEventListener("click", () => {
			if (!this.useExistingSecret) {
				this.useExistingSecret = true;
				this.render();
			}
		});

		if (this.useExistingSecret) {
			this.renderExistingSecretPicker(container);
		} else {
			this.renderKeyInput(container);
		}

		if (this.validationError) {
			this.callout(container, "error", this.validationError);
		}
		if (this.testState === "testing") {
			const status = container.createDiv({ cls: "pet-onboarding-status pet-onboarding-status--testing" });
			status.createDiv({ cls: "pet-onboarding-spinner" });
			status.createSpan({ text: t("onboarding.connect.testing") });
		}
		if (this.testState === "error" && this.errorInfo) {
			this.renderErrorCallout(container);
		}
	}

	private renderKeyInput(container: HTMLElement): void {
		const row = container.createDiv({ cls: "pet-onboarding-key-row" });
		const input = row.createEl("input", {
			type: this.revealKey ? "text" : "password",
			placeholder: t("onboarding.connect.placeholder"),
			cls: "pet-onboarding-key-input",
		});
		input.autocomplete = "off";
		input.spellcheck = false;
		input.value = this.keyDraft;
		input.addEventListener("input", () => {
			this.keyDraft = input.value;
		});
		input.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				void this.saveAndTest();
			}
		});

		const reveal = row.createEl("button", {
			text: this.revealKey ? t("onboarding.connect.hide") : t("onboarding.connect.show"),
			cls: "pet-onboarding-reveal",
		});
		reveal.addEventListener("click", () => {
			this.revealKey = !this.revealKey;
			this.render();
		});

		const paste = row.createEl("button", {
			text: t("onboarding.connect.paste"),
			cls: "pet-onboarding-reveal",
		});
		paste.addEventListener("click", () => void this.pasteFromClipboard());

		const save = container.createEl("button", {
			text: this.testState === "testing"
				? t("onboarding.connect.testing")
				: t("onboarding.connect.saveTest"),
			cls: "mod-cta pet-onboarding-save",
		});
		save.disabled = this.testState === "testing";
		save.addEventListener("click", () => void this.saveAndTest());

		container.createDiv({
			cls: "pet-onboarding-fineprint",
			text: t("onboarding.connect.storedSecurely"),
		});
	}

	private renderExistingSecretPicker(container: HTMLElement): void {
		const secrets = this.app.secretStorage.listSecrets();
		if (secrets.length === 0) {
			this.callout(container, "info", t("onboarding.connect.noSecrets"));
			return;
		}

		const holder = container.createDiv({ cls: "pet-onboarding-secret-picker" });
		new SecretComponent(this.app, holder)
			.setValue(this.selectedSecret || this.plugin.instanceData.openAiApiKey || "")
			.onChange((value) => {
				this.selectedSecret = value;
			});

		const save = container.createEl("button", {
			text: this.testState === "testing"
				? t("onboarding.connect.testing")
				: t("onboarding.connect.saveTest"),
			cls: "mod-cta pet-onboarding-save",
		});
		save.disabled = this.testState === "testing";
		save.addEventListener("click", () => void this.saveAndTest());
	}

	private renderErrorCallout(container: HTMLElement): void {
		const info = this.errorInfo;
		if (!info) return;
		const copy = getAiErrorCopy(info);
		const callout = this.callout(container, "error", copy.title, copy.body);
		const actions = callout.createDiv({ cls: "pet-onboarding-callout-actions" });

		if (info.kind === "auth") {
			this.linkButton(actions, t("onboarding.openPage"), DEEPSEEK_API_KEYS_URL);
		} else if (info.kind === "balance") {
			this.linkButton(actions, t("onboarding.openPage"), DEEPSEEK_TOP_UP_URL);
		}

		const retry = actions.createEl("button", {
			text: t("onboarding.connect.saveTest"),
		});
		retry.addEventListener("click", () => void this.saveAndTest());
	}

	private renderDone(container: HTMLElement): void {
		container.createEl("h2", { cls: "pet-onboarding-title", text: t("onboarding.done.title") });
		this.callout(container, "success", t("onboarding.done.lede"));
		this.paragraph(
			container,
			tMobile("onboarding.done.body", "onboarding.done.bodyMobile"),
		);

		const actions = container.createDiv({ cls: "pet-onboarding-done-actions" });
		const add = actions.createEl("button", {
			text: t("onboarding.done.addVillager"),
			cls: "mod-cta",
		});
		add.addEventListener("click", () => {
			this.close();
			this.plugin.showAddPetCommand();
		});
		const close = actions.createEl("button", { text: t("onboarding.done.close") });
		close.addEventListener("click", () => this.close());
	}

	// ── Links & clipboard ──────────────────────────────────────

	private renderLinkRow(container: HTMLElement, url: string): void {
		const row = container.createDiv({ cls: "pet-onboarding-link-row" });
		this.linkButton(row, t("onboarding.openPage"), url);
		const copy = row.createEl("button", {
			text: t("onboarding.copyLink"),
			cls: "pet-onboarding-copy-button",
		});
		copy.addEventListener("click", () => void this.copyToClipboard(url));

		const consoleBtn = row.createEl("button", {
			text: t("onboarding.openConsole"),
			cls: "pet-onboarding-text-button",
		});
		consoleBtn.addEventListener("click", () => this.openUrl(DEEPSEEK_CONSOLE_URL));

		row.createDiv({ cls: "pet-onboarding-url", text: url });
	}

	private linkButton(container: HTMLElement, label: string, url: string): void {
		const btn = container.createEl("button", {
			text: label,
			cls: "pet-onboarding-link-button",
		});
		btn.addEventListener("click", () => this.openUrl(url));
	}

	private openUrl(url: string): void {
		try {
			// Do not pass `noopener` here: it makes window.open return null even
			// on success, which would trigger the copy fallback every time.
			const win = window.open(url, "_blank");
			if (!win) {
				void this.copyToClipboard(url);
				new Notice(t("notices.linkOpenFailed"));
			}
		} catch {
			void this.copyToClipboard(url);
			new Notice(t("notices.linkOpenFailed"));
		}
	}

	private async copyToClipboard(text: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(text);
			new Notice(t("notices.copied"));
		} catch {
			new Notice(t("notices.clipboardFailed"));
		}
	}

	private async pasteFromClipboard(): Promise<void> {
		try {
			const text = await navigator.clipboard.readText();
			this.keyDraft = text.trim();
			this.render();
		} catch {
			new Notice(t("notices.clipboardFailed"));
		}
	}

	// ── Save & test ────────────────────────────────────────────

	private async saveAndTest(): Promise<void> {
		if (this.testState === "testing") return;

		let secretName: string;
		let rawKey: string | null = null;

		if (this.useExistingSecret) {
			const picked = this.selectedSecret.trim() ||
				this.plugin.instanceData.openAiApiKey?.trim() ||
				"";
			if (!picked) {
				this.validationError = t("settings.testConnection.noKey");
				this.render();
				return;
			}
			secretName = picked;
		} else {
			const key = this.keyDraft.trim();
			this.keyDraft = key;
			if (!key) {
				this.validationError = t("onboarding.connect.validationEmpty");
				this.render();
				return;
			}
			if (!key.startsWith("sk-")) {
				this.validationError = t("onboarding.connect.validationPrefix");
				this.render();
				return;
			}
			if (key.length < 20) {
				this.validationError = t("onboarding.connect.validationShort");
				this.render();
				return;
			}
			try {
				this.app.secretStorage.setSecret(DEEPSEEK_SECRET_ID, key);
			} catch {
				console.error("Failed to save the API key to SecretStorage.");
				new Notice(t("notices.secretSaveFailed"));
				return;
			}
			secretName = DEEPSEEK_SECRET_ID;
			rawKey = key;
		}

		this.validationError = null;
		this.errorInfo = null;
		this.testState = "testing";
		this.render();

		const runId = ++this.testRunId;
		await this.plugin.applyAiConfig(
			{
				openAiApiKey: secretName,
				openAiBaseUrl: DEEPSEEK_BASE_URL,
				selectedModel: DEEPSEEK_DEFAULT_MODEL,
			},
			{ quiet: true },
		);

		const probeKey = rawKey ?? this.app.secretStorage.getSecret(secretName);
		if (!probeKey) {
			if (this.closed || runId !== this.testRunId) return;
			this.testState = "error";
			this.errorInfo = { kind: "auth" };
			this.render();
			return;
		}

		const result = await probeChatModel(
			probeKey,
			DEEPSEEK_BASE_URL,
			DEEPSEEK_DEFAULT_MODEL,
		);
		if (this.closed || runId !== this.testRunId) return;

		if (result.ok) {
			// First successful setup turns speech on; reconfiguring leaves the
			// user's own toggle choice alone.
			if (!this.plugin.instanceData.deepseekSetupComplete) {
				this.plugin.instanceData.npcSpeechEnabled = true;
			}
			await this.plugin.markDeepSeekSetupComplete();
			this.testState = "success";
			this.keyDraft = "";
			this.step = "done";
			this.render();
			new Notice(
				tMobile("notices.deepseekReady", "notices.deepseekReadyMobile"),
				8000,
			);
		} else {
			this.testState = "error";
			this.errorInfo = classifyAiError(result.error);
			this.render();
		}
	}
}
