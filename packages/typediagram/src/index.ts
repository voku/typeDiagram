import type { Diagnostic } from "./parser/diagnostics.js";
import { type Result, andThenAsync, err, ok } from "./result.js";
import { parse as parseSrc } from "./parser/index.js";
import { buildModel } from "./model/index.js";
import { layout } from "./layout/index.js";
import { renderSvg, type SvgOpts } from "./render-svg/index.js";
import type { LayoutOpts } from "./layout/index.js";

export interface AllOpts extends SvgOpts, LayoutOpts {}

export async function renderToString(source: string, opts: AllOpts = {}): Promise<Result<string, Diagnostic[]>> {
  const parsed = parseSrc(source);
  if (!parsed.ok) {
    return parsed;
  }
  const model = buildModel(parsed.value);
  if (!model.ok) {
    return model;
  }
  const laid = await layout(model.value, opts);
  if (!laid.ok) {
    return laid;
  }
  return ok(renderSvg(laid.value, opts));
}

/** Browser-only: parse SVG string into an SVGElement via DOMParser. */
export async function render(source: string, opts: AllOpts = {}): Promise<Result<SVGElement, Diagnostic[]>> {
  const r = await renderToString(source, opts);
  if (!r.ok) {
    return r;
  }
  if (typeof DOMParser === "undefined") {
    return err<Diagnostic[]>([
      {
        severity: "error",
        message: "render() requires a browser DOMParser; use renderToString() in Node",
        line: 0,
        col: 0,
        length: 0,
      },
    ]);
  }
  const doc = new DOMParser().parseFromString(r.value, "image/svg+xml");
  const el = doc.documentElement as unknown as SVGElement;
  return ok(el);
}

// Layer barrels for direct access
export * as parser from "./parser/index.js";
export * as model from "./model/index.js";
export * as layoutLayer from "./layout/index.js";
export * as renderSvgLayer from "./render-svg/index.js";
export * as converters from "./converters/index.js";

// Result type
export type { Result } from "./result.js";
export { ok, err, isOk, isErr, map, mapErr, andThen, andThenAsync, unwrap } from "./result.js";

// Common types most consumers want at the top level
export type { Diagnostic } from "./parser/diagnostics.js";

// keep imports from being tree-shaken away in odd configurations
void andThenAsync;
