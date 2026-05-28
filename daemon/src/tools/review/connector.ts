import { getRepositories } from "../../db/factory.js";
import { registerTool } from "../registry.js";
import {
  getDailySummarySchema,
  getWeeklyStatsSchema,
  saveReviewSchema,
  getReviewHistorySchema,
} from "./schema.js";

export function registerReviewTools(): void {
  // getDailySummary
  registerTool(
    {
      type: "function",
      function: {
        name: "getDailySummary",
        description: "获取指定日期的任务完成情况汇总。默认今日。",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "日期 YYYY-MM-DD，默认今日" },
          },
        },
      },
    },
    async (args) => {
      const input = getDailySummarySchema.parse(args);
      const result = await getRepositories().reviews.getDailySummary(input.date);
      return result;
    },
  );

  // getWeeklyStats
  registerTool(
    {
      type: "function",
      function: {
        name: "getWeeklyStats",
        description: "获取本周统计数据。包含每日分解、阅读量、高频标签。",
        parameters: {
          type: "object",
          properties: {
            weekStart: { type: "string", description: "周一日期 YYYY-MM-DD" },
          },
        },
      },
    },
    async (args) => {
      const input = getWeeklyStatsSchema.parse(args);
      const result = await getRepositories().reviews.getWeeklyStats(input.weekStart);
      return result;
    },
  );

  // saveReview
  registerTool(
    {
      type: "function",
      function: {
        name: "saveReview",
        description: "保存 AI 生成的回顾记录。",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["daily", "weekly"] },
            summary: { type: "string", description: "AI 生成的总结" },
            patterns: { type: "array", items: { type: "string" }, description: "识别的模式" },
            suggestions: { type: "array", items: { type: "string" }, description: "改进建议" },
          },
          required: ["type", "summary", "patterns"],
        },
      },
    },
    async (args) => {
      const input = saveReviewSchema.parse(args);
      const review = await getRepositories().reviews.save(input);
      return { review };
    },
  );

  // getReviewHistory
  registerTool(
    {
      type: "function",
      function: {
        name: "getReviewHistory",
        description: "获取历史回顾记录。",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["daily", "weekly"] },
            limit: { type: "number", description: "返回数量" },
          },
          required: ["type"],
        },
      },
    },
    async (args) => {
      const input = getReviewHistorySchema.parse(args);
      const reviews = await getRepositories().reviews.getHistory(input.type, input.limit);
      return { reviews };
    },
  );
}
