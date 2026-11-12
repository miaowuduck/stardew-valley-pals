/**
 * Endpoint helpers shared by the AI client, settings UI, and error copy.
 *
 * Local OpenAI-compatible servers (Ollama, LM Studio, llama.cpp, vLLM, …) are
 * configured with a base URL such as `http://127.0.0.1:11434/v1`. They are not
 * all standard about schemes, trailing slashes, or whether `/v1` is included,
 * so normalize what the user typed before it reaches the OpenAI SDK.
 */

function isLocalHostname(hostname: string): boolean {
	const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
	if (
		host === "localhost" ||
		host === "::1" ||
		host === "0.0.0.0" ||
		host === "host.docker.internal" ||
		host === "host.containers.internal" ||
		host.endsWith(".local")
	) {
		return true;
	}
	if (host === "127.0.0.1" || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
		return true;
	}
	// Private LAN ranges: Ollama on another machine, a home server, etc.
	if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
	if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
	const m = host.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
	if (m) {
		const second = Number(m[1]);
		if (second >= 16 && second <= 31) return true;
	}
	return false;
}

/** True for loopback, LAN, and `.local` endpoints that usually need no API key. */
export function isLocalEndpoint(baseUrl: string | null | undefined): boolean {
	const raw = (baseUrl ?? "").trim();
	if (!raw) return false;
	try {
		const url = new URL(
			/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `http://${raw}`,
		);
		return isLocalHostname(url.hostname);
	} catch {
		return false;
	}
}

export function isDeepSeekEndpoint(baseUrl: string | null | undefined): boolean {
	return /^https?:\/\/api\.deepseek\.com(\/|$)/i.test((baseUrl ?? "").trim());
}

/**
 * Clean up a base URL typed or pasted by the user:
 * - repair `http:/host` typos
 * - add a scheme (http for local hosts, https otherwise)
 * - drop trailing slashes
 * - drop a trailing `/chat/completions` pasted from API docs
 * - add `/v1` to bare local URLs such as `http://127.0.0.1:11434`
 *
 * The OpenAI SDK appends `/chat/completions` itself, so the value must be a
 * base URL, not a full endpoint.
 */
export function normalizeBaseUrl(raw: string | null | undefined): string {
	let url = (raw ?? "").trim();
	if (!url) return "";

	url = url.replace(/^(https?):\/(?!\/)/i, "$1://");

	if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
		const host = url.split(/[/?#]/)[0].replace(/^.*@/, "").split(":")[0];
		url = `${isLocalHostname(host) ? "http" : "https"}://${url}`;
	}

	url = url.replace(/\/+$/, "");
	url = url.replace(/\/chat\/completions$/i, "");
	url = url.replace(/\/+$/, "");

	try {
		const parsed = new URL(url);
		if (isLocalHostname(parsed.hostname) && (parsed.pathname === "" || parsed.pathname === "/")) {
			parsed.pathname = "/v1";
			url = parsed.toString();
		}
	} catch {
		// Leave malformed input untouched; the request will fail with a clear
		// error and the full URL is shown in the diagnostics dialog.
	}

	return url.replace(/\/+$/, "");
}

/** Redact anything that looks like a credential before showing or logging it. */
export function redactSecrets(text: string): string {
	return text
		.replace(/\bsk-[A-Za-z0-9_-]{6,}\b/g, "sk-***")
		.replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1***")
		.replace(/((?:api[-_]?key|token|authorization)["'\s:=]+)[^\s"',}]+/gi, "$1***");
}
