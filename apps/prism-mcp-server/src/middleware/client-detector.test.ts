import { describe, it, expect, beforeEach } from "vitest";
import { detectPlatform, setCurrentClient, getCurrentClient, getClientPlatform } from "./client-detector.js";

describe("detectPlatform", () => {
  it("detects Cursor", () => {
    expect(detectPlatform("cursor")).toBe("cursor");
    expect(detectPlatform("Cursor")).toBe("cursor");
    expect(detectPlatform("vscode/cursor")).toBe("cursor");
  });

  it("detects Windsurf", () => {
    expect(detectPlatform("windsurf")).toBe("windsurf");
    expect(detectPlatform("Windsurf")).toBe("windsurf");
  });

  it("detects Claude Desktop", () => {
    expect(detectPlatform("claude")).toBe("claude-desktop");
    expect(detectPlatform("Claude")).toBe("claude-desktop");
    expect(detectPlatform("claude-desktop")).toBe("claude-desktop");
  });

  it("detects Cline", () => {
    expect(detectPlatform("cline")).toBe("cline");
    expect(detectPlatform("Cline")).toBe("cline");
  });

  it("detects VS Code", () => {
    expect(detectPlatform("vscode")).toBe("vscode");
    expect(detectPlatform("Visual Studio Code")).toBe("vscode");
    expect(detectPlatform("VS Code")).toBe("vscode");
  });

  it("detects GitHub Copilot", () => {
    expect(detectPlatform("github-copilot")).toBe("github-copilot");
    expect(detectPlatform("GitHub Copilot")).toBe("github-copilot");
    expect(detectPlatform("ghcp")).toBe("github-copilot");
  });

  it("returns unknown for unrecognized clients", () => {
    expect(detectPlatform("some-other-client")).toBe("unknown");
    expect(detectPlatform("")).toBe("unknown");
  });
});

describe("setCurrentClient / getCurrentClient", () => {
  beforeEach(() => {
    setCurrentClient({ name: "unknown", version: "0.0.0" });
  });

  it("stores and retrieves client info", () => {
    setCurrentClient({ name: "Cursor", version: "1.0.0" });
    const client = getCurrentClient();
    expect(client.name).toBe("Cursor");
    expect(client.version).toBe("1.0.0");
    expect(client.platform).toBe("cursor");
  });

  it("detects platform on set", () => {
    setCurrentClient({ name: "Windsurf", version: "2.0.0" });
    expect(getClientPlatform()).toBe("windsurf");
  });

  it("returns unknown platform for unrecognized", () => {
    setCurrentClient({ name: "Random IDE", version: "1.0.0" });
    expect(getClientPlatform()).toBe("unknown");
  });
});
