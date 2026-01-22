import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("OpenAI API", () => {
  it("should validate OpenAI API key", async () => {
    const apiKey = ENV.openaiApiKey;

    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^sk-(proj-|svcacct-)/);

    // OpenAI API 헬스 체크
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);

    console.log("✅ OpenAI API key is valid");
  });
});
