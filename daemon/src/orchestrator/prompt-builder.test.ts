import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./prompt-builder.js";

describe("Prompt Builder", () => {
  it("should build a system prompt with current date", () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain("Jarvis");
    expect(prompt).toContain("任务");
    expect(prompt).toContain("阅读清单");
    expect(prompt).toContain("中文");

    // Should contain today's date
    const today = new Date().toISOString().split("T")[0];
    expect(prompt).toContain(today);
  });
});
