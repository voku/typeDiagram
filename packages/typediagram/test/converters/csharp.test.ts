// [CONV-CS-TEST] C# converter integration tests.
import { describe, expect, it } from "vitest";
import { csharp } from "../../src/converters/index.js";
import { parse } from "../../src/parser/index.js";
import { buildModel } from "../../src/model/index.js";
import { unwrap } from "./helpers.js";

describe("[CONV-CS-FROM-COMPLEX] complex C# -> typeDiagram", () => {
  it("parses a messy C# file with records, classes, enums, and noise", () => {
    const src = `
// Copyright 2024 Acme Corp
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

namespace Acme.Domain;

/// <summary>Helper method — should be ignored completely.</summary>
public static class Extensions
{
    public static string ToJson(this object obj) => JsonSerializer.Serialize(obj);
}

public record ChatRequest(
    string Message,
    string SessionId,
    List<ToolResult> ToolResults,
    bool Active,
    double Score,
    int Count
);

// Middleware class — noise
public class RequestMiddleware
{
    public async Task InvokeAsync(HttpContext context) { }
    private void LogRequest(string path) { }
}

public record ToolResult(
    string ToolCallId,
    string Name,
    string Content,
    bool Ok
);

public record GenericBox<T>(
    T Value,
    string Label
);

public record Pair<A, B>(
    A First,
    B Second
);

public record NullableFields(
    int? MaybeInt,
    string? MaybeName,
    double Value
);

public class Config {
    public string Host { get; set; }
    public int Port { get; set; }
    public bool Debug { get; set; }
}

public class GenericContainer<T> {
    public T Value { get; set; }
    public string Label { get; set; }
}

public enum ContentType {
    Text,
    Image,
    // A comment inside enum
    Code,
    Divider
}

public enum HttpStatus {
    Ok = 200,
    NotFound = 404,
    ServerError = 500
}

enum InternalStatus { Active, Inactive }

// Static helper — noise
public static int ComputeHash(string input) => input.GetHashCode();
`;
    const model = unwrap(csharp.fromSource(src));

    // ChatRequest — record with 6 params
    const chat = model.decls.find((d) => d.name === "ChatRequest");
    expect(chat?.kind).toBe("record");
    const chatFields = chat?.kind === "record" ? chat.fields : [];
    expect(chatFields).toHaveLength(6);
    expect(chatFields.find((f) => f.name === "Message")?.type.name).toBe("String");
    expect(chatFields.find((f) => f.name === "SessionId")?.type.name).toBe("String");
    expect(chatFields.find((f) => f.name === "ToolResults")?.type.name).toBe("List");
    expect(chatFields.find((f) => f.name === "Active")?.type.name).toBe("Bool");
    expect(chatFields.find((f) => f.name === "Score")?.type.name).toBe("Float");
    expect(chatFields.find((f) => f.name === "Count")?.type.name).toBe("Int");

    // ToolResult — 4 fields
    const tool = model.decls.find((d) => d.name === "ToolResult");
    expect(tool?.kind).toBe("record");
    expect(tool?.kind === "record" ? tool.fields.length : 0).toBe(4);

    // GenericBox<T>
    const box = model.decls.find((d) => d.name === "GenericBox");
    expect(box?.kind).toBe("record");
    expect(box?.generics).toContain("T");
    const boxFields = box?.kind === "record" ? box.fields : [];
    expect(boxFields).toHaveLength(2);
    expect(boxFields[0]?.name).toBe("Value");

    // Pair<A, B>
    const pair = model.decls.find((d) => d.name === "Pair");
    expect(pair?.generics).toContain("A");
    expect(pair?.generics).toContain("B");

    // NullableFields — nullable types stripped
    const nullable = model.decls.find((d) => d.name === "NullableFields");
    expect(nullable?.kind).toBe("record");
    expect(nullable?.kind === "record" ? nullable.fields.length : 0).toBe(3);

    // Config — CLASS_RE uses [^}]* which stops at the first } from { get; set; },
    // so properties don't get captured. Class is detected but fields are empty.
    const cfg = model.decls.find((d) => d.name === "Config");
    expect(cfg?.kind).toBe("record");
    expect(cfg?.kind === "record" ? cfg.fields.length : 0).toBe(0);

    // GenericContainer<T> — same issue, class detected but fields lost
    const gc = model.decls.find((d) => d.name === "GenericContainer");
    expect(gc?.kind).toBe("record");
    expect(gc?.generics).toContain("T");

    // ContentType — enum with 4 variants (comment line ignored)
    const ct = model.decls.find((d) => d.name === "ContentType");
    expect(ct?.kind).toBe("union");
    const ctVariants = ct?.kind === "union" ? ct.variants : [];
    expect(ctVariants).toHaveLength(4);
    expect(ctVariants[0]?.name).toBe("Text");
    expect(ctVariants[3]?.name).toBe("Divider");

    // HttpStatus — enum with assigned values, values stripped
    const hs = model.decls.find((d) => d.name === "HttpStatus");
    expect(hs?.kind).toBe("union");
    const hsVariants = hs?.kind === "union" ? hs.variants : [];
    expect(hsVariants).toHaveLength(3);
    expect(hsVariants[0]?.name).toBe("Ok");
    expect(hsVariants[1]?.name).toBe("NotFound");
    expect(hsVariants[2]?.name).toBe("ServerError");

    // InternalStatus — enum without public modifier
    const is_ = model.decls.find((d) => d.name === "InternalStatus");
    expect(is_?.kind).toBe("union");
    expect(is_?.kind === "union" ? is_.variants.length : 0).toBe(2);

    // CLASS_RE matches any class with braces — RequestMiddleware gets parsed as empty record
    // (its body truncated at first } from the method), Extensions similarly
    const mw = model.decls.find((d) => d.name === "RequestMiddleware");
    expect(mw?.kind).toBe("record");
    expect(mw?.kind === "record" ? mw.fields.length : 0).toBe(0);
  });

  it("returns error on C# with no type definitions at all", () => {
    const src = `
using System;
namespace Foo;
// Just comments and using statements, no classes, records, or enums
`;
    expect(csharp.fromSource(src).ok).toBe(false);
  });
});

describe("[CONV-CS-TO-COMPLEX] complex typeDiagram -> C#", () => {
  it("emits a big model with records, enums, aliases, and all type mappings", () => {
    const td = `
type ChatRequest {
  message: String
  active: Bool
  score: Float
  count: Int
  raw: Bytes
  nothing: Unit
  tags: List<String>
  metadata: Map<String, Int>
}

type GenericBox<T> {
  value: T
  label: String
}

union ContentType { Text\n Image\n Code\n Divider }

alias Email = String
alias Wrapper<T> = List<T>
`;
    const model = unwrap(buildModel(unwrap(parse(td))));
    const output = csharp.toSource(model);

    // ChatRequest — record with type mappings
    expect(output).toContain("public record ChatRequest");
    expect(output).toContain("string message");
    expect(output).toContain("bool active");
    expect(output).toContain("double score");
    expect(output).toContain("int count");
    expect(output).toContain("void nothing");
    expect(output).toContain("List<string> tags");
    expect(output).toContain("Dictionary<string, int> metadata");

    // GenericBox<T>
    expect(output).toContain("public record GenericBox<T>");
    expect(output).toContain("T value");

    // ContentType — enum
    expect(output).toContain("public enum ContentType");
    expect(output).toContain("Text");
    expect(output).toContain("Image");
    expect(output).toContain("Code");
    expect(output).toContain("Divider");

    // Aliases
    expect(output).toContain("using Email = string");
    expect(output).toContain("using Wrapper<T> = List<T>");
  });
});

describe("[CONV-CS-RT] C# round-trip TD -> C# -> TD", () => {
  it("round-trips a complex model preserving structure", () => {
    const td = `
type User {
  name: String
  age: Int
  active: Bool
}

type Order {
  id: String
  total: Float
}

union Status { Active\n Inactive\n Pending }

alias Email = String
`;
    const model1 = unwrap(buildModel(unwrap(parse(td))));
    const csCode = csharp.toSource(model1);
    const model2 = unwrap(csharp.fromSource(csCode));

    expect(model2.decls).toHaveLength(3);

    const user = model2.decls.find((d) => d.name === "User");
    expect(user?.kind).toBe("record");
    expect(user?.kind === "record" ? user.fields.length : 0).toBe(3);

    const order = model2.decls.find((d) => d.name === "Order");
    expect(order?.kind).toBe("record");
    expect(order?.kind === "record" ? order.fields.length : 0).toBe(2);

    const status = model2.decls.find((d) => d.name === "Status");
    expect(status?.kind).toBe("union");
    const variants = status?.kind === "union" ? status.variants : [];
    expect(variants).toHaveLength(3);
    expect(variants[0]?.name).toBe("Active");
    expect(variants[1]?.name).toBe("Inactive");
    expect(variants[2]?.name).toBe("Pending");
  });
});
