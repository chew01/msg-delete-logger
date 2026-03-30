import { Database } from "bun:sqlite";
import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";

/** Discord allows at most 10 embeds per message. */
const MAX_EMBEDS = 10;
const ROWS_PER_CHUNK = 25;
const MAX_ROWS = MAX_EMBEDS * ROWS_PER_CHUNK;

type Row = { user_id: string; frequency: number; frequency_r: number };

async function resolveMention(
	interaction: ChatInputCommandInteraction,
	userId: string,
): Promise<string> {
	try {
		const guild = interaction.guild;
		if (guild) {
			const member = await guild.members.fetch(userId).catch(() => null);
			if (member) return member.toString();
		}
		const user = await interaction.client.users.fetch(userId);
		return user.toString();
	} catch {
		return `<@${userId}>`;
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

		const totalInDb = rows.length;
		const cappedRows = rows.slice(0, MAX_ROWS);

		const mentions = await Promise.all(
			cappedRows.map((row) => resolveMention(interaction, row.user_id)),
		);

		const embeds: EmbedBuilder[] = [];
		for (let offset = 0; offset < cappedRows.length; offset += ROWS_PER_CHUNK) {
			const slice = cappedRows.slice(offset, offset + ROWS_PER_CHUNK);
			const sliceMentions = mentions.slice(offset, offset + ROWS_PER_CHUNK);
			const ranks = slice.map((_, j) => String(offset + j + 1)).join("\n");
			const users = sliceMentions.join("\n");
			const totals = slice.map((r) => String(r.frequency)).join("\n");
			const hardRs = slice.map((r) => String(r.frequency_r)).join("\n");

			const embed = new EmbedBuilder()
				.setColor(0x5865f2)
				.setTitle(
					offset === 0
						? "Funny word leaderboard"
						: "Funny word leaderboard (continued)",
				)
				.addFields(
					{ name: "#", value: ranks, inline: true },
					{ name: "User", value: users, inline: true },
					{ name: "\u200B", value: "\u200B", inline: true },
					{ name: "Total", value: totals, inline: true },
					{ name: "Hard R", value: hardRs, inline: true },
					{ name: "\u200B", value: "\u200B", inline: true },
				)
				.setTimestamp();

			if (offset === 0 && totalInDb > MAX_ROWS) {
				embed.setFooter({
					text: `Showing top ${MAX_ROWS} of ${totalInDb} users.`,
				});
			}

			embeds.push(embed);
		}

		await interaction.reply({ embeds });
	},
};

export default racists;
