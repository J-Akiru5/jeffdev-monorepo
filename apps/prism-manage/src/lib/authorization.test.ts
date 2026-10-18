import { describe, it, expect } from "vitest";
import {
  isMarketingAuthorized,
  canApproveTaskStatus,
  type WorkspaceAccess,
} from "./authorization";

describe("isMarketingAuthorized", () => {
  const base: WorkspaceAccess = {
    role: null,
    cLevelTitle: null,
    departmentName: null,
  };

  it("allows an unrefined founder (all departments)", () => {
    expect(
      isMarketingAuthorized({ ...base, role: "founder", cLevelTitle: null }),
    ).toBe(true);
  });

  it("allows the CEO (all departments)", () => {
    expect(
      isMarketingAuthorized({ ...base, role: "founder", cLevelTitle: "ceo" }),
    ).toBe(true);
  });

  it("allows the CMO (Marketing is their department)", () => {
    expect(
      isMarketingAuthorized({ ...base, role: "founder", cLevelTitle: "cmo" }),
    ).toBe(true);
  });

  it("denies the CTO", () => {
    expect(
      isMarketingAuthorized({ ...base, role: "founder", cLevelTitle: "cto" }),
    ).toBe(false);
  });

  it("denies the CPO", () => {
    expect(
      isMarketingAuthorized({ ...base, role: "founder", cLevelTitle: "cpo" }),
    ).toBe(false);
  });

  it("denies the COO", () => {
    expect(
      isMarketingAuthorized({ ...base, role: "founder", cLevelTitle: "coo" }),
    ).toBe(false);
  });

  it("allows an employee assigned to the Marketing department", () => {
    expect(
      isMarketingAuthorized({
        ...base,
        role: "employee",
        departmentName: "Marketing",
      }),
    ).toBe(true);
  });

  it("denies an employee in another department", () => {
    expect(
      isMarketingAuthorized({
        ...base,
        role: "employee",
        departmentName: "Engineering",
      }),
    ).toBe(false);
  });

  it("denies an employee with no department", () => {
    expect(
      isMarketingAuthorized({
        ...base,
        role: "employee",
        departmentName: null,
      }),
    ).toBe(false);
  });

  it("denies a user with no membership", () => {
    expect(isMarketingAuthorized(base)).toBe(false);
  });
});

describe("canApproveTaskStatus", () => {
  it("allows anyone to manage personal (non-workspace) task workflows", () => {
    expect(canApproveTaskStatus("employee", false)).toBe(true);
    expect(canApproveTaskStatus("founder", false)).toBe(true);
    expect(canApproveTaskStatus(null, false)).toBe(true);
  });

  it("allows founders to approve workspace tasks", () => {
    expect(canApproveTaskStatus("founder", true)).toBe(true);
  });

  it("denies employees approval of workspace tasks", () => {
    expect(canApproveTaskStatus("employee", true)).toBe(false);
  });

  it("does not block non-members at this layer (RLS enforces membership)", () => {
    expect(canApproveTaskStatus(null, true)).toBe(true);
  });
});
