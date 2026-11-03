import type { AiErrorInfo } from "../ai/errors";
import { t } from "../core/i18n";

export interface AiErrorCopy {
	title: string;
	body: string;
	short: string;
}

/** Localized, user-friendly copy for a classified AI error. */
export function getAiErrorCopy(info: AiErrorInfo): AiErrorCopy {
	return {
		title: t(`errors.ai.${info.kind}.title`),
		body: t(`errors.ai.${info.kind}.body`),
		short: t(`errors.ai.${info.kind}.short`),
	};
}
