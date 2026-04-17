import { resolve } from "path";
import { defineConfig } from "vite";
import { docsPlugin } from "./vite-plugin-docs.js";

// [WEB-CHUNK-FRAMEWORK] framework is imported dynamically in render-pane.ts,
// so Rollup emits it (plus elkjs) as a lazy chunk — the app shell stays tiny.
// [WEB-GHPAGES-BASE] served from apex custom domain typediagram.dev (see public/CNAME).
export default defineConfig({
  base: "/",
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        converter: resolve(__dirname, "converter.html"),
      },
    },
  },
  plugins: [docsPlugin()],
});
