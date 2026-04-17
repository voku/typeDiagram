// [WEB-SPLITTER] Draggable vertical splitter between editor and preview panes.
// Persists split position to localStorage.

const STORAGE_KEY = "typediagram-split";
const DEFAULT_RATIO = 0.5;
const MIN_RATIO = 0.15;
const MAX_RATIO = 0.85;

const clampRatio = (r: number): number => (r < MIN_RATIO ? MIN_RATIO : r > MAX_RATIO ? MAX_RATIO : r);

const loadRatio = (): number => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored !== null && stored !== "" ? clampRatio(parseFloat(stored)) : DEFAULT_RATIO;
};

const saveRatio = (r: number) => {
  localStorage.setItem(STORAGE_KEY, String(r));
};

export const initSplitter = (app: HTMLElement, handle: HTMLElement) => {
  let ratio = loadRatio();
  let dragging = false;

  const applyRatio = () => {
    app.style.gridTemplateColumns = `${String(ratio)}fr 4px ${String(1 - ratio)}fr`;
  };

  applyRatio();

  handle.addEventListener("pointerdown", (e) => {
    dragging = true;
    if (typeof handle.setPointerCapture === "function") {
      handle.setPointerCapture(e.pointerId);
    }
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) {
      return;
    }
    const rect = app.getBoundingClientRect();
    ratio = clampRatio((e.clientX - rect.left) / rect.width);
    applyRatio();
  });

  const stopDrag = () => {
    if (!dragging) {
      return;
    }
    dragging = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    saveRatio(ratio);
  };

  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);
};
