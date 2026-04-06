import { Database } from "bun:sqlite";
import {
	AttachmentBuilder,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { renderLeaderboardTable } from "../lib/renderLeaderboardTable.ts";

const MAX_ROWS = 250;
const MAX_LABEL_LEN = 40;

type Row = { user_id: string; frequency: number; frequency_r: number };

function truncateLabel(s: string): string {
	const t = s.trim();
	if (t.length <= MAX_LABEL_LEN) return t;
	return `${t.slice(0, MAX_LABEL_LEN - 1)}…`;
}

async function resolveDisplayLabel(
	interaction: ChatInputCommandInteraction,
	userId: string,
): Promise<string> {
	try {
		const guild = interaction.guild;
		if (guild) {
			const member = await guild.members.fetch(userId).catch(() => null);
			if (member) return truncateLabel(member.displayName);
		}
		const user = await interaction.client.users.fetch(userId);
		return truncateLabel(user.username);
	} catch {
		return truncateLabel(`…${userId.slice(-6)}`);
	}
}

const racists = {
	name: "racists",
	data: new SlashCommandBuilder()
		.setName("racists")
		.setDescription("Leaderboard of funny word usage"),
	description: "Leaderboard of funny word usage",
	async execute(interaction: ChatInputCommandInteraction) {
		const db = new Database("database.sqlite");
		const rows =
			db
				.query<Row, []>(
					"SELECT user_id, frequency, frequency_r FROM funny_word_counts ORDER BY frequency DESC",
				)
				.all() || [];
		db.close();

		if (rows.length === 0) {
			await interaction.reply("No funny word usage has been logged yet.");
			return;
		}

		await interaction.deferReply();

		const totalInDb = rows.length;
		const cappedRows = rows.slice(0, MAX_ROWS);

		const labels = await Promise.all(
			cappedRows.map((row) => resolveDisplayLabel(interaction, row.user_id)),
		);

		const leaderboardRows = cappedRows.map((row, i) => ({
			rank: i + 1,
			label: labels[i],
			frequency: row.frequency,
			frequency_r: row.frequency_r,
		}));

		const footerText =
			totalInDb > MAX_ROWS
				? `Showing top ${MAX_ROWS} of ${totalInDb} users.`
				: undefined;

		const png = renderLeaderboardTable(leaderboardRows, {
			title: "Funny word leaderboard",
			footerText,
		});

		await interaction.editReply({
			files: [new AttachmentBuilder(png, { name: "leaderboard.png" })],
		});
	},
};

export default racists;
