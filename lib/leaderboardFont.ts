import { existsSync } from "node:fs";
import { GlobalFonts } from "@napi-rs/canvas";

const FONT_FAMILY = "LeaderboardSans";

const FONT_CANDIDATES = [
	"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
	"/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
	"/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
	"/usr/share/fonts/truetype/freefont/FreeSans.ttf",
] as const;

let resolvedFamily: string | null = null;

/** Prefer a system TTF so text renders on minimal Linux; falls back to generic sans-serif. */
export function getLeaderboardFontFamily(): string {
	if (resolvedFamily !== null) {
		return resolvedFamily;
	}
	for (const fontPath of FONT_CANDIDATES) {
		if (!existsSync(fontPath)) continue;
		try {
			GlobalFonts.registerFromPath(fontPath, FONT_FAMILY);
			resolvedFamily = FONT_FAMILY;
			return FONT_FAMILY;
		} catch {
			// try next candidate
		}
	}
	resolvedFamily = "sans-serif";
	return resolvedFamily;
}
