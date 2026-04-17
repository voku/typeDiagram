// [WEB-CONVERTER-TEST] Tests for the converter page component.
import { describe, expect, it, beforeEach, vi } from "vitest";

// Mock the converter-render module since it depends on the full typediagram package
vi.mock("../src/converter-render.js", () => ({
  convertSource: vi.fn().mockResolvedValue({
    tdSource: "typeDiagram\n\ntype Foo {\n  name: String\n}\n",
    svgHtml: "<svg></svg>",
  }),
  convertFromTd: vi.fn().mockResolvedValue({
    tdSource: "export interface Foo {\n  name: string;\n}\n",
    svgHtml: "<svg></svg>",
  }),
}));

import { mountConverter } from "../src/converter.js";
import { convertSource, convertFromTd } from "../src/converter-render.js";

describe("[WEB-CONVERTER] mountConverter()", () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("renders language tabs for all 6 languages", async () => {
    mountConverter(container);
    await vi.dynamicImportSettled();

    const tabs = Array.from(container.querySelectorAll<HTMLElement>(".conv-lang-tab"));
    expect(tabs.length).toBe(6);

    const labels: (string | null)[] = tabs.map((t: HTMLElement) => t.textContent);
    expect(labels).toContain("TypeScript");
    expect(labels).toContain("Rust");
    expect(labels).toContain("Python");
    expect(labels).toContain("Go");
    expect(labels).toContain("C#");
    expect(labels).toContain("F#");
  });

  it("sets TypeScript as the default active tab", () => {
    mountConverter(container);

    const activeTab = container.querySelector(".conv-lang-tab--active");
    expect(activeTab?.textContent).toBe("TypeScript");
  });

  it("renders editor textarea with sample code", () => {
    mountConverter(container);

    const editor = container.querySelector<HTMLTextAreaElement>("#conv-editor");
    expect(editor).toBeTruthy();
    expect(editor?.value).toContain("interface");
  });

  it("renders typediagram output area", () => {
    mountConverter(container);

    const tdOutput = container.querySelector("#conv-td");
    expect(tdOutput).toBeTruthy();
  });

  it("renders preview area", () => {
    mountConverter(container);

    const preview = container.querySelector("#conv-preview");
    expect(preview).toBeTruthy();
  });

  it("renders a splitter between source and td output", () => {
    mountConverter(container);

    const splitter = container.querySelector("#conv-splitter");
    expect(splitter).toBeTruthy();
  });

  it("switches active tab on click", async () => {
    mountConverter(container);

    const rustTab = container.querySelector('[data-lang="rust"]') as HTMLButtonElement;
    rustTab.click();

    await vi.dynamicImportSettled();

    expect(rustTab.classList.contains("conv-lang-tab--active")).toBe(true);

    const tsTab = container.querySelector('[data-lang="typescript"]');
    expect(tsTab).not.toBeNull();
    expect(tsTab?.classList.contains("conv-lang-tab--active")).toBe(false);
  });

  it("updates editor content when switching languages", () => {
    mountConverter(container);

    const rustTab = container.querySelector('[data-lang="rust"]') as HTMLButtonElement;
    rustTab.click();

    const editor = container.querySelector<HTMLTextAreaElement>("#conv-editor");
    expect(editor).not.toBeNull();
    expect(editor?.value).toContain("struct");
  });

  it("calls convertSource on mount", async () => {
    mountConverter(container);
    // Give the async render time to settle
    await new Promise((r) => setTimeout(r, 10));

    expect(convertSource).toHaveBeenCalled();
  });

  it("creates backdrop for syntax highlighting", () => {
    mountConverter(container);

    const backdrop = container.querySelector("#conv-backdrop");
    expect(backdrop).toBeTruthy();
    expect(backdrop?.querySelector("code")).toBeTruthy();
  });

  it("renders flip button", () => {
    mountConverter(container);

    const flipBtn = container.querySelector("#conv-flip");
    expect(flipBtn).toBeTruthy();
  });

  it("flips direction and swaps labels on flip click", async () => {
    mountConverter(container);

    const flipBtn = container.querySelector<HTMLButtonElement>("#conv-flip");
    const leftLabel = container.querySelector("#conv-left-label");
    const rightLabel = container.querySelector("#conv-right-label");
    expect(flipBtn).not.toBeNull();
    expect(leftLabel).not.toBeNull();
    expect(rightLabel).not.toBeNull();
    if (flipBtn === null || leftLabel === null || rightLabel === null) {
      return;
    }

    expect(leftLabel.textContent).toBe("source");
    expect(rightLabel.textContent).toBe("typediagram");

    flipBtn.click();
    await new Promise((r) => setTimeout(r, 10));

    expect(leftLabel.textContent).toBe("typediagram");
    expect(flipBtn.classList.contains("conv-flip-btn--active")).toBe(true);
  });

  it("calls convertFromTd when flipped", async () => {
    mountConverter(container);

    const flipBtn = container.querySelector<HTMLButtonElement>("#conv-flip");
    expect(flipBtn).not.toBeNull();
    if (flipBtn === null) {
      return;
    }
    flipBtn.click();
    await new Promise((r) => setTimeout(r, 10));

    expect(convertFromTd).toHaveBeenCalled();
  });

  it("loads typediagram sample in editor when flipped", () => {
    mountConverter(container);

    const flipBtn = container.querySelector<HTMLButtonElement>("#conv-flip");
    expect(flipBtn).not.toBeNull();
    if (flipBtn === null) {
      return;
    }
    flipBtn.click();

    const editor = container.querySelector<HTMLTextAreaElement>("#conv-editor");
    expect(editor).not.toBeNull();
    expect(editor?.value).toContain("typeDiagram");
  });
});
