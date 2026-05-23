#!/usr/bin/env node
/**
 * Clerk User Export → Supabase Import Script
 * Migrates users from Clerk JSON/CSV export to Supabase Auth + user_profiles
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

interface ClerkUser {
  id: string;
  email_addresses?: Array<{ email_address: string }>;
  first_name?: string;
  last_name?: string;
  public_metadata?: {
    role?: string;
    tier?: string;
    [key: string]: any;
  };
  private_metadata?: {
    [key: string]: any;
  };
}

interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ userId: string; error: string }>;
  passwordResetLinks: Array<{ userId: string; email: string; link: string }>;
}

async function importClerkUsers(clerkExportPath: string): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read export file
  if (!fs.existsSync(clerkExportPath)) {
    throw new Error(`File not found: ${clerkExportPath}`);
  }

  let exportData: ClerkUser[];
  const fileContent = fs.readFileSync(clerkExportPath, "utf-8");

  try {
    const parsed = JSON.parse(fileContent);
    // Handle both direct array and { users: [...] } format
    exportData = Array.isArray(parsed) ? parsed : parsed.users || [];
  } catch (err) {
    throw new Error(
      `Invalid JSON format: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const stats: ImportStats = {
    total: exportData.length,
    imported: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
    passwordResetLinks: [],
  };

  console.log(`\n📊 Starting import of ${stats.total} users from Clerk...\n`);

  for (const clerkUser of exportData) {
    try {
      const email =
        clerkUser.email_addresses?.[0]?.email_address ||
        `user_${clerkUser.id}@placeholder.local`;

      if (!email || email.includes("@placeholder.local")) {
        console.warn(`⚠️  Skipping user ${clerkUser.id} - no valid email`);
        stats.skipped++;
        continue;
      }

      // Create Supabase auth user (minimal password, will force reset)
      const tempPassword = Buffer.from(
        `clerk_${clerkUser.id}_${Date.now()}`,
      ).toString("base64");

      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            clerk_id: clerkUser.id,
            migrated_from: "clerk",
            migrated_at: new Date().toISOString(),
          },
        });

      if (authError) {
        // Check if user already exists
        if (authError.message?.includes("already exists")) {
          console.log(`ℹ️  User already exists: ${email}`);
          stats.skipped++;
          continue;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error("No user returned from Supabase auth.createUser");
      }

      // Create user_profiles entry
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: authData.user.id,
          email,
          full_name:
            `${clerkUser.first_name || ""} ${clerkUser.last_name || ""}`.trim(),
          role: clerkUser.public_metadata?.role || "employee",
          tier: clerkUser.public_metadata?.tier || "free",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        // If profile creation fails, warn but don't fail the whole import
        console.warn(
          `⚠️  Profile creation failed for ${email}: ${profileError.message}`,
        );
      }

      // Generate password reset link
      const { data: linkData, error: linkError } =
        await supabase.auth.admin.generateLink({
          type: "recovery",
          email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password`,
          },
        });

      if (linkError) {
        console.warn(`⚠️  Password reset link generation failed for ${email}`);
      } else if (linkData?.properties?.action_link) {
        stats.passwordResetLinks.push({
          userId: authData.user.id,
          email,
          link: linkData.properties.action_link,
        });
      }

      stats.imported++;
      console.log(`✅ Imported user: ${email} (${clerkUser.id})`);
    } catch (err) {
      stats.errors++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      stats.errorDetails.push({
        userId: clerkUser.id,
        error: errorMessage,
      });
      console.error(`❌ Failed to import ${clerkUser.id}: ${errorMessage}`);
    }
  }

  // Print summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📈 IMPORT SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Total processed:     ${stats.total}`);
  console.log(
    `Successfully imported: ${stats.imported} (${((stats.imported / stats.total) * 100).toFixed(1)}%)`,
  );
  console.log(`Skipped:             ${stats.skipped}`);
  console.log(`Errors:              ${stats.errors}`);
  console.log(`Password reset links: ${stats.passwordResetLinks.length}`);
  console.log(`${"=".repeat(60)}\n`);

  if (stats.errorDetails.length > 0) {
    console.log(`\n⚠️  ERRORS ENCOUNTERED:\n`);
    stats.errorDetails.forEach(({ userId, error }) => {
      console.log(`  - ${userId}: ${error}`);
    });
  }

  // Save password reset links to file
  if (stats.passwordResetLinks.length > 0) {
    const linksPath = path.join(
      process.cwd(),
      "clerk-password-reset-links.json",
    );
    fs.writeFileSync(
      linksPath,
      JSON.stringify(stats.passwordResetLinks, null, 2),
    );
    console.log(`\n💌 Password reset links saved to: ${linksPath}`);
  }

  // Exit with error code if there were import failures
  if (stats.errors > 0) {
    process.exit(1);
  }
}

// Main execution
const clerkExportPath = process.argv[2];

if (!clerkExportPath) {
  console.error(
    "Usage: npx tsx scripts/import-clerk-users.ts <path-to-clerk-export.json>",
  );
  process.exit(1);
}

importClerkUsers(clerkExportPath)
  .then(() => {
    console.log("✨ Import completed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("💥 Import failed:", err);
    process.exit(1);
  });
