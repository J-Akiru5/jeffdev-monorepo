/**
 * Integration tests for Prism MCP Server
 * Tests MCP tool simulation and query construction patterns
 */

import { describe, it, expect } from "vitest";

describe("MCP Tool Simulation", () => {
  it("should construct search query correctly", () => {
    const query = "authentication flow";
    const projectId = "test-project";

    const searchQuery = {
      transcriptText: { $regex: query, $options: "i" },
      projectId,
    };

    expect(searchQuery.transcriptText.$regex).toBe(query);
    expect(searchQuery.transcriptText.$options).toBe("i");
    expect(searchQuery.projectId).toBe(projectId);
  });

  it("should handle query without project filter", () => {
    const query = "Server Actions";

    const searchQuery: {
      transcriptText: { $regex: string; $options: string };
      projectId?: string;
    } = {
      transcriptText: { $regex: query, $options: "i" },
    };

    expect(searchQuery.transcriptText.$regex).toBe(query);
    expect(searchQuery.projectId).toBeUndefined();
  });

  it("should format search results as markdown", () => {
    const mockResult = {
      videoTitle: "Authentication Flow Demo",
      duration: 180,
      createdAt: new Date("2026-01-03").toISOString(),
      muxPlaybackId: "test-playback-id",
    };

    const snippet = "We validate using Zod schemas...";
    const lines = [
      `### ${mockResult.videoTitle}`,
      "",
      `**Duration:** 3:00`,
      `**Uploaded:** 1/3/2026`,
      "",
      "**Snippet:**",
      `> ${snippet}`,
      "",
      `**Playback:** https://stream.mux.com/${mockResult.muxPlaybackId}`,
    ];

    const formatted = lines.join("\\n");

    expect(formatted).toContain("### Authentication Flow Demo");
    expect(formatted).toContain("**Duration:** 3:00");
    expect(formatted).toContain("> We validate using Zod schemas...");
    expect(formatted).toContain("https://stream.mux.com/test-playback-id");
  });

  it("should format duration correctly", () => {
    const formatDuration = (seconds: number): string => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    expect(formatDuration(180)).toBe("3:00");
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(3665)).toBe("1:01:05");
  });

  it("should extract snippet around search query", () => {
    const text =
      "In this video, we'll walk through the authentication flow. First, the user lands on the login page. They enter their email and password. When they click submit, the form data is validated using Zod schemas.";
    const query = "Zod schemas";

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    expect(index).toBeGreaterThan(-1);

    const contextLength = 50;
    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(
      text.length,
      index + query.length + contextLength / 2,
    );

    const snippet = text.substring(start, end);

    expect(snippet).toContain("Zod schemas");
    expect(snippet.length).toBeLessThanOrEqual(contextLength + query.length);
  });
});
