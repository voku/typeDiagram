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

const portraitQuery = (): MediaQueryList | null =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(orientation: portrait), (max-width: 767px)")
    : null;

export const initSplitter = (app: HTMLElement, handle: HTMLElement) => {
  let ratio = loadRatio();
  let dragging = false;
  const mq = portraitQuery();
  const isPortrait = () => mq?.matches === true;

  const applyRatio = () => {
    const tracks = `${String(ratio)}fr 4px ${String(1 - ratio)}fr`;
    const portrait = isPortrait();
    app.style.gridTemplateRows = portrait ? tracks : "";
    app.style.gridTemplateColumns = portrait ? "" : tracks;
  };

  applyRatio();
  mq?.addEventListener("change", applyRatio);

  handle.addEventListener("pointerdown", (e) => {
    dragging = true;
    if (typeof handle.setPointerCapture === "function") {
      handle.setPointerCapture(e.pointerId);
    }
    document.body.style.cursor = isPortrait() ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) {
      return;
    }
    const rect = app.getBoundingClientRect();
    ratio = isPortrait()
      ? clampRatio((e.clientY - rect.top) / rect.height)
      : clampRatio((e.clientX - rect.left) / rect.width);
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
