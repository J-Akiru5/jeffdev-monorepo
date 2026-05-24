import * as vscode from "vscode";
import { Rule } from "./mcpClient";

export interface ProjectData {
  type: "project";
  id: string;
  name: string;
  slug: string;
  ruleCount: number;
  stack?: string;
  designSystem?: string;
}

export interface BrandData {
  type: "brand";
  id: string;
  slug: string;
  companyName: string;
  industry?: string;
}

export interface ComponentData {
  type: "component";
  id: string;
  name: string;
}

export type DashboardItem = ProjectData | BrandData | ComponentData;

export interface DashboardData {
  projects: ProjectData[];
  brands: BrandData[];
  components: ComponentData[];
  rules: Rule[];
}

export class DashboardTreeItem extends vscode.TreeItem {
  children: DashboardTreeItem[] = [];

  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    contextValue: string,
    icon?: string,
    description?: string,
    tooltip?: string,
  ) {
    super(label, collapsibleState);
    this.contextValue = contextValue;
    this.description = description;
    this.tooltip = tooltip || label;
    if (icon) this.iconPath = new vscode.ThemeIcon(icon);
  }
}

export class DashboardTreeProvider implements vscode.TreeDataProvider<DashboardTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    DashboardTreeItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private data: DashboardData = {
    projects: [],
    brands: [],
    components: [],
    rules: [],
  };

  refresh(data: DashboardData): void {
    this.data = data;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: DashboardTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DashboardTreeItem): Thenable<DashboardTreeItem[]> {
    if (!element) return Promise.resolve(this.getRootChildren());
    return Promise.resolve(element.children);
  }

  private getRootChildren(): DashboardTreeItem[] {
    const items: DashboardTreeItem[] = [];

    // Projects section
    if (this.data.projects.length > 0) {
      const projectsHeader = new DashboardTreeItem(
        `Projects (${this.data.projects.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
        "section",
        "folder-library",
      );

      for (const p of this.data.projects) {
        const projectItem = new DashboardTreeItem(
          p.name,
          vscode.TreeItemCollapsibleState.Collapsed,
          "project",
          "project",
          `${p.stack || ""} / ${p.designSystem || ""}`,
          `Rules: ${p.ruleCount}`,
        );

        projectItem.children = [
          new DashboardTreeItem(
            `Rules (${p.ruleCount})`,
            vscode.TreeItemCollapsibleState.None,
            "project-rules",
            "symbol-property",
          ),
          new DashboardTreeItem(
            "Create Rule",
            vscode.TreeItemCollapsibleState.None,
            "create-rule",
            "add",
          ),
        ];

        projectsHeader.children.push(projectItem);
      }
      items.push(projectsHeader);
    }

    // Brands section
    if (this.data.brands.length > 0) {
      const brandsHeader = new DashboardTreeItem(
        `Brands (${this.data.brands.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
        "section",
        "symbol-color",
      );

      for (const b of this.data.brands) {
        const brandItem = new DashboardTreeItem(
          b.companyName,
          vscode.TreeItemCollapsibleState.None,
          "brand",
          "paintcan",
          b.industry,
        );
        brandsHeader.children.push(brandItem);
      }
      items.push(brandsHeader);
    }

    // Components section
    if (this.data.components.length > 0) {
      const componentsHeader = new DashboardTreeItem(
        `Components (${this.data.components.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
        "section",
        "symbol-class",
      );

      for (const c of this.data.components) {
        const compItem = new DashboardTreeItem(
          c.name,
          vscode.TreeItemCollapsibleState.None,
          "component",
          "symbol-misc",
        );
        componentsHeader.children.push(compItem);
      }
      items.push(componentsHeader);
    }

    // Rules section (global)
    if (this.data.rules.length > 0) {
      const rulesHeader = new DashboardTreeItem(
        `All Rules (${this.data.rules.length})`,
        vscode.TreeItemCollapsibleState.Collapsed,
        "section",
        "book",
      );

      for (const r of this.data.rules) {
        const iconMap: Record<string, string> = {
          architecture: "symbol-structure",
          styling: "symbol-color",
          security: "shield",
          performance: "dashboard",
          testing: "beaker",
          documentation: "book",
        };
        const ruleItem = new DashboardTreeItem(
          r.name,
          vscode.TreeItemCollapsibleState.None,
          "rule",
          iconMap[r.category] || "symbol-misc",
          r.category,
          r.content.slice(0, 200),
        );
        rulesHeader.children.push(ruleItem);
      }
      items.push(rulesHeader);
    }

    // Quick actions
    if (items.length === 0) {
      items.push(
        new DashboardTreeItem(
          'No data loaded. Run "Prism: Connect" or "Prism: Refresh All"',
          vscode.TreeItemCollapsibleState.None,
          "empty",
          "info",
        ),
      );
    }

    return items;
  }
}
