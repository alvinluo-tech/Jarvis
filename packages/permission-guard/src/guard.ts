import type {
  JarvisTool,
  PermissionCheckResult,
  PermissionGuardConfig,
  ToolResult,
} from "@jarvis/types";
import { AuditLog } from "./audit.js";
import { DEFAULT_PERMISSION_CONFIG, getRiskAction } from "./policies.js";

export class PermissionGuard {
  private config: PermissionGuardConfig;
  private auditLog: AuditLog;

  constructor(config?: Partial<PermissionGuardConfig>) {
    this.config = { ...DEFAULT_PERMISSION_CONFIG, ...config };
    this.auditLog = new AuditLog();
  }

  checkPermission(tool: JarvisTool): PermissionCheckResult {
    const action = getRiskAction(tool.risk, this.config, tool.appId);

    switch (action) {
      case "auto":
        return {
          allowed: true,
          requiresConfirmation: false,
          riskLevel: tool.risk,
        };
      case "notify":
        return {
          allowed: true,
          requiresConfirmation: false,
          riskLevel: tool.risk,
          reason: `执行后通知: ${tool.title}`,
        };
      case "confirm":
        return {
          allowed: true,
          requiresConfirmation: true,
          riskLevel: tool.risk,
          reason: `需要确认: ${tool.title} (风险等级: ${tool.risk})`,
        };
      case "deny":
        return {
          allowed: false,
          requiresConfirmation: false,
          riskLevel: tool.risk,
          reason: `已拒绝: ${tool.title} (风险等级: ${tool.risk})`,
        };
    }
  }

  async executeWithGuard(
    tool: JarvisTool,
    args: unknown,
    confirmCallback?: (tool: JarvisTool, args: unknown) => Promise<boolean>,
  ): Promise<{ result: ToolResult; confirmed: boolean }> {
    const check = this.checkPermission(tool);
    let confirmed = false;

    if (!check.allowed) {
      this.auditLog.log({
        action: "execute",
        toolId: tool.id,
        toolName: tool.name,
        appId: tool.appId,
        args,
        result: "denied",
        riskLevel: tool.risk,
        confirmedByUser: false,
        error: check.reason,
      });

      return {
        result: { success: false, error: check.reason },
        confirmed: false,
      };
    }

    if (check.requiresConfirmation && confirmCallback) {
      confirmed = await confirmCallback(tool, args);
      if (!confirmed) {
        this.auditLog.log({
          action: "execute",
          toolId: tool.id,
          toolName: tool.name,
          appId: tool.appId,
          args,
          result: "cancelled",
          riskLevel: tool.risk,
          confirmedByUser: false,
        });

        return {
          result: { success: false, error: "用户取消执行" },
          confirmed: false,
        };
      }
    }

    const startTime = Date.now();
    try {
      const result = await tool.execute(args);
      const durationMs = Date.now() - startTime;

      this.auditLog.log({
        action: "execute",
        toolId: tool.id,
        toolName: tool.name,
        appId: tool.appId,
        args,
        result: result.success ? "success" : "failure",
        riskLevel: tool.risk,
        confirmedByUser: confirmed,
        error: result.error,
      });

      return { result, confirmed };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.auditLog.log({
        action: "execute",
        toolId: tool.id,
        toolName: tool.name,
        appId: tool.appId,
        args,
        result: "failure",
        riskLevel: tool.risk,
        confirmedByUser: confirmed,
        error: errorMessage,
      });

      return {
        result: { success: false, error: errorMessage },
        confirmed,
      };
    }
  }

  getAuditLog(): AuditLog {
    return this.auditLog;
  }

  updateConfig(config: Partial<PermissionGuardConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setAppPermissions(appId: string, permissions: PermissionGuardConfig["appPermissions"][string]): void {
    this.config.appPermissions[appId] = permissions;
  }
}
