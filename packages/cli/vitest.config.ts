import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

interface ThresholdsFile {
  readonly projects: Record<string, Record<string, number>>;
}

const raw: unknown = JSON.parse(readFileSync(resolve(__dirname, "../../coverage-thresholds.json"), "utf8"));
const thresholds = (raw as ThresholdsFile).projects["packages/cli"];

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/bin.ts"],
      thresholds,
    },
  },
});
