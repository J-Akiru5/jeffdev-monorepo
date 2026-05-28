const { spawn } = require("child_process");

const maxOldSpaceSize = "4096";

process.env.NODE_OPTIONS =
  (process.env.NODE_OPTIONS || "") + ` --max-old-space-size=${maxOldSpaceSize}`;

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/with-memory-limit.js <command> [args...]");
  process.exit(1);
}

const child = spawn(args[0], args.slice(1), {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (err) => {
  console.error("Failed to start command:", err.message);
  process.exit(1);
});
