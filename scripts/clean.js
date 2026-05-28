const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

function removeIfExists(dir) {
  if (fs.existsSync(dir)) {
    const size = getDirSize(dir);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`  ✓ Removed ${path.relative(ROOT, dir)} (${formatSize(size)})`);
    return true;
  }
  return false;
}

function getDirSize(dir) {
  try {
    const files = fs.readdirSync(dir, { recursive: true });
    let size = 0;
    for (const file of files) {
      try {
        const stat = fs.statSync(path.join(dir, file));
        size += stat.size;
      } catch {}
    }
    return size;
  } catch {
    return 0;
  }
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

console.log("\n🧹 Cleaning caches...\n");

// 1. Turbo cache
removeIfExists(path.join(ROOT, ".turbo", "cache"));

// 2. .next directories in all apps
const appsDir = path.join(ROOT, "apps");
if (fs.existsSync(appsDir)) {
  for (const app of fs.readdirSync(appsDir)) {
    const nextDir = path.join(appsDir, app, ".next");
    removeIfExists(nextDir);
  }
}

// 3. .next in packages (if any)
const packagesDir = path.join(ROOT, "packages");
if (fs.existsSync(packagesDir)) {
  for (const pkg of fs.readdirSync(packagesDir)) {
    const nextDir = path.join(packagesDir, pkg, ".next");
    removeIfExists(nextDir);
  }
}

// 4. node_modules (optional, prompt)
if (process.argv.includes("--all")) {
  console.log("\n  Cleaning node_modules...");
  for (const dir of ["apps", "packages"]) {
    const fullDir = path.join(ROOT, dir);
    if (fs.existsSync(fullDir)) {
      for (const item of fs.readdirSync(fullDir)) {
        const nmDir = path.join(fullDir, item, "node_modules");
        removeIfExists(nmDir);
      }
    }
  }
}

console.log("\n✅ Done. Run 'pnpm install' if you removed node_modules.\n");
