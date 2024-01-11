import debug from "debug";
import { config } from "dotenv";
import { decode } from "node-wav";
import fs from "node:fs";
import type { Whisper } from "smart-whisper";

config();

const log = debug("transcriber");
log.enabled = true;

const model = process.env.WHISPER_MODEL;
const server = process.env.SMART_WHISPER_SERVER;

export function read_wav(file: string): Float32Array {
	const { sampleRate, channelData } = decode(fs.readFileSync(file));

	if (sampleRate !== 16000) {
		throw new Error(`Invalid sample rate: ${sampleRate}`);
	}
	if (channelData.length !== 1) {
		throw new Error(`Invalid channel count: ${channelData.length}`);
	}

	return channelData[0];
}

let whisper: Whisper | null = null;
export const local_transcribe = model
	? async (
			file: string,
			options: {
				language?: string;
				initial_prompt?: string;
			} = {},
		) => {
			if (!whisper) {
				const { Whisper } = await import("smart-whisper");
				whisper = new Whisper(model);
			}

			const pcm = read_wav(file);

			const { result } = await whisper.transcribe(pcm, {
				language: options.language ?? undefined,
				initial_prompt: options.initial_prompt ?? undefined,
			});
			return { result };
		}
	: undefined;

export const remote_transcribe = server
	? async (
			file: string,
			options: {
				language?: string;
				prompt?: string;
			} = {},
		) => {
			const form = new FormData();
			form.append("audio", new Blob([fs.readFileSync(file)]), "audio.wav");
			if (options.language) {
				form.append("language", options.language);
			}
			if (options.prompt) {
				form.append("prompt", options.prompt);
			}

			const url = `${server}/transcribe`;
			log("Sending request to %s", url);
			log("Form data: %O", form);

			const res = await fetch(url, {
				method: "POST",
				body: form,
			});
			log("Status: %d", res.status);

			if (!res.ok) {
				throw new Error(`Server returned ${res.status}`);
			}

			const result = (await res.json()) as {
				text: string;
				from: number;
				to: number;
			}[];

			return { result };
		}
	: undefined;

log({
	model,
	server,
});
