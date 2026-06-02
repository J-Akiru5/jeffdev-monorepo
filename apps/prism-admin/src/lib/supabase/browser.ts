import { createBrowser } from "@syntaxure/supabase/browser";
import type { Database } from "@/lib/database.types";

export const createClient = () => createBrowser<Database>();
