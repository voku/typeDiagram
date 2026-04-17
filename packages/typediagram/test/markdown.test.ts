import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../src/markdown.js";
import { SMALL_EXAMPLE } from "./fixtures.js";

function unwrap<T>(r: { ok: true; value: T } | { ok: false; error: unknown }): T {
  if (!r.ok) {
    throw new Error(`expected ok: ${JSON.stringify(r.error)}`);
  }
  return r.value;
}

describe("markdown — renderMarkdown", () => {
  it("returns input unchanged when no fences", async () => {
    const md = "# hello\n\nsome text";
    const out = unwrap(await renderMarkdown(md));
    expect(out).toBe(md);
  });

  it("replaces a typeDiagram fence with rendered SVG", async () => {
    const md = "before\n\n```typeDiagram\n" + SMALL_EXAMPLE.trim() + "\n```\n\nafter";
    const out = unwrap(await renderMarkdown(md));
    expect(out).toContain("before");
    expect(out).toContain("after");
    expect(out).toContain("<svg");
    expect(out).not.toContain("```typeDiagram");
  });

  it("leaves other fences untouched", async () => {
    const md = "```js\nconsole.log(1)\n```\n\n```typeDiagram\ntype X { a: Int }\n```";
    const out = unwrap(await renderMarkdown(md));
    expect(out).toContain("```js\nconsole.log(1)\n```");
    expect(out).toContain("<svg");
  });

  it("handles multiple typeDiagram fences in one doc", async () => {
    const md = "```typeDiagram\ntype A { x: Int }\n```\n\n```typeDiagram\ntype B { y: Int }\n```";
    const out = unwrap(await renderMarkdown(md));
    expect((out.match(/<svg/g) ?? []).length).toBe(2);
  });

  it("emits HTML-comment diagnostics on a bad fence (still returns Result.err)", async () => {
    const md = "```typeDiagram\ntype X { @bad }\n```";
    const r = await renderMarkdown(md);
    expect(r.ok).toBe(false);
    if (r.ok) {
      throw new Error("unreachable");
    }
    expect(r.error.length).toBeGreaterThan(0);
  });
});
