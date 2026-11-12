import { redactSecrets } from "./provider";

/**
 * Normalizes provider errors into a small set of kinds the UI can explain.
 * Never include the API key, headers, or raw request objects here.
 */
export type AiErrorKind =
	| "auth"
	| "balance"
	| "model"
	| "endpoint"
	| "network"
	| "rateLimit"
	| "server"
	| "unknown";

export interface AiErrorInfo {
	kind: AiErrorKind;
	status?: number;
	code?: string;
}

export interface AiDiagnosticContext {
	endpoint?: string;
	model?: string;
}

export interface AiErrorDetails {
	name: string;
	status?: number;
	code?: string;
	message: string;
}

function errorName(error: unknown): string {
	if (error instanceof Error) return error.name || "Error";
	if (typeof error === "object" && error !== null) {
		const name = (error as { name?: unknown }).name;
		if (typeof name === "string") return name;
	}
	return typeof error;
}

/**
 * Pull the useful pieces out of an SDK error. The OpenAI SDK puts the HTTP
 * status on `status`, the JSON error object on `error`, and a readable summary
 * on `message`; Obsidian's requestUrl puts connection failures in `message`.
 */
export function getAiErrorDetails(error: unknown): AiErrorDetails {
	const e = error as {
		status?: unknown;
		code?: unknown;
		message?: unknown;
		name?: unknown;
		cause?: { code?: unknown; message?: unknown };
		error?: { code?: unknown; message?: unknown; type?: unknown };
	};

	const status = typeof e?.status === "number" ? e.status : undefined;
	const code = typeof e?.code === "string"
		? e.code
		: typeof e?.error?.code === "string"
			? e.error.code
			: typeof e?.cause?.code === "string"
				? e.cause.code
				: undefined;

	const parts: string[] = [];
	if (typeof e?.message === "string" && e.message.trim()) parts.push(e.message.trim());
	if (typeof e?.cause?.message === "string" && e.cause.message.trim()) parts.push(e.cause.message.trim());
	if (typeof e?.error?.message === "string" && e.error.message.trim()) parts.push(e.error.message.trim());
	if (parts.length === 0) {
		try {
			const json = JSON.stringify(error);
			if (json && json !== "{}") parts.push(json);
		} catch {
			parts.push(String(error));
		}
	}

	return {
		name: errorName(error),
		status,
		code,
		message: parts.join("\n") || "Unknown error",
	};
}

export function classifyAiError(error: unknown): AiErrorInfo {
	const details = getAiErrorDetails(error);
	const status = details.status;
	const code = details.code;
	const message = details.message.toLowerCase();
	const name = details.name;

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
	if (status === 404 || status === 405) {
		// A 404/405 that doesn't mention a model is almost always a wrong path
		// (e.g. base URL missing /v1, or the full /chat/completions URL pasted
		// into the endpoint field).
		return { kind: message.includes("model") ? "model" : "endpoint", status, code };
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
		message.includes("fetch failed") ||
		message.includes("econnrefused") ||
		message.includes("err_connection") ||
		message.includes("network") ||
		message.includes("timeout") ||
		message.includes("timed out") ||
		message.includes("cors")
	) {
		return { kind: "network", status, code };
	}
	return { kind: "unknown", status, code };
}

/**
 * Multi-line, copy-pasteable diagnostics for the console and the error dialog.
 * The API key is never part of the error object; redact defensively anyway.
 */
export function describeAiError(
	error: unknown,
	context: AiDiagnosticContext = {},
): string {
	const details = getAiErrorDetails(error);
	const endpoint = context.endpoint?.replace(/\/+$/, "") || "";
	const lines = [
		`Endpoint: ${endpoint || "(not set)"}`,
		`Request: ${endpoint ? `POST ${endpoint}/chat/completions` : "(not sent)"}`,
		`Model: ${context.model || "(not set)"}`,
		`Status: ${details.status ?? "(no HTTP status — connection failed before a response)"}`,
		`Error: ${details.name}${details.code ? ` (${details.code})` : ""}`,
		"Message:",
		details.message,
	];
	return redactSecrets(lines.join("\n"));
}
