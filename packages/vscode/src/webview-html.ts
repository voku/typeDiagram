// [VSCODE-WEBVIEW-HTML] Generates the HTML shell for the preview webview.
import type * as vscode from "vscode";

export const webviewHtml = (cspSource: string, scriptUri: vscode.Uri, initialSource: string) => {
  const escaped = initialSource
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; script-src ${cspSource}; style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 16px; background: var(--vscode-editor-background); overflow: auto; }
    #preview svg { max-width: 100%; height: auto; }
    #error { color: var(--vscode-errorForeground); font-family: var(--vscode-editor-font-family); white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="preview"></div>
  <pre id="error"></pre>
  <script data-source="${escaped}" src="${scriptUri.toString()}"></script>
</body>
</html>`;
};
