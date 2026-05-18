import * as vscode from 'vscode';
import { Rule } from './mcpClient';

export class RuleTreeItem extends vscode.TreeItem {
  constructor(
    public readonly rule: Rule,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(rule.name, collapsibleState);

    this.description = rule.category;
    this.tooltip = rule.content;

    const iconMap: Record<string, string> = {
      architecture: '$(symbol-structure)',
      styling: '$(symbol-color)',
      security: '$(shield)',
      performance: '$(dashboard)',
      testing: '$(beaker)',
      documentation: '$(book)',
    };
    this.iconPath = new vscode.ThemeIcon(
      iconMap[rule.category]?.replace(/[\(\)$]/g, '') || 'symbol-misc'
    );

    this.contextValue = 'rule';
  }
}

export class RuleTreeProvider implements vscode.TreeDataProvider<RuleTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<RuleTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private rules: Rule[] = [];

  refresh(rules: Rule[]): void {
    this.rules = rules;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: RuleTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: RuleTreeItem): Thenable<RuleTreeItem[]> {
    if (element) {
      return Promise.resolve([]);
    }
    const grouped = this.groupByCategory(this.rules);
    const items: RuleTreeItem[] = [];
    for (const [category, categoryRules] of Object.entries(grouped)) {
      const categoryItem = new RuleTreeItem(
        { name: category.charAt(0).toUpperCase() + category.slice(1), category, content: '' },
        vscode.TreeItemCollapsibleState.Collapsed
      );
      categoryItem.iconPath = new vscode.ThemeIcon('folder');
      items.push(categoryItem);
      for (const rule of categoryRules) {
        items.push(new RuleTreeItem(rule, vscode.TreeItemCollapsibleState.None));
      }
    }
    return Promise.resolve(items);
  }

  private groupByCategory(rules: Rule[]): Record<string, Rule[]> {
    const grouped: Record<string, Rule[]> = {};
    for (const rule of rules) {
      const cat = rule.category || 'general';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(rule);
    }
    return grouped;
  }
}
