import type { VoiceConnection } from "@discordjs/voice";
import { EndBehaviorType } from "@discordjs/voice";
import debug from "debug";
import type { GuildMember, VoiceBasedChannel } from "discord.js";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import prism from "prism-media";
import wav from "wav";
import { RECORDING_DIR } from "../config";
import { manager } from "../user";

const log = debug("recorder");
log.enabled = true;

const RATE = 16000;
const CHANNELS = 1;

export class Recorder extends EventEmitter {
	public conn: VoiceConnection;
	public chan: VoiceBasedChannel;
	public user: GuildMember;
	public start: number;
	protected dir: string;
	protected interval: NodeJS.Timeout | null = null;
	protected recording = new Set<string>();

	constructor(conn: VoiceConnection, chan: VoiceBasedChannel, user: GuildMember) {
		super();

		this.conn = conn;
		this.chan = chan;
		this.user = user;

		this.start = Date.now();
		this.dir = path.join(RECORDING_DIR, this.start.toString());
		fs.mkdirSync(this.dir, { recursive: true });
		fs.writeFileSync(
			path.join(this.dir, "meta.json"),
			JSON.stringify({
				start: new Date(this.start).toISOString(),
				guild: this.chan.guild.id,
				channel: this.chan.id,
				user: this.user.id,
			}),
		);

		this.setup();
	}

	protected setup() {
		this.conn.on("error", log);

		this.conn.receiver.speaking.on("start", async (user) => {
			// ignore bots
			if (this.chan.members.get(user)?.user.bot) {
				return;
			}

			const eula = manager.get(user).eula;
			if (!eula) {
				return;
			}

			if (this.recording.has(user)) {
				return;
			}
			this.recording.add(user);
			log("speaking start", user);
			this.emit("speaking", user);

			const audio = this.conn.receiver.subscribe(user, {
				end: {
					behavior: EndBehaviorType.AfterSilence,
					duration: 1500,
				},
			});

			const time_offset = Date.now() - this.start;
			const fp = path.join(this.dir, user, `${time_offset.toString().padStart(8, "0")}.wav`);
			if (!fs.existsSync(path.join(this.dir, user))) {
				fs.mkdirSync(path.join(this.dir, user), { recursive: true });
			}

			audio.once("end", () => {
				log("speaking end", user);
				this.recording.delete(user);
			});

			const transcoder = new prism.opus.Decoder({
				channels: CHANNELS,
				rate: RATE,
				frameSize: 960,
			});
			const out = new wav.FileWriter(fp, { sampleRate: RATE, channels: CHANNELS });
			audio.pipe(transcoder).pipe(out);

			out.on("done", () => {
				this.emit("recorded", fp, user);
			});

			const meta = path.join(this.dir, user, "meta.json");
			if (!fs.existsSync(meta)) {
				fs.writeFileSync(
					meta,
					JSON.stringify({
						id: user,
						name: this.chan.members.get(user)?.displayName ?? user,
						username: this.chan.members.get(user)?.user.username ?? user,
					}),
				);
			}
		});

		const client = this.chan.client;
		client.on("voiceStateUpdate", (old, cur) => {
			if (old.member?.id !== this.user.id) {
				return;
			}

			if (old.channelId !== this.chan.id) {
				return;
			}

			if (cur.channelId === null) {
				this.stop();
			}
		});

		this.interval = setInterval(() => {
			if (this.conn.state.status === "destroyed") {
				this.stop();
			}

			const user = this.chan.members.get(this.user.id);
			if (!user) {
				this.stop();
			}
		}, 1000);
	}

	protected stopped = false;
	public stop() {
		if (this.stopped) {
			return;
		}
		this.stopped = true;

		this.conn.destroy();
		if (this.interval) {
			clearInterval(this.interval);
		}
	}

	public gather(): [time: number, user: string, content: string][] {
		const uids = fs
			.readdirSync(this.dir, { withFileTypes: true })
			.filter((x) => x.isDirectory());
		const result: [time: number, user: string, content: string][] = [];
		for (const uid of uids) {
			const files = fs.readdirSync(path.join(this.dir, uid.name));
			const meta = JSON.parse(
				fs.readFileSync(path.join(this.dir, uid.name, "meta.json"), "utf-8"),
			);
			for (const file of files) {
				if (!file.endsWith(".txt")) {
					continue;
				}

				const time = parseInt(file.replace(/\.txt$/, ""));
				const content = fs.readFileSync(path.join(this.dir, uid.name, file), "utf-8");
				result.push([time, meta.name, content]);
			}
		}

		result.sort((a, b) => a[0] - b[0]);
		return result;
	}
}
