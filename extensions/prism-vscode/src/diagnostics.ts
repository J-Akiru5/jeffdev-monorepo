import * as vscode from "vscode";
import { McpClient } from "./mcpClient";

const diagnosticCollection =
  vscode.languages.createDiagnosticCollection("prism");

export function registerDiagnostics(client: McpClient): vscode.Disposable {
  const saveDisposable = vscode.workspace.onDidSaveTextDocument(
    async (document) => {
      if (!client.isConnected) return;

      const config = vscode.workspace.getConfiguration("prism");
      if (!config.get<boolean>("checkOnSave", true)) return;

      const code = document.getText();
      const filePath = vscode.workspace.asRelativePath(document.uri);

      try {
        const result = await client.checkCode(code, filePath);

        if (result.status === "fail" && result.violations.length > 0) {
          const diagnostics: vscode.Diagnostic[] = [];

          for (const v of result.violations) {
            const startLine = Math.max(0, v.line - 1);
            const endLine = Math.max(startLine, v.endLine - 1);
            const range = new vscode.Range(
              startLine,
              Math.max(0, v.column - 1),
              endLine,
              Math.max(0, v.endColumn - 1),
            );

            const severity =
              v.severity === "error"
                ? vscode.DiagnosticSeverity.Error
                : v.severity === "warning"
                  ? vscode.DiagnosticSeverity.Warning
                  : vscode.DiagnosticSeverity.Information;

            const diag = new vscode.Diagnostic(range, v.message, severity);
            diag.source = "prism";
            diag.code = {
              value: v.ruleId,
              target: vscode.Uri.parse(
                `command:prism.showRuleDetail?${encodeURIComponent(JSON.stringify({ ruleId: v.ruleId, ruleName: v.ruleName }))}`,
              ),
            };
            diagnostics.push(diag);
          }

          diagnosticCollection.set(document.uri, diagnostics);
        } else {
          diagnosticCollection.delete(document.uri);
        }
      } catch {
        // silent
      }
    },
  );

  const codeActionDisposable = vscode.languages.registerCodeActionsProvider(
    { pattern: "**/*" },
    new PrismFixCodeActionProvider(client),
    { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] },
  );

  return vscode.Disposable.from(saveDisposable, codeActionDisposable);
}

class PrismFixCodeActionProvider implements vscode.CodeActionProvider {
  constructor(private client: McpClient) {}

  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken,
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diag of context.diagnostics) {
      if (
        diag.source !== "prism" ||
        !diag.code ||
        typeof diag.code === "string"
      )
        continue;

      const ruleId = (diag.code as { value: string }).value;
      const code = document.getText();
      const codeLines = code.split("\n");

      const fixAction = new vscode.CodeAction(
        `Fix: ${diag.message.slice(0, 60)}`,
        vscode.CodeActionKind.QuickFix,
      );
      fixAction.isPreferred = true;
      fixAction.diagnostics = [diag];

      fixAction.command = {
        title: "Apply Prism Fix",
        command: "prism.applyFix",
        arguments: [
          {
            ruleId,
            ruleName: (diag.code as { value: string; target?: vscode.Uri })
              .value,
            line: diag.range.start.line + 1,
            column: diag.range.start.character + 1,
            endLine: diag.range.end.line + 1,
            endColumn: diag.range.end.character + 1,
            matchedText: code.slice(
              code.indexOf(codeLines[diag.range.start.line]) +
                diag.range.start.character,
              code.indexOf(codeLines[diag.range.end.line]) +
                diag.range.end.character,
            ),
            message: diag.message,
            severity:
              diag.severity === vscode.DiagnosticSeverity.Error
                ? "error"
                : "warning",
          },
          document.uri.toString(),
        ],
      };

      actions.push(fixAction);
    }

    return actions;
  }
}

export function clearDiagnostics(): void {
  diagnosticCollection.clear();
}
