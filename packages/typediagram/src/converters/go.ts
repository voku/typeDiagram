// [CONV-GO] Go <-> typeDiagram bidirectional converter.
import type { Diagnostic } from "../parser/diagnostics.js";
import { type Result, err } from "../result.js";
import type { Model, ResolvedTypeRef } from "../model/types.js";
import { ModelBuilder, record, union, alias } from "../model/builder.js";
import type { Converter } from "./types.js";
import { parseTypeRef } from "./parse-typeref.js";

// ── Type mapping ──

const TD_TO_GO: Record<string, string> = {
  Bool: "bool",
  Int: "int64",
  Float: "float64",
  String: "string",
  Bytes: "[]byte",
  Unit: "struct{}",
  List: "[]",
  Map: "map",
  Option: "*",
};

const GO_TO_TD: Record<string, string> = {
  bool: "Bool",
  int: "Int",
  int8: "Int",
  int16: "Int",
  int32: "Int",
  int64: "Int",
  uint: "Int",
  uint8: "Int",
  uint16: "Int",
  uint32: "Int",
  uint64: "Int",
  float32: "Float",
  float64: "Float",
  string: "String",
  byte: "Int",
  rune: "Int",
};

// ── From Go ──

const STRUCT_RE = /type\s+(\w+)\s+struct\s*\{([^}]*)}/g;
const IFACE_RE = /type\s+(\w+)\s+interface\s*\{([^}]*)}/g;
const TYPE_ALIAS_RE = /type\s+(\w+)\s+=?\s*(\w[\w.[\]*]*)/g;
const FIELD_RE = /(\w+)\s+(.+)/;

const mapGoType = (t: string): string => {
  const cleaned = t.trim().replace(/\s*`[^`]*`$/, "");
  if (cleaned.startsWith("[]")) {
    return `List<${mapGoType(cleaned.slice(2))}>`;
  }
  if (cleaned.startsWith("*")) {
    return `Option<${mapGoType(cleaned.slice(1))}>`;
  }
  if (cleaned.startsWith("map[")) {
    const closeBracket = cleaned.indexOf("]");
    const key = cleaned.slice(4, closeBracket);
    const val = cleaned.slice(closeBracket + 1);
    return `Map<${mapGoType(key)}, ${mapGoType(val)}>`;
  }
  return GO_TO_TD[cleaned] ?? cleaned;
};

const parseGoFields = (body: string) =>
  body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("//"))
    .map((l) => {
      const m = FIELD_RE.exec(l);
      if (m === null) {
        return null;
      }
      const [, name, type] = m;
      if (name === undefined || type === undefined) {
        return null;
      }
      return { name, type: mapGoType(type.replace(/\s*`[^`]*`$/, "").trim()) };
    })
    .filter((f): f is { name: string; type: string } => f !== null);

const fromGo = (source: string): Result<Model, Diagnostic[]> => {
  const builder = new ModelBuilder();
  let found = false;
  const structNames = new Set<string>();
  const ifaceNames = new Set<string>();

  STRUCT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = STRUCT_RE.exec(source)) !== null) {
    const [, name, body] = m;
    if (name === undefined || body === undefined) {
      continue;
    }
    found = true;
    structNames.add(name);
    const fields = parseGoFields(body).map((f) => ({ name: f.name, type: parseTypeRef(f.type) }));
    builder.add(record(name, fields));
  }

  IFACE_RE.lastIndex = 0;
  while ((m = IFACE_RE.exec(source)) !== null) {
    const [, name, body] = m;
    if (name === undefined || body === undefined) {
      continue;
    }
    found = true;
    ifaceNames.add(name);
    const methods = body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("//"))
      .map((l) => l.replace(/\(.*\).*$/, "").trim())
      .filter((l) => l.length > 0);
    const variants = methods.map((vname) => ({ name: vname, fields: [] }));
    builder.add(union(name, variants.length > 0 ? variants : [{ name: "Unknown", fields: [] }]));
  }

  TYPE_ALIAS_RE.lastIndex = 0;
  while ((m = TYPE_ALIAS_RE.exec(source)) !== null) {
    const [, name, rawTarget] = m;
    if (name === undefined || rawTarget === undefined) {
      continue;
    }
    const target = rawTarget.trim();
    if (structNames.has(name) || ifaceNames.has(name)) {
      continue;
    }
    if (target === "struct" || target === "interface") {
      continue;
    }
    found = true;
    builder.add(alias(name, parseTypeRef(mapGoType(target))));
  }

  return found
    ? builder.build()
    : err([{ severity: "error", message: "No Go type definitions found", line: 0, col: 0, length: 0 }]);
};

// ── To Go ──

const mapTdToGo = (t: ResolvedTypeRef): string => {
  const [a0, a1] = t.args;
  if (t.name === "List" && t.args.length === 1 && a0 !== undefined) {
    return `[]${mapTdToGo(a0)}`;
  }
  if (t.name === "Option" && t.args.length === 1 && a0 !== undefined) {
    return `*${mapTdToGo(a0)}`;
  }
  if (t.name === "Map" && t.args.length === 2 && a0 !== undefined && a1 !== undefined) {
    return `map[${mapTdToGo(a0)}]${mapTdToGo(a1)}`;
  }
  return TD_TO_GO[t.name] ?? t.name;
};

const toGo = (model: Model): string => {
  const lines: string[] = ["package types", ""];

  for (const d of model.decls) {
    if (d.kind === "record") {
      lines.push(`type ${d.name} struct {`);
      for (const f of d.fields) {
        const goName = f.name.charAt(0).toUpperCase() + f.name.slice(1);
        lines.push(`\t${goName} ${mapTdToGo(f.type)}`);
      }
      lines.push("}", "");
    } else if (d.kind === "union") {
      // Go uses interface + method for sum types
      lines.push(`type ${d.name} interface {`, `\tis${d.name}()`, "}", "");
      for (const v of d.variants) {
        if (v.fields.length === 0) {
          lines.push(`type ${v.name} struct{}`, "");
        } else {
          lines.push(`type ${v.name} struct {`);
          for (const f of v.fields) {
            const goName = f.name.charAt(0).toUpperCase() + f.name.slice(1);
            lines.push(`\t${goName} ${mapTdToGo(f.type)}`);
          }
          lines.push("}", "");
        }
        lines.push(`func (${v.name}) is${d.name}() {}`, "");
      }
    } else {
      lines.push(`type ${d.name} = ${mapTdToGo(d.target)}`, "");
    }
  }

  return lines.join("\n");
};

export const go: Converter = {
  language: "go",
  fromSource: fromGo,
  toSource: toGo,
};
