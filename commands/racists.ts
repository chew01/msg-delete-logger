import { Database } from "bun:sqlite";
import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

const racists = {
	name: "racists",
	data: new SlashCommandBuilder()
		.setName("racists")
		.setDescription("Leaderboard of funny word usage"),
	description: "Leaderboard of funny word usage",
	async execute(interaction: ChatInputCommandInteraction) {
		const db = new Database("database.sqlite");
		const rows =
			db.query<{ user_id: string; frequency: number; frequency_r: number }, []>(
				"SELECT user_id, frequency, frequency_r FROM funny_word_counts ORDER BY frequency DESC",
			).all() || [];
		db.close();

		if (rows.length === 0) {
			await interaction.reply("No funny word usage has been logged yet.");
			return;
		}

		const leaderboard = rows
			.map((row) => `${row.user_id} | ${row.frequency} | ${row.frequency_r}`)
			.join("\n");

		await interaction.reply(`\`\`\`\n${leaderboard}\n\`\`\``);
	},
};

export default racists;