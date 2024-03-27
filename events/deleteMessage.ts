import {
	ChannelType,
	EmbedBuilder,
	Events,
	type Message,
} from "discord.js";

const EXPORT_CHANNEL_ID = process.env.EXPORT_CHANNEL_ID;

const deleteMessage = {
	name: Events.MessageDelete,
	async execute(message: Message) {
		// Checks for export channel
		const exportChannel =
			await message.client.channels.fetch(EXPORT_CHANNEL_ID);
		if (!exportChannel || exportChannel.type !== ChannelType.GuildText) {
			return; // Exit if nowhere to export
		}

		// Build embed
		const embed = new EmbedBuilder()
			.setTitle("New deleted message!")
			.setAuthor({
				name: message.author.displayName,
				iconURL: message.author.avatarURL() || "",
			})
			.setDescription(message.content || "No content");

		const embedList: EmbedBuilder[] = [];

		// Multiple attachments detected
		if (message.attachments.size > 0) {
			for (const attachment of message.attachments.values()) {
				if (attachment.contentType?.includes("image")) {
					const newEmbed = embed.setImage(attachment.url);
					embedList.push(newEmbed);
				}
			}
		}

		// No attachments detected
		if (embedList.length === 0) {
			embedList.push(embed);
		}

		await exportChannel.send({ embeds: [embed] });
	},
};

export default deleteMessage;
