// [WEB-CONV-MAIN] Entry point for the converter page.
import { mountConverter } from "./converter.js";

const el = document.getElementById("converter-mount");
if (el instanceof HTMLElement) {
  mountConverter(el);
}
