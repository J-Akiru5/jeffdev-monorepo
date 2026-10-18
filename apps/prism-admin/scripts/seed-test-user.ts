/**
 * Seed Test Users for Playwright E2E Tests
 *
 * Creates deterministic test users in Supabase Auth:
 *  - test-admin@syntaxure.dev    (role: admin)
 *  - test-employee@syntaxure.dev (role: employee)
 *
 * The employee is used by e2e/authz-live.spec.ts to prove that authenticated
 * non-admin users are rejected from privileged routes.
 *
 * Run with: npx tsx scripts/seed-test-user.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const TEST_USERS = [
  {
    email: "test-admin@syntaxure.dev",
    password: "TestAdmin123!@#",
    full_name: "Test Admin",
    role: "admin" as const,
  },
  {
    email: "test-employee@syntaxure.dev",
    password: "TestEmployee123!@#",
    full_name: "Test Employee",
    role: "employee" as const,
  },
];

async function seedTestUsers() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  for (const TEST_USER of TEST_USERS) {
    console.log(`Seeding test user ${TEST_USER.email}...`);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
      user_metadata: {
        full_name: TEST_USER.full_name,
      },
    });

    let userId = authData.user?.id;
    if (authError) {
      if (authError.message.includes("already exists")) {
        console.log(`User ${TEST_USER.email} already exists, skipping create...`);
        const { data: listed } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        userId = (listed?.users || []).find((u) => u.email === TEST_USER.email)?.id;
        // Reset the password so the deterministic credentials always work.
        if (userId) {
          await supabase.auth.admin.updateUserById(userId, {
            password: TEST_USER.password,
          });
        }
      } else {
        console.error("Failed to create auth user:", authError.message);
        continue;
      }
    } else {
      console.log(`Created auth user: ${userId}`);
    }

    if (!userId) {
      console.error(`Could not resolve user id for ${TEST_USER.email}`);
      continue;
    }

    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        email: TEST_USER.email,
        full_name: TEST_USER.full_name,
        role: TEST_USER.role,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Failed to create user profile:", profileError.message);
    } else {
      console.log(`Created user profile with ${TEST_USER.role} role`);
    }
  }

  console.log("\nTest user credentials:");
  for (const u of TEST_USERS) {
    console.log(`  ${u.email} / ${u.password} (${u.role})`);
  }
  console.log("\nRun this script before running Playwright tests.");
}

seedTestUsers().catch(console.error);
