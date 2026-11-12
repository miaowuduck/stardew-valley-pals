import { Platform } from "obsidian";

/**
 * Obsidian's mobile UI. This is also true in desktop DevTools mobile
 * emulation (`app.emulateMobile(true)`), which is exactly what we want when
 * developing and testing mobile layout.
 */
export function isMobileUi(): boolean {
	return Platform.isMobile;
}

/** Display mode for installs that have no saved preference yet. */
export function getDefaultOverlayMode(): boolean {
	return Platform.isMobile;
}

/**
 * Whether the app window is actually in front of the user. Mobile WebViews
 * report `document.hasFocus()` inconsistently, so rely on visibility there.
 */
export function isDocumentActive(doc: Document): boolean {
	return Platform.isMobile ? doc.visibilityState === "visible" : doc.hasFocus();
}
