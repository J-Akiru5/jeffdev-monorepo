import * as vscode from 'vscode';
import { McpClient } from './mcpClient';

const diagnosticCollection = vscode.languages.createDiagnosticCollection('prism');

export function registerDiagnostics(client: McpClient): vscode.Disposable {
  return vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (!client.isConnected) return;

    const config = vscode.workspace.getConfiguration('prism');
    if (!config.get<boolean>('checkOnSave', true)) return;

    const code = document.getText();
    const filePath = vscode.workspace.asRelativePath(document.uri);

    try {
      const result = await client.validateCode(code, filePath);

      if (result.includes('❌') || result.includes('⚠️')) {
        const lines = result.split('\n').filter(l => l.includes('**'));
        const diagnostics: vscode.Diagnostic[] = [];

        for (const line of lines) {
          const isError = line.includes('❌');
          const diag = new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 1),
            line.replace(/^[❌⚠️ℹ️]\s*\*{1,2}/, '').replace(/\*{1,2}/g, '').trim(),
            isError ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
          );
          diag.source = 'prism';
          diagnostics.push(diag);
        }

        diagnosticCollection.set(document.uri, diagnostics);
      } else {
        diagnosticCollection.delete(document.uri);
      }
    } catch {
      // silent
    }
  });
}

export function clearDiagnostics(): void {
  diagnosticCollection.clear();
}
