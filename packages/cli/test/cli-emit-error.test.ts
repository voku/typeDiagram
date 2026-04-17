// [CLI-EMIT-SVG-ERR] Test emitSvg error branch via mocked renderToString.
import { Writable } from "node:stream";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import type * as TypediagramCoreMod from "typediagram-core";

vi.mock("typediagram-core", async (importOriginal) => {
  const orig = await importOriginal<typeof TypediagramCoreMod>();
  return {
    ...orig,
    renderToString: vi.fn(() =>
      Promise.resolve({
        ok: false as const,
        error: [
          {
            severity: "error" as const,
            message: "mock render fail",
            line: 0,
            col: 0,
            length: 0,
          },
        ],
      })
    ),
  };
});

// Import main AFTER the mock is set up
const { main } = await import("../src/cli.js");

const makeStream = () => {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));
      cb();
    },
  });
  return { stream, text: () => chunks.join("") };
};

const fixtureUrl = (name: string) => new URL(`./fixtures/${name}`, import.meta.url);
const fixturePath = (name: string) => fileURLToPath(fixtureUrl(name));

describe("[CLI-EMIT-SVG-ERR] emitSvg render failure", () => {
  it("--from --emit svg exits 1 when renderToString fails", async () => {
    const out = makeStream();
    const errS = makeStream();
    const code = await main(["--from", "rust", "--emit", "svg", fixturePath("types.rs")], out.stream, errS.stream);
    expect(code).toBe(1);
    expect(errS.text()).toContain("mock render fail");
  });
});
