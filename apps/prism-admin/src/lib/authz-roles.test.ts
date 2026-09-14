import { describe, it, expect } from "vitest";
import {
  AuthzError,
  canAccess,
  canRunDevOnlyFeature,
  roleRank,
  ROLE_HIERARCHY_DESCRIPTION,
} from "./authz-roles";

describe("roleRank / canAccess — role hierarchy", () => {
  it("documents the explicit hierarchy", () => {
    expect(ROLE_HIERARCHY_DESCRIPTION).toContain("founder");
    expect(ROLE_HIERARCHY_DESCRIPTION).toContain("admin");
    expect(ROLE_HIERARCHY_DESCRIPTION).toContain("manager");
  });

  it("ranks founder above admin above manager above everyone else", () => {
    expect(roleRank("founder")).toBeGreaterThan(roleRank("admin"));
    expect(roleRank("admin")).toBeGreaterThan(roleRank("manager"));
    expect(roleRank("manager")).toBeGreaterThan(roleRank("employee"));
    expect(roleRank("employee")).toBe(roleRank("partner"));
  });

  it("treats unknown roles as unprivileged", () => {
    expect(roleRank("superuser")).toBe(0);
    expect(canAccess("superuser", "manager")).toBe(false);
  });

  it("employee cannot access anything (unauthenticated/employee rejected)", () => {
    expect(canAccess("employee", "manager")).toBe(false);
    expect(canAccess("employee", "admin")).toBe(false);
    expect(canAccess("employee", "founder")).toBe(false);
    expect(canAccess("", "manager")).toBe(false);
  });

  it("manager is allowed only where appropriate (manager-level actions)", () => {
    expect(canAccess("manager", "manager")).toBe(true);
    expect(canAccess("manager", "admin")).toBe(false);
    expect(canAccess("manager", "founder")).toBe(false);
  });

  it("admin is allowed for admin-level actions but not founder-level", () => {
    expect(canAccess("admin", "manager")).toBe(true);
    expect(canAccess("admin", "admin")).toBe(true);
    expect(canAccess("admin", "founder")).toBe(false);
  });

  it("founder (Super Admin) is allowed everywhere", () => {
    expect(canAccess("founder", "manager")).toBe(true);
    expect(canAccess("founder", "admin")).toBe(true);
    expect(canAccess("founder", "founder")).toBe(true);
  });
});

describe("AuthzError", () => {
  it("carries HTTP status codes for route handlers", () => {
    const unauthenticated = new AuthzError("Authentication required", 401);
    const forbidden = new AuthzError("Insufficient role: admin required", 403);
    expect(unauthenticated.status).toBe(401);
    expect(forbidden.status).toBe(403);
    expect(unauthenticated).toBeInstanceOf(Error);
  });
});

describe("canRunDevOnlyFeature — bootstrap/bridge fail closed", () => {
  it("production cannot escalate even with the flag on", () => {
    expect(
      canRunDevOnlyFeature({
        nodeEnv: "production",
        enabledFlag: "true",
        authenticated: true,
      }),
    ).toBe(false);
  });

  it("production-like env (Vercel preview) cannot escalate", () => {
    expect(
      canRunDevOnlyFeature({
        nodeEnv: "production",
        enabledFlag: "true",
        authenticated: true,
      }),
    ).toBe(false);
  });

  it("flag off denies even in development", () => {
    expect(
      canRunDevOnlyFeature({
        nodeEnv: "development",
        enabledFlag: undefined,
        authenticated: true,
      }),
    ).toBe(false);
    expect(
      canRunDevOnlyFeature({
        nodeEnv: "development",
        enabledFlag: "false",
        authenticated: true,
      }),
    ).toBe(false);
  });

  it("unauthenticated callers are denied even in development with the flag on", () => {
    expect(
      canRunDevOnlyFeature({
        nodeEnv: "development",
        enabledFlag: "true",
        authenticated: false,
      }),
    ).toBe(false);
  });

  it("NODE_ENV alone is never sufficient (authorization must not depend solely on NODE_ENV)", () => {
    expect(
      canRunDevOnlyFeature({
        nodeEnv: "development",
        enabledFlag: undefined,
        authenticated: true,
      }),
    ).toBe(false);
  });

  it("allows only development + explicit opt-in + authenticated", () => {
    expect(
      canRunDevOnlyFeature({
        nodeEnv: "development",
        enabledFlag: "true",
        authenticated: true,
      }),
    ).toBe(true);
  });
});
