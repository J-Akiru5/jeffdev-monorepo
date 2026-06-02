import * as vscode from "vscode";
import { McpClient, Rule } from "./mcpClient";
import { PrismStatusBar } from "./statusBar";
import { DashboardTreeProvider } from "./treeProvider";
import { registerDiagnostics, clearDiagnostics } from "./diagnostics";

let client: McpClient;
let statusBar: PrismStatusBar;
let treeProvider: DashboardTreeProvider;

export function activate(context: vscode.ExtensionContext): void {
  client = new McpClient();
  statusBar = new PrismStatusBar();
  treeProvider = new DashboardTreeProvider();

  const config = vscode.workspace.getConfiguration("prism");

  vscode.window.registerTreeDataProvider("prism-rules", treeProvider);

  context.subscriptions.push(
    statusBar,
    vscode.commands.registerCommand("prism.connect", connect),
    vscode.commands.registerCommand("prism.disconnect", disconnect),
    vscode.commands.registerCommand("prism.showRules", showRules),
    vscode.commands.registerCommand("prism.refreshRules", refreshRules),
    vscode.commands.registerCommand("prism.login", login),
    vscode.commands.registerCommand("prism.createRule", createRule),
    vscode.commands.registerCommand("prism.deleteRule", deleteRule),
    vscode.commands.registerCommand("prism.createProject", createProject),
    vscode.commands.registerCommand("prism.listProjects", listProjects),
    vscode.commands.registerCommand("prism.deleteProject", deleteProject),
    vscode.commands.registerCommand("prism.createBrand", createBrand),
    vscode.commands.registerCommand("prism.listBrands", listBrands),
    vscode.commands.registerCommand("prism.exportBrand", exportBrand),
    vscode.commands.registerCommand("prism.deleteBrand", deleteBrand),
    vscode.commands.registerCommand("prism.generate", generate),
    vscode.commands.registerCommand("prism.marketplace", marketplace),
    vscode.commands.registerCommand("prism.showAnalytics", showAnalytics),
    vscode.commands.registerCommand("prism.manageApiKeys", manageApiKeys),
    vscode.commands.registerCommand("prism.refreshTree", refreshAll),
    vscode.commands.registerCommand("prism.applyFix", applyFix),
    vscode.commands.registerCommand("prism.showRuleDetail", showRuleDetail),
    registerDiagnostics(client),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("prism") &&
        config.get<boolean>("autoConnect", true)
      ) {
        connect();
      }
    }),
  );

  client.onRulesChanged = () => {
    if (!client.isConnected) {
      statusBar.setDisconnected();
      treeProvider.refresh({
        projects: [],
        brands: [],
        components: [],
        rules: [],
      });
    }
  };

  if (config.get<boolean>("autoConnect", true)) {
    connect();
  }
}

export function deactivate(): void {
  clearDiagnostics();
  client?.disconnect();
}

function getConfig() {
  const config = vscode.workspace.getConfiguration("prism");
  return {
    token: config.get<string>("token") || process.env.PRISM_TOKEN || "",
    apiUrl: config.get<string>("apiUrl") || "https://prism.syntaxure.dev",
  };
}

async function apiGet<T>(path: string): Promise<T | null> {
  const { token, apiUrl } = getConfig();
  try {
    const res = await fetch(`${apiUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}

async function apiPost(
  path: string,
  body: unknown,
): Promise<{ error?: string } | null> {
  const { token, apiUrl } = getConfig();
  try {
    const res = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch {
    return null;
  }
}

async function apiDelete(path: string): Promise<boolean> {
  const { token, apiUrl } = getConfig();
  try {
    const res = await fetch(`${apiUrl}${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}    // === Connection ===

async function connect(): Promise<void> {
  const config = vscode.workspace.getConfiguration("prism");
  let token = config.get<string>("token") || process.env.PRISM_TOKEN || "";
  const apiUrl = config.get<string>("apiUrl") || "https://prism.syntaxure.dev";

  if (!token) {
    const input = await vscode.window.showInputBox({
      prompt: "Enter your Prism API token",
      password: true,
      placeHolder: "Get your token at prism.syntaxure.dev/settings",
      ignoreFocusOut: true,
    });
    if (!input) return;
    token = input;
    await config.update("token", token, vscode.ConfigurationTarget.Global);
  }

  try {
    await client.connect(token, apiUrl);
    statusBar.setConnected(0);
    await refreshAllData();
    vscode.window.showInformationMessage("Prism connected");
  } catch (error) {
    statusBar.setError(`Connection failed: ${error}`);
    vscode.window.showErrorMessage(
      `Prism connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

async function disconnect(): Promise<void> {
  client.disconnect();
  statusBar.setDisconnected();
  treeProvider.refresh({ projects: [], brands: [], components: [], rules: [] });
  clearDiagnostics();
  vscode.window.showInformationMessage("Prism disconnected");
}

async function refreshAllData() {
  const [projects, brands, components, rules] = await Promise.all([
    apiGet<
      Array<{ id: string; name: string; slug: string; ruleCount: number }>
    >("/api/v1/projects"),
    apiGet<Array<{ id: string; slug: string; companyName: string }>>(
      "/api/v1/brands",
    ),
    apiGet<Array<{ id: string; name: string }>>("/api/v1/components"),
    client.isConnected
      ? client.getArchitecturalRules()
      : Promise.resolve([] as Rule[]),
  ]);
  treeProvider.refresh({
    projects: (projects || []).map((p) => ({ ...p, type: "project" as const })),
    brands: (brands || []).map((b) => ({ ...b, type: "brand" as const })),
    components: (components || []).map((c) => ({
      ...c,
      type: "component" as const,
    })),
    rules: rules || [],
  });
  statusBar.setConnected((rules || []).length);
}

async function refreshAll() {
  await refreshAllData();
}

// === Rules ===

async function showRules(): Promise<void> {
  if (!client.isConnected) {
    const action = await vscode.window.showWarningMessage(
      "Prism is not connected.",
      "Connect",
    );
    if (action === "Connect") await connect();
    return;
  }
  const rules = await client.getArchitecturalRules();
  const panel = vscode.window.createWebviewPanel(
    "prismRules",
    "Prism Rules",
    vscode.ViewColumn.One,
    {},
  );
  panel.webview.html = getRulesHtml(rules);
}

async function refreshRules(): Promise<void> {
  if (!client.isConnected) return;
  await refreshAllData();
  vscode.window.showInformationMessage("Prism data refreshed");
}

async function createRule(): Promise<void> {
  const name = await vscode.window.showInputBox({
    prompt: "Rule name",
    placeHolder: "e.g. Use CSS modules",
  });
  if (!name) return;
  const category = await vscode.window.showQuickPick(
    [
      "architecture",
      "styling",
      "security",
      "performance",
      "testing",
      "documentation",
      "custom",
    ],
    { placeHolder: "Category" },
  );
  if (!category) return;
  const content = await vscode.window.showInputBox({
    prompt: "Rule content (markdown)",
    placeHolder: "Describe the rule...",
  });
  if (!content) return;

  const projects =
    await apiGet<Array<{ id: string; name: string }>>("/api/v1/projects");
  const projectPicks = [
    { label: "(none)", id: "" },
    ...(projects || []).map((p) => ({ label: p.name, id: p.id })),
  ];
  const project = await vscode.window.showQuickPick(
    projectPicks.map((p) => p.label),
    { placeHolder: "Project (optional)" },
  );
  const projectId =
    project && project !== "(none)"
      ? projectPicks.find((p) => p.label === project)?.id
      : undefined;

  const result = await apiPost("/api/v1/rules", {
    name,
    category,
    content,
    priority: 50,
    projectId,
  });
  if (result?.error) {
    vscode.window.showErrorMessage(`Failed to create rule: ${result.error}`);
  } else {
    vscode.window.showInformationMessage(`Rule "${name}" created`);
    await refreshAllData();
  }
}

async function deleteRule(): Promise<void> {
  const rules =
    await apiGet<Array<{ id: string; name: string }>>("/api/v1/rules");
  if (!rules || rules.length === 0) {
    vscode.window.showInformationMessage("No rules to delete.");
    return;
  }
  const pick = await vscode.window.showQuickPick(
    rules.map((r) => ({ label: r.name, id: r.id })),
    { placeHolder: "Select rule to delete" },
  );
  if (!pick) return;
  const ok = await apiDelete(`/api/v1/rules/${pick.id}`);
  if (ok) {
    vscode.window.showInformationMessage(`Rule "${pick.label}" deleted`);
    await refreshAllData();
  }
}

// === Projects ===

async function listProjects(): Promise<void> {
  const projects =
    await apiGet<
      Array<{
        name: string;
        slug: string;
        stack: string;
        designSystem: string;
        ruleCount: number;
        videoCount: number;
      }>
    >("/api/v1/projects");
  if (!projects || projects.length === 0) {
    vscode.window.showInformationMessage("No projects found.");
    return;
  }
  const pick = await vscode.window.showQuickPick(
    projects.map((p) => ({
      label: p.name,
      description: `${p.stack} / ${p.designSystem}`,
      detail: `Rules: ${p.ruleCount}, Videos: ${p.videoCount}`,
    })),
    { placeHolder: "Select a project" },
  );
  if (!pick) return;
  const project = projects.find((p) => p.name === pick.label);
  if (!project) return;
  const panel = vscode.window.createWebviewPanel(
    "prismProject",
    `Project: ${project.name}`,
    vscode.ViewColumn.One,
    {},
  );
  panel.webview.html = getProjectHtml(project);
}

async function createProject(): Promise<void> {
  const name = await vscode.window.showInputBox({
    prompt: "Project name",
    placeHolder: "My Next.js App",
  });
  if (!name) return;
  const stack = await vscode.window.showQuickPick(
    ["react", "nextjs", "react-native"],
    { placeHolder: "Tech stack" },
  );
  if (!stack) return;
  const design = await vscode.window.showQuickPick(
    [
      "jdstudio",
      "bare-minimum",
      "glassmorphic",
      "8bit-nostalgia",
      "keandrew",
      "custom",
    ],
    { placeHolder: "Design system" },
  );
  if (!design) return;

  const result = await apiPost("/api/v1/projects", {
    name,
    designSystem: design,
    stack,
  });
  if (result?.error) {
    vscode.window.showErrorMessage(`Failed to create project: ${result.error}`);
  } else {
    vscode.window.showInformationMessage(`Project "${name}" created`);
    await refreshAllData();
  }
}

async function deleteProject(): Promise<void> {
  const projects =
    await apiGet<Array<{ id: string; name: string }>>("/api/v1/projects");
  if (!projects || projects.length === 0) {
    vscode.window.showInformationMessage("No projects.");
    return;
  }
  const pick = await vscode.window.showQuickPick(
    projects.map((p) => ({ label: p.name, id: p.id })),
    { placeHolder: "Select project to delete" },
  );
  if (!pick) return;
  const confirm = await vscode.window.showWarningMessage(
    `Delete "${pick.label}"? This cannot be undone.`,
    { modal: true },
    "Delete",
  );
  if (confirm !== "Delete") return;
  const ok = await apiDelete(`/api/v1/projects/${pick.id}`);
  if (ok) {
    vscode.window.showInformationMessage("Project deleted");
    await refreshAllData();
  }
}

// === Brands ===

async function listBrands(): Promise<void> {
  const brands =
    await apiGet<
      Array<{ slug: string; companyName: string; industry: string }>
    >("/api/v1/brands");
  if (!brands || brands.length === 0) {
    vscode.window.showInformationMessage("No brands found.");
    return;
  }
  const pick = await vscode.window.showQuickPick(
    brands.map((b) => ({
      label: b.companyName,
      description: b.industry,
      slug: b.slug,
    })),
    { placeHolder: "Select a brand" },
  );
  if (!pick) return;
  const brand = await apiGet<Record<string, unknown>>(
    `/api/v1/brands/${pick.slug}`,
  );
  if (!brand) return;
  const panel = vscode.window.createWebviewPanel(
    "prismBrand",
    `Brand: ${brand.companyName}`,
    vscode.ViewColumn.One,
    {},
  );
  panel.webview.html = getBrandHtml(brand);
}

async function createBrand(): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    "prismBrandWizard",
    "Brand Wizard",
    vscode.ViewColumn.One,
    { enableScripts: true },
  );
  panel.webview.html = getBrandWizardHtml();
  panel.webview.onDidReceiveMessage(async (message) => {
    if (message.command === "createBrand") {
      const result = await apiPost("/api/v1/brands", message.data);
      if (result?.error) {
        panel.webview.postMessage({ command: "error", message: result.error });
      } else {
        panel.webview.postMessage({
          command: "success",
          message: "Brand created!",
        });
        await refreshAllData();
      }
    }
  });
}

async function exportBrand(): Promise<void> {
  const brands =
    await apiGet<Array<{ id: string; slug: string; companyName: string }>>(
      "/api/v1/brands",
    );
  if (!brands || brands.length === 0) {
    vscode.window.showInformationMessage("No brands.");
    return;
  }
  const pick = await vscode.window.showQuickPick(
    brands.map((b) => ({ label: b.companyName, slug: b.slug })),
    { placeHolder: "Brand" },
  );
  if (!pick) return;
  const format = await vscode.window.showQuickPick(
    ["cursor", "windsurf", "vscode", "claude", "css", "tailwind"],
    { placeHolder: "Export format" },
  );
  if (!format) return;

  const { token, apiUrl } = getConfig();
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/brands/${pick.slug}/export?format=${format}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const content = await res.text();
    const doc = await vscode.workspace.openTextDocument({
      content,
      language:
        format === "json"
          ? "json"
          : format === "css"
            ? "css"
            : format === "tailwind"
              ? "javascript"
              : "markdown",
    });
    await vscode.window.showTextDocument(doc);
  } catch {
    vscode.window.showErrorMessage("Failed to export brand");
  }
}

async function deleteBrand(): Promise<void> {
  const brands =
    await apiGet<Array<{ id: string; companyName: string }>>("/api/v1/brands");
  if (!brands || brands.length === 0) {
    vscode.window.showInformationMessage("No brands.");
    return;
  }
  const pick = await vscode.window.showQuickPick(
    brands.map((b) => ({ label: b.companyName, id: b.id })),
    { placeHolder: "Brand to delete" },
  );
  if (!pick) return;
  const ok = await apiDelete(`/api/v1/brands/${pick.id}`);
  if (ok) {
    vscode.window.showInformationMessage("Brand deleted");
    await refreshAllData();
  }
}

// === AI Kitchen ===

async function generate(): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    "prismKitchen",
    "AI Kitchen",
    vscode.ViewColumn.Two,
    { enableScripts: true },
  );
  panel.webview.html = getKitchenHtml();
  panel.webview.onDidReceiveMessage(async (message) => {
    if (message.command === "generate") {
      const result = await apiPost("/api/generate", message.data);
      panel.webview.postMessage({ command: "result", data: result });
    }
    if (message.command === "insert") {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.edit((builder) => {
          builder.insert(editor.selection.active, message.code);
        });
        vscode.window.showInformationMessage("Component inserted at cursor");
      }
    }
  });
}

// === Marketplace ===

async function marketplace(): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    "prismMarketplace",
    "Marketplace",
    vscode.ViewColumn.One,
    { enableScripts: true },
  );
  const { token, apiUrl } = getConfig();
  panel.webview.html = getMarketplaceHtml(token, apiUrl);
  panel.webview.onDidReceiveMessage(async (message) => {
    if (message.command === "install") {
      const result = await apiPost(
        `/api/v1/marketplace/install/${message.id}`,
        {},
      );
      panel.webview.postMessage({ command: "installed", data: result });
      await refreshAllData();
    }
  });
}

// === Analytics ===

async function showAnalytics(): Promise<void> {
  const data = await apiGet<{
    tier: string;
    usage: Record<string, { used: number; limit: number | string }>;
    resetDate: string;
  }>("/api/v1/analytics");
  if (!data) {
    vscode.window.showErrorMessage("Failed to load analytics");
    return;
  }
  const panel = vscode.window.createWebviewPanel(
    "prismAnalytics",
    "Analytics",
    vscode.ViewColumn.One,
    {},
  );
  panel.webview.html = getAnalyticsHtml(data);
}

// === API Keys ===

async function manageApiKeys(): Promise<void> {
  const keysData = await apiGet<{
    keys: Array<{
      id: string;
      name: string;
      keyPrefix: string;
      createdAt: string;
    }>;
    canCreate: boolean;
  }>("/api/v1/api-keys");
  if (!keysData) {
    vscode.window.showErrorMessage("Failed to load API keys");
    return;
  }

  const actions = keysData.canCreate
    ? ["List Keys", "Create New Key", "Revoke Key"]
    : ["List Keys", "Revoke Key"];
  const action = await vscode.window.showQuickPick(actions, {
    placeHolder: "API Keys",
  });
  if (!action) return;

  if (action === "List Keys") {
    if (keysData.keys.length === 0) {
      vscode.window.showInformationMessage("No API keys.");
    } else {
      await vscode.window.showQuickPick(
        keysData.keys.map((k) => ({
          label: k.name,
          description: `${k.keyPrefix}...`,
          detail: `Created: ${k.createdAt.slice(0, 10)}`,
          id: k.id,
        })),
        { placeHolder: "Your API keys" },
      );
    }
  }

  if (action === "Create New Key") {
    const name = await vscode.window.showInputBox({
      prompt: "Key name",
      placeHolder: "e.g. CLI",
    });
    if (!name) return;
    const result = await apiPost("/api/v1/api-keys", { name });
    if (result?.error) {
      vscode.window.showErrorMessage(result.error);
    } else {
      const keyData = result as { key?: string };
      if (keyData?.key) {
        await vscode.env.clipboard.writeText(keyData.key);
        vscode.window.showInformationMessage(
          "API key copied to clipboard! Save it now - it won't be shown again.",
        );
      }
    }
  }

  if (action === "Revoke Key") {
    const keys = keysData.keys;
    if (keys.length === 0) {
      vscode.window.showInformationMessage("No keys to revoke.");
      return;
    }
    const pick = await vscode.window.showQuickPick(
      keys.map((k) => ({ label: k.name, id: k.id })),
      { placeHolder: "Key to revoke" },
    );
    if (!pick) return;
    const ok = await apiDelete(`/api/v1/api-keys/${pick.id}`);
    if (ok) vscode.window.showInformationMessage("API key revoked");
  }
}

// === Fix & Rule Detail ===

async function applyFix(
  params: {
    ruleId: string;
    ruleName: string;
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
    matchedText: string;
    message: string;
    severity: string;
  },
  docUri: string,
): Promise<void> {
  if (!client.isConnected) {
    vscode.window.showErrorMessage("Prism is not connected.");
    return;
  }

  const editor = vscode.window.visibleTextEditors.find(
    (e) => e.document.uri.toString() === docUri,
  );
  if (!editor) {
    vscode.window.showErrorMessage("Cannot find the document to fix.");
    return;
  }

  const code = editor.document.getText();
  const fixResult = await client.fixCode(params, code);
  if (!fixResult || !fixResult.correctedCode) {
    vscode.window.showWarningMessage(
      `No automatic fix available for "${params.ruleName}". Manual review required.`,
    );
    return;
  }

  const fullRange = new vscode.Range(
    editor.document.positionAt(0),
    editor.document.positionAt(code.length),
  );

  await editor.edit((builder) => {
    builder.replace(fullRange, fixResult.correctedCode);
  });

  const confidence = Math.round(fixResult.confidence * 100);
  if (fixResult.confidence >= 0.8) {
    vscode.window.showInformationMessage(
      `Fixed "${params.ruleName}" (${confidence}% confidence)`,
    );
  } else if (fixResult.confidence >= 0.5) {
    vscode.window.showWarningMessage(
      `Applied partial fix for "${params.ruleName}" (${confidence}% confidence) — please review`,
    );
  } else {
    vscode.window.showWarningMessage(
      `Low-confidence fix applied for "${params.ruleName}" — manual review required`,
    );
  }
}

async function showRuleDetail(params: {
  ruleId: string;
  ruleName: string;
}): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    "prismRuleDetail",
    `Rule: ${params.ruleName}`,
    vscode.ViewColumn.One,
    {},
  );
  try {
    const rules = await client.getArchitecturalRules();
    const rule = rules.find((r) => r.name === params.ruleName);
    panel.webview.html = `<!DOCTYPE html><html><head><style>
      body { font-family: system-ui; padding: 1rem; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
      pre { background: var(--vscode-textCodeBlock-background); padding: 1rem; border-radius: 4px; overflow-x: auto; }
    </style></head><body>
      <h1>${rule?.name || params.ruleName}</h1>
      <pre>${rule?.content || "Rule content not available"}</pre>
    </body></html>`;
  } catch {
    panel.webview.html = `<h1>${params.ruleName}</h1><p>Error loading rule details.</p>`;
  }
}

// === Login ===

async function login(): Promise<void> {
  const terminal = vscode.window.createTerminal("Prism Login");
  terminal.show();
  terminal.sendText("npx prism-context-engine login");
}

// === Webview HTML generators ===

function getRulesHtml(rules: Rule[]): string {
  return `<!DOCTYPE html><html><head><style>
    body { font-family: system-ui; padding: 1rem; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
    .rule { border-left: 3px solid #06b6d4; padding: 0.5rem 1rem; margin: 1rem 0; }
    .category { color: #06b6d4; font-size: 0.8rem; text-transform: uppercase; }
    h2 { margin: 0 0 0.25rem 0; }
  </style></head><body>
    <h1>Prism Rules (${rules.length})</h1>
    ${rules.map((r) => `<div class="rule"><div class="category">${r.category}</div><h2>${r.name}</h2><pre>${r.content.slice(0, 500)}${r.content.length > 500 ? "..." : ""}</pre></div>`).join("")}
  </body></html>`;
}

function getProjectHtml(project: Record<string, unknown>): string {
  return `<!DOCTYPE html><html><head><style>
    body { font-family: system-ui; padding: 1rem; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
    .stat { display: inline-block; padding: 0.5rem 1rem; margin: 0.25rem; background: #06b6d420; border-radius: 6px; }
    .label { font-size: 0.75rem; opacity: 0.7; }
    .value { font-size: 1.5rem; font-weight: 700; }
  </style></head><body>
    <h1>${project.name}</h1>
    <p>Stack: <strong>${project.stack}</strong> | Design: <strong>${project.designSystem}</strong></p>
    <div><span class="stat"><div class="label">Rules</div><div class="value">${project.ruleCount}</div></span>
    <span class="stat"><div class="label">Videos</div><div class="value">${project.videoCount}</div></span></div>
  </body></html>`;
}

function getBrandHtml(brand: Record<string, unknown>): string {
  const colors = (brand.colors || {}) as Record<string, string>;
  return `<!DOCTYPE html><html><head><style>
    body { font-family: system-ui; padding: 1rem; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
    .swatch { display: inline-block; width: 40px; height: 40px; border-radius: 6px; margin: 4px; border: 1px solid #333; }
    .color-row { display: flex; align-items: center; gap: 0.5rem; margin: 0.25rem 0; }
  </style></head><body>
    <h1>${brand.companyName}</h1>
    <p>Industry: ${brand.industry}${brand.tagline ? ` | "${brand.tagline}"` : ""}</p>
    <h3>Colors</h3>
    ${Object.entries(colors)
      .map(
        ([k, v]) =>
          `<div class="color-row"><div class="swatch" style="background:${v}"></div>${k}: ${v}</div>`,
      )
      .join("")}
    <h3>Typography</h3>
    <p>Heading: ${(brand.typography as Record<string, string>)?.headingFont} | Body: ${(brand.typography as Record<string, string>)?.bodyFont}</p>
  </body></html>`;
}

function getBrandWizardHtml(): string {
  return `<!DOCTYPE html><html><head><style>
    body { font-family: system-ui; padding: 1rem; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
    input, select { margin: 0.25rem 0; padding: 0.5rem; width: 100%; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; }
    button { padding: 0.5rem 1rem; background: #06b6d4; color: #000; border: none; border-radius: 4px; cursor: pointer; margin: 0.5rem 0; }
    .step { display: none; }
    .step.active { display: block; }
    .color-preview { display: flex; gap: 4px; margin: 0.5rem 0; }
    .color-preview div { width: 32px; height: 32px; border-radius: 4px; }
  </style></head><body>
    <h2>Brand Wizard</h2>
    <div id="step1" class="step active">
      <h3>Step 1: Identity</h3>
      <input id="companyName" placeholder="Company name" />
      <input id="tagline" placeholder="Tagline (optional)" />
      <select id="industry"><option>tech</option><option>agency</option><option>ecommerce</option><option>saas</option><option>healthcare</option><option>finance</option><option>education</option><option>photography</option><option>other</option></select>
      <button onclick="nextStep(1)">Next</button>
    </div>
    <div id="step2" class="step">
      <h3>Step 2: Colors</h3>
      <div class="color-preview" id="colorPreview"></div>
      <input id="primary" placeholder="Primary (#3B82F6)" />
      <input id="secondary" placeholder="Secondary (#6366F1)" />
      <input id="accent" placeholder="Accent (#F59E0B)" />
      <input id="background" placeholder="Background (#0A0A0A)" />
      <input id="surface" placeholder="Surface (#1A1A2E)" />
      <input id="text" placeholder="Text (#FFFFFF)" />
      <input id="textMuted" placeholder="Text muted (#9CA3AF)" />
      <button onclick="nextStep(2)">Next</button>
    </div>
    <div id="step3" class="step">
      <h3>Step 3: Typography</h3>
      <input id="headingFont" placeholder="Heading font (Inter)" />
      <input id="bodyFont" placeholder="Body font (Inter)" />
      <select id="scale"><option>default</option><option>compact</option><option>spacious</option></select>
      <button onclick="nextStep(3)">Next</button>
    </div>
    <div id="step4" class="step">
      <h3>Step 4: Voice</h3>
      <select id="personality"><option>minimal</option><option>warm</option><option>bold</option><option>playful</option><option>corporate</option></select>
      <select id="formality"><option>casual</option><option>balanced</option><option>formal</option></select>
      <input id="keywords" placeholder="Keywords (comma-separated)" />
      <button onclick="nextStep(4)">Next</button>
    </div>
    <div id="step5" class="step">
      <h3>Step 5: Review & Create</h3>
      <div id="summary"></div>
      <button onclick="submitBrand()">Create Brand</button>
    </div>
    <script>
      const vscode = acquireVsCodeApi();
      function nextStep(n) {
        document.getElementById('step'+n).classList.remove('active');
        document.getElementById('step'+(n+1)).classList.add('active');
        if (n===4) updateSummary();
      }
      function updateSummary() {
        const summary = document.getElementById('summary');
        summary.innerHTML = '';
        const p1 = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = document.getElementById('companyName').value;
        p1.appendChild(strong);
        p1.append(' - ' + document.getElementById('industry').value);
        summary.appendChild(p1);
        const p2 = document.createElement('p');
        p2.textContent = 'Fonts: ' + document.getElementById('headingFont').value + ' / ' + document.getElementById('bodyFont').value;
        summary.appendChild(p2);
      }
      function submitBrand() {
        const colors = ['primary','secondary','accent','background','surface','text','textMuted'];
        const colorObj = {};
        colors.forEach(c => colorObj[c] = document.getElementById(c).value);
        vscode.postMessage({ command: 'createBrand', data: {
          companyName: document.getElementById('companyName').value,
          tagline: document.getElementById('tagline').value,
          industry: document.getElementById('industry').value,
          colors: colorObj,
          typography: {
            headingFont: document.getElementById('headingFont').value,
            bodyFont: document.getElementById('bodyFont').value,
            scale: document.getElementById('scale').value
          },
          voice: {
            personality: document.getElementById('personality').value,
            formality: document.getElementById('formality').value,
            keywords: document.getElementById('keywords').value.split(',').map(k=>k.trim()).filter(Boolean)
          },
          imagery: { style: 'mixed', mood: 'dark' },
          spacing: { unit: 4, borderRadius: 'sm' }
        }});
      }
      window.addEventListener('message', e => {
        if (e.data.command === 'success') { document.body.innerHTML = '<h2>Brand created!</h2>'; }
        if (e.data.command === 'error') {
          document.body.innerHTML = '';
          var h2 = document.createElement('h2');
          h2.style.color = 'red';
          h2.textContent = 'Error: ' + (e.data.message || 'Unknown error');
          document.body.appendChild(h2);
        }
      });
    </script></body></html>`;
}

function getKitchenHtml(): string {
  return `<!DOCTYPE html><html><head><style>
    body { font-family: system-ui; padding: 1rem; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
    textarea, select, input { margin: 0.25rem 0; padding: 0.5rem; width: 100%; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; }
    textarea { height: 100px; }
    button { padding: 0.5rem 1rem; background: #06b6d4; color: #000; border: none; border-radius: 4px; cursor: pointer; margin: 0.5rem 0.25rem; }
    pre { background: var(--vscode-textCodeBlock-background); padding: 1rem; border-radius: 4px; overflow-x: auto; }
    .hidden { display: none; }
  </style></head><body>
    <h2>AI Kitchen</h2>
    <textarea id="prompt" placeholder="Describe the component you want..."></textarea>
    <select id="design"><option value="jdstudio">JD Studio</option><option value="bare-minimum">Bare Minimum</option><option value="glassmorphic">Glassmorphic</option><option value="8bit-nostalgia">8-Bit Nostalgia</option></select>
    <select id="stack"><option value="nextjs">Next.js</option><option value="react">React</option><option value="react-native">React Native</option></select>
    <button onclick="doGenerate()">Generate</button>
    <div id="result" class="hidden">
      <pre id="code"></pre>
      <button onclick="insertCode()">Insert at Cursor</button>
    </div>
    <script>
      const vscode = acquireVsCodeApi();
      async function doGenerate() {
        document.getElementById('result').classList.add('hidden');
        vscode.postMessage({ command: 'generate', data: {
          prompt: document.getElementById('prompt').value,
          designSystem: document.getElementById('design').value,
          stack: document.getElementById('stack').value
        }});
      }
      function insertCode() {
        vscode.postMessage({ command: 'insert', code: document.getElementById('code').textContent });
      }
      window.addEventListener('message', e => {
        if (e.data.command === 'result') {
          const data = e.data.data;
          if (data.error) { document.getElementById('code').textContent = data.error; }
          else if (data.component) { document.getElementById('code').textContent = data.component.code || JSON.stringify(data.component); }
          else { document.getElementById('code').textContent = JSON.stringify(data, null, 2); }
          document.getElementById('result').classList.remove('hidden');
        }
      });
    </script></body></html>`;
}

function getMarketplaceHtml(token: string, apiUrl: string): string {
  return `<!DOCTYPE html><html><head><style>
    body { font-family: system-ui; padding: 1rem; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
    input { padding: 0.5rem; width: 100%; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; }
    .card { border: 1px solid var(--vscode-panel-border); padding: 0.75rem; margin: 0.5rem 0; border-radius: 6px; }
    .card h3 { margin: 0 0 0.25rem 0; }
    button { padding: 0.25rem 0.75rem; background: #06b6d4; color: #000; border: none; border-radius: 4px; cursor: pointer; }
    .badge { background: #06b6d420; color: #06b6d4; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem; }
  </style></head><body>
    <h2>Marketplace</h2>
    <input id="search" placeholder="Search rule sets..." oninput="loadMarketplace(this.value)" />
    <div id="results">Loading...</div>
    <script>
      const vscode = acquireVsCodeApi();
      async function loadMarketplace(query) {
        const res = await fetch('${apiUrl}/api/v1/marketplace?q=' + encodeURIComponent(query || ''), {
          headers: { 'Authorization': 'Bearer ${token}' }
        });
        const json = await res.json();
        const items = json.data || [];
        var results = document.getElementById('results');
        results.innerHTML = '';
        if (items.length === 0) {
          results.textContent = 'No results.';
        } else {
          items.forEach(function(rs) {
            var card = document.createElement('div');
            card.className = 'card';
            var h3 = document.createElement('h3');
            h3.textContent = rs.name || '';
            var badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = (rs.ruleCount || 0) + ' rules';
            h3.appendChild(badge);
            card.appendChild(h3);
            if (rs.description) {
              var p = document.createElement('p');
              p.textContent = rs.description;
              card.appendChild(p);
            }
            var btn = document.createElement('button');
            btn.textContent = 'Install';
            btn.onclick = (function(id) { return function() { install(id); }; })(rs.id);
            card.appendChild(btn);
            results.appendChild(card);
          });
        }
      }
      function install(id) {
        vscode.postMessage({ command: 'install', id });
      }
      window.addEventListener('message', e => {
        if (e.data.command === 'installed') { loadMarketplace(document.getElementById('search').value); }
      });
      loadMarketplace('');
    </script></body></html>`;
}

function getAnalyticsHtml(data: {
  tier: string;
  usage: Record<string, { used: number; limit: number | string }>;
  resetDate: string;
}): string {
  const formatLabel = (k: string) =>
    k === "aiGenerations"
      ? "AI Generations"
      : k.charAt(0).toUpperCase() + k.slice(1);
  const formatLimit = (v: number | string) =>
    v === "unlimited" || v === -1 ? "∞" : String(v);
  return `<!DOCTYPE html><html><head><style>
    body { font-family: system-ui; padding: 1rem; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
    .metric { margin: 0.75rem 0; }
    .bar { height: 24px; background: var(--vscode-progressBar-background); border-radius: 4px; overflow: hidden; margin: 0.25rem 0; }
    .bar-fill { height: 100%; background: #06b6d4; border-radius: 4px; transition: width 0.3s; }
    .label { display: flex; justify-content: space-between; font-size: 0.85rem; }
    .tier { color: #06b6d4; font-weight: 700; }
    .reset { opacity: 0.6; font-size: 0.8rem; margin-top: 1rem; }
  </style></head><body>
    <h1>Usage & Limits <span class="tier">[${data.tier.toUpperCase()}]</span></h1>
    ${Object.entries(data.usage)
      .map(([k, v]) => {
        const pct =
          v.limit === "unlimited" || v.limit === -1 || Number(v.limit) === 0
            ? 0
            : Math.min(100, (v.used / Number(v.limit)) * 100);
        return (
          '<div class="metric"><div class="label"><span>' +
          formatLabel(k) +
          "</span><span>" +
          v.used +
          " / " +
          formatLimit(v.limit) +
          '</span></div><div class="bar"><div class="bar-fill" style="width:' +
          pct +
          '%"></div></div></div>'
        );
      })
      .join("")}
    <div class="reset">Resets: ${data.resetDate.slice(0, 10)}</div>
  </body></html>`;
}
