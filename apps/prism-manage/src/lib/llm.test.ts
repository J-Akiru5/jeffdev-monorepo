import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateText, llmProviderName } from "./llm";

const ENV_KEYS = [
  "OPENCODE_API_KEY",
  "OPENCODE_MODEL",
  "OPENCODE_BASE_URL",
  "GEMINI_API_KEY",
  "GOOGLE_GEMINI_API_KEY",
] as const;

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = {};
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("llmProviderName", () => {
  it("prefers opencode, then gemini, else null", () => {
    expect(llmProviderName()).toBeNull();
    process.env.GEMINI_API_KEY = "g";
    expect(llmProviderName()).toBe("gemini");
    process.env.OPENCODE_API_KEY = "o";
    expect(llmProviderName()).toBe("opencode");
  });
});

describe("generateText (OpenCode)", () => {
  it("posts an OpenAI-compatible request with client identity headers", async () => {
    process.env.OPENCODE_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "  hello  " } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateText("hi", {
      sessionId: "sess-1",
      maxTokens: 42,
    });
    expect(result).toEqual({
      text: "hello",
      provider: "opencode",
      model: "deepseek-v4.1-flash",
    });

    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe(
      "https://opencode.ai/inference/openai/v1/chat/completions",
    );
    const headers = call[1].headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-key");
    expect(headers["User-Agent"]).toBe("prism-manage/1.0");
    expect(headers["x-opencode-session"]).toBe("sess-1");
    const body = JSON.parse(String(call[1].body)) as Record<string, unknown>;
    expect(body.model).toBe("deepseek-v4.1-flash");
    expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
    expect(body.max_tokens).toBe(42);
  });

  it("honours OPENCODE_MODEL and OPENCODE_BASE_URL (trailing slash trimmed)", async () => {
    process.env.OPENCODE_API_KEY = "k";
    process.env.OPENCODE_MODEL = "kimi-k3";
    process.env.OPENCODE_BASE_URL = "https://opencode.ai/inference/openai/v1/";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateText("x");
    expect(result?.model).toBe("kimi-k3");
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://opencode.ai/inference/openai/v1/chat/completions",
    );
  });

  it("returns null when the provider fails and no fallback is configured", async () => {
    process.env.OPENCODE_API_KEY = "k";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => '{"error":{"message":"Invalid credential"}}',
      }),
    );
    expect(await generateText("x")).toBeNull();
  });

  it("returns null on empty content", async () => {
    process.env.OPENCODE_API_KEY = "k";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "   " } }] }),
      }),
    );
    expect(await generateText("x")).toBeNull();
  });

  it("returns null without any provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await generateText("x")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
