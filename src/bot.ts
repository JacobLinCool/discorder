import debug from "debug";
import { Client } from "discord.js";
import { commands } from "./commands";

const log = debug("bot");
log.enabled = true;

export const bot = new Client({
	intents: ["GuildVoiceStates", "Guilds"],
});

bot.on("ready", () => {
	log("Bot is ready");
});

bot.on("interactionCreate", (interaction) => {
	if (!interaction.isCommand()) {
		return;
	}
	log("Command received: %s", interaction.commandName);
	const command = commands.find((cmd) => cmd.name === interaction.commandName);
	if (!command) {
		return;
	}
	log("Executing command: %s", command.name);
	command.action(interaction);
});
