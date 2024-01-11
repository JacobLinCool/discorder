import fs from "node:fs";
import path from "node:path";
import { manager } from "../user";
import type { Command } from "./types";

const eula = fs.readFileSync(path.join(process.cwd(), "eula.md"), "utf-8");

const command: Command = {
	name: "eula",
	description: "View or accept the EULA",
	action: async (interaction) => {
		if (!interaction.isCommand()) {
			return;
		}

		if (!interaction.isChatInputCommand()) {
			return;
		}

		if (!interaction.member) {
			return;
		}

		const subcommand = interaction.options.getSubcommand();

		if (subcommand === "accept") {
			const prev = manager.get(interaction.user.id);
			if (prev && prev.eula) {
				await interaction.reply({
					content:
						"You already accepted the EULA at " + new Date(prev.eula).toLocaleString(),
					ephemeral: true,
				});
				return;
			}

			manager.set(interaction.user.id, { eula: Date.now() });
			await interaction.reply({
				content: "You accepted the EULA, you can use the recorder now!",
				ephemeral: true,
			});
		} else {
			await interaction.reply({
				content: eula,
				ephemeral: true,
			});
		}
	},
	build: (builder) => {
		builder
			.addSubcommand((subcommand) =>
				subcommand.setName("view").setDescription("View the EULA"),
			)
			.addSubcommand((subcommand) =>
				subcommand
					.setName("accept")
					.setDescription("Accept the EULA, please make sure you have read it!"),
			);

		return builder;
	},
};

export default command;
