import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts", "tool.ts"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
  noExternal: [/.*/],
  external: ["@opencode-ai/plugin"],
  dts: false,
  splitting: false,
  sourcemap: false,
  minify: false,
  target: "esnext",
});
