import type { EdgeRoute, LaidOutGraph, NodeBox } from "../layout/types.js";
import { escapeText, raw, svg, type SafeSvg } from "./svg-tag.js";
import { getTheme, type Theme, type ThemeName } from "./theme.js";

export interface SvgOpts {
  theme?: ThemeName;
  fontSize?: number;
  /** Outer padding around the diagram. */
  padding?: number;
}

const DEFAULT_FONT_SIZE = 13;
const DEFAULT_PADDING = 16;

export function renderSvg(graph: LaidOutGraph, opts: SvgOpts = {}): string {
  const theme = getTheme(opts.theme ?? "light");
  const fontSize = opts.fontSize ?? DEFAULT_FONT_SIZE;
  const pad = opts.padding ?? DEFAULT_PADDING;

  const w = Math.max(1, Math.ceil(graph.width + pad * 2));
  const h = Math.max(1, Math.ceil(graph.height + pad * 2));

  const defs = renderDefs(theme);
  const nodes = raw(graph.nodes.map((n) => renderNode(n, theme, fontSize, pad).value).join("\n"));
  const edges = raw(graph.edges.map((e) => renderEdge(e, theme, fontSize, pad).value).join("\n"));

  return svg`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="${theme.fontFamily}" font-size="${fontSize}">
${defs}
<rect x="0" y="0" width="${w}" height="${h}" fill="none"/>
${nodes}
${edges}
</svg>`.value;
}

function renderDefs(theme: Theme): SafeSvg {
  return svg`<defs>
  <marker id="td-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="${theme.edgeStroke}"/>
  </marker>
</defs>`;
}

function accentFor(declKind: NodeBox["declKind"], theme: Theme): string {
  return declKind === "union" ? theme.unionAccent : declKind === "alias" ? theme.aliasAccent : theme.recordAccent;
}

/** [RENDER-UNION-ONEOF] Height of the "one of" badge below union headers. */
const UNION_BADGE_H = 16;

function renderRows(n: NodeBox, isUnion: boolean, theme: Theme, fontSize: number, x: number, y: number): SafeSvg {
  return raw(
    n.rows
      .map((r) => {
        const ry = y + r.y;
        const dashAttr = isUnion ? raw(` stroke-dasharray="4 3"`) : raw("");
        const divider = svg`<line x1="${x}" y1="${ry}" x2="${x + n.width}" y2="${ry}" stroke="${theme.rowDivider}" stroke-width="1"${dashAttr}/>`;
        const textY = ry + r.height / 2 + fontSize * 0.35;
        const prefix = isUnion ? "\u25c7 " : "";
        const text = svg`<text x="${x + 10}" y="${textY}" fill="${theme.rowText}">${raw(escapeText(prefix + r.text))}</text>`;
        return `${divider.value}\n${text.value}`;
      })
      .join("\n")
  );
}

function renderUnionBadge(
  x: number,
  headerBottom: number,
  badgeH: number,
  width: number,
  theme: Theme,
  fontSize: number
): SafeSvg {
  const badgeY = headerBottom + badgeH / 2 + fontSize * 0.2;
  const badgeFontSize = Math.round(fontSize * 0.7);
  return svg`<text x="${x + width / 2}" y="${badgeY}" fill="${theme.unionBadgeText}" font-size="${badgeFontSize}" font-weight="700" text-anchor="middle" font-style="italic" letter-spacing="0.08em">ONE OF</text>
  <line x1="${x}" y1="${headerBottom + badgeH}" x2="${x + width}" y2="${headerBottom + badgeH}" stroke="${theme.rowDivider}" stroke-width="1"/>`;
}

function renderNode(n: NodeBox, theme: Theme, fontSize: number, pad: number): SafeSvg {
  const x = n.x + pad;
  const y = n.y + pad;
  const accent = accentFor(n.declKind, theme);
  const isUnion = n.declKind === "union";

  /** Header height is the area above the first row (or full node if no rows). */
  const firstRowY = n.rows[0]?.y ?? n.height;
  /** For unions, the name header is smaller — the badge occupies the rest. */
  const nameHeaderH = isUnion ? firstRowY - UNION_BADGE_H : firstRowY;
  const headerFill = isUnion ? theme.unionHeaderFill : theme.headerFill;

  const rows = renderRows(n, isUnion, theme, fontSize, x, y);

  const headerY = y + nameHeaderH / 2 + fontSize * 0.35;

  const badge = isUnion ? renderUnionBadge(x, y + nameHeaderH, UNION_BADGE_H, n.width, theme, fontSize) : raw("");

  return svg`<g data-decl="${n.declName}" data-kind="${n.declKind}">
  <rect x="${x}" y="${y}" width="${n.width}" height="${n.height}" rx="6" ry="6" fill="${theme.nodeFill}" stroke="${theme.nodeStroke}" stroke-width="1"/>
  <rect x="${x}" y="${y}" width="${n.width}" height="${firstRowY}" rx="6" ry="6" fill="${headerFill}" stroke="none"/>
  <rect x="${x}" y="${y + firstRowY - 6}" width="${n.width}" height="6" fill="${headerFill}" stroke="none"/>
  <line x1="${x}" y1="${y + firstRowY}" x2="${x + n.width}" y2="${y + firstRowY}" stroke="${theme.nodeStroke}" stroke-width="1"/>
  <rect x="${x}" y="${y}" width="4" height="${n.height}" rx="2" ry="2" fill="${accent}"/>
  <text x="${x + 10}" y="${headerY}" fill="${theme.headerText}" font-weight="600">${raw(escapeText(n.header))}</text>
  ${badge}
  ${rows}
</g>`;
}

function renderEdge(e: EdgeRoute, theme: Theme, fontSize: number, pad: number): SafeSvg {
  const empty = raw("");
  if (e.points.length < 2) {
    return empty;
  }
  const points = e.points.map((p) => `${String(p.x + pad)},${String(p.y + pad)}`).join(" ");
  const dash = e.kind === "genericArg" ? raw(`stroke-dasharray="3 3"`) : empty;
  const polyline = svg`<polyline points="${points}" fill="none" stroke="${theme.edgeStroke}" stroke-width="${e.kind === "genericArg" ? 1 : 1.5}" marker-end="url(#td-arrow)" ${dash}/>`;

  const label =
    e.label === ""
      ? empty
      : (() => {
          const mid = midpoint(e.points);
          return svg`<text x="${mid.x + pad}" y="${mid.y + pad - 4}" fill="${theme.edgeText}" font-size="${Math.round(fontSize * 0.85)}" text-anchor="middle">${raw(escapeText(e.label))}</text>`;
        })();

  return raw(`${polyline.value}\n${label.value}`);
}

function midpoint(points: ReadonlyArray<{ x: number; y: number }>): { x: number; y: number } {
  if (points.length === 2) {
    const [a, b] = points;
    if (a !== undefined && b !== undefined) {
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
  }
  const mid = Math.floor(points.length / 2);
  const prev = points[mid - 1];
  const next = points[mid];
  if (prev === undefined || next === undefined) {
    return { x: 0, y: 0 };
  }
  return { x: (prev.x + next.x) / 2, y: (prev.y + next.y) / 2 };
}
