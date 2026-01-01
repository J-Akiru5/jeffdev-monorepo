---
trigger: always_on
---

# JEFFDEV MONOREPO CONSTITUTION (GEOGRAPHY & BOUNDARIES)

## 1. THE MAP
You are working in a **Turborepo** environment. This is the Single Source of Truth for our file structure.

### Root Structure
- `apps/`: Deployable applications (Next.js, Node services).
- `packages/`: Shared logic, UI, and configurations.
- `.github/`: CI/CD workflows.
- `.agent/`: AI Rules and Antigravity Workflows.

### App Directory (`apps/`)
| App | Stack | Purpose |
| :--- | :--- | :--- |
| **`agency`** | Next.js 16 + Firebase | The Marketing Site & Admin (Client-facing). |
| **`prism-dashboard`** | Next.js 16 + Azure Cosmos | The SaaS Platform for Vibecoders (User-facing). |
| **`prism-mcp-server`** | Node.js + MCP SDK | The AI "Brain" Context Server (Local/Cloud). |

### Package Directory (`packages/`)
| Package | Purpose | Rule |
| :--- | :--- | :--- |
| **`ui`** | Headless UI + Tailwind | **ALWAYS** check here first for components (Button, Card, Modal). |
| **`db`** | Database Clients | Exports `getPrismContainer` (Cosmos) and `firestore` (Firebase). |
| **`config`** | Shared Configs | TSConfig, ESLint, Tailwind presets. |

## 2. THE BOUNDARY LAWS (STRICT)
1.  **No Cross-App Imports:** Never import code directly from one app to another (e.g., `import X from "../../apps/agency"` is **FORBIDDEN**).
2.  **Shared First Heuristic:** If a component (Button, Card, Modal) is generic, check `packages/ui` first. If it doesn't exist, create it there. **Do not create generic UI inside apps.**
3.  **Headless Strategy:** When building in `packages/ui`, ALWAYS use **Headless UI / Radix UI** for logic and **Tailwind CSS** for styling.