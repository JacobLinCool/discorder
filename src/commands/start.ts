import { joinVoiceChannel } from "@discordjs/voice";
import fs from "node:fs";
import { add } from "../recorder";
import { local_transcribe, remote_transcribe } from "../transcriber";
import { manager } from "../user";
import type { Command } from "./types";

const command: Command = {
	name: "start",
	description: "Start the recorder in the current voice channel",
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

		const eula = manager.get(interaction.user.id).eula;
		if (!eula) {
			await interaction.reply(
				"You need to accept the EULA first! Use `/eula view` to view the EULA and `/eula accept` to accept it.",
			);
			return;
		}

		if (!("voice" in interaction.member)) {
			await interaction.reply("You need to join a voice channel first!");
			return;
		}

		const { channel } = interaction.member.voice;
		if (!channel) {
			await interaction.reply("You need to join a voice channel first!");
			return;
		}

		const permissions = channel.permissionsFor(interaction.client.user);
		if (
			!permissions?.has("Connect") ||
			!permissions.has("Speak") ||
			!permissions.has("UseVAD")
		) {
			await interaction.reply(
				"I need the permissions to join and speak in your voice channel!",
			);
			return;
		}

		const language = interaction.options.getString("language");
		const prompt = interaction.options.getString("prompt");
		const live_chan = interaction.options.getChannel("channel");
		if (!live_chan || !("send" in live_chan)) {
			await interaction.reply("Invalid live channel!");
			return;
		}

		const conn = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator,
			selfDeaf: false,
			selfMute: true,
			debug: true,
		});

		const recorder = add(conn, channel, interaction.member);
		recorder.on("recorded", async (wav: string, user_id: string) => {
			console.log("Recorded", wav);

			let text = "";
			if (local_transcribe) {
				const { result } = await local_transcribe(wav, {
					language: language ?? undefined,
					initial_prompt: prompt ?? undefined,
				});
				text = (await result).map((x) => x.text).join(" ");
			} else if (remote_transcribe) {
				const { result } = await remote_transcribe(wav, {
					language: language ?? undefined,
					prompt: prompt ?? undefined,
				});
				text = result.map((x) => x.text).join(" ");
			}

			if (text) {
				const fp = wav.replace(/\.wav$/, ".txt");
				fs.writeFileSync(fp, text);

				const username = channel.guild.members.cache.get(user_id)?.displayName ?? user_id;
				await live_chan.send({
					content: `**${username}**: ${text}`,
				});
			}
		});

		await interaction.reply("Starting the recorder!");
	},
	build: (builder) => {
		builder
			.addStringOption((option) =>
				option
					.setName("language")
					.setDescription("The language of the recording")
					.setRequired(false)
					.setChoices(
						...[
							{ name: "Auto", value: "auto" },
							// { name: "Afrikaans", value: "af" },
							// { name: "Arabic", value: "ar" },
							// { name: "Armenian", value: "hy" },
							// { name: "Azerbaijani", value: "az" },
							// { name: "Belarusian", value: "be" },
							// { name: "Bosnian", value: "bs" },
							// { name: "Bulgarian", value: "bg" },
							// { name: "Catalan", value: "ca" },
							{ name: "Chinese", value: "zh" },
							// { name: "Croatian", value: "hr" },
							{ name: "Czech", value: "cs" },
							// { name: "Danish", value: "da" },
							{ name: "Dutch", value: "nl" },
							{ name: "English", value: "en" },
							// { name: "Estonian", value: "et" },
							// { name: "Finnish", value: "fi" },
							{ name: "French", value: "fr" },
							// { name: "Galician", value: "gl" },
							{ name: "German", value: "de" },
							// { name: "Greek", value: "el" },
							// { name: "Hebrew", value: "he" },
							// { name: "Hindi", value: "hi" },
							// { name: "Hungarian", value: "hu" },
							// { name: "Icelandic", value: "is" },
							{ name: "Indonesian", value: "id" },
							{ name: "Italian", value: "it" },
							{ name: "Japanese", value: "ja" },
							// { name: "Kannada", value: "kn" },
							// { name: "Kazakh", value: "kk" },
							{ name: "Korean", value: "ko" },
							// { name: "Latvian", value: "lv" },
							// { name: "Lithuanian", value: "lt" },
							// { name: "Macedonian", value: "mk" },
							// { name: "Malay", value: "ms" },
							// { name: "Marathi", value: "mr" },
							// { name: "Maori", value: "mi" },
							// { name: "Nepali", value: "ne" },
							// { name: "Norwegian", value: "no" },
							// { name: "Persian", value: "fa" },
							{ name: "Polish", value: "pl" },
							{ name: "Portuguese", value: "pt" },
							{ name: "Romanian", value: "ro" },
							{ name: "Russian", value: "ru" },
							// { name: "Serbian", value: "sr" },
							// { name: "Slovak", value: "sk" },
							// { name: "Slovenian", value: "sl" },
							{ name: "Spanish", value: "es" },
							// { name: "Swahili", value: "sw" },
							{ name: "Swedish", value: "sv" },
							// { name: "Tagalog", value: "tl" },
							// { name: "Tamil", value: "ta" },
							{ name: "Thai", value: "th" },
							{ name: "Turkish", value: "tr" },
							// { name: "Ukrainian", value: "uk" },
							// { name: "Urdu", value: "ur" },
							// { name: "Vietnamese", value: "vi" },
							// { name: "Welsh", value: "cy" },
						],
					),
			)
			.addStringOption((option) =>
				option
					.setName("prompt")
					.setDescription("The prompt to use")
					.setRequired(false)
					.setMinLength(1)
					.setMaxLength(100),
			)
			.addChannelOption((option) =>
				option
					.setName("channel")
					.setDescription("The text channel to send transcriptions to")
					.setRequired(false),
			);

		return builder;
	},
};

export default command;
