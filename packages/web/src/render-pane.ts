// [WEB-RENDER-PANE] Pure function: source -> HTML string for the preview div.
// Lazy-loads `typediagram` so the main chunk stays free of framework + ELK weight.

const getTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? ("dark" as const) : ("light" as const);

export const renderPane = async (source: string): Promise<string> => {
  const { parser, renderToString } = await import("typediagram-core");
  const result = await renderToString(source, { theme: getTheme() });
  return result.ok ? result.value : diagnosticsHtml(parser.formatDiagnostics([...result.error]));
};

const diagnosticsHtml = (text: string): string => {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<pre class="diag">${escaped}</pre>`;
};
