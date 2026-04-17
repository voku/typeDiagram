# Language Converters

typeDiagram includes bidirectional converters for **TypeScript**, **Python**, **Rust**, **Go**, and **C#**. Each converter can parse existing type definitions into a typeDiagram model, and emit type definitions from a model.

## How it works

```
TypeScript source  ──→  Model  ──→  SVG diagram
                          ↕
Python source      ←──  Model  ←──  typeDiagram source
```

Converters target the **Model** layer (Layer 2 of the framework). They don't round-trip through DSL text — they work directly with the resolved type graph.

## TypeScript

### What maps

| TypeScript                      | typeDiagram                      |
| ------------------------------- | -------------------------------- |
| `interface User { ... }`        | `type User { ... }`              |
| `type Shape = Circle \| Square` | `union Shape { Circle, Square }` |
| `type Email = string`           | `alias Email = String`           |
| `string`                        | `String`                         |
| `number`                        | `Int`                            |
| `boolean`                       | `Bool`                           |
| `Array<T>`                      | `List<T>`                        |
| `Map<K,V>`                      | `Map<K,V>`                       |

### From TypeScript

```ts
// Input
export interface User {
  id: string;
  name: string;
  email: string | undefined;
}
```

```sh
typediagram --from typescript types.ts > diagram.svg
```

### To TypeScript

Emits `export interface` for records, discriminated unions with a `kind` field for unions, `export type X = Y` for aliases.

## Python

### What maps

| Python                    | typeDiagram           |
| ------------------------- | --------------------- |
| `@dataclass class User`   | `type User { ... }`   |
| `class Color(str, Enum)`  | `union Color { ... }` |
| `class Config(TypedDict)` | `type Config { ... }` |
| `str`                     | `String`              |
| `int`                     | `Int`                 |
| `float`                   | `Float`               |
| `bool`                    | `Bool`                |
| `list[T]` / `List[T]`     | `List<T>`             |
| `dict[K,V]` / `Dict[K,V]` | `Map<K,V>`            |
| `Optional[T]`             | `Option<T>`           |

### To Python

Emits `@dataclass` for records, `str, Enum` for unions with no payloads, separate dataclass per variant + type alias for unions with payloads.

## Rust

### What maps

| Rust                      | typeDiagram            |
| ------------------------- | ---------------------- |
| `pub struct User { ... }` | `type User { ... }`    |
| `pub enum Shape { ... }`  | `union Shape { ... }`  |
| `pub type Email = String` | `alias Email = String` |
| `String` / `&str`         | `String`               |
| `i32` / `i64` / `u64`     | `Int`                  |
| `f64`                     | `Float`                |
| `bool`                    | `Bool`                 |
| `Vec<T>`                  | `List<T>`              |
| `HashMap<K,V>`            | `Map<K,V>`             |
| `Option<T>`               | `Option<T>`            |

Supports struct variants, tuple variants, and unit variants in enums. Generic bounds (e.g. `T: Clone`) are parsed but bounds are dropped (only the type parameter name is kept).

## Go

### What maps

| Go                             | typeDiagram            |
| ------------------------------ | ---------------------- |
| `type User struct { ... }`     | `type User { ... }`    |
| `type Shape interface { ... }` | `union Shape { ... }`  |
| `type Email = string`          | `alias Email = String` |
| `string`                       | `String`               |
| `int64`                        | `Int`                  |
| `float64`                      | `Float`                |
| `bool`                         | `Bool`                 |
| `[]T`                          | `List<T>`              |
| `map[K]V`                      | `Map<K,V>`             |
| `*T`                           | `Option<T>`            |

Go doesn't have native sum types. Interfaces are mapped to unions; exported field names are lowercased in the typeDiagram output.

## C#

### What maps

| C#                                        | typeDiagram            |
| ----------------------------------------- | ---------------------- |
| `class User { ... }` / `record User(...)` | `type User { ... }`    |
| `enum Color { ... }`                      | `union Color { ... }`  |
| `using Email = string`                    | `alias Email = String` |

## Programmatic API

```ts
import { converters } from "typediagram-core";

// Parse TypeScript source into a Model
const result = converters.typescript.fromSource(tsCode);
if (result.ok) {
  const model = result.value;

  // Convert to Rust
  const rustCode = converters.rust.toSource(model);

  // Convert to Python
  const pyCode = converters.python.toSource(model);

  // Render to SVG (via typeDiagram DSL)
  const { model: modelLayer } = await import("typediagram");
  const tdSource = modelLayer.printSource(model);
  const svg = await renderToString(tdSource);
}

// Available converters
converters.typescript;
converters.python;
converters.rust;
converters.go;
converters.csharp;
```

Each converter implements the `Converter` interface:

```ts
interface Converter {
  readonly language: Language;
  fromSource(source: string): Result<Model, Diagnostic[]>;
  toSource(model: Model): string;
}
```
