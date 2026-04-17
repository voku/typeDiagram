import { DiagnosticBag, type Diagnostic } from "../parser/diagnostics.js";
import type { Model, ResolvedDecl, ResolvedTypeRef } from "./types.js";

const NULL_SPAN = { line: 0, col: 0 } as const;

/** Validate a Model independently of the parser. Used for hand-built or JSON-loaded models. */
export function validate(model: Model): Diagnostic[] {
  const bag = new DiagnosticBag();

  // Duplicate decl names
  const seen = new Map<string, number>();
  for (const d of model.decls) {
    seen.set(d.name, (seen.get(d.name) ?? 0) + 1);
  }
  for (const [name, count] of seen) {
    if (count > 1) {
      bag.error(`duplicate declaration '${name}'`, NULL_SPAN.line, NULL_SPAN.col);
    }
  }

  // Generic-arity mismatches when a decl name is referenced
  const arity = new Map<string, number>();
  for (const d of model.decls) {
    arity.set(d.name, d.generics.length);
  }

  for (const d of model.decls) {
    walkDecl(d, (t) => {
      if (t.resolution.kind === "declared") {
        const expected = arity.get(t.resolution.declName);
        if (expected !== undefined && t.args.length !== expected) {
          bag.error(
            `type '${t.name}' takes ${String(expected)} type argument(s), got ${String(t.args.length)}`,
            NULL_SPAN.line,
            NULL_SPAN.col
          );
        }
      }
    });
  }

  return bag.items;
}

function walkDecl(d: ResolvedDecl, visit: (t: ResolvedTypeRef) => void): void {
  if (d.kind === "record") {
    for (const f of d.fields) {
      walkRef(f.type, visit);
    }
  } else if (d.kind === "union") {
    for (const v of d.variants) {
      for (const f of v.fields) {
        walkRef(f.type, visit);
      }
    }
  } else {
    walkRef(d.target, visit);
  }
}

function walkRef(t: ResolvedTypeRef, visit: (t: ResolvedTypeRef) => void): void {
  visit(t);
  for (const a of t.args) {
    walkRef(a, visit);
  }
}
