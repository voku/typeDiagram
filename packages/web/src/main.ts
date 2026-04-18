// [WEB-MAIN] Landing page + embedded playground.
import { mountPlayground } from "./playground.js";

const el = document.getElementById("playground-mount");
if (el instanceof HTMLElement) {
  mountPlayground(el);
}
