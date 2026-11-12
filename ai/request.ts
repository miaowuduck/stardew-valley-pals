import { requestUrl } from "obsidian";
import type { RequestUrlResponse } from "obsidian";

/**
 * A `fetch` implementation backed by Obsidian's `requestUrl`.
 *
 * The OpenAI SDK defaults to the renderer's global `fetch`, which is subject
 * to Chromium's CORS rules. Cloud providers return the right CORS headers, so
 * they work — but local OpenAI-compatible servers (Ollama, LM Studio,
 * llama.cpp, vLLM, one-api, …) usually don't, and many also reject the
 * `OPTIONS` preflight. The request then fails with an opaque "Failed to fetch"
 * even though the same endpoint works from curl or another desktop app.
 *
 * `requestUrl` runs outside the renderer's network stack and bypasses CORS.
 * The plugin never streams responses, so buffering the body is fine.
 */

type FetchLike = (
	input: string | URL | Request,
	init?: RequestInit,
) => Promise<Response>;

function abortError(): Error {
	try {
		return new DOMException("The operation was aborted.", "AbortError");
	} catch {
		const error = new Error("The operation was aborted.");
		error.name = "AbortError";
		return error;
	}
}

function toHeaderRecord(headers: HeadersInit | undefined): Record<string, string> {
	const out: Record<string, string> = {};
	if (!headers) return out;

	if (typeof Headers !== "undefined" && headers instanceof Headers) {
		headers.forEach((value, key) => {
			out[key] = value;
		});
		return out;
	}

	if (Array.isArray(headers)) {
		for (const pair of headers) {
			const [key, value] = pair as [string, string];
			out[key] = value;
		}
		return out;
	}

	const record = headers as Record<string, string>;
	for (const key of Object.keys(record)) {
		const value = record[key];
		if (typeof value === "string") out[key] = value;
	}
	return out;
}

function toRequestBody(body: BodyInit | null | undefined): string | ArrayBuffer | undefined {
	if (body === null || body === undefined) return undefined;
	if (typeof body === "string") return body;
	if (body instanceof ArrayBuffer) return body;
	if (ArrayBuffer.isView(body)) {
		const view = body as ArrayBufferView;
		return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
	}
	// URLSearchParams and other stringifiable bodies. The OpenAI SDK always
	// sends JSON strings, so this is only a safety net.
	return String(body);
}

function toResponse(result: RequestUrlResponse): Response {
	const headers = new Headers();
	const responseHeaders = result.headers ?? {};
	for (const key of Object.keys(responseHeaders)) {
		// requestUrl already decoded the body, so forwarding transport headers
		// would describe the wrong bytes.
		if (/^(content-encoding|content-length|transfer-encoding|connection)$/i.test(key)) {
			continue;
		}
		try {
			headers.set(key, responseHeaders[key]);
		} catch {
			// Ignore header names Chromium won't accept.
		}
	}

	const hasBody = result.status !== 204 && result.status !== 205 && result.status !== 304;
	return new Response(hasBody ? result.text : null, {
		status: result.status,
		headers,
	});
}

function waitForAbort<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
	if (!signal) return promise;
	if (signal.aborted) return Promise.reject(abortError());

	return new Promise<T>((resolve, reject) => {
		const onAbort = () => reject(abortError());
		signal.addEventListener("abort", onAbort, { once: true });
		promise.then(
			(value) => {
				signal.removeEventListener("abort", onAbort);
				resolve(value);
			},
			(error) => {
				signal.removeEventListener("abort", onAbort);
				reject(error);
			},
		);
	});
}

export const obsidianFetch: FetchLike = async (input, init) => {
	const url =
		typeof input === "string"
			? input
			: input instanceof URL
				? input.toString()
				: input.url;

	const result = await waitForAbort(
		requestUrl({
			url,
			method: (init?.method ?? "GET").toUpperCase(),
			headers: toHeaderRecord(init?.headers),
			body: toRequestBody(init?.body),
			throw: false,
		}),
		init?.signal ?? undefined,
	);

	return toResponse(result);
};
