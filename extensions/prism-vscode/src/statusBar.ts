import * as vscode from 'vscode';

export class PrismStatusBar {
  private item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.item.command = 'prism.showRules';
    this.setDisconnected();
    this.item.show();
  }

  setConnected(ruleCount: number): void {
    this.item.text = `$(database) Prism: ${ruleCount} rules`;
    this.item.tooltip = 'Prism Context Engine — Connected';
    this.item.backgroundColor = undefined;
  }

  setDisconnected(): void {
    this.item.text = '$(circle-slash) Prism: Off';
    this.item.tooltip = 'Prism Context Engine — Click to connect';
    this.item.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.warningBackground'
    );
  }

  setError(message: string): void {
    this.item.text = `$(error) Prism: Error`;
    this.item.tooltip = message;
    this.item.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.errorBackground'
    );
  }

  dispose(): void {
    this.item.dispose();
  }
}
