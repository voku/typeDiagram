// [WEB-CONV-SAMPLES] Converter page samples stay in sync with supported conversions.
import { describe, expect, it } from "vitest";
import { converters, model, parser } from "typediagram-core";
import type { SupportedLang } from "../src/converter-render.js";
import { SAMPLES, TD_SAMPLE } from "../src/converter.js";

const EXPECTED_BY_LANG: Record<SupportedLang, readonly string[]> = {
  typescript: ["ChatRequest", "ChatTurnInput", "ToolResult", "TextPart", "UriPart", "ContentItem", "UriKind"],
  rust: ["ChatRequest", "ChatTurnInput", "ToolResult", "TextPart", "UriPart", "ContentItem", "UriKind"],
  python: ["ChatRequest", "ChatTurnInput", "ToolResult", "TextPart", "UriPart", "UriKind"],
  go: ["ChatRequest", "ChatTurnInput", "ToolResult", "TextPart", "UriPart", "ContentItem", "UriKind"],
  csharp: ["ChatRequest", "ChatTurnInput", "ToolResult", "TextPart", "UriPart", "ContentItem", "UriKind"],
  fsharp: ["ChatRequest", "ChatTurnInput", "ToolResult", "TextPart", "UriPart", "ContentItem", "UriKind"],
  php: ["ChatRequest", "ChatTurnInput", "ToolResult", "TextPart", "UriPart", "ContentItem", "UriKind"],
};

const assertDeclNames = (names: readonly string[], expected: readonly string[]) => {
  for (const decl of expected) {
    expect(names).toContain(decl);
  }
};

describe("[WEB-CONV-SAMPLES] converter page seed content", () => {
  it("keeps the typediagram sample parseable", () => {
    const parsed = parser.parse(TD_SAMPLE);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const built = model.buildModel(parsed.value);
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }

    assertDeclNames(built.value.decls.map((decl) => decl.name), EXPECTED_BY_LANG.typescript);
  });

  for (const [lang, source] of Object.entries(SAMPLES) as [SupportedLang, string][]) {
    it(`keeps the ${lang} sample convertible`, () => {
      const converted = converters[lang].fromSource(source);
      expect(converted.ok).toBe(true);
      if (!converted.ok) {
        return;
      }

      assertDeclNames(converted.value.decls.map((decl) => decl.name), EXPECTED_BY_LANG[lang]);

      const reParsed = parser.parse(model.printSource(converted.value));
      expect(reParsed.ok).toBe(true);
    });
  }
});
