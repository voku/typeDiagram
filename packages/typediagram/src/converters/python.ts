// [CONV-PY] Python <-> typeDiagram bidirectional converter.
import type { Diagnostic } from "../parser/diagnostics.js";
import { type Result, err } from "../result.js";
import type { Model, ResolvedTypeRef } from "../model/types.js";
import { ModelBuilder, record, union } from "../model/builder.js";
import type { Converter } from "./types.js";
import { parseTypeRef } from "./parse-typeref.js";

// ── Type mapping ──

const TD_TO_PY: Record<string, string> = {
  Bool: "bool",
  Int: "int",
  Float: "float",
  String: "str",
  Bytes: "bytes",
  Unit: "None",
  List: "list",
  Map: "dict",
  Option: "Optional",
};

const PY_TO_TD: Record<string, string> = {
  bool: "Bool",
  int: "Int",
  float: "Float",
  str: "String",
  bytes: "Bytes",
  None: "Unit",
  list: "List",
  dict: "Map",
  Optional: "Option",
  List: "List",
  Dict: "Map",
  Set: "List",
  Tuple: "List",
};

// ── From Python ──

const CLASS_RE = /@dataclass\s*\n\s*class\s+(\w+)(?:\(([^)]*)\))?\s*:\s*\n((?:\s+\w+\s*:.+\n?)*)/g;
const ENUM_RE = /class\s+(\w+)\((?:str,\s*)?Enum\)\s*:\s*\n((?:[ \t]+\w+\s*=.+\n?)*)/g;
const TYPED_DICT_RE = /class\s+(\w+)\(TypedDict\)\s*:\s*\n((?:\s+\w+\s*:.+\n?)*)/g;
const PY_FIELD_RE = /(\w+)\s*:\s*(.+)/;

/** Recursively map a Python type string, converting brackets and names. */
const mapPyType = (t: string): string => {
  const cleaned = t.trim().replace(/\s*#.*$/, "");
  // Normalize square brackets to angle brackets
  const normalized = cleaned.replace(/\[/g, "<").replace(/\]/g, ">");
  const angleBracket = normalized.indexOf("<");
  const baseName = angleBracket === -1 ? normalized : normalized.slice(0, angleBracket);
  const mapped = PY_TO_TD[baseName] ?? baseName;
  if (angleBracket === -1) {
    return mapped;
  }
  const inner = normalized.slice(angleBracket + 1, normalized.lastIndexOf(">"));
  const args = splitPyArgs(inner).map(mapPyType);
  return `${mapped}<${args.join(", ")}>`;
};

const splitPyArgs = (s: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charAt(i);
    depth += c === "<" ? 1 : c === ">" ? -1 : 0;
    if (c === "," && depth === 0) {
      parts.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  const last = s.slice(start).trim();
  return last.length > 0 ? [...parts, last] : parts;
};

const parsePyFields = (body: string) =>
  body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"))
    .map((l) => {
      const m = PY_FIELD_RE.exec(l);
      if (m === null) {
        return null;
      }
      const [, name, type] = m;
      if (name === undefined || type === undefined) {
        return null;
      }
      return { name, type: mapPyType(type.replace(/\s*=.*$/, "").trim()) };
    })
    .filter((f): f is { name: string; type: string } => f !== null);

const fromPython = (source: string): Result<Model, Diagnostic[]> => {
  const builder = new ModelBuilder();
  let found = false;

  CLASS_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CLASS_RE.exec(source)) !== null) {
    const [, name, , body] = m;
    if (name === undefined || body === undefined) {
      continue;
    }
    found = true;
    const fields = parsePyFields(body).map((f) => ({ name: f.name, type: parseTypeRef(f.type) }));
    builder.add(record(name, fields));
  }

  TYPED_DICT_RE.lastIndex = 0;
  while ((m = TYPED_DICT_RE.exec(source)) !== null) {
    const [, name, body] = m;
    if (name === undefined || body === undefined) {
      continue;
    }
    found = true;
    const fields = parsePyFields(body).map((f) => ({ name: f.name, type: parseTypeRef(f.type) }));
    builder.add(record(name, fields));
  }

  ENUM_RE.lastIndex = 0;
  while ((m = ENUM_RE.exec(source)) !== null) {
    const [, name, body] = m;
    if (name === undefined || body === undefined) {
      continue;
    }
    found = true;
    const variants = body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"))
      .map((l) => {
        const [variantName] = l.split("=");
        return { name: (variantName ?? l).trim(), fields: [] };
      });
    builder.add(union(name, variants));
  }

  return found
    ? builder.build()
    : err([{ severity: "error", message: "No Python type definitions found", line: 0, col: 0, length: 0 }]);
};

// ── To Python ──

const mapTdToPy = (t: ResolvedTypeRef): string => {
  const name = TD_TO_PY[t.name] ?? t.name;
  return t.args.length === 0 ? name : `${name}[${t.args.map(mapTdToPy).join(", ")}]`;
};

const toPython = (model: Model): string => {
  const lines: string[] = [
    "from __future__ import annotations",
    "from dataclasses import dataclass",
    "from enum import Enum",
    "from typing import Optional",
    "",
  ];

  for (const d of model.decls) {
    if (d.kind === "record") {
      lines.push("@dataclass", `class ${d.name}:`);
      if (d.fields.length > 0) {
        for (const f of d.fields) {
          lines.push(`    ${f.name}: ${mapTdToPy(f.type)}`);
        }
      } else {
        lines.push("    pass");
      }
      lines.push("");
    } else if (d.kind === "union") {
      const allEmpty = d.variants.every((v) => v.fields.length === 0);
      if (allEmpty) {
        lines.push(`class ${d.name}(str, Enum):`);
        for (const v of d.variants) {
          lines.push(`    ${v.name} = "${v.name.toLowerCase()}"`);
        }
        lines.push("");
      } else {
        for (const v of d.variants.filter((x) => x.fields.length > 0)) {
          lines.push("@dataclass", `class ${v.name}:`);
          for (const f of v.fields) {
            lines.push(`    ${f.name}: ${mapTdToPy(f.type)}`);
          }
          lines.push("");
        }
        const variantTypes = d.variants.map((v) => (v.fields.length > 0 ? v.name : `"${v.name}"`));
        lines.push(`${d.name} = ${variantTypes.join(" | ")}`, "");
      }
    } else {
      lines.push(`${d.name} = ${mapTdToPy(d.target)}`, "");
    }
  }

  return lines.join("\n");
};

export const python: Converter = {
  language: "python",
  fromSource: fromPython,
  toSource: toPython,
};
