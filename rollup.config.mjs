import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const isWatch = !!process.env.ROLLUP_WATCH;

export default {
	input: "src/plugin.ts",
	output: {
		file: "com.kailo.edminingbook.sdPlugin/bin/plugin.cjs",
		format: "cjs",
		sourcemap: isWatch,
		exports: "auto"
	},
	plugins: [
		typescript({ tsconfig: "./tsconfig.json" }),
		nodeResolve(),
		commonjs(),
		!isWatch && terser()
	].filter(Boolean)
};
