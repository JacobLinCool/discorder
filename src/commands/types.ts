import type { Interaction, SlashCommandBuilder } from "discord.js";

export interface Command {
	name: string;
	description: string;
	build?: (builder: SlashCommandBuilder) => SlashCommandBuilder;
	action: (interaction: Interaction) => void;
}
