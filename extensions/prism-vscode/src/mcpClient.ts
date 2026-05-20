import { ChildProcess, spawn } from 'child_process';
import * as vscode from 'vscode';

export interface Rule {
  name: string;
  category: string;
  content: string;
  priority?: number;
}

export interface McpToolResult {
  content: Array<{ type: string; text: string }>;
}

export class McpClient {
  private process: ChildProcess | null = null;
  private buffer = '';
  private pendingRequests: Map<string, (result: unknown) => void> = new Map();
  private requestId = 0;
  public onRulesChanged?: () => void;

  get isConnected(): boolean {
    return this.process !== null && !this.process.killed;
  }

  async connect(token: string, apiUrl: string): Promise<void> {
    if (this.isConnected) return;

    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      PRISM_TOKEN: token,
      PRISM_API_URL: apiUrl,
    };

    this.process = spawn('npx', ['@prism-engine/cli', 'serve'], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.process.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      console.error(`[prism-mcp] ${data.toString().trim()}`);
    });

    this.process.on('exit', (code) => {
      console.error(`[prism-mcp] Process exited with code ${code}`);
      this.process = null;
      this.onRulesChanged?.();
    });

    await this.sendRequest('initialize', { protocolVersion: '2024-11-05' });
  }

  disconnect(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  async getArchitecturalRules(category?: string, tag?: string): Promise<Rule[]> {
    const result = await this.callTool('get_architectural_rules', { category, tag }) as McpToolResult;
    return this.parseRulesFromText(result.content[0]?.text || '');
  }

  async validateCode(code: string, context?: string, category?: string): Promise<string> {
    const result = await this.callTool('validate_code_pattern', { code, context, category }) as McpToolResult;
    return result.content[0]?.text || '';
  }

  async checkCode(code: string, filePath?: string): Promise<{
    status: string;
    violations: Array<{
      ruleId: string;
      ruleName: string;
      message: string;
      severity: string;
      line: number;
      column: number;
      endLine: number;
      endColumn: number;
      matchedText: string;
      suggestion: string;
    }>;
    checkedRules: number;
  }> {
    const result = await this.callTool('prism_check', { code, filePath }) as McpToolResult;
    try {
      return JSON.parse(result.content[0]?.text || '{}');
    } catch {
      return { status: 'error', violations: [], checkedRules: 0 };
    }
  }

  async fixCode(violation: Record<string, unknown>, code: string): Promise<{
    correctedCode: string;
    appliedRule: string;
    confidence: number;
  } | null> {
    const result = await this.callTool('prism_fix', { violation, code }) as McpToolResult;
    try {
      return JSON.parse(result.content[0]?.text || '{}');
    } catch {
      return null;
    }
  }

  async listProjects(): Promise<string> {
    const result = await this.callTool('list_projects', {}) as McpToolResult;
    return result.content[0]?.text || '';
  }

  async getBrandProfile(brandId?: string): Promise<string> {
    const result = await this.callTool('get_brand_profile', { brandId }) as McpToolResult;
    return result.content[0]?.text || '';
  }

  async searchMarketplace(query?: string): Promise<string> {
    const result = await this.callTool('search_marketplace', { query }) as McpToolResult;
    return result.content[0]?.text || '';
  }

  async getUsageStats(): Promise<string> {
    const result = await this.callTool('get_usage_stats', {}) as McpToolResult;
    return result.content[0]?.text || '';
  }

  async createRule(name: string, category: string, content: string, projectId?: string): Promise<string> {
    const result = await this.callTool('create_rule', { name, category, content, projectId }) as McpToolResult;
    return result.content[0]?.text || '';
  }

  async updateRule(ruleId: string, updates: Record<string, unknown>): Promise<string> {
    const result = await this.callTool('update_rule', { ruleId, ...updates }) as McpToolResult;
    return result.content[0]?.text || '';
  }

  async deleteRule(ruleId: string): Promise<string> {
    const result = await this.callTool('delete_rule', { ruleId }) as McpToolResult;
    return result.content[0]?.text || '';
  }

  private async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest('tools/call', { name, arguments: args });
  }

  private async sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pendingRequests.set(id.toString(), resolve);

      const request = JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params,
      });

      this.process?.stdin?.write(request + '\n');

      setTimeout(() => {
        this.pendingRequests.delete(id.toString());
        reject(new Error(`Request ${method} timed out`));
      }, 10000);
    });
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const response = JSON.parse(line);
        if (response.id && this.pendingRequests.has(response.id.toString())) {
          const resolve = this.pendingRequests.get(response.id.toString())!;
          this.pendingRequests.delete(response.id.toString());
          if (response.error) {
            console.error(`[prism-mcp] Error: ${response.error.message}`);
          }
          resolve(response.result || response);
        }
      } catch {
        // non-JSON output
      }
    }
  }

  private parseRulesFromText(text: string): Rule[] {
    const rules: Rule[] = [];
    const sections = text.split(/^## /m);
    for (const section of sections) {
      if (!section.trim()) continue;
      const lines = section.split('\n');
      const name = lines[0]?.trim() || 'Unknown';
      const categoryMatch = section.match(/\*\*Category:\*\*\s*(\w+)/);
      const category = categoryMatch?.[1] || 'general';
      const content = section.trim();
      rules.push({ name, category, content });
    }
    return rules;
  }
}
