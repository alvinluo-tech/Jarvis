import { describe, it, expect } from "vitest";
import { PermissionGuard } from "../guard.js";
import type { JarvisTool } from "@jarvis/types";

function createTestTool(overrides: Partial<JarvisTool> = {}): JarvisTool {
  return {
    id: "test:tool1",
    appId: "test-app",
    source: "native",
    name: "testTool",
    title: "Test Tool",
    description: "A test tool",
    inputSchema: { type: "object" },
    risk: "low",
    permissions: [],
    requiresConfirmation: false,
    execute: async () => ({ success: true, data: "ok" }),
    ...overrides,
  };
}

describe("PermissionGuard", () => {
  it("allows low risk tools automatically", () => {
    const guard = new PermissionGuard();
    const tool = createTestTool({ risk: "low" });

    const result = guard.checkPermission(tool);
    expect(result.allowed).toBe(true);
    expect(result.requiresConfirmation).toBe(false);
  });

  it("allows medium risk tools with notify", () => {
    const guard = new PermissionGuard();
    const tool = createTestTool({ risk: "medium" });

    const result = guard.checkPermission(tool);
    expect(result.allowed).toBe(true);
    expect(result.requiresConfirmation).toBe(false);
    expect(result.reason).toContain("执行后通知");
  });

  it("requires confirmation for high risk tools", () => {
    const guard = new PermissionGuard();
    const tool = createTestTool({ risk: "high" });

    const result = guard.checkPermission(tool);
    expect(result.allowed).toBe(true);
    expect(result.requiresConfirmation).toBe(true);
    expect(result.reason).toContain("需要确认");
  });

  it("executes low risk tools directly", async () => {
    const guard = new PermissionGuard();
    const tool = createTestTool({ risk: "low" });

    const { result } = await guard.executeWithGuard(tool, {});
    expect(result.success).toBe(true);
    expect(result.data).toBe("ok");
  });

  it("executes medium risk tools without confirmation", async () => {
    const guard = new PermissionGuard();
    const tool = createTestTool({ risk: "medium" });

    const { result } = await guard.executeWithGuard(tool, {});
    expect(result.success).toBe(true);
  });

  it("waits for confirmation on high risk tools", async () => {
    const guard = new PermissionGuard();
    const tool = createTestTool({ risk: "high" });

    const { result, confirmed } = await guard.executeWithGuard(
      tool,
      {},
      async () => true, // user confirms
    );
    expect(result.success).toBe(true);
    expect(confirmed).toBe(true);
  });

  it("cancels execution when user denies confirmation", async () => {
    const guard = new PermissionGuard();
    const tool = createTestTool({ risk: "high" });

    const { result, confirmed } = await guard.executeWithGuard(
      tool,
      {},
      async () => false, // user denies
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("用户取消");
    expect(confirmed).toBe(false);
  });

  it("logs audit entries for executed tools", async () => {
    const guard = new PermissionGuard();
    const tool = createTestTool({ risk: "low" });

    await guard.executeWithGuard(tool, { test: true });

    const auditLog = guard.getAuditLog();
    expect(auditLog.size).toBe(1);

    const entries = auditLog.getEntries();
    expect(entries[0].toolName).toBe("testTool");
    expect(entries[0].result).toBe("success");
    expect(entries[0].riskLevel).toBe("low");
  });

  it("logs denied entries when user cancels", async () => {
    const guard = new PermissionGuard();
    const tool = createTestTool({ risk: "high" });

    await guard.executeWithGuard(tool, {}, async () => false);

    const auditLog = guard.getAuditLog();
    const denied = auditLog.getDeniedEntries();
    expect(denied).toHaveLength(0); // cancelled, not denied

    const entries = auditLog.getEntries();
    expect(entries[0].result).toBe("cancelled");
  });

  it("logs failure when tool execution throws", async () => {
    const guard = new PermissionGuard();
    const tool = createTestTool({
      risk: "low",
      execute: async () => {
        throw new Error("Tool failed");
      },
    });

    const { result } = await guard.executeWithGuard(tool, {});
    expect(result.success).toBe(false);
    expect(result.error).toBe("Tool failed");

    const entries = guard.getAuditLog().getEntries();
    expect(entries[0].result).toBe("failure");
  });

  it("respects custom app permissions", () => {
    const guard = new PermissionGuard();
    guard.setAppPermissions("restricted-app", {
      appId: "restricted-app",
      read: true,
      write: false,
      delete: false,
      bulkWrite: false,
      execute: false,
    });

    const tool = createTestTool({ appId: "restricted-app", risk: "medium" });
    const result = guard.checkPermission(tool);
    expect(result.requiresConfirmation).toBe(true);
  });
});
