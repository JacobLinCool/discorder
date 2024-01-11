import fs from "node:fs";
import path from "node:path";
import { USER_DATA_DIR } from "../config";

export interface UserData {
	eula?: number;
}

export class UserDataManager {
	public dir: string;

	constructor(dir: string) {
		this.dir = path.resolve(dir);
		fs.mkdirSync(this.dir, { recursive: true });
	}

	public get(id: string): UserData {
		const file = path.join(this.dir, `${id}.json`);
		if (fs.existsSync(file)) {
			return JSON.parse(fs.readFileSync(file, "utf-8"));
		} else {
			return {};
		}
	}

	public set(id: string, data: UserData): void {
		const file = path.join(this.dir, `${id}.json`);
		fs.writeFileSync(file, JSON.stringify(data));
	}
}

export const manager = new UserDataManager(USER_DATA_DIR);
