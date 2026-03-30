import fs from "node:fs";
import path from "node:path";
import { REST, Routes, type ChatInputCommandInteraction, type SlashCommandBuilder } from "discord.js";

type Command = {
	name: string;
	data: SlashCommandBuilder;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) {
	throw new Error("Missing TOKEN environment variable.");
}

if (!CLIENT_ID) {
	throw new Error("Missing CLIENT_ID environment variable.");
}

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".ts"));

const commands = [];

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const commandModule = await import(filePath);
	const command = commandModule.default as Partial<Command>;

	if (!command.data || !command.execute) {
		console.log(
			`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
		);
		continue;
	}

	commands.push(command.data.toJSON());
}

const rest = new REST().setToken(TOKEN);

console.log(`Started refreshing ${commands.length} global application (/) command(s).`);
await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
console.log(`Successfully reloaded ${commands.length} global application (/) command(s).`);
