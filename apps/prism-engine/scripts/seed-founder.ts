/**
 * Founder Account Seeder
 *
 * Creates the founder account (jeffmartinez@syntaxure.dev) with:
 * - Supabase auth user (email/password)
 * - user_profiles record with role = 'admin'
 * - Enterprise subscription in Postgres (prism_subscriptions)
 *
 * Run: pnpm --filter prism-engine exec dotenv -e .env.local -- tsx scripts/seed-founder.ts
 * Or:  doppler run -- pnpm --filter prism-engine exec tsx scripts/seed-founder.ts
 */

import { createClient } from "@supabase/supabase-js";
import { getPrismDb } from "@syntaxure-labs/db/prism";

const FOUNDER_EMAIL = "jeffmartinez@syntaxure.dev";
const FOUNDER_PASSWORD = "prism-admin2026!";
const FOUNDER_NAME = "Jeff Martinez";

async function main() {
  console.log("🚀 Seeding founder account...");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY_;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(
      (u) => u.email === FOUNDER_EMAIL,
    );

    let userId: string;

    if (existingUser) {
      console.log("👤 Founder user already exists in auth, updating password...");
      const { data, error } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: FOUNDER_PASSWORD },
      );
      if (error) throw error;
      userId = data.user.id;
      console.log("✅ Password updated");
    } else {
      console.log("👤 Creating founder auth user...");
      const { data, error } = await supabase.auth.admin.createUser({
        email: FOUNDER_EMAIL,
        password: FOUNDER_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: FOUNDER_NAME },
      });
      if (error) throw error;
      userId = data.user.id;
      console.log("✅ Founder auth user created");
    }

    // Create/update user_profiles in Supabase
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (existingProfile) {
      console.log("👤 Profile exists, updating role to admin...");
      await supabase
        .from("user_profiles")
        .update({
          full_name: FOUNDER_NAME,
          role: "admin",
          tier: "enterprise",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } else {
      console.log("👤 Creating user profile with admin role...");
      await supabase.from("user_profiles").insert({
        id: userId,
        email: FOUNDER_EMAIL,
        full_name: FOUNDER_NAME,
        role: "admin",
        tier: "enterprise",
      });
    }
    console.log("✅ User profile set to admin");

    // Create/update enterprise subscription in Postgres
    const db = getPrismDb();
    const now = new Date();
    const tenYearsOut = new Date(
      now.getFullYear() + 10,
      now.getMonth(),
      now.getDate(),
    );

    const { error: subError } = await db.from("prism_subscriptions").upsert(
      {
        user_id: userId,
        tier: "enterprise",
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: tenYearsOut.toISOString(),
        metadata: {
          isFounder: true,
          notes: "Founder account - full access",
        },
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (subError) throw subError;
    console.log("✅ Enterprise subscription upserted");

    console.log("\n🎉 Founder account seeded successfully!");
    console.log(`   Email:    ${FOUNDER_EMAIL}`);
    console.log(`   Password: ${FOUNDER_PASSWORD}`);
    console.log(`   Role:     admin`);
    console.log(`   Tier:     enterprise`);
    console.log("\nSign in at /sign-in with email/password or use Google/GitHub OAuth.");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
