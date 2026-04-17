// [WEB-ZOOM-CONTROLS-TEST] Tests for floating zoom toolbar.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createZoomControls } from "../src/zoom-controls.js";

describe("[WEB-ZOOM-CONTROLS]", () => {
  let container: HTMLElement;
  const actions = {
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    reset: vi.fn(),
    fit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("appends a .zoom-controls element to the container", () => {
    createZoomControls(container, actions);
    expect(container.querySelector(".zoom-controls")).not.toBeNull();
  });

  it("creates five buttons", () => {
    createZoomControls(container, actions);
    const btns = container.querySelectorAll(".zoom-btn");
    expect(btns).toHaveLength(5);
  });

  it("+ button calls zoomIn", () => {
    createZoomControls(container, actions);
    const btn = container.querySelectorAll(".zoom-btn")[0] as HTMLButtonElement;
    btn.click();
    expect(actions.zoomIn).toHaveBeenCalledOnce();
  });

  it("\u2212 button calls zoomOut", () => {
    createZoomControls(container, actions);
    const btn = container.querySelectorAll(".zoom-btn")[1] as HTMLButtonElement;
    btn.click();
    expect(actions.zoomOut).toHaveBeenCalledOnce();
  });

  it("1:1 button calls reset", () => {
    createZoomControls(container, actions);
    const btn = container.querySelectorAll(".zoom-btn")[2] as HTMLButtonElement;
    btn.click();
    expect(actions.reset).toHaveBeenCalledOnce();
  });

  it("fit button calls fit", () => {
    createZoomControls(container, actions);
    const btn = container.querySelectorAll(".zoom-btn")[3] as HTMLButtonElement;
    btn.click();
    expect(actions.fit).toHaveBeenCalledOnce();
  });

  it("returns the bar element", () => {
    const bar = createZoomControls(container, actions);
    expect(bar.className).toBe("zoom-controls");
  });
});
