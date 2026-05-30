import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

/** Cookie domain for cross-subdomain auth sharing. Set COOKIE_DOMAIN=.syntaxure.dev in production. */
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

export async function createClient() {
  const cookieStore = await cookies();

  // In development, if env vars are missing, load them from parent directories (.env or .env.local)
  if (
    process.env.NODE_ENV === "development" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ) {
    const searchDirs = [process.cwd(), __dirname];
    for (const startDir of searchDirs) {
      let dir = startDir;
      while (dir && dir !== path.parse(dir).root) {
        const envLocalPath = path.join(dir, ".env.local");
        const envPath = path.join(dir, ".env");
        
        const loadEnvFile = (filePath: string) => {
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
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                  val = val.substring(1, val.length - 1);
                }
                if (!process.env[key]) {
                  process.env[key] = val;
                }
              });
            } catch {}
          }
        };
        
        loadEnvFile(envPath);
        loadEnvFile(envLocalPath);
        
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
          if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
          }
          break;
        }
        dir = path.dirname(dir);
      }
    }
  }

  // During build time, return a placeholder if env vars are missing
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }>,
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
              }),
            );
          } catch {
            // The `setAll` method was called from a Server Component
            // This can be ignored if you have middleware refreshing user sessions
          }
        },
      },
    },
  );
}
