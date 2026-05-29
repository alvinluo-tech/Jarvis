import { describe, it, expect } from "vitest";
import { selectModelForTask, inferTaskType } from "../router.js";
import { DEFAULT_ROUTING_RULES } from "../profiles.js";

describe("selectModelForTask", () => {
  it("returns fast model for short voice answers", () => {
    const modelId = selectModelForTask(
      { mode: "voice", expectedAnswerLength: "short" },
      DEFAULT_ROUTING_RULES,
      "mimo-2.5-pro",
    );
    expect(modelId).toBe("groq-llama");
  });

  it("returns tool agent model when tool calling is required", () => {
    const modelId = selectModelForTask(
      { requiresToolCalling: true },
      DEFAULT_ROUTING_RULES,
      "mimo-2.5-pro",
    );
    expect(modelId).toBe("mimo-2.5-pro");
  });

  it("returns reasoning model for long context tasks", () => {
    const modelId = selectModelForTask(
      { requiresLongContext: true },
      DEFAULT_ROUTING_RULES,
      "mimo-2.5-pro",
    );
    expect(modelId).toBe("mimo-2.5-pro");
  });

  it("returns local model for privacy tasks", () => {
    const modelId = selectModelForTask(
      { requiresPrivacy: true },
      DEFAULT_ROUTING_RULES,
      "mimo-2.5-pro",
    );
    expect(modelId).toBe("local-ollama");
  });

  it("returns default model for generic chat", () => {
    const modelId = selectModelForTask(
      { mode: "text" },
      DEFAULT_ROUTING_RULES,
      "mimo-2.5-pro",
    );
    expect(modelId).toBe("mimo-2.5-pro");
  });

  it("returns default model when no rules match", () => {
    const modelId = selectModelForTask(
      { mode: "text", requiresVision: true },
      [],
      "mimo-2.5-pro",
    );
    expect(modelId).toBe("mimo-2.5-pro");
  });
});

describe("inferTaskType", () => {
  it("infers fast for short voice", () => {
    expect(inferTaskType({ mode: "voice", expectedAnswerLength: "short" })).toBe("fast");
  });

  it("infers toolAgent when tool calling required", () => {
    expect(inferTaskType({ requiresToolCalling: true })).toBe("toolAgent");
  });

  it("infers reasoning for long context", () => {
    expect(inferTaskType({ requiresLongContext: true })).toBe("reasoning");
  });

  it("infers private for privacy tasks", () => {
    expect(inferTaskType({ requiresPrivacy: true })).toBe("private");
  });

  it("infers chat by default", () => {
    expect(inferTaskType({})).toBe("chat");
  });
});
