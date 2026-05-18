import * as vscode from 'vscode';
import { McpClient, Rule } from './mcpClient';
import { PrismStatusBar } from './statusBar';
import { RuleTreeProvider } from './treeProvider';
import { registerDiagnostics, clearDiagnostics } from './diagnostics';

let client: McpClient;
let statusBar: PrismStatusBar;
let treeProvider: RuleTreeProvider;

export function activate(context: vscode.ExtensionContext): void {
  client = new McpClient();
  statusBar = new PrismStatusBar();
  treeProvider = new RuleTreeProvider();

  const config = vscode.workspace.getConfiguration('prism');

  vscode.window.registerTreeDataProvider('prism-rules', treeProvider);

  context.subscriptions.push(
    statusBar,
    vscode.commands.registerCommand('prism.connect', connect),
    vscode.commands.registerCommand('prism.disconnect', disconnect),
    vscode.commands.registerCommand('prism.showRules', showRules),
    vscode.commands.registerCommand('prism.refreshRules', refreshRules),
    vscode.commands.registerCommand('prism.login', login),
    registerDiagnostics(client),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('prism')) {
        if (config.get<boolean>('autoConnect', true)) {
          connect();
        }
      }
    })
  );

  client.onRulesChanged = () => {
    if (!client.isConnected) {
      statusBar.setDisconnected();
      treeProvider.refresh([]);
    }
  };

  if (config.get<boolean>('autoConnect', true)) {
    connect();
  }
}

export function deactivate(): void {
  clearDiagnostics();
  client?.disconnect();
}

async function connect(): Promise<void> {
  const config = vscode.workspace.getConfiguration('prism');
  let token = config.get<string>('token') || process.env.PRISM_TOKEN || '';
  const apiUrl = config.get<string>('apiUrl') || 'https://prism.jeffdev.studio';

  if (!token) {
    const input = await vscode.window.showInputBox({
      prompt: 'Enter your Prism API token',
      password: true,
      placeHolder: 'Get your token at prism.jeffdev.studio/settings',
      ignoreFocusOut: true,
    });
    if (!input) return;
    token = input;
    await config.update('token', token, vscode.ConfigurationTarget.Global);
  }

  try {
    await client.connect(token, apiUrl);
    statusBar.setConnected(0);

    const rules = await client.getArchitecturalRules();
    treeProvider.refresh(rules);
    statusBar.setConnected(rules.length);

    vscode.window.showInformationMessage(
      `Prism connected — ${rules.length} rules active`
    );
  } catch (error) {
    statusBar.setError(`Connection failed: ${error}`);
    vscode.window.showErrorMessage(
      `Prism connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function disconnect(): Promise<void> {
  client.disconnect();
  statusBar.setDisconnected();
  treeProvider.refresh([]);
  clearDiagnostics();
  vscode.window.showInformationMessage('Prism disconnected');
}

async function showRules(): Promise<void> {
  if (!client.isConnected) {
    const action = await vscode.window.showWarningMessage(
      'Prism is not connected.',
      'Connect'
    );
    if (action === 'Connect') await connect();
    return;
  }

  const rules = await client.getArchitecturalRules();
  const panel = vscode.window.createWebviewPanel(
    'prismRules',
    'Prism Rules',
    vscode.ViewColumn.One,
    {}
  );

  panel.webview.html = `<!DOCTYPE html>
<html>
<head><style>
  body { font-family: system-ui; padding: 1rem; }
  .rule { border-left: 3px solid #06b6d4; padding: 0.5rem 1rem; margin: 1rem 0; }
  .category { color: #06b6d4; font-size: 0.8rem; text-transform: uppercase; }
  h2 { margin: 0 0 0.25rem 0; }
</style></head>
<body>
  <h1>Prism Rules (${rules.length})</h1>
  ${rules.map(r => `
    <div class="rule">
      <div class="category">${r.category}</div>
      <h2>${r.name}</h2>
      <pre>${r.content.slice(0, 300)}${r.content.length > 300 ? '...' : ''}</pre>
    </div>
  `).join('')}
</body></html>`;
}

async function refreshRules(): Promise<void> {
  if (!client.isConnected) return;
  const rules = await client.getArchitecturalRules();
  treeProvider.refresh(rules);
  statusBar.setConnected(rules.length);
  vscode.window.showInformationMessage(`Prism: ${rules.length} rules loaded`);
}

async function login(): Promise<void> {
  const terminal = vscode.window.createTerminal('Prism Login');
  terminal.show();
  terminal.sendText('npx @prism-engine/cli login');
}
