import { unlink } from "node:fs/promises";
import {
	AttachmentBuilder,
	ChannelType,
	Events,
	type Message,
} from "discord.js";

const EXPORT_CHANNEL_ID = process.env.EXPORT_CHANNEL_ID || "";
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const DOWNLOAD_DIR = "download";

const deleteMessage = {
	name: Events.MessageDelete,
	async execute(message: Message) {
		// Check for export channel
		const exportChannel =
			await message.client.channels.fetch(EXPORT_CHANNEL_ID);
		if (!exportChannel || exportChannel.type !== ChannelType.GuildText) {
			return; // Exit if nowhere to export
		}

		// Craft message
		let msg = `**New deleted message by ${message.author.displayName} with `;
		msg += `${message.attachments.size} attachment${message.attachments.size === 1 ? "" : "s"}**`;
		if (message.content) {
			msg += `\n${message.content}`;
		}

		const files: AttachmentBuilder[] = [];
		const filenames: string[] = [];

		// Attachments detected
		if (message.attachments.size > 0) {
			for (const [id, attachment] of message.attachments) {
				if (
					attachment.contentType &&
					ACCEPTED_TYPES.includes(attachment.contentType)
				) {
					try {
						const res = await fetch(attachment.url);
						const filename = `${DOWNLOAD_DIR}/${id}_${attachment.name}`;
						await Bun.write(filename, res);

						files.push(new AttachmentBuilder(filename));
						filenames.push(filename);
					} catch (e: unknown) {
						console.error(e);
					}
				}
			}
		}

		await exportChannel.send({ content: msg, files: files });

		// Remove files after 10s
		await Bun.sleep(10000);
		for (const filename of filenames) {
			await unlink(filename);
		}
	},
};

export default deleteMessage;
