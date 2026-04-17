// [INDEX-TEST] Tests for index.ts render() browser function and error paths.
import { describe, expect, it, vi } from "vitest";
import { render, renderToString } from "../src/index.js";

describe("[INDEX-RENDER] render() browser function", () => {
  it("returns error when DOMParser is undefined", async () => {
    const r = await render("type Foo { x: String }");
    expect(r.ok).toBe(false);
    expect(r.ok).toBe(false);
    if (r.ok) {
      return;
    }
    expect(r.error[0]?.message).toContain("DOMParser");
  });

  it("returns SVGElement when DOMParser is available", async () => {
    const mockElement = { tagName: "svg" };
    const mockDoc = { documentElement: mockElement };
    const mockParser = { parseFromString: vi.fn(() => mockDoc) };
    // @ts-expect-error stubbing global DOMParser
    globalThis.DOMParser = vi.fn(() => mockParser);
    try {
      const r = await render("type Foo { x: String }");
      expect(r.ok).toBe(true);
      expect(r.ok && r.value).toBe(mockElement);
      expect(mockParser.parseFromString).toHaveBeenCalledWith(expect.stringContaining("<svg"), "image/svg+xml");
    } finally {
      // @ts-expect-error cleaning up global stub
      delete globalThis.DOMParser;
    }
  });

  it("propagates parse errors from render()", async () => {
    const r = await render("@@@invalid syntax");
    expect(r.ok).toBe(false);
  });

  it("uses default opts when none provided", async () => {
    const r = await render("type Foo { x: String }");
    // Without DOMParser, still returns err (not a crash)
    expect(r.ok).toBe(false);
  });
});

describe("[INDEX-RENDERTOSTRING] renderToString error propagation", () => {
  it("returns err for build errors", async () => {
    // Duplicate decl names cause a build error
    const r = await renderToString("type X { a: Int }\ntype X { b: Int }");
    expect(r.ok).toBe(false);
  });
});
