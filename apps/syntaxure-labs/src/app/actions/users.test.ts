import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Namecard action tests
 * ---------------------
 * The Supabase client is mocked: these pin the lookup path (the JSONB
 * namecard username — there is no `username` column) and null behaviour.
 */

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: () => ({ from: mocks.from }),
}));

import { getPublicNamecard } from "./users";

interface Query {
  result: unknown;
  eqs: Array<[string, unknown]>;
}

function chain({ result, eqs }: Query) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = {
    select: () => q,
    eq: (column: string, value: unknown) => {
      eqs.push([column, value]);
      return q;
    },
    maybeSingle: async () => result,
  };
  return q;
}

const row = {
  id: "u1",
  email: "jeff@syntaxure.dev",
  full_name: "Jeff Martinez",
  avatar_url: null,
  bio: "Founder",
  phone: null,
  preferences: {
    namecard: { username: "jeff", showEmail: true },
  },
};

beforeEach(() => {
  mocks.from.mockReset();
});

describe("getPublicNamecard", () => {
  it("looks profiles up by the namecard username path", async () => {
    const eqs: Array<[string, unknown]> = [];
    mocks.from.mockReturnValue(
      chain({ result: { data: row, error: null }, eqs }),
    );

    const card = await getPublicNamecard("jeff");

    expect(mocks.from).toHaveBeenCalledWith("user_profiles");
    expect(eqs[0]).toEqual(["preferences->namecard->>username", "jeff"]);
    expect(card?.displayName).toBe("Jeff Martinez");
    expect(card?.email).toBe("jeff@syntaxure.dev");
  });

  it("returns null when the handle is unknown", async () => {
    const eqs: Array<[string, unknown]> = [];
    mocks.from.mockReturnValue(
      chain({ result: { data: null, error: null }, eqs }),
    );

    expect(await getPublicNamecard("nobody")).toBeNull();
  });

  it("returns null on a database error", async () => {
    const eqs: Array<[string, unknown]> = [];
    mocks.from.mockReturnValue(
      chain({ result: { data: null, error: { message: "boom" } }, eqs }),
    );

    expect(await getPublicNamecard("jeff")).toBeNull();
  });

  it("rejects empty or oversized handles without a query", async () => {
    expect(await getPublicNamecard("   ")).toBeNull();
    expect(await getPublicNamecard("x".repeat(65))).toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
