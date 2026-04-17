export type ThemeName = "light" | "dark";

export interface Theme {
  bg: string;
  nodeFill: string;
  nodeStroke: string;
  headerFill: string;
  headerText: string;
  /** [RENDER-UNION-ONEOF] Distinct fill for union headers. */
  unionHeaderFill: string;
  /** [RENDER-UNION-ONEOF] "one of" badge text color. */
  unionBadgeText: string;
  rowText: string;
  rowDivider: string;
  edgeStroke: string;
  edgeText: string;
  unionAccent: string;
  aliasAccent: string;
  recordAccent: string;
  fontFamily: string;
}

export const LIGHT: Theme = {
  bg: "#ffffff",
  nodeFill: "#ffffff",
  nodeStroke: "#3b3f46",
  headerFill: "#eef1f5",
  headerText: "#1a1d22",
  unionHeaderFill: "#f3eefa",
  unionBadgeText: "#7a4cc7",
  rowText: "#1a1d22",
  rowDivider: "#dadde2",
  edgeStroke: "#5b6068",
  edgeText: "#3b3f46",
  unionAccent: "#7a4cc7",
  aliasAccent: "#0a7a5e",
  recordAccent: "#1f6feb",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

export const DARK: Theme = {
  bg: "#1c1f24",
  nodeFill: "#252931",
  nodeStroke: "#9da3ac",
  headerFill: "#2f343d",
  headerText: "#f1f3f6",
  unionHeaderFill: "#2d2640",
  unionBadgeText: "#b48cf2",
  rowText: "#e4e7ea",
  rowDivider: "#3b3f46",
  edgeStroke: "#a8aeb6",
  edgeText: "#d4d7dc",
  unionAccent: "#b48cf2",
  aliasAccent: "#4cd1a6",
  recordAccent: "#79b8ff",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

export function getTheme(name: ThemeName): Theme {
  return name === "dark" ? DARK : LIGHT;
}
