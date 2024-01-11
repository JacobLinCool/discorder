import { remove } from "../recorder";
import type { Command } from "./types";

const command: Command = {
	name: "stop",
	description: "Stop the recorder you started",
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

		if (!("voice" in interaction.member)) {
			await interaction.reply("You need to join a voice channel first!");
			return;
		}

		const removed = remove(interaction.member);
		if (removed) {
			await interaction.reply("Stopping the recorder!");

			const data = removed.gather();
			const transcription = data
				.map(([t, u, c]) => `[${ms_to_time(t)}] ${u}: ${c}`)
				.join("\n");

			await interaction.followUp({
				files: [
					{
						name: "transcription.txt",
						attachment: Buffer.from(transcription),
					},
				],
			});
		} else {
			await interaction.reply("You didn't start the recorder!");
		}
	},
};

export default command;

function ms_to_time(ms: number) {
	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);
	const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
		.toString()
		.padStart(2, "0")}`;
}
