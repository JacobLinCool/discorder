import { config } from "dotenv";
import path from "node:path";

config();

export const BOT_TOKEN = process.env.BOT_TOKEN ?? "";
export const BOT_ID = process.env.BOT_ID ?? "";
export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? "./data");
export const RECORDING_DIR = path.join(DATA_DIR, "recording");
export const USER_DATA_DIR = path.join(DATA_DIR, "user");

if (!BOT_TOKEN) {
	throw new Error("Missing BOT_TOKEN");
}

if (!BOT_ID) {
	throw new Error("Missing BOT_ID");
}
