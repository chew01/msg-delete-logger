import { type SKRSContext2D, createCanvas } from "@napi-rs/canvas";
import { getLeaderboardFontFamily } from "./leaderboardFont.ts";

export type LeaderboardRow = {
	rank: number;
	label: string;
	frequency: number;
	frequency_r: number;
};

export type RenderLeaderboardOptions = {
	title: string;
	footerText?: string;
};

const CANVAS_WIDTH = 1100;
const PADDING = 28;
const TITLE_SIZE = 22;
const HEADER_SIZE = 15;
const ROW_SIZE = 15;
const ROW_HEIGHT = 30;
const HEADER_ROW_HEIGHT = 30;
const TITLE_BLOCK = 52;
const FOOTER_HEIGHT = 32;
const RANK_COL_W = 44;

function drawTruncatedText(
	ctx: SKRSContext2D,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
) {
	if (ctx.measureText(text).width <= maxWidth) {
		ctx.fillText(text, x, y);
		return;
	}
	const ellipsis = "…";
	let low = 0;
	let high = text.length;
	while (low < high) {
		const mid = Math.ceil((low + high) / 2);
		const test = text.slice(0, mid) + ellipsis;
		if (ctx.measureText(test).width <= maxWidth) low = mid;
		else high = mid - 1;
	}
	ctx.fillText(text.slice(0, low) + ellipsis, x, y);
}

export function renderLeaderboardTable(
	rows: LeaderboardRow[],
	options: RenderLeaderboardOptions,
): Buffer {
	const family = getLeaderboardFontFamily();
	const rowCount = rows.length;
	const topHeight = TITLE_BLOCK + HEADER_ROW_HEIGHT;
	const bottomHeight = options.footerText ? FOOTER_HEIGHT : 0;
	const height =
		PADDING + topHeight + rowCount * ROW_HEIGHT + bottomHeight + PADDING;

	const canvas = createCanvas(CANVAS_WIDTH, height);
	const ctx = canvas.getContext("2d");

	ctx.fillStyle = "#313338";
	ctx.fillRect(0, 0, CANVAS_WIDTH, height);

	ctx.fillStyle = "#f2f3f5";
	ctx.font = `${TITLE_SIZE}px ${family}`;
	ctx.textBaseline = "alphabetic";
	ctx.fillText(options.title, PADDING, PADDING + TITLE_SIZE);

	const totalColRight = CANVAS_WIDTH - PADDING;
	const totalColMinW = 210;
	const userColX = PADDING + RANK_COL_W + 12;
	const userMaxW = totalColRight - totalColMinW - userColX - 8;

	const tableTop = PADDING + TITLE_BLOCK;

	ctx.fillStyle = "#5865f2";
	ctx.fillRect(
		PADDING,
		tableTop,
		CANVAS_WIDTH - 2 * PADDING,
		HEADER_ROW_HEIGHT,
	);

	ctx.fillStyle = "#ffffff";
	ctx.font = `bold ${HEADER_SIZE}px ${family}`;
	ctx.textBaseline = "middle";
	const headerMidY = tableTop + HEADER_ROW_HEIGHT / 2;
	ctx.fillText("#", PADDING, headerMidY);
	ctx.fillText("User", userColX, headerMidY);
	ctx.textAlign = "right";
	ctx.fillText("Total", totalColRight, headerMidY);
	ctx.textAlign = "left";

	ctx.textBaseline = "alphabetic";

	const bodyTop = tableTop + HEADER_ROW_HEIGHT;
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const rowTop = bodyTop + i * ROW_HEIGHT;
		const bg = i % 2 === 0 ? "#2b2d31" : "#313338";
		ctx.fillStyle = bg;
		ctx.fillRect(PADDING, rowTop, CANVAS_WIDTH - 2 * PADDING, ROW_HEIGHT);

		const baselineY = rowTop + ROW_HEIGHT - 8;
		ctx.fillStyle = "#dbdee1";
		ctx.font = `${ROW_SIZE}px ${family}`;
		ctx.fillText(String(row.rank), PADDING, baselineY);

		drawTruncatedText(ctx, row.label, userColX, baselineY, userMaxW);

		const hardRLabel = row.frequency_r === 1 ? "hard R" : "hard Rs";
		const totalStr = `${row.frequency} (${row.frequency_r} ${hardRLabel})`;
		ctx.textAlign = "right";
		ctx.fillText(totalStr, totalColRight, baselineY);
		ctx.textAlign = "left";
	}

	if (options.footerText) {
		ctx.fillStyle = "#949ba4";
		ctx.font = `${HEADER_SIZE - 1}px ${family}`;
		ctx.fillText(options.footerText, PADDING, height - 12);
	}

	return canvas.toBuffer("image/png");
}
