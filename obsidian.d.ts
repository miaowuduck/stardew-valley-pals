import type { App, Modal, Component } from "obsidian";

declare module "obsidian" {
	export class ConfirmationModal extends Modal {
		constructor(
			app: App,
			options: {
				title: string | DocumentFragment;
				body?: string | DocumentFragment;
				onConfirm: () => void | Promise<void>;
			}
		);
	}

	export class SecretComponent extends Component {
		constructor(app: App, el: HTMLElement);
		setValue(value: string): this;
		onChange(callback: (value: string) => any): this;
	}

	export class SecretStorage {
		getSecret(id: string): string | null;
	}
}

declare module "obsidian" {
	interface App {
		secretStorage: SecretStorage;
	}

	interface Setting {
		addComponent(component: (el: HTMLElement) => Component): this;
	}

	interface ButtonComponent {
		setDestructive(): this;
	}
}
