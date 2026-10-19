/**
 * Public namecard mapping (pure)
 * ------------------------------
 * Namecards are opt-in: a profile becomes public at /card/<username> only when
 * `preferences.namecard.username` is set. Contact details and social links are
 * exposed only when explicitly enabled — never by default.
 */

import type { PublicNamecard } from "@/types/user";

export interface NamecardProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  preferences: Record<string, unknown> | null;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function mapPublicNamecard(
  row: NamecardProfileRow,
  handle: string,
): PublicNamecard {
  const preferences = record(row.preferences);
  const namecard = record(preferences.namecard);
  const socialUrls = record(preferences.social);
  const socialFlags = record(namecard.socials);

  // Opt-in only: a link renders when its flag is explicitly true.
  const social: Record<string, string> = {};
  for (const key of ["linkedin", "github", "twitter", "website"] as const) {
    if (socialFlags[key] === true) {
      const url = text(socialUrls[key]);
      if (url) social[key] = url;
    }
  }

  return {
    username: handle,
    displayName:
      text(row.full_name) ??
      (text(row.email) ? text(row.email)!.split("@")[0]! : "Syntaxure Labs"),
    title: text(namecard.title),
    tagline: text(namecard.tagline),
    photoURL: text(row.avatar_url),
    bio: text(row.bio),
    email: namecard.showEmail === true ? text(row.email) : undefined,
    phone: namecard.showPhone === true ? text(row.phone) : undefined,
    social: Object.keys(social).length > 0 ? social : undefined,
    accentColor: text(namecard.accentColor),
    background: text(namecard.background),
  };
}
