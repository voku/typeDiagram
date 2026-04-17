// [WEB-EDITOR-ZOOM-TEST] Tests for Ctrl+wheel editor zoom.
import { describe, expect, it, beforeEach } from "vitest";
import { initEditorZoom } from "../src/editor-zoom.js";

// happy-dom's WheelEvent doesn't propagate modifier keys, so we patch them on.
const ctrlWheel = (deltaY: number, extra: Record<string, boolean> = {}) => {
  const e = new WheelEvent("wheel", { deltaY, bubbles: true });
  Object.defineProperty(e, "ctrlKey", { value: extra.ctrlKey ?? true });
  Object.defineProperty(e, "metaKey", { value: extra.metaKey ?? false });
  return e;
};

describe("[WEB-EDITOR-ZOOM]", () => {
  let wrap: HTMLElement;
  let textarea: HTMLTextAreaElement;
  let backdrop: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    wrap = document.createElement("div");
    textarea = document.createElement("textarea");
    backdrop = document.createElement("pre");
    wrap.appendChild(backdrop);
    wrap.appendChild(textarea);
    document.body.appendChild(wrap);
  });

  it("applies default font size on init", () => {
    initEditorZoom(wrap, textarea, backdrop);
    expect(textarea.style.fontSize).toBe("13px");
    expect(backdrop.style.fontSize).toBe("13px");
  });

  it("restores persisted font size from localStorage", () => {
    localStorage.setItem("typediagram-editor-zoom", "18");
    initEditorZoom(wrap, textarea, backdrop);
    expect(textarea.style.fontSize).toBe("18px");
  });

  it("clamps stored size to min bound", () => {
    localStorage.setItem("typediagram-editor-zoom", "2");
    initEditorZoom(wrap, textarea, backdrop);
    expect(textarea.style.fontSize).toBe("8px");
  });

  it("clamps stored size to max bound", () => {
    localStorage.setItem("typediagram-editor-zoom", "99");
    initEditorZoom(wrap, textarea, backdrop);
    expect(textarea.style.fontSize).toBe("32px");
  });

  it("zooms in on Ctrl+wheel-up", () => {
    initEditorZoom(wrap, textarea, backdrop);
    wrap.dispatchEvent(ctrlWheel(-100));
    expect(textarea.style.fontSize).toBe("14px");
    expect(backdrop.style.fontSize).toBe("14px");
    expect(localStorage.getItem("typediagram-editor-zoom")).toBe("14");
  });

  it("zooms out on Ctrl+wheel-down", () => {
    initEditorZoom(wrap, textarea, backdrop);
    wrap.dispatchEvent(ctrlWheel(100));
    expect(textarea.style.fontSize).toBe("12px");
  });

  it("zooms with metaKey (Cmd on Mac)", () => {
    initEditorZoom(wrap, textarea, backdrop);
    wrap.dispatchEvent(ctrlWheel(-100, { ctrlKey: false, metaKey: true }));
    expect(textarea.style.fontSize).toBe("14px");
  });

  it("ignores plain wheel (no modifier)", () => {
    initEditorZoom(wrap, textarea, backdrop);
    wrap.dispatchEvent(ctrlWheel(-100, { ctrlKey: false, metaKey: false }));
    expect(textarea.style.fontSize).toBe("13px");
  });

  it("clamps zoom to min", () => {
    localStorage.setItem("typediagram-editor-zoom", "8");
    initEditorZoom(wrap, textarea, backdrop);
    expect(textarea.style.fontSize).toBe("8px");
    wrap.dispatchEvent(ctrlWheel(100));
    expect(textarea.style.fontSize).toBe("8px");
  });

  it("clamps zoom to max", () => {
    localStorage.setItem("typediagram-editor-zoom", "32");
    initEditorZoom(wrap, textarea, backdrop);
    expect(textarea.style.fontSize).toBe("32px");
    wrap.dispatchEvent(ctrlWheel(-100));
    expect(textarea.style.fontSize).toBe("32px");
  });
});
