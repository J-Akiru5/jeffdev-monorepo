/**
 * Seed Test User for Playwright E2E Tests
 *
 * Creates a deterministic test admin user in Supabase Auth.
 * Run with: npx tsx scripts/seed-test-user.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const TEST_USER = {
  email: "test-admin@syntaxure.dev",
  password: "TestAdmin123!@#",
  full_name: "Test Admin",
  role: "admin" as const,
};

async function seedTestUser() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log("Seeding test admin user...");

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true,
    user_metadata: {
      full_name: TEST_USER.full_name,
    },
  });

  if (authError) {
    if (authError.message.includes("already exists")) {
      console.log(`User ${TEST_USER.email} already exists, skipping...`);
    } else {
      console.error("Failed to create auth user:", authError.message);
      process.exit(1);
    }
  } else {
    console.log(`Created auth user: ${authData.user.id}`);

    // Create user profile with admin role
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: authData.user.id,
        email: TEST_USER.email,
        full_name: TEST_USER.full_name,
        role: TEST_USER.role,
      });

    if (profileError) {
      console.error("Failed to create user profile:", profileError.message);
    } else {
      console.log("Created user profile with admin role");
    }
  }

  console.log("\nTest user credentials:");
  console.log(`  Email: ${TEST_USER.email}`);
  console.log(`  Password: ${TEST_USER.password}`);
  console.log("\nRun this script before running Playwright tests.");
}

seedTestUser().catch(console.error);
