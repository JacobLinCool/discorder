import eula from "./eula";
import start from "./start";
import stop from "./stop";
import type { Command } from "./types";

export const commands: Command[] = [start, stop, eula];
