/**
 * Prism CLI - Main Entry
 *
 * Commands:
 * - prism login       : Authenticate with Prism Cloud
 * - prism init        : Auto-detect IDEs and configure MCP connection
 * - prism sync        : Sync data from Prism Cloud to local cache
 * - prism serve       : Start MCP server (for IDE integration)
 * - prism connect     : URL scanning for rule extraction
 * - prism rules       : List/create/edit/delete rules
 * - prism projects    : Manage projects
 * - prism brands      : Manage brand profiles
 * - prism generate    : Generate component with AI
 * - prism marketplace : Browse and install rule sets
 * - prism analytics   : View usage stats
 * - prism telemetry   : View token telemetry and baseline
 * - prism kitchen     : Context Kitchen — analyze, preview, trim, history, optimize
 * - prism api-keys    : Manage API keys
 * - prism doctor      : Health check — verify all Prism systems
 * - prism status      : Quick snapshot of current Prism state
 * - prism check       : The Pass — enforce local .prism/rules.json on written files
 */

import { Command } from "commander";
import { login } from "./commands/login.js";
import { sync } from "./commands/sync.js";
import { serve } from "./commands/serve.js";
import {
  listRules,
  createRule,
  editRule,
  deleteRule,
} from "./commands/rules.js";
import { connect } from "./commands/connect.js";
import { init } from "./commands/init.js";
import {
  listProjects,
  viewProject,
  createProject,
  deleteProject,
} from "./commands/projects.js";
import {
  listBrands,
  viewBrand,
  createBrand,
  exportBrand,
  deleteBrand,
} from "./commands/brands.js";
import { generate } from "./commands/generate.js";
import { listMarketplace, installMarketplace } from "./commands/marketplace.js";
import { analytics } from "./commands/analytics.js";
import { telemetry } from "./commands/telemetry.js";
import {
  kitchenAnalyze,
  kitchenPreview,
  kitchenTrim,
  kitchenHistory,
  kitchenOptimize,
} from "./commands/kitchen.js";
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
} from "./commands/api-keys.js";
import { doctor } from "./commands/doctor.js";
import { status } from "./commands/status.js";
import { check } from "./commands/check.js";

const program = new Command();

program
  .name("prism")
  .description("Prism Context Engine CLI - Context Governance for LLMs")
  .version("1.2.0");

program
  .command("login")
  .description("Authenticate with Prism Cloud")
  .action(login);

program
  .command("init")
  .description("Auto-detect IDEs and configure MCP connection")
  .action(init);

program
  .command("sync")
  .description("Sync projects, rules, brands, and components from Prism Cloud")
  .option("--full", "Force full re-sync instead of delta")
  .option(
    "--repo [path]",
    "Scan a local repository for naming conventions, import patterns, and config files",
  )
  .action((opts) => sync(opts));

program
  .command("serve")
  .description("Start Prism MCP server for IDE integration (stdio transport)")
  .option("--offline", "Force offline/cache-only mode")
  .action((opts) => serve(opts));

program
  .command("connect")
  .description(
    "Launch MCP proxy for IDE integration, or scan a URL for rule extraction",
  )
  .option("-u, --url <url>", "URL to scan for automatic rule extraction")
  .action((opts) => connect(opts));

// Rules (enhanced with CRUD)
const rulesCmd = program.command("rules").description("Manage rules");

rulesCmd
  .command("list")
  .description("List your rules")
  .option("-c, --category <category>", "Filter by category")
  .option("-p, --project <project>", "Filter by project slug/ID")
  .option("--json", "Output as JSON")
  .action(listRules);

rulesCmd
  .command("create")
  .description("Create a new rule")
  .option("-n, --name <name>", "Rule name")
  .option("-c, --category <category>", "Rule category")
  .option("--content <content>", "Rule content")
  .option("-p, --priority <number>", "Priority (1-100)", "50")
  .option("--project <project>", "Project slug/ID")
  .option("--json", "Output as JSON")
  .action((opts) => createRule(opts));

rulesCmd
  .command("edit <id>")
  .description("Edit a rule")
  .option("--name <name>", "New name")
  .option("--category <category>", "New category")
  .option("--content <content>", "New content")
  .option("--json", "Output as JSON")
  .action((id, opts) => editRule(id, opts));

rulesCmd
  .command("delete <id>")
  .description("Delete a rule")
  .option("--force", "Skip confirmation")
  .option("--json", "Output as JSON")
  .action((id, opts) => deleteRule(id, opts));

// Projects
const projectsCmd = program.command("projects").description("Manage projects");

projectsCmd
  .command("list")
  .description("List your projects")
  .option("--stack <stack>", "Filter by stack")
  .option("--design <design>", "Filter by design system")
  .option("--json", "Output as JSON")
  .action(listProjects);

projectsCmd
  .command("view <slug>")
  .description("View project details")
  .option("--json", "Output as JSON")
  .action(viewProject);

projectsCmd
  .command("create")
  .description("Create a new project")
  .option("-n, --name <name>", "Project name")
  .option("-d, --design <design>", "Design system")
  .option("-s, --stack <stack>", "Tech stack")
  .option("--json", "Output as JSON")
  .action(createProject);

projectsCmd
  .command("delete <slug>")
  .description("Delete a project")
  .option("--force", "Skip confirmation")
  .option("--json", "Output as JSON")
  .action(deleteProject);

// Brands
const brandsCmd = program
  .command("brands")
  .description("Manage brand profiles");

brandsCmd
  .command("list")
  .description("List your brands")
  .option("--json", "Output as JSON")
  .action(listBrands);

brandsCmd
  .command("view <slug>")
  .description("View brand details")
  .option("--json", "Output as JSON")
  .action(viewBrand);

brandsCmd
  .command("create")
  .description("Create a brand profile (interactive wizard)")
  .option("--json", "Output as JSON")
  .action(createBrand);

brandsCmd
  .command("export <slug>")
  .description("Export brand as IDE rules")
  .option(
    "-f, --format <format>",
    "Export format: cursor|windsurf|vscode|claude|css|tailwind",
    "cursor",
  )
  .option("-o, --output <file>", "Write to file")
  .option("--json", "Output as JSON")
  .action(exportBrand);

brandsCmd
  .command("delete <slug>")
  .description("Delete a brand")
  .option("--force", "Skip confirmation")
  .option("--json", "Output as JSON")
  .action(deleteBrand);

// Generate
program
  .command("generate")
  .description("Generate component with AI")
  .option("--prompt <prompt>", "Component description")
  .option("-d, --design <design>", "Design system", "jdstudio")
  .option("-s, --stack <stack>", "Tech stack", "nextjs")
  .option("--rules", "Also generate companion rules")
  .option("-o, --output <file>", "Save to file")
  .option("--json", "Output as JSON")
  .action(generate);

// Marketplace
const marketplaceCmd = program
  .command("marketplace")
  .description("Browse rule marketplace");

marketplaceCmd
  .command("list")
  .description("List marketplace rule sets")
  .option("-s, --search <query>", "Search query")
  .option("--json", "Output as JSON")
  .action(listMarketplace);

marketplaceCmd
  .command("install <id>")
  .description("Install a marketplace rule set")
  .option("--json", "Output as JSON")
  .action(installMarketplace);

// Analytics
program
  .command("analytics")
  .description("View usage stats and limits")
  .option("--json", "Output as JSON")
  .action(analytics);

// Telemetry
program
  .command("telemetry")
  .description("View token telemetry and baseline data")
  .option("--json", "Output as JSON")
  .action(telemetry);

// Kitchen
const kitchenCmd = program
  .command("kitchen")
  .description(
    "Context Kitchen — analyze, preview, trim, and optimize AI context",
  );

kitchenCmd
  .command("analyze")
  .description("Analyze how your rules will be used for a given task")
  .option("-t, --task <task>", "The task description to analyze against")
  .option("-b, --budget <number>", "Token budget", "4000")
  .option("--json", "Output as JSON")
  .action((opts) =>
    kitchenAnalyze({
      task: opts.task,
      budget: parseInt(opts.budget || "4000"),
      json: opts.json,
    }),
  );

kitchenCmd
  .command("preview")
  .description("Preview the exact context string that would be sent to the LLM")
  .option("-t, --task <task>", "Filter preview by task relevance")
  .option("--json", "Output as JSON")
  .action(kitchenPreview);

kitchenCmd
  .command("trim")
  .description("Trim rules to fit within a token budget")
  .option("-b, --budget <number>", "Token budget", "2000")
  .option("--json", "Output as JSON")
  .action((opts) =>
    kitchenTrim({ budget: parseInt(opts.budget || "2000"), json: opts.json }),
  );

kitchenCmd
  .command("history")
  .description("Show past kitchen analysis sessions")
  .option("--json", "Output as JSON")
  .action(kitchenHistory);

kitchenCmd
  .command("optimize")
  .description("Re-rank rules based on telemetry usage data")
  .option("--json", "Output as JSON")
  .action(kitchenOptimize);

// API Keys
const apiKeysCmd = program.command("api-keys").description("Manage API keys");

apiKeysCmd
  .command("list")
  .description("List API keys")
  .option("--json", "Output as JSON")
  .action(listApiKeys);

apiKeysCmd
  .command("create")
  .description("Generate a new API key")
  .option("--json", "Output as JSON")
  .action(createApiKey);

apiKeysCmd
  .command("revoke <id>")
  .description("Revoke an API key")
  .option("--force", "Skip confirmation")
  .option("--json", "Output as JSON")
  .action(revokeApiKey);

// Doctor
program
  .command("doctor")
  .description("Run a full health check on all Prism systems")
  .option("--json", "Output as JSON")
  .action((opts) => doctor(opts));

// Status
program
  .command("status")
  .description("Quick snapshot of your current Prism state")
  .option("--json", "Output as JSON")
  .action((opts) => status(opts));

// Check (the Pass)
program
  .command("check")
  .description(
    "The Pass — enforce local rules against files (agent hook or lint mode)",
  )
  .argument("[files...]", "Files or directories to check")
  .option("--rules <path>", "Path to .prism/rules.json (default: nearest ancestor)")
  .option(
    "--hook",
    "Agent hook mode: read a PostToolUse event JSON from stdin, exit 2 on blocking violations",
  )
  .option("--format <format>", "Hook message format", "claude-code")
  .action((files, opts) => check(files, opts));

program.parse();
