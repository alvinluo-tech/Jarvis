import { getRepositories } from "../../db/factory.js";
import { registerTool } from "../registry.js";
import {
  addArticleSchema,
  getReadingListSchema,
  updateReadingStatusSchema,
  getReadingStatsSchema,
} from "./schema.js";

export function registerReadingTools(): void {
  // addArticle
  registerTool(
    {
      type: "function",
      function: {
        name: "addArticle",
        description: "添加文章到阅读清单。可指定 URL、标题、分类。",
        parameters: {
          type: "object",
          properties: {
            url: { type: "string", description: "文章 URL" },
            title: { type: "string", description: "文章标题" },
            category: { type: "string", description: "分类" },
            description: { type: "string", description: "文章描述" },
          },
          required: ["title"],
        },
      },
    },
    async (args) => {
      const input = addArticleSchema.parse(args);
      const article = await getRepositories().articles.create(input);
      return { article };
    },
  );

  // getReadingList
  registerTool(
    {
      type: "function",
      function: {
        name: "getReadingList",
        description: "获取阅读清单。可按状态、分类筛选。",
        parameters: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["unread", "reading", "finished"] },
            category: { type: "string" },
            limit: { type: "number", description: "返回数量上限" },
          },
        },
      },
    },
    async (args) => {
      const input = getReadingListSchema.parse(args);
      const articles = await getRepositories().articles.list(input);
      return { articles, count: articles.length };
    },
  );

  // updateReadingStatus
  registerTool(
    {
      type: "function",
      function: {
        name: "updateReadingStatus",
        description: "更新文章阅读状态。可设置评分和笔记。",
        parameters: {
          type: "object",
          properties: {
            articleId: { type: "string", description: "文章 ID" },
            status: { type: "string", enum: ["unread", "reading", "finished"] },
            rating: { type: "number", description: "评分 1-5" },
            notes: { type: "string", description: "笔记" },
          },
          required: ["articleId", "status"],
        },
      },
    },
    async (args) => {
      const input = updateReadingStatusSchema.parse(args);
      const article = await getRepositories().articles.update(input.articleId, input);
      return { article };
    },
  );

  // getReadingStats
  registerTool(
    {
      type: "function",
      function: {
        name: "getReadingStats",
        description: "获取阅读统计数据。",
        parameters: {
          type: "object",
          properties: {
            period: { type: "string", enum: ["week", "month", "all"] },
          },
        },
      },
    },
    async (args) => {
      const input = getReadingStatsSchema.parse(args);
      const allArticles = await getRepositories().articles.list();

      let filteredArticles = allArticles;
      if (input.period !== "all") {
        const now = new Date();
        const cutoff = new Date();
        if (input.period === "week") {
          cutoff.setDate(now.getDate() - 7);
        } else if (input.period === "month") {
          cutoff.setMonth(now.getMonth() - 1);
        }
        const cutoffStr = cutoff.toISOString();
        filteredArticles = allArticles.filter((a) => a.addedAt >= cutoffStr);
      }

      const stats = {
        total: filteredArticles.length,
        finished: filteredArticles.filter((a) => a.status === "finished").length,
        reading: filteredArticles.filter((a) => a.status === "reading").length,
        unread: filteredArticles.filter((a) => a.status === "unread").length,
        byCategory: {} as Record<string, number>,
      };

      for (const article of filteredArticles) {
        const cat = article.category ?? "未分类";
        stats.byCategory[cat] = (stats.byCategory[cat] ?? 0) + 1;
      }

      return stats;
    },
  );

  // recommendNext
  registerTool(
    {
      type: "function",
      function: {
        name: "recommendNext",
        description: "推荐下一篇阅读。基于未读清单和阅读历史。",
        parameters: { type: "object", properties: {} },
      },
    },
    async () => {
      const unread = await getRepositories().articles.list({ status: "unread" });

      if (unread.length === 0) {
        return { recommendation: null, reason: "阅读清单为空，没有可推荐的文章。" };
      }

      const recommendation = unread[0];
      return {
        recommendation,
        reason: `推荐阅读「${recommendation.title}」，它是你阅读清单中最早添加的未读文章。`,
      };
    },
  );
}
