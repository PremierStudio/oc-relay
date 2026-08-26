import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "plugin/server": "src/plugin/server.ts",
    "plugin/tui": "src/plugin/tui.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
});
