import { type Client, Events } from "discord.js";

const ready = {
	name: Events.ClientReady,
	once: true,
	async execute(client: Client<true>) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};

export default ready;
