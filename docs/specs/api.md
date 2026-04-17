# Node.js API

The `typediagram-core` npm package exposes a layered API. Each layer is independently importable.

## Quick start

```ts
import { renderToString } from "typediagram-core";

const source = `
  type User { name: String, email: Option<Email> }
  union Option<T> { Some { value: T }, None }
  alias Email = String
`;

const result = await renderToString(source);
if (result.ok) {
  console.log(result.value); // full <svg> string
}
```

## Sugar API (top-level)

```ts
import { renderToString, render, parser } from "typediagram-core";
```

### `renderToString(source, opts?)`

Parse, layout, and render to an SVG string. Returns `Result<string, Diagnostic[]>`.

```ts
const result = await renderToString(source, {
  theme: "dark", // "light" | "dark"
  fontSize: 14, // px
  padding: 16, // outer padding
});
```

### `render(source, opts?)`

Browser-only. Same as `renderToString` but returns an `SVGElement` via `DOMParser`. Returns `Result<SVGElement, Diagnostic[]>`.

## Result type

Every API returns `Result<T, E>` instead of throwing:

```ts
import { type Result, ok, err, isOk, isErr, map, andThen, unwrap } from "typediagram-core";

const result = await renderToString(source);
if (result.ok) {
  console.log(result.value);
} else {
  console.error(result.error); // Diagnostic[]
}
```

## Layer 1: Parser

```ts
import { parser } from "typediagram-core";

const result = parser.parse(source);
// Result<Diagram, Diagnostic[]>

// Partial parse (for IDE/LSP — returns both AST and diagnostics)
const { diagram, diagnostics } = parser.parsePartial(source);

// Format diagnostics for display
const text = parser.formatDiagnostics(diagnostics);
// "  3:12  error   expected '{', got Ident "User""
```

## Layer 2: Model

```ts
import { model } from "typediagram-core";

// From AST
const m = model.buildModel(ast);
// Result<Model, Diagnostic[]>

// Programmatic construction
const builder = new model.ModelBuilder();
builder.add(
  model.record("User", [
    { name: "name", type: model.ref("String") },
    { name: "email", type: model.ref("Option", [model.ref("Email")]) },
  ])
);
builder.add(model.alias("Email", model.ref("String")));
const result = builder.build();

// Model → typeDiagram DSL source
const source = model.printSource(result.value);

// Model → JSON (stable versioned schema)
const json = model.toJSON(result.value);
const restored = model.fromJSON(json);
```

## Layer 3: Layout

```ts
import { layoutLayer } from "typediagram-core";

const result = await layoutLayer.layout(model);
// Result<LaidOutGraph, Diagnostic[]>
// LaidOutGraph has: nodes (NodeBox[]), edges (EdgeRoute[]), width, height
```

## Layer 4: SVG Renderer

```ts
import { renderSvgLayer } from "typediagram-core";

const svg = renderSvgLayer.renderSvg(laidOutGraph, {
  theme: "light",
  fontSize: 13,
  padding: 16,
});
// Returns a full <svg xmlns="...">...</svg> string
```

## Converters

```ts
import { converters } from "typediagram-core";

// Parse other languages
const model = converters.typescript.fromSource(tsCode);
const model = converters.python.fromSource(pyCode);
const model = converters.rust.fromSource(rsCode);
const model = converters.go.fromSource(goCode);
const model = converters.csharp.fromSource(csCode);

// Emit other languages
const tsCode = converters.typescript.toSource(model);
const pyCode = converters.python.toSource(model);
const rsCode = converters.rust.toSource(model);
const goCode = converters.go.toSource(model);
const csCode = converters.csharp.toSource(model);
```

## Diagnostic type

```ts
interface Diagnostic {
  severity: "error" | "warning";
  message: string;
  line: number;
  col: number;
  length: number;
}
```
