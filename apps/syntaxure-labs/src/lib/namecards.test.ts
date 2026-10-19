import { describe, expect, it } from "vitest";
import { mapPublicNamecard } from "./namecards";

/**
 * Namecard privacy tests
 * ----------------------
 * The public card is opt-in: contact details and social links only render
 * when the profile explicitly enables them.
 */

const baseRow = {
  id: "u1",
  email: "jeff@syntaxure.dev",
  full_name: "Jeff Martinez",
  avatar_url: "https://cdn.example.com/avatar.png",
  bio: "Founder",
  phone: "+63 900 000 0000",
  preferences: null as Record<string, unknown> | null,
};

describe("mapPublicNamecard", () => {
  it("is private by default (no contact details, no socials)", () => {
    const card = mapPublicNamecard(baseRow, "jeff");

    expect(card.username).toBe("jeff");
    expect(card.displayName).toBe("Jeff Martinez");
    expect(card.bio).toBe("Founder");
    expect(card.photoURL).toBe("https://cdn.example.com/avatar.png");
    expect(card.email).toBeUndefined();
    expect(card.phone).toBeUndefined();
    expect(card.social).toBeUndefined();
  });

  it("honours showEmail and showPhone opt-ins", () => {
    const card = mapPublicNamecard(
      {
        ...baseRow,
        preferences: {
          namecard: { username: "jeff", showEmail: true, showPhone: true },
        },
      },
      "jeff",
    );

    expect(card.email).toBe("jeff@syntaxure.dev");
    expect(card.phone).toBe("+63 900 000 0000");
  });

  it("only renders explicitly enabled social links", () => {
    const card = mapPublicNamecard(
      {
        ...baseRow,
        preferences: {
          namecard: {
            username: "jeff",
            socials: { linkedin: true, github: false },
          },
          social: {
            linkedin: "https://linkedin.com/in/jeff",
            github: "https://github.com/jeff",
            twitter: "https://twitter.com/jeff",
          },
        },
      },
      "jeff",
    );

    expect(card.social).toEqual({ linkedin: "https://linkedin.com/in/jeff" });
  });

  it("passes through namecard text and styling", () => {
    const card = mapPublicNamecard(
      {
        ...baseRow,
        preferences: {
          namecard: {
            username: "jeff",
            title: "Founder",
            tagline: "Builds things",
            accentColor: "#22d3ee",
            background: "void",
          },
        },
      },
      "jeff",
    );

    expect(card.title).toBe("Founder");
    expect(card.tagline).toBe("Builds things");
    expect(card.accentColor).toBe("#22d3ee");
    expect(card.background).toBe("void");
  });

  it("falls back to the email local part when there is no name", () => {
    const card = mapPublicNamecard({ ...baseRow, full_name: null }, "jeff");

    expect(card.displayName).toBe("jeff");
  });
});
