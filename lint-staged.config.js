const path = require("path");
const fs = require("fs");

module.exports = {
  "*.{js,jsx,ts,tsx}": (filenames) => {
    const packageFiles = {};
    filenames.forEach((file) => {
      const relativePath = path.relative(process.cwd(), file);
      const parts = relativePath.split(path.sep);
      if (parts.length > 2 && (parts[0] === "apps" || parts[0] === "packages")) {
        const pkgDir = parts[0] + "/" + parts[1];
        if (!packageFiles[pkgDir]) {
          packageFiles[pkgDir] = [];
        }
        packageFiles[pkgDir].push(file);
      }
    });

    const commands = [];
    Object.entries(packageFiles).forEach(([pkgDir, files]) => {
      const pkgJsonPath = path.join(process.cwd(), pkgDir, "package.json");
      if (fs.existsSync(pkgJsonPath)) {
        try {
          const pkgName = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8")).name;
          const relativeFiles = files.map(file => `"${path.relative(pkgDir, file)}"`).join(" ");
          commands.push(`pnpm --filter ${pkgName} exec eslint --fix ${relativeFiles}`);
        } catch (e) {
          // Fallback if package.json read/parse fails
        }
      }
    });

    return commands;
  },
  "*.{json,md,yml,yaml}": ["prettier --write"],
};
