"use server";

/**
 * Users Server Actions
 * --------------------
 * Public namecards: a profile is published at /card/<username> when
 * `preferences.namecard.username` is set. Contact details are gated by the
 * profile's own showEmail/showPhone/socials flags (see lib/namecards.ts).
 */

import { getAdminClient } from "@/lib/supabase/admin";
import {
  mapPublicNamecard,
  type NamecardProfileRow,
} from "@/lib/namecards";
import type { PublicNamecard } from "@/types/user";

export async function getPublicNamecard(
  handle: string,
): Promise<PublicNamecard | null> {
  const username = (handle || "").trim();
  if (!username || username.length > 64) return null;

  try {
    const supabase = getAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("user_profiles")
      .select("id, email, full_name, avatar_url, bio, phone, preferences")
      .eq("preferences->namecard->>username", username)
      .maybeSingle();

    if (error || !data) return null;
    return mapPublicNamecard(data as NamecardProfileRow, username);
  } catch (error) {
    console.error("[NAMECARD] lookup failed", error);
    return null;
  }
}
