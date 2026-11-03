/**
 * Normalizes provider errors into a small set of kinds the UI can explain.
 * Never include the API key, headers, or raw request objects here.
 */
export type AiErrorKind =
	| "auth"
	| "balance"
	| "model"
	| "network"
	| "rateLimit"
	| "server"
	| "unknown";

export interface AiErrorInfo {
	kind: AiErrorKind;
	status?: number;
	code?: string;
}

export function classifyAiError(error: unknown): AiErrorInfo {
	const e = error as {
		status?: unknown;
		code?: unknown;
		message?: unknown;
		name?: unknown;
		error?: { code?: unknown; message?: unknown };
	};

	const status = typeof e?.status === "number" ? e.status : undefined;
	const code = typeof e?.code === "string"
		? e.code
		: typeof e?.error?.code === "string"
			? e.error.code
			: undefined;
	const message = `${typeof e?.message === "string" ? e.message : ""} ${
		typeof e?.error?.message === "string" ? e.error.message : ""
	}`.toLowerCase();
	const name = typeof e?.name === "string" ? e.name : "";

	if (status === 401 || status === 403 || code === "invalid_api_key" || message.includes("invalid api key")) {
		return { kind: "auth", status, code };
	}
	if (
		status === 402 ||
		code === "insufficient_quota" ||
		message.includes("insufficient balance") ||
		message.includes("insufficient_quota")
	) {
		return { kind: "balance", status, code };
	}
	if (status === 400 && message.includes("model")) {
		return { kind: "model", status, code };
	}
	if (status === 404 && message.includes("model")) {
		return { kind: "model", status, code };
	}
	if (status === 429) {
		return { kind: "rateLimit", status, code };
	}
	if (status !== undefined && status >= 500) {
		return { kind: "server", status, code };
	}
	if (
		status === undefined ||
		name === "APIConnectionError" ||
		name === "APIConnectionTimeoutError" ||
		name === "AbortError" ||
		name === "TypeError" ||
		message.includes("failed to fetch") ||
		message.includes("network") ||
		message.includes("timeout")
	) {
		return { kind: "network", status, code };
	}
	return { kind: "unknown", status, code };
}
