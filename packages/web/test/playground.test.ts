// [WEB-PLAYGROUND-TEST] Integration test for the mountPlayground component.
import { describe, expect, it, beforeEach, vi } from "vitest";

// Mock typediagram to avoid pulling the full framework in this DOM-focused test.
vi.mock("typediagram-core", () => ({
  renderToString: vi.fn().mockResolvedValue({ ok: true, value: "<svg>mock</svg>" }),
  parser: { formatDiagnostics: (d: unknown[]) => d.map(String).join("\n") },
}));

import { mountPlayground } from "../src/playground.js";

describe("[WEB-PLAYGROUND]", () => {
  let container: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement("div");
    document.body.innerHTML = "";
    document.body.appendChild(container);
  });

  it("builds the DOM structure with editor, splitter, and preview", () => {
    mountPlayground(container);
    expect(container.querySelector("#editor")).not.toBeNull();
    expect(container.querySelector("#splitter")).not.toBeNull();
    expect(container.querySelector("#preview")).not.toBeNull();
    expect(container.querySelector("#backdrop")).not.toBeNull();
  });

  it("adds playground class to container", () => {
    mountPlayground(container);
    expect(container.classList.contains("playground")).toBe(true);
  });

  it("populates editor with initial example text", () => {
    mountPlayground(container);
    const editor = container.querySelector<HTMLTextAreaElement>("#editor");
    expect(editor).not.toBeNull();
    expect(editor?.value).toContain("typeDiagram");
    expect(editor?.value).toContain("ChatRequest");
  });

  it("renders preview on mount", async () => {
    mountPlayground(container);
    // Allow async render to settle
    await new Promise((r) => setTimeout(r, 50));
    const preview = container.querySelector("#preview");
    expect(preview).not.toBeNull();
    expect(preview?.innerHTML).toContain("mock");
  });

  it("re-renders on editor input", async () => {
    mountPlayground(container);
    await new Promise((r) => setTimeout(r, 50));

    const editor = container.querySelector<HTMLTextAreaElement>("#editor");
    expect(editor).not.toBeNull();
    if (editor === null) {
      return;
    }
    editor.value = "typeDiagram\n  type Foo { x: Int }";
    editor.dispatchEvent(new Event("input", { bubbles: true }));

    // Wait for debounce (120ms) + render
    await new Promise((r) => setTimeout(r, 200));
    const preview = container.querySelector("#preview");
    expect(preview?.innerHTML).toContain("mock");
  });

  it("creates splitter and viewport inside preview", () => {
    mountPlayground(container);
    const preview = container.querySelector("#preview");
    expect(preview).not.toBeNull();
    expect(preview?.querySelector(".viewport-wrapper")).not.toBeNull();
  });

  it("creates editor pane labels", () => {
    mountPlayground(container);
    const labels = container.querySelectorAll(".pane-label");
    expect(labels.length).toBe(2);
    expect(labels[0]?.textContent).toBe("source");
    expect(labels[1]?.textContent).toBe("preview");
  });
});
