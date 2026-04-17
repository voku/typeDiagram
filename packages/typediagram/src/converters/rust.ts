// [CONV-RUST] Rust <-> typeDiagram bidirectional converter.
import type { Diagnostic } from "../parser/diagnostics.js";
import { type Result, err } from "../result.js";
import type { Model, ResolvedTypeRef } from "../model/types.js";
import { ModelBuilder, record, union, alias } from "../model/builder.js";
import type { Converter } from "./types.js";
import { parseTypeRef } from "./parse-typeref.js";

// ── Type mapping ──

const TD_TO_RS: Record<string, string> = {
  Bool: "bool",
  Int: "i64",
  Float: "f64",
  String: "String",
  Bytes: "Vec<u8>",
  Unit: "()",
  List: "Vec",
  Map: "HashMap",
  Option: "Option",
};

const RS_TO_TD: Record<string, string> = {
  bool: "Bool",
  i8: "Int",
  i16: "Int",
  i32: "Int",
  i64: "Int",
  u8: "Int",
  u16: "Int",
  u32: "Int",
  u64: "Int",
  f32: "Float",
  f64: "Float",
  String: "String",
  str: "String",
  Vec: "List",
  HashMap: "Map",
  BTreeMap: "Map",
  Option: "Option",
  Box: "",
};

// ── From Rust ──

const STRUCT_RE = /(?:pub\s+)?struct\s+(\w+)(?:<([^>]+)>)?\s*\{([^}]*)}/g;
const ENUM_RE = /(?:pub\s+)?enum\s+(\w+)(?:<([^>]+)>)?\s*\{([^}]*)}/g;
const TYPE_ALIAS_RE = /(?:pub\s+)?type\s+(\w+)(?:<([^>]+)>)?\s*=\s*([^;]+);/g;
const FIELD_RE = /(?:pub\s+)?(\w+)\s*:\s*(.+)/;

const splitGenericArgs = (s: string): string[] => {
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

const mapRsType = (t: string): string => {
  const cleaned = t
    .trim()
    .replace(/&'?\w*\s*/g, "")
    .replace(/^&/, "");
  const angleBracket = cleaned.indexOf("<");
  if (angleBracket !== -1) {
    const baseName = cleaned.slice(0, angleBracket);
    const mapped = RS_TO_TD[baseName] ?? baseName;
    const inner = cleaned.slice(angleBracket + 1, cleaned.lastIndexOf(">"));
    const args = splitGenericArgs(inner).map(mapRsType);
    return `${mapped}<${args.join(", ")}>`;
  }
  return RS_TO_TD[cleaned] ?? cleaned;
};

const parseRsFields = (body: string) =>
  body
    .split(",")
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
      return { name, type: mapRsType(type.replace(/,$/, "").trim()) };
    })
    .filter((f): f is { name: string; type: string } => f !== null);

const splitRsVariants = (body: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body.charAt(i);
    depth += c === "{" || c === "(" ? 1 : c === "}" || c === ")" ? -1 : 0;
    if (c === "," && depth === 0) {
      parts.push(body.slice(start, i).trim());
      start = i + 1;
    }
  }
  const last = body.slice(start).trim();
  return last.length > 0 ? [...parts, last] : parts;
};

const parseRsVariants = (body: string) => {
  const variants: Array<{ name: string; fields: Array<{ name: string; type: string }> }> = [];
  const raw = splitRsVariants(body).filter((s) => s.length > 0 && !s.startsWith("//"));

  for (const line of raw) {
    const braceIdx = line.indexOf("{");
    const parenIdx = line.indexOf("(");

    if (braceIdx !== -1) {
      const name = line.slice(0, braceIdx).trim();
      const inner = line.slice(braceIdx + 1, line.lastIndexOf("}"));
      variants.push({ name, fields: parseRsFields(inner) });
    } else if (parenIdx !== -1) {
      const name = line.slice(0, parenIdx).trim();
      const inner = line.slice(parenIdx + 1, line.lastIndexOf(")"));
      const types = inner
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const fields = types.map((t, i) => ({ name: `_${String(i)}`, type: mapRsType(t) }));
      variants.push({ name, fields });
    } else {
      variants.push({ name: line.replace(/,$/, "").trim(), fields: [] });
    }
  }
  return variants;
};

const rsGenerics = (s: string | undefined): string[] =>
  s !== undefined && s.length > 0
    ? s.split(",").map((g) => {
        const [first] = g.trim().split(/[:\s]/);
        return first ?? g.trim();
      })
    : [];

const fromRust = (source: string): Result<Model, Diagnostic[]> => {
  const builder = new ModelBuilder();
  let found = false;

  STRUCT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = STRUCT_RE.exec(source)) !== null) {
    const [, name, gens, body] = m;
    if (name === undefined || body === undefined) {
      continue;
    }
    found = true;
    const fields = parseRsFields(body).map((f) => ({ name: f.name, type: parseTypeRef(f.type) }));
    builder.add(record(name, fields, rsGenerics(gens)));
  }

  ENUM_RE.lastIndex = 0;
  while ((m = ENUM_RE.exec(source)) !== null) {
    const [, name, gens, body] = m;
    if (name === undefined || body === undefined) {
      continue;
    }
    found = true;
    const variants = parseRsVariants(body).map((v) => ({
      name: v.name,
      fields: v.fields.map((f) => ({ name: f.name, type: parseTypeRef(f.type) })),
    }));
    builder.add(union(name, variants, rsGenerics(gens)));
  }

  TYPE_ALIAS_RE.lastIndex = 0;
  while ((m = TYPE_ALIAS_RE.exec(source)) !== null) {
    const [, name, gens, target] = m;
    if (name === undefined || target === undefined) {
      continue;
    }
    found = true;
    builder.add(alias(name, parseTypeRef(mapRsType(target.trim())), rsGenerics(gens)));
  }

  return found
    ? builder.build()
    : err([{ severity: "error", message: "No Rust type definitions found", line: 0, col: 0, length: 0 }]);
};

// ── To Rust ──

const mapTdToRs = (t: ResolvedTypeRef): string => {
  const name = TD_TO_RS[t.name] ?? t.name;
  return t.args.length === 0 ? name : `${name}<${t.args.map(mapTdToRs).join(", ")}>`;
};

const toRust = (model: Model): string => {
  const lines: string[] = [];

  for (const d of model.decls) {
    const genericsStr = d.generics.length > 0 ? `<${d.generics.join(", ")}>` : "";

    if (d.kind === "record") {
      lines.push(`pub struct ${d.name}${genericsStr} {`);
      for (const f of d.fields) {
        lines.push(`    pub ${f.name}: ${mapTdToRs(f.type)},`);
      }
      lines.push("}", "");
    } else if (d.kind === "union") {
      lines.push(`pub enum ${d.name}${genericsStr} {`);
      for (const v of d.variants) {
        if (v.fields.length === 0) {
          lines.push(`    ${v.name},`);
        } else {
          lines.push(`    ${v.name} { ${v.fields.map((f) => `${f.name}: ${mapTdToRs(f.type)}`).join(", ")} },`);
        }
      }
      lines.push("}", "");
    } else {
      lines.push(`pub type ${d.name}${genericsStr} = ${mapTdToRs(d.target)};`, "");
    }
  }

  return lines.join("\n");
};

export const rust: Converter = {
  language: "rust",
  fromSource: fromRust,
  toSource: toRust,
};
