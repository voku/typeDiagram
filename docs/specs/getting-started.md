# Getting Started

typeDiagram is a tiny, language-neutral DSL for diagramming **records**, **tagged unions**, and **generics**. Write plain text, get auto-laid-out SVG diagrams.

## Quick start

### Web playground

The fastest way to try typeDiagram is the [web playground](/#playground). Type on the left, see your diagram on the right — updates instantly.

### VS Code extension

Install the `.vsix` for syntax highlighting of `.td` files:

```sh
make vsix-install
```

This gives you keyword highlighting, bracket matching, and comment support in VS Code.

### CLI

Install and run from the command line:

```sh
# From typeDiagram source
echo 'type User { name: String }' | typediagram > diagram.svg

# From a file
typediagram schema.td > diagram.svg

# From existing TypeScript/Python/Rust/Go/C# code
typediagram --from typescript types.ts > diagram.svg
```

## Your first diagram

Create a file called `schema.td`:

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

Render it:

```sh
typediagram schema.td > diagram.svg
open diagram.svg
```

You'll see three connected boxes: `User` links to `Option<T>` (via the `email` field) and to `Email` (via the generic argument). The layout is automatic — orthogonal edges, no overlapping nodes.

## What's in the box

| Tool                  | What it does                                                          |
| --------------------- | --------------------------------------------------------------------- |
| **Web playground**    | Browser-based editor with syntax highlighting, live preview, pan/zoom |
| **CLI**               | `typediagram` binary — pipe source in, SVG out                        |
| **VS Code extension** | TextMate grammar for `.td` syntax highlighting                        |
| **Converters**        | Bidirectional: TypeScript, Python, Rust, Go, C# ↔ typeDiagram         |
| **Node.js API**       | `renderToString()`, `parse()`, converter APIs for programmatic use    |
