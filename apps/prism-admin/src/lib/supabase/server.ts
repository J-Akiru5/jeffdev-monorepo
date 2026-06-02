import { createServer as createSharedServer } from "@syntaxure/supabase/server";
import type { Database } from "@/lib/database.types";
import fs from "fs";
import path from "path";

if (process.env.NODE_ENV === "development") {
  let rootDir = process.cwd();
  while (rootDir && rootDir !== path.parse(rootDir).root) {
    if (fs.existsSync(path.join(rootDir, "pnpm-workspace.yaml"))) break;
    rootDir = path.dirname(rootDir);
  }

  const envFiles = [".env", ".env.local"];
  for (const file of envFiles) {
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
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.substring(1, val.length - 1);
          }
          if (!process.env[key]) process.env[key] = val;
        });
      } catch {}
    }
  }

  if (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  }
}

export const createClient = () => createSharedServer<Database>();
