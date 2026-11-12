import { App, Modal, Notice } from "obsidian";
import { t } from "../core/i18n";

/**
 * Shows the exact endpoint/model/status/message behind a failed AI request and
 * lets the user copy it for a bug report. The API key is never included.
 */
export class AiErrorModal extends Modal {
	private readonly title: string;
	private readonly body: string;
	private readonly details: string;

	constructor(app: App, title: string, body: string, details: string) {
		super(app);
		this.title = title;
		this.body = body;
		this.details = details;
	}

	onOpen(): void {
		this.titleEl.setText(this.title);
		const { contentEl } = this;

		contentEl.createEl("p", { text: this.body });
		contentEl.createEl("p", {
			text: t("errors.ai.details.hint"),
			cls: "setting-item-description",
		});

		const pre = contentEl.createEl("pre", { cls: "pet-ai-error-details" });
		pre.createEl("code", { text: this.details });

		const actions = contentEl.createDiv({ cls: "pet-ai-error-actions" });
		const copy = actions.createEl("button", {
			text: t("errors.ai.details.copy"),
			cls: "mod-cta",
		});
		copy.addEventListener("click", () => {
			void (async () => {
				try {
					await navigator.clipboard.writeText(this.details);
					new Notice(t("notices.copied"));
				} catch {
					new Notice(t("notices.clipboardFailed"));
				}
			})();
		});

		const close = actions.createEl("button", { text: t("onboarding.done.close") });
		close.addEventListener("click", () => this.close());
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
