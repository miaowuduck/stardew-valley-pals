import type { AiErrorInfo } from "../ai/errors";
import { isDeepSeekEndpoint } from "../ai/provider";
import { t } from "../core/i18n";
import type { TranslationKey } from "../core/i18n";

export interface AiErrorCopy {
	title: string;
	body: string;
	short: string;
}

export interface AiErrorCopyOptions {
	/** Used to choose generic-provider copy instead of DeepSeek-specific copy. */
	baseUrl?: string | null;
}

/**
 * Localized, user-friendly copy for a classified AI error.
 *
 * DeepSeek gets the setup-wizard-flavoured copy; any other OpenAI-compatible
 * endpoint gets provider-neutral copy, because "top up your DeepSeek balance"
 * is actively misleading when the request went to http://127.0.0.1.
 */
export function getAiErrorCopy(
	info: AiErrorInfo,
	options: AiErrorCopyOptions = {},
): AiErrorCopy {
	const custom = !!options.baseUrl && !isDeepSeekEndpoint(options.baseUrl);
	const prefix = custom ? "errors.ai.custom" : "errors.ai";
	const vars = options.baseUrl ? { endpoint: options.baseUrl } : undefined;

	const key = (suffix: "title" | "body" | "short"): TranslationKey =>
		`${prefix}.${info.kind}.${suffix}` as TranslationKey;

	return {
		title: t(key("title"), vars),
		body: t(key("body"), vars),
		short: t(key("short"), vars),
	};
}
