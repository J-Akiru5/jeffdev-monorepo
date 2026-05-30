import chalk from "chalk";
import ora from "ora";
import { apiFetch, getApiOptions } from "../api.js";
import { createInterface } from "readline";
import { writeFileSync } from "fs";

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((r) => {
    rl.question(question, (a) => {
      rl.close();
      r(a.trim());
    });
  });
}

export async function listBrands(options: { json?: boolean }) {
  const result =
    await apiFetch<Array<Record<string, unknown>>>("/api/v1/brands");
  if (result.error) {
    console.error(chalk.red(`Error: ${result.error}`));
    process.exit(1);
  }

  const items = result.data || [];
  if (options.json) {
    console.log(JSON.stringify(items, null, 2));
    return;
  }
  if (items.length === 0) {
    console.log(chalk.yellow("No brands found."));
    return;
  }

  console.log(chalk.cyan(`\nBrands (${items.length}):\n`));
  for (const b of items) {
    const colors = b.colors as Record<string, string> | undefined;
    const swatch = colors ? `${colors.primary} ${colors.accent}` : "";
    console.log(
      `  ${chalk.bold(b.companyName)}  [${chalk.dim(b.industry)}]  ${chalk.dim(swatch)}`,
    );
    console.log(`    ${chalk.dim("slug:")} ${b.slug}`);
  }
  console.log("");
}

export async function viewBrand(slug: string, options: { json?: boolean }) {
  const brands =
    await apiFetch<Array<{ id: string; slug: string }>>("/api/v1/brands");
  const brand = (brands.data || []).find(
    (b) => b.slug === slug || b.id === slug,
  );
  if (!brand) {
    console.error(chalk.red("Brand not found."));
    process.exit(1);
  }

  const result = await apiFetch<Record<string, unknown>>(
    `/api/v1/brands/${brand.id}`,
  );
  if (result.error) {
    console.error(chalk.red(`Error: ${result.error}`));
    process.exit(1);
  }

  const b = result.data!;
  if (options.json) {
    console.log(JSON.stringify(b, null, 2));
    return;
  }

  console.log(chalk.cyan(`\n${b.companyName}`));
  console.log(`  Industry:     ${b.industry}`);
  if (b.tagline) console.log(`  Tagline:      "${b.tagline}"`);

  const colors = b.colors as Record<string, string> | undefined;
  if (colors) {
    console.log(chalk.bold("\n  Colors:"));
    for (const [k, v] of Object.entries(colors)) {
      console.log(`    ${chalk.hex(v || "#000")(`██`)} ${k}: ${v}`);
    }
  }

  const typography = b.typography as Record<string, string> | undefined;
  if (typography) {
    console.log(chalk.bold("\n  Typography:"));
    console.log(
      `    Heading: ${typography.headingFont}  |  Body: ${typography.bodyFont}`,
    );
    if (typography.monoFont) console.log(`    Mono:    ${typography.monoFont}`);
    console.log(`    Scale:   ${typography.scale}`);
  }

  const voice = b.voice as Record<string, unknown> | undefined;
  if (voice) {
    console.log(chalk.bold("\n  Voice:"));
    console.log(
      `    Personality: ${voice.personality}  |  Formality: ${voice.formality}`,
    );
    const kw = voice.keywords as string[] | undefined;
    if (kw?.length) console.log(`    Keywords: ${kw.join(", ")}`);
  }
  console.log("");
}

export async function createBrand(options: { json?: boolean }) {
  console.log(chalk.cyan("◈ Brand Creation Wizard\n"));
  const name = await prompt("Company name: ");
  const industryAnswer = await prompt(
    "Industry (photography/tech/agency/ecommerce/saas/healthcare/finance/education/other): ",
  );
  const tagline = await prompt("Tagline (optional): ");

  console.log(chalk.bold("\n--- Colors ---"));
  const primary = await prompt("Primary hex (e.g. #3B82F6): ");
  const secondary = await prompt("Secondary hex: ");
  const accent = await prompt("Accent hex: ");
  const background = await prompt("Background hex: ");
  const surface = await prompt("Surface hex: ");
  const text = await prompt("Text hex: ");
  const textMuted = await prompt("Text muted hex: ");

  console.log(chalk.bold("\n--- Typography ---"));
  const headingFont = await prompt("Heading font: ");
  const bodyFont = await prompt("Body font: ");
  const monoFont = await prompt("Mono font (optional): ");
  console.log("Scale: compact | default | spacious");
  const scale = (await prompt("Scale (default): ")) || "default";

  console.log(chalk.bold("\n--- Voice ---"));
  console.log("Personality: minimal | warm | bold | playful | corporate");
  const personality = await prompt("Personality: ");
  console.log("Formality: casual | balanced | formal");
  const formality = await prompt("Formality: ");
  const keywords = await prompt("Keywords (comma-separated): ");

  console.log(chalk.bold("\n--- Imagery ---"));
  console.log("Style: photography | illustration | 3d | mixed");
  const style = await prompt("Style: ");
  console.log("Mood: light | dark | moody | vibrant");
  const mood = await prompt("Mood: ");

  console.log(chalk.bold("\n--- Spacing ---"));
  const unit = parseInt((await prompt("Spacing unit (4): ")) || "4");
  console.log("Border radius: none | sm | md | lg | full");
  const borderRadius = (await prompt("Border radius (sm): ")) || "sm";

  const payload = {
    companyName: name,
    tagline: tagline || undefined,
    industry: industryAnswer,
    colors: {
      primary,
      secondary,
      accent,
      background,
      surface,
      text,
      textMuted,
    },
    typography: {
      headingFont,
      bodyFont,
      monoFont: monoFont || undefined,
      scale,
    },
    voice: {
      personality,
      formality,
      keywords: keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    },
    imagery: { style, mood },
    spacing: { unit, borderRadius },
  };

  const spinner = ora("Creating brand...").start();
  const result = await apiFetch("/api/v1/brands", {
    method: "POST",
    body: payload,
  });
  if (result.error) {
    spinner.fail(result.error);
    process.exit(1);
  }
  spinner.succeed("Brand created");

  if (options.json) {
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }
  const b = result.data as Record<string, unknown>;
  console.log(`  ${chalk.bold(b.companyName)} (${b.slug})`);
}

export async function exportBrand(
  slug: string,
  options: { format: string; json?: boolean; output?: string },
) {
  const brands =
    await apiFetch<Array<{ id: string; slug: string }>>("/api/v1/brands");
  const brand = (brands.data || []).find(
    (b) => b.slug === slug || b.id === slug,
  );
  if (!brand) {
    console.error(chalk.red("Brand not found."));
    process.exit(1);
  }

  const format = options.format || "cursor";
  const opts = getApiOptions();
  const spinner = ora(`Exporting brand as ${format}...`).start();

  const response = await fetch(
    `${opts.apiUrl}/api/v1/brands/${brand.id}/export?format=${format}`,
    {
      headers: { Authorization: `Bearer ${opts.token}` },
    },
  );
  const content = await response.text();
  spinner.succeed("Brand exported");

  if (options.output) {
    writeFileSync(options.output, content);
    console.log(`  Written to: ${options.output}`);
  } else {
    console.log(content);
  }
}

export async function deleteBrand(
  slug: string,
  options: { json?: boolean; force?: boolean },
) {
  if (!options.force && !options.json) {
    const answer = await prompt(chalk.red(`Delete brand "${slug}"? (y/N): `));
    if (answer.toLowerCase() !== "y") {
      console.log("Cancelled.");
      return;
    }
  }

  const brands =
    await apiFetch<Array<{ id: string; slug: string }>>("/api/v1/brands");
  const brand = (brands.data || []).find(
    (b) => b.slug === slug || b.id === slug,
  );
  if (!brand) {
    console.error(chalk.red("Brand not found."));
    process.exit(1);
  }

  const spinner = ora("Deleting brand...").start();
  const result = await apiFetch(`/api/v1/brands/${brand.id}`, {
    method: "DELETE",
  });
  if (result.error) {
    spinner.fail(result.error);
    process.exit(1);
  }
  spinner.succeed("Brand deleted");
  if (options.json) console.log(JSON.stringify({ deleted: true }, null, 2));
}
