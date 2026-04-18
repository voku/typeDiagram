// [WEB-CONV-SAMPLES] Converter page samples stay in sync with supported conversions.
import { describe, expect, it } from "vitest";
import { converters, model, parser } from "typediagram-core";
import type { SupportedLang } from "../src/converter-render.js";
import { SAMPLES, TD_SAMPLE } from "../src/converter.js";

const BASE_EXPECTED = ["ChatRequest", "ChatTurnInput", "ToolResult", "TextPart", "UriPart"] as const;
const UNION_EXPECTED = [...BASE_EXPECTED, "ContentItem", "UriKind"] as const;

const EXPECTED_BY_LANG: Record<SupportedLang, readonly string[]> = {
  typescript: UNION_EXPECTED,
  rust: UNION_EXPECTED,
  python: [...BASE_EXPECTED, "UriKind"],
  go: UNION_EXPECTED,
  csharp: UNION_EXPECTED,
  fsharp: UNION_EXPECTED,
  php: UNION_EXPECTED,
};

const assertDeclNames = (names: readonly string[], expected: readonly string[]) => {
  expect([...names].sort()).toEqual([...expected].sort());
};

describe("[WEB-CONV-SAMPLES] converter page seed content", () => {
  it("keeps the typediagram sample parseable", () => {
    const parsed = parser.parse(TD_SAMPLE);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      expect.fail(JSON.stringify(parsed.error));
    }

    const built = model.buildModel(parsed.value);
    expect(built.ok).toBe(true);
    if (!built.ok) {
      expect.fail(JSON.stringify(built.error));
    }

    assertDeclNames(
      built.value.decls.map((decl) => decl.name),
      EXPECTED_BY_LANG.typescript
    );
  });

  for (const [lang, source] of Object.entries(SAMPLES) as [SupportedLang, string][]) {
    it(`keeps the ${lang} sample convertible`, () => {
      const converted = converters[lang].fromSource(source);
      expect(converted.ok).toBe(true);
      if (!converted.ok) {
        expect.fail(JSON.stringify(converted.error));
      }

      assertDeclNames(
        converted.value.decls.map((decl) => decl.name),
        EXPECTED_BY_LANG[lang]
      );

      const reParsed = parser.parse(model.printSource(converted.value));
      expect(reParsed.ok).toBe(true);
    });
  }
});
