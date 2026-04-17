// [WEB-SPLITTER-TEST] Integration test for the draggable splitter.
import { describe, expect, it, beforeEach } from "vitest";
import { initSplitter } from "../src/splitter.js";

describe("[WEB-SPLITTER]", () => {
  let app: HTMLElement;
  let handle: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    app = document.createElement("main");
    app.className = "app";
    app.style.display = "grid";
    handle = document.createElement("div");
    handle.className = "splitter";
    document.body.appendChild(app);
  });

  it("applies default 50/50 split on init", () => {
    initSplitter(app, handle);
    expect(app.style.gridTemplateColumns).toBe("0.5fr 4px 0.5fr");
  });

  it("restores persisted ratio from localStorage", () => {
    localStorage.setItem("typediagram-split", "0.3");
    initSplitter(app, handle);
    expect(app.style.gridTemplateColumns).toBe("0.3fr 4px 0.7fr");
  });

  it("clamps stored ratio to min/max bounds", () => {
    localStorage.setItem("typediagram-split", "0.05");
    initSplitter(app, handle);
    expect(app.style.gridTemplateColumns).toBe("0.15fr 4px 0.85fr");
  });

  it("clamps stored ratio to max bound", () => {
    localStorage.setItem("typediagram-split", "0.99");
    initSplitter(app, handle);
    expect(app.style.gridTemplateColumns).toBe("0.85fr 4px 0.15000000000000002fr");
  });

  it("pointermove without drag does nothing", () => {
    initSplitter(app, handle);
    const initial = app.style.gridTemplateColumns;
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 700, bubbles: true }));
    expect(app.style.gridTemplateColumns).toBe(initial);
  });

  it("pointercancel stops drag and saves", () => {
    initSplitter(app, handle);
    Object.defineProperty(app, "getBoundingClientRect", {
      value: () => ({ left: 0, width: 1000, top: 0, height: 800, right: 1000, bottom: 800 }),
    });
    handle.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, clientX: 500, bubbles: true }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 600, bubbles: true }));
    window.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true }));
    expect(localStorage.getItem("typediagram-split")).toBe("0.6");
  });

  it("pointerup without prior drag does nothing", () => {
    initSplitter(app, handle);
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    expect(localStorage.getItem("typediagram-split")).toBeNull();
  });

  it("works when handle lacks setPointerCapture", () => {
    const bare = document.createElement("div");
    // Remove setPointerCapture to test the optional chain
    (bare as Record<string, unknown>).setPointerCapture = undefined;
    initSplitter(app, bare);
    Object.defineProperty(app, "getBoundingClientRect", {
      value: () => ({ left: 0, width: 1000, top: 0, height: 800, right: 1000, bottom: 800 }),
    });
    bare.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, clientX: 500, bubbles: true }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 600, bubbles: true }));
    expect(app.style.gridTemplateColumns).toBe("0.6fr 4px 0.4fr");
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    expect(localStorage.getItem("typediagram-split")).toBe("0.6");
  });

  it("calls setPointerCapture when available", () => {
    initSplitter(app, handle);
    const captured: number[] = [];
    Object.defineProperty(handle, "setPointerCapture", {
      value: (id: number) => captured.push(id),
      configurable: true,
    });
    Object.defineProperty(app, "getBoundingClientRect", {
      value: () => ({ left: 0, width: 1000, top: 0, height: 800, right: 1000, bottom: 800 }),
    });
    handle.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 42, clientX: 500, bubbles: true }));
    expect(captured).toEqual([42]);
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
  });

  it("updates grid on pointer drag and saves on pointerup", () => {
    initSplitter(app, handle);
    Object.defineProperty(app, "getBoundingClientRect", {
      value: () => ({ left: 0, width: 1000, top: 0, height: 800, right: 1000, bottom: 800 }),
    });

    handle.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, clientX: 500, bubbles: true }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 700, bubbles: true }));
    expect(app.style.gridTemplateColumns).toBe("0.7fr 4px 0.30000000000000004fr");

    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    expect(localStorage.getItem("typediagram-split")).toBe("0.7");
  });
});
