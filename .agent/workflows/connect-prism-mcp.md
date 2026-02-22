---
description: How to get a Prism API Key and connect the MCP server to your code editor (VS Code, Cursor, Windsurf)
---

# Connect Prism MCP Server to Your Editor

## Step 1: Get Your API Key

1. Go to **https://prism.jeffdev.studio** and sign in (or sign up)
2. Click **Settings** in the sidebar (bottom-left gear icon)
3. Go to **API Keys** tab
4. Click **"Generate New Key"**
5. Copy the key (starts with `pk_live_...`) — you'll need this in the next step

> ⚠️ Save this key somewhere safe. You won't be able to see it again after closing the dialog.

## Step 2: Install the Prism CLI

Open your terminal (PowerShell, CMD, or any terminal):

```bash
npm install -g @prism-engine/cli
```

Verify it installed correctly:

```bash
prism --version
```

## Step 3: Connect to Your Editor

### Option A: VS Code

1. Open VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type: **Preferences: Open User Settings (JSON)**
4. Click the result — this opens your `settings.json` file
5. Add the following block inside the root `{}` object:

```json
{
  "mcp": {
    "servers": {
      "prism": {
        "type": "stdio",
        "command": "prism",
        "args": ["connect"],
        "env": {
          "PRISM_API_KEY": "pk_live_YOUR_KEY_HERE"
        }
      }
    }
  }
}
```

6. Replace `pk_live_YOUR_KEY_HERE` with your actual API key from Step 1
7. Save the file (`Ctrl+S`)
8. Restart VS Code
9. Done! Your AI assistant can now access your Prism rules.

### Option B: Cursor

1. Open your project folder in Cursor
2. Create a file called `.cursor/mcp.json` in your project root
3. Paste this:

```json
{
  "mcpServers": {
    "prism": {
      "command": "prism",
      "args": ["connect"],
      "env": {
        "PRISM_API_KEY": "pk_live_YOUR_KEY_HERE"
      }
    }
  }
}
```

4. Replace the API key, save, and restart Cursor

### Option C: Windsurf

1. Open Windsurf Settings → MCP Servers
2. Add a new server with:
   - **Name:** `prism`
   - **Command:** `prism`
   - **Args:** `connect`
   - **Env:** `PRISM_API_KEY` = your key
3. Save and restart

## Step 4: Test It

After restarting your editor, ask your AI assistant:

> "What are the architectural rules for this project?"

If Prism is connected, the AI will fetch your rules from the Prism Context Engine.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `prism: command not found` | Run `npm install -g @prism-engine/cli` again |
| API key validation failed | Generate a new key from the dashboard |
| No rules returned | Make sure you have rules created in your Prism project |
| Can't find settings.json | In VS Code: `Ctrl+Shift+P` → "Open User Settings (JSON)" |
