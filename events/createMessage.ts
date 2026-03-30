import { Database } from "bun:sqlite";
import { Events, type Message } from "discord.js";

const FUNNY_WORD = process.env.FUNNY_WORD || "funny";
const FUNNY_WORD_R = process.env.FUNNY_WORD_R || "funnyr";
const FUNNY_WORD_REGEX = new RegExp(FUNNY_WORD, "gi");
const FUNNY_WORD_R_REGEX = new RegExp(FUNNY_WORD_R, "gi");

const createMessage = {
	name: Events.MessageCreate,
	async execute(message: Message) {
		const frequency =
			message.content.toLowerCase().match(FUNNY_WORD_REGEX)?.length || 0;
		const frequencyR =
			message.content.toLowerCase().match(FUNNY_WORD_R_REGEX)?.length || 0;

		if (frequency == 0 && frequencyR == 0) return;

		let reply = "";
		if (frequencyR > 0) {
			reply += `Woah <@${message.author.id}>, you used the hard R!`;
		} else {
			reply += `Haha <@${message.author.id}>, you said it!`;
		}

		const db = new Database("database.sqlite");
		const totalFrequency = db
			.query<{ frequency: number; frequency_r: number }, [string]>(
				"SELECT frequency, frequency_r FROM funny_word_counts WHERE user_id = ?",
			)
			.get(message.author.id) || { frequency: 0, frequency_r: 0 };
		const newFrequency =
			(totalFrequency.frequency || 0) + frequency + frequencyR;
		const newFrequencyR = (totalFrequency.frequency_r || 0) + frequencyR;

		reply += ` You've said the funny word ${newFrequency} time${newFrequency === 1 ? "" : "s"}, of which ${newFrequencyR} time${newFrequencyR === 1 ? "" : "s"} was the hard R.`;

		db.run(
			"INSERT INTO funny_word_counts (user_id, frequency, frequency_r) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET frequency = excluded.frequency, frequency_r = excluded.frequency_r",
			[message.author.id, newFrequency, newFrequencyR],
		);
		db.close();

		await message.reply({ content: reply });
	},
};

export default createMessage;
