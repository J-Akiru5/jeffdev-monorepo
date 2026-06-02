import { createAdmin } from "@syntaxure/supabase/admin";
import type { Database } from "@/lib/database.types";

export const getAdminClient = () => createAdmin<Database>();
