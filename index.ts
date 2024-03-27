import fs from "node:fs";
import path from "node:path";
import { Client, GatewayIntentBits } from "discord.js";

const TOKEN = process.env.TOKEN;

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
	.readdirSync(eventsPath)
	.filter((file) => file.endsWith(".ts"));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = await import(filePath);
	if (event.default.once) {
		client.once(event.default.name, (...args) =>
			event.default.execute(...args),
		);
	} else {
		client.on(event.default.name, (...args) => event.default.execute(...args));
	}
	console.log(`Imported ${event.default.name}`);
}

client.login(TOKEN);
