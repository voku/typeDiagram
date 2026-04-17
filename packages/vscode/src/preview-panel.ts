// [VSCODE-PREVIEW-PANEL] Creates/reveals a webview panel for a .td document.
import * as vscode from "vscode";
import { webviewHtml } from "./webview-html.js";

export const openPreview = (
  context: vscode.ExtensionContext,
  doc: vscode.TextDocument,
  panels: Map<string, vscode.WebviewPanel>,
  column: vscode.ViewColumn = vscode.ViewColumn.Beside
) => {
  const key = doc.uri.toString();
  const existing = panels.get(key);
  if (existing) {
    existing.reveal(column);
    return;
  }

  const panel = vscode.window.createWebviewPanel("typediagram.preview", `Preview: ${fileName(doc)}`, column, {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "dist", "webview")],
  });

  const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "dist", "webview", "main.js"));

  panel.webview.html = webviewHtml(panel.webview.cspSource, scriptUri, doc.getText());

  panel.onDidDispose(() => panels.delete(key));
  panels.set(key, panel);
};

const fileName = (doc: vscode.TextDocument) => doc.uri.path.split("/").pop() ?? "untitled.td";
