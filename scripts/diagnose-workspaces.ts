import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from apps/prism-manage/.env.local
const envPath = path.resolve(process.cwd(), "apps/prism-manage/.env.local");
if (fs.existsSync(envPath)) {
  console.log(`Loading env variables from: ${envPath}`);
  const content = fs.readFileSync(envPath, "utf-8");
  content.replace(/\r/g, "").split("\n").forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith("#") || !line.includes("=")) return;
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      // Remove surrounding quotes if present
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      } else if (val.startsWith("'") && val.endsWith("'")) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("SUPABASE_URL:", supabaseUrl);
    console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "[CONFIGURED]" : "[MISSING]");
    throw new Error("Missing Supabase configuration. Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local");
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("Checking workspaces...");
  const { data: workspaces, error: wsError } = await supabase
    .from("workspaces")
    .select("*");
  
  if (wsError) throw wsError;
  console.log("Workspaces in DB:", workspaces);

  let syntaxureWs = workspaces?.find(w => w.name === "Syntaxure Labs" || w.name === "Syntaxure Labs, Inc.");

  if (!syntaxureWs) {
    console.log("Syntaxure Labs workspace NOT found. Creating it...");
    const { data: newWs, error: createWsError } = await supabase
      .from("workspaces")
      .insert({ name: "Syntaxure Labs" })
      .select()
      .single();
    
    if (createWsError) throw createWsError;
    syntaxureWs = newWs;
    console.log("Created workspace:", syntaxureWs);
  } else {
    console.log("Syntaxure Labs workspace found:", syntaxureWs);
  }

  console.log("Checking departments for Syntaxure Labs...");
  const { data: departments, error: deptError } = await supabase
    .from("departments")
    .select("*")
    .eq("workspace_id", syntaxureWs.id);
  
  if (deptError) throw deptError;
  console.log("Departments in DB:", departments);

  if (!departments || departments.length === 0) {
    console.log("Seeding departments...");
    const { error: seedDeptError } = await supabase
      .from("departments")
      .insert([
        { workspace_id: syntaxureWs.id, name: "Executive" },
        { workspace_id: syntaxureWs.id, name: "Engineering" },
        { workspace_id: syntaxureWs.id, name: "Operations" },
        { workspace_id: syntaxureWs.id, name: "Marketing" },
        { workspace_id: syntaxureWs.id, name: "Product" }
      ]);
    if (seedDeptError) throw seedDeptError;
    console.log("Seeded departments successfully.");
  }

  console.log("Checking user profiles...");
  let { data: profiles, error: profileError } = await supabase
    .from("user_profiles")
    .select("*");
  
  if (profileError) throw profileError;
  console.log("User profiles in DB:", profiles?.map(p => ({ id: p.id, email: p.email, role: p.role })));

  console.log("Checking auth users...");
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Failed to list auth users:", authError.message);
  } else {
    console.log("Auth users in DB:", users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })));
    
    // Auto-heal missing profiles
    for (const authUser of users) {
      const hasProfile = profiles?.some(p => p.id === authUser.id);
      if (!hasProfile && authUser.email) {
        console.log(`Auth user ${authUser.email} is missing a profile. Creating profile...`);
        const { data: newProfile, error: insError } = await supabase
          .from("user_profiles")
          .insert({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.email.split("@")[0],
            role: "admin",
            tier: "free",
            timezone: "UTC"
          })
          .select()
          .single();
        if (insError) {
          console.error(`Failed to create profile for ${authUser.email}:`, insError.message);
        } else if (newProfile) {
          console.log(`Created profile for ${authUser.email} successfully.`);
          if (profiles) {
            profiles.push(newProfile);
          } else {
            profiles = [newProfile];
          }
        }
      }
    }
  }

  console.log("Checking workspace memberships...");
  const { data: memberships, error: memError } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", syntaxureWs.id);
  
  if (memError) throw memError;
  console.log("Memberships in Syntaxure Labs:", memberships);

  const execDept = departments?.find(d => d.name === "Executive") || departments?.[0];

  if (profiles) {
    for (const profile of profiles) {
      const existingMember = memberships?.find(m => m.user_id === profile.id);
      if (!existingMember) {
        console.log(`User ${profile.email || profile.id} is NOT a member of Syntaxure Labs. Adding as founder...`);
        const { error: addMemError } = await supabase
          .from("workspace_members")
          .insert({
            workspace_id: syntaxureWs.id,
            user_id: profile.id,
            role: "founder",
            department_id: execDept?.id || null
          });
        if (addMemError) {
          console.error(`Failed to add user ${profile.id}:`, addMemError.message);
        } else {
          console.log(`Added user ${profile.email || profile.id} successfully.`);
        }
      } else {
        console.log(`User ${profile.email || profile.id} is already a member of Syntaxure Labs.`);
        
        // Check if we should elevate/update membership details
        const isJeffEmail = profile.email && (profile.email.includes("jeff") || profile.email.includes("syntaxure.dev") || profile.email.includes("isufst.edu.ph"));
        const shouldElevate = profile.role === "admin" || isJeffEmail;
        
        const updates: Record<string, any> = {};
        if (shouldElevate && existingMember.role !== "founder") {
          updates.role = "founder";
        }
        if (!existingMember.department_id && execDept) {
          updates.department_id = execDept.id;
        }

        if (Object.keys(updates).length > 0) {
          console.log(`Updating membership details for user ${profile.email}:`, updates);
          const { error: updateMemError } = await supabase
            .from("workspace_members")
            .update(updates)
            .eq("workspace_id", syntaxureWs.id)
            .eq("user_id", profile.id);
          
          if (updateMemError) {
            console.error(`Failed to update membership for user ${profile.email}:`, updateMemError.message);
          } else {
            console.log(`Updated membership for user ${profile.email} successfully.`);
          }
        }
      }
    }
  }

  console.log("Database diagnosis and auto-healing complete!");
}

run().catch(console.error);
