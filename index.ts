import { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";
import {
	Client,
	Collection,
	Events,
	GatewayIntentBits,
	MessageFlags,
	type ChatInputCommandInteraction,
	type SlashCommandBuilder,
} from "discord.js";

const TOKEN = process.env.TOKEN;

const db = new Database("database.sqlite");
db.run(`CREATE TABLE IF NOT EXISTS funny_word_counts (
	user_id TEXT PRIMARY KEY,
	frequency INTEGER DEFAULT 0,
	frequency_r INTEGER DEFAULT 0
)`);
db.close();

type Command = {
	name: string;
	data: SlashCommandBuilder;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
}) as Client & { commands: Collection<string, Command> };

client.commands = new Collection<string, Command>();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".ts"));

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

	client.commands.set(command.data.name, command as Command);
	console.log(`Imported command ${command.data.name}`);
}

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

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: "There was an error while executing this command!",
				flags: MessageFlags.Ephemeral,
			});
		} else {
			await interaction.reply({
				content: "There was an error while executing this command!",
				flags: MessageFlags.Ephemeral,
			});
		}
	}
});

client.login(TOKEN);
