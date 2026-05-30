const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load local environment files if running locally without Doppler
const rootDir = path.join(__dirname, "..");
const initialEnvKeys = new Set(Object.keys(process.env));
const envFiles = [".env", ".env.local"];

envFiles.forEach((file) => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const firstEqual = trimmed.indexOf("=");
        if (firstEqual === -1) return;
        const key = trimmed.substring(0, firstEqual).trim();
        let val = trimmed.substring(firstEqual + 1).trim();
        // Remove surrounding quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        // Set env variable if not already set by host/Doppler
        if (!initialEnvKeys.has(key)) {
          process.env[key] = val;
        }
      });
    } catch (e) {
      console.warn(`Warning: Failed to load ${file}:`, e.message);
    }
  }
});

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
