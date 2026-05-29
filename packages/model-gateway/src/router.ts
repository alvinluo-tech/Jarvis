import type { ModelRoutingRule, ModelTaskType } from "@jarvis/types";

interface TaskContext {
  mode?: "text" | "voice";
  expectedAnswerLength?: "short" | "medium" | "long";
  requiresToolCalling?: boolean;
  requiresLongContext?: boolean;
  requiresPrivacy?: boolean;
  requiresVision?: boolean;
}

export function selectModelForTask(
  task: TaskContext,
  routingRules: ModelRoutingRule[],
  defaultModelId: string,
): string {
  for (const rule of routingRules) {
    if (matchesRule(task, rule)) {
      return rule.modelId;
    }
  }
  return defaultModelId;
}

function matchesRule(task: TaskContext, rule: ModelRoutingRule): boolean {
  const conditions = rule.conditions;
  if (!conditions) return true;

  if (conditions.expectedAnswerLength && task.expectedAnswerLength !== conditions.expectedAnswerLength) {
    return false;
  }
  if (conditions.requiresToolCalling !== undefined && task.requiresToolCalling !== conditions.requiresToolCalling) {
    return false;
  }
  if (conditions.requiresLongContext !== undefined && task.requiresLongContext !== conditions.requiresLongContext) {
    return false;
  }
  if (conditions.requiresPrivacy !== undefined && task.requiresPrivacy !== conditions.requiresPrivacy) {
    return false;
  }
  if (conditions.requiresVision !== undefined && task.requiresVision !== conditions.requiresVision) {
    return false;
  }

  return true;
}

export function inferTaskType(task: TaskContext): ModelTaskType {
  if (task.mode === "voice" && task.expectedAnswerLength === "short") return "fast";
  if (task.requiresToolCalling) return "toolAgent";
  if (task.requiresLongContext) return "reasoning";
  if (task.requiresPrivacy) return "private";
  return "chat";
}
