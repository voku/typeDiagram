# typeDiagram

**Type-safe diagrams from plain text.** Define records, tagged unions, and aliases in a tiny DSL — get beautiful, auto-laid-out SVG diagrams instantly. Round-trip between the DSL and TypeScript, Python, Rust, Go, and C#.

## 🚀 Try it live — no install

**→ [typediagram.dev](https://typediagram.dev)**

The full thing runs in your browser. Playground, converter, docs — all live. Paste a schema, get a diagram. Paste TypeScript, get a diagram. Export SVG. Done.

## Install

```sh
# CLI
npm install -g typediagram

# Library
npm install typediagram-core

# VS Code extension
# search "TypeDiagram" by nimblesite in the Marketplace
```

## The language

```
typeDiagram

type User {
  id:    UUID
  name:  String
  email: Option<Email>
}

union Option<T> {
  Some { value: T }
  None
}

alias Email = String
```

Three constructs: `type` (records), `union` (tagged sum types), `alias` (newtypes). Generics with `<T>`. Comments with `#`.

## CLI

```sh
typediagram schema.td > diagram.svg          # DSL → SVG
typediagram --from typescript types.ts > diagram.svg   # TS → SVG
typediagram --to rust schema.td > types.rs    # DSL → Rust
```

Full reference at [typediagram.dev/docs/](https://typediagram.dev/docs/).

## Monorepo layout

| Package                                        | What                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| [packages/typediagram/](packages/typediagram/) | Core framework: parser, model, layout, render-svg, converters           |
| [packages/cli/](packages/cli/)                 | `typediagram` CLI binary                                                |
| [packages/web/](packages/web/)                 | Web playground + docs site ([typediagram.dev](https://typediagram.dev)) |
| [packages/vscode/](packages/vscode/)           | VS Code extension                                                       |

## Contributing

```sh
make setup   # install deps + build framework
make dev     # web playground at localhost:5173
make test    # run all tests (fail-fast + coverage)
make ci      # full CI simulation
```

MIT © [Nimblesite](https://nimblesite.co)
