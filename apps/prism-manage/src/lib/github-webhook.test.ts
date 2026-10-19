import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  mapIssueActionToStatus,
  verifyWebhookSignature,
} from "./github-webhook";

describe("mapIssueActionToStatus", () => {
  it("maps closed → approved and reopened → backlog", () => {
    expect(mapIssueActionToStatus("closed")).toBe("approved");
    expect(mapIssueActionToStatus("reopened")).toBe("backlog");
  });

  it("ignores other actions", () => {
    expect(mapIssueActionToStatus("opened")).toBeNull();
    expect(mapIssueActionToStatus("labeled")).toBeNull();
    expect(mapIssueActionToStatus("")).toBeNull();
  });
});

describe("verifyWebhookSignature", () => {
  const secret = "test-secret";
  const body = JSON.stringify({ action: "closed", issue: { number: 7 } });
  const valid =
    "sha256=" + createHmac("sha256", secret).update(body, "utf8").digest("hex");

  it("accepts a valid signature", () => {
    expect(verifyWebhookSignature(body, valid, secret)).toBe(true);
  });

  it("rejects tampered bodies", () => {
    expect(verifyWebhookSignature(body + "x", valid, secret)).toBe(false);
  });

  it("rejects wrong secrets, missing and malformed signatures", () => {
    expect(verifyWebhookSignature(body, valid, "other-secret")).toBe(false);
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
    expect(verifyWebhookSignature(body, "sha256=", secret)).toBe(false);
    expect(verifyWebhookSignature(body, "md5=abc", secret)).toBe(false);
  });
});
