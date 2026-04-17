// [CONV-CS] C# <-> typeDiagram bidirectional converter.
import type { Diagnostic } from "../parser/diagnostics.js";
import { type Result, err } from "../result.js";
import type { Model, ResolvedTypeRef } from "../model/types.js";
import { ModelBuilder, record, union } from "../model/builder.js";
import type { Converter } from "./types.js";
import { parseTypeRef } from "./parse-typeref.js";

// ── Type mapping tables ──

const TD_TO_CS: Record<string, string> = {
  Bool: "bool",
  Int: "int",
  Float: "double",
  String: "string",
  Bytes: "byte[]",
  Unit: "void",
  List: "List",
  Map: "Dictionary",
  Option: "Nullable",
};

const CS_TO_TD: Record<string, string> = {
  bool: "Bool",
  int: "Int",
  long: "Int",
  short: "Int",
  float: "Float",
  double: "Float",
  decimal: "Float",
  string: "String",
  byte: "Int",
  void: "Unit",
  List: "List",
  Dictionary: "Map",
  HashSet: "List",
};

// ── From C# ──

const RECORD_RE = /(?:public\s+)?record\s+(\w+)(?:<([^>]+)>)?\s*\(([^)]*)\)\s*;/g;
const CLASS_RE = /(?:public\s+)?class\s+(\w+)(?:<([^>]+)>)?\s*\{([^}]*)}/g;
const ENUM_RE = /(?:public\s+)?enum\s+(\w+)\s*\{([^}]*)}/g;
const PROP_RE = /(?:public\s+)?(\w[\w<>,\s[\]?]*?)\s+(\w+)\s*\{[^}]*\}/;
const PARAM_RE = /(\w[\w<>,\s[\]?]*?)\s+(\w+)/;

const mapCsType = (t: string): string => {
  const cleaned = t.trim().replace(/\?$/, "");
  return CS_TO_TD[cleaned] ?? cleaned;
};

const parseCsParams = (body: string) =>
  body
    .split(",")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => {
      const m = PARAM_RE.exec(l);
      if (m === null) {
        return null;
      }
      const [, type, name] = m;
      if (type === undefined || name === undefined) {
        return null;
      }
      return { name, type: mapCsType(type) };
    })
    .filter((f): f is { name: string; type: string } => f !== null);

const parseCsProps = (body: string) =>
  body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("//"))
    .map((l) => {
      const m = PROP_RE.exec(l);
      if (m === null) {
        return null;
      }
      const [, type, name] = m;
      if (type === undefined || name === undefined) {
        return null;
      }
      return { name, type: mapCsType(type) };
    })
    .filter((f): f is { name: string; type: string } => f !== null);

const parseGenerics = (s: string | undefined): string[] =>
  s !== undefined && s.length > 0 ? s.split(",").map((g) => g.trim()) : [];

const fromCSharp = (source: string): Result<Model, Diagnostic[]> => {
  const builder = new ModelBuilder();
  let found = false;

  // record types (positional)
  RECORD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RECORD_RE.exec(source)) !== null) {
    const [, name, gens, body] = m;
    if (name === undefined || body === undefined) {
      continue;
    }
    found = true;
    const fields = parseCsParams(body).map((f) => ({ name: f.name, type: parseTypeRef(f.type) }));
    builder.add(record(name, fields, parseGenerics(gens)));
  }

  // classes with properties
  CLASS_RE.lastIndex = 0;
  while ((m = CLASS_RE.exec(source)) !== null) {
    const [, name, gens, body] = m;
    if (name === undefined || body === undefined) {
      continue;
    }
    found = true;
    const fields = parseCsProps(body).map((f) => ({ name: f.name, type: parseTypeRef(f.type) }));
    builder.add(record(name, fields, parseGenerics(gens)));
  }

  // enums → unions
  ENUM_RE.lastIndex = 0;
  while ((m = ENUM_RE.exec(source)) !== null) {
    const [, name, body] = m;
    if (name === undefined || body === undefined) {
      continue;
    }
    found = true;
    const cleaned = body
      .split("\n")
      .map((l) => l.replace(/\/\/.*$/, "").trim())
      .join(",");
    const variants = cleaned
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((l) => {
        const [variantName] = l.split("=");
        return { name: (variantName ?? l).trim(), fields: [] };
      });
    builder.add(union(name, variants));
  }

  return found
    ? builder.build()
    : err([{ severity: "error", message: "No C# type definitions found", line: 0, col: 0, length: 0 }]);
};

// ── To C# ──

const mapTdToCs = (t: ResolvedTypeRef): string => {
  const name = TD_TO_CS[t.name] ?? t.name;
  return t.args.length === 0 ? name : `${name}<${t.args.map(mapTdToCs).join(", ")}>`;
};

const toCSharp = (model: Model): string => {
  const lines: string[] = [];

  for (const d of model.decls) {
    const genericsStr = d.generics.length > 0 ? `<${d.generics.join(", ")}>` : "";

    if (d.kind === "record") {
      const params = d.fields.map((f) => `${mapTdToCs(f.type)} ${f.name}`).join(", ");
      lines.push(`public record ${d.name}${genericsStr}(${params});`, "");
    } else if (d.kind === "union") {
      lines.push(`public enum ${d.name} {`);
      lines.push(d.variants.map((v) => `    ${v.name}`).join(",\n"));
      lines.push("}", "");
    } else {
      lines.push(`using ${d.name}${genericsStr} = ${mapTdToCs(d.target)};`, "");
    }
  }

  return lines.join("\n");
};

export const csharp: Converter = {
  language: "csharp",
  fromSource: fromCSharp,
  toSource: toCSharp,
};
