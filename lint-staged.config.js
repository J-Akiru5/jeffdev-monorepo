const path = require("path");

module.exports = {
  "*.{js,jsx,ts,tsx}": (filenames) => {
    const groups = {};
    filenames.forEach((filename) => {
      const relative = path.relative(process.cwd(), filename);
      const parts = relative.split(path.sep);
      if (parts[0] === "apps" || parts[0] === "packages") {
        const pkgDir = `${parts[0]}/${parts[1]}`;
        if (!groups[pkgDir]) {
          groups[pkgDir] = [];
        }
        groups[pkgDir].push(filename);
      } else {
        if (!groups["."]) {
          groups["."] = [];
        }
        groups["."].push(filename);
      }
    });

    const commands = [];
    Object.keys(groups).forEach((pkgDir) => {
      const files = groups[pkgDir].join(" ");
      if (pkgDir !== ".") {
        // Run eslint in the context of the workspace package
        commands.push(`pnpm --filter ${pkgDir} exec eslint --fix ${files}`);
      } else {
        // For root-level js/ts files, run eslint if we have a config, otherwise fallback to prettier
        // Since we don't have a root eslint config, we only run prettier
      }
    });

    // Run prettier on all staged js/ts/jsx/tsx files
    commands.push(`prettier --write ${filenames.join(" ")}`);
    return commands;
  },
  "*.{json,md,yml,yaml}": (filenames) => {
    return `prettier --write ${filenames.join(" ")}`;
  },
};
