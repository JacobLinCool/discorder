import { defineConfig } from "tsup";

export default defineConfig(() => ({
	entry: ["src/index.ts", "src/register.ts"],
	outDir: "dist",
	target: "node18",
	format: ["esm"],
	shims: true,
	clean: true,
	splitting: false,
	external: ["smart-whisper"],
}));
