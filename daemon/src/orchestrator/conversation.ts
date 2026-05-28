import type { ChatMessage } from "./ai-client.js";
import { buildSystemPrompt } from "./prompt-builder.js";
import { createChatCompletion } from "./ai-client.js";
import { getAvailableTools, executeToolCalls } from "./tool-router.js";
import { env } from "../config/env.js";
import { getRepositories } from "../db/factory.js";
import type { MessageRow, ConversationRow } from "../db/repository.js";

const MAX_TOOL_ROUNDS = 5;
const MAX_HISTORY_MESSAGES = 20;

function isAiConfigured(): boolean {
  return Boolean(env.MIMO_API_KEY && env.MIMO_API_URL);
}

function generateTitleFromMessage(message: string): string {
  const cleaned = message.replace(/\n/g, " ").trim();
  return cleaned.length > 30 ? cleaned.slice(0, 30) + "..." : cleaned;
}

/**
 * When AI is not configured, handle requests locally using tool calls directly.
 * Parses user intent from keywords and calls appropriate tools.
 */
async function handleLocally(userMessage: string): Promise<{
  reply: string;
  toolCalls: { name: string; args: unknown; result: unknown }[];
}> {
  const msg = userMessage.toLowerCase();
  const toolCallsLog: { name: string; args: unknown; result: unknown }[] = [];

  // Today's tasks
  if (msg.includes("今天") && (msg.includes("任务") || msg.includes("todo"))) {
    const { getTool } = await import("../tools/registry.js");
    const tool = getTool("getTodayTasks");
    if (tool) {
      const result = await tool.handler({});
      toolCallsLog.push({ name: "getTodayTasks", args: {}, result });
      const data = result as { tasks: { title: string; status: string; priority: number }[]; count: number };
      if (data.count === 0) {
        return { reply: "今天没有待办任务。", toolCalls: toolCallsLog };
      }
      const lines = data.tasks.map((t, i) => `${i + 1}. [${t.status === "done" ? "✅" : "⬜"}] ${t.title} (优先级: ${t.priority})`);
      return { reply: `今日 ${data.count} 个任务：\n${lines.join("\n")}`, toolCalls: toolCallsLog };
    }
  }

  // All tasks
  if (msg.includes("任务") || msg.includes("todo")) {
    const { getTool } = await import("../tools/registry.js");
    const tool = getTool("queryTasks");
    if (tool) {
      const result = await tool.handler({});
      toolCallsLog.push({ name: "queryTasks", args: {}, result });
      const data = result as { tasks: { title: string; status: string }[]; count: number };
      if (data.count === 0) {
        return { reply: "暂无任务。可以通过对话创建新任务。", toolCalls: toolCallsLog };
      }
      const lines = data.tasks.slice(0, 10).map((t, i) => `${i + 1}. [${t.status}] ${t.title}`);
      return { reply: `共 ${data.count} 个任务：\n${lines.join("\n")}`, toolCalls: toolCallsLog };
    }
  }

  // Reading list
  if (msg.includes("阅读") || msg.includes("reading") || msg.includes("文章")) {
    const { getTool } = await import("../tools/registry.js");
    const tool = getTool("getReadingList");
    if (tool) {
      const result = await tool.handler({});
      toolCallsLog.push({ name: "getReadingList", args: {}, result });
      const data = result as { articles: { title: string; status: string }[]; count: number };
      if (data.count === 0) {
        return { reply: "阅读清单为空。", toolCalls: toolCallsLog };
      }
      const lines = data.articles.slice(0, 10).map((a, i) => `${i + 1}. [${a.status}] ${a.title}`);
      return { reply: `阅读清单共 ${data.count} 篇：\n${lines.join("\n")}`, toolCalls: toolCallsLog };
    }
  }

  // Daily summary
  if (msg.includes("总结") || msg.includes("summary") || msg.includes("复盘")) {
    const { getTool } = await import("../tools/registry.js");
    const tool = getTool("getDailySummary");
    if (tool) {
      const result = await tool.handler({});
      toolCallsLog.push({ name: "getDailySummary", args: {}, result });
      const data = result as { tasksCompleted: number; tasksTotal: number; completionRate: number; articlesRead: number };
      return {
        reply: `📊 今日总结\n任务完成: ${data.tasksCompleted}/${data.tasksTotal} (${data.completionRate}%)\n阅读文章: ${data.articlesRead} 篇`,
        toolCalls: toolCallsLog,
      };
    }
  }

  // Weekly stats
  if (msg.includes("周") || msg.includes("week")) {
    const { getTool } = await import("../tools/registry.js");
    const tool = getTool("getWeeklyStats");
    if (tool) {
      const result = await tool.handler({});
      toolCallsLog.push({ name: "getWeeklyStats", args: {}, result });
      const data = result as { tasksCompleted: number; tasksTotal: number; completionRate: number; articlesFinished: number };
      return {
        reply: `📊 本周统计\n任务完成: ${data.tasksCompleted}/${data.tasksTotal} (${data.completionRate}%)\n阅读完成: ${data.articlesFinished} 篇`,
        toolCalls: toolCallsLog,
      };
    }
  }

  // Create task
  const createMatch = msg.match(/(?:创建|添加|新建|add|create)[\s]*任务[\s：:]*(.+)/);
  if (createMatch) {
    const { getTool } = await import("../tools/registry.js");
    const tool = getTool("createTask");
    if (tool) {
      const title = createMatch[1].trim();
      const result = await tool.handler({ title });
      toolCallsLog.push({ name: "createTask", args: { title }, result });
      return { reply: `✅ 已创建任务：${title}`, toolCalls: toolCallsLog };
    }
  }

  // Add article
  const addArticleMatch = msg.match(/(?:添加|加入|add)[\s]*(?:文章|阅读|article)[\s：:]*(.+)/);
  if (addArticleMatch) {
    const { getTool } = await import("../tools/registry.js");
    const tool = getTool("addArticle");
    if (tool) {
      const title = addArticleMatch[1].trim();
      const result = await tool.handler({ title });
      toolCallsLog.push({ name: "addArticle", args: { title }, result });
      return { reply: `✅ 已添加到阅读清单：${title}`, toolCalls: toolCallsLog };
    }
  }

  // Recommend next reading
  if (msg.includes("推荐") || msg.includes("recommend") || msg.includes("下一篇")) {
    const { getTool } = await import("../tools/registry.js");
    const tool = getTool("recommendNext");
    if (tool) {
      const result = await tool.handler({});
      toolCallsLog.push({ name: "recommendNext", args: {}, result });
      const data = result as { recommendation: { title: string } | null; reason: string };
      if (!data.recommendation) {
        return { reply: data.reason, toolCalls: toolCallsLog };
      }
      return { reply: `📖 ${data.reason}`, toolCalls: toolCallsLog };
    }
  }

  // Help
  if (msg.includes("帮助") || msg.includes("help") || msg.includes("能做什么")) {
    return {
      reply: `我是 Jarvis，你的个人指令中心。我可以：

📋 **任务管理**
- "今天有什么任务？"
- "创建任务：写周报"
- "查看所有任务"

📚 **阅读清单**
- "阅读清单有什么？"
- "添加文章：xxx"
- "推荐下一篇"

📊 **总结复盘**
- "今日总结"
- "本周统计"

💡 当前为本地模式，配置 MiMo API Key 后可启用 AI 对话。`,
      toolCalls: toolCallsLog,
    };
  }

  return {
    reply: `收到你的消息：「${userMessage}」\n\n💡 当前为本地模式（未配置 AI API）。你可以试试：\n- "今天有什么任务？"\n- "阅读清单"\n- "今日总结"\n- "帮助" 查看所有命令`,
    toolCalls: toolCallsLog,
  };
}

/**
 * Handle a message within a conversation context.
 * Persists user message, loads history, calls AI, persists response.
 */
export async function handleMessageInConversation(
  conversationId: string,
  userMessage: string,
): Promise<{
  userMessage: MessageRow;
  assistantMessage: MessageRow;
  conversation: ConversationRow;
}> {
  const repo = getRepositories().conversations;

  // Persist user message
  const savedUserMsg = await repo.addMessage(conversationId, {
    role: "user",
    content: userMessage,
  });

  // Auto-generate title from first message
  const conversation = await repo.getById(conversationId);
  if (conversation && conversation.title === "New Chat" && conversation.messageCount <= 1) {
    const title = generateTitleFromMessage(userMessage);
    await repo.update(conversationId, { title });
  }

  // Load message history
  const history = await repo.getMessages(conversationId);
  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);

  let reply: string;
  let toolCallsLog: { name: string; args: unknown; result: unknown }[] = [];

  if (isAiConfigured()) {
    const messages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt() },
      ...recentHistory.map((msg) => ({
        role: msg.role as "user" | "assistant" | "tool",
        content: msg.content,
        tool_call_id: msg.toolCallId ?? undefined,
        tool_calls: msg.toolCalls ? JSON.parse(msg.toolCalls) : undefined,
      })),
    ];

    const tools = getAvailableTools();

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await createChatCompletion(messages, tools);
      const assistantMsg = completion.message;

      messages.push({
        role: "assistant",
        content: assistantMsg.content ?? "",
        tool_calls: assistantMsg.tool_calls,
      });

      if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
        reply = assistantMsg.content ?? "";
        break;
      }

      const results = await executeToolCalls(assistantMsg.tool_calls);

      for (const result of results) {
        const toolCall = assistantMsg.tool_calls.find((tc) => tc.id === result.toolCallId);
        toolCallsLog.push({
          name: toolCall?.function.name ?? "unknown",
          args: toolCall ? JSON.parse(toolCall.function.arguments) : {},
          result: result.error ?? result.result,
        });

        messages.push({
          role: "tool",
          content: result.error ?? JSON.stringify(result.result),
          tool_call_id: result.toolCallId,
        });
      }

      if (round === MAX_TOOL_ROUNDS - 1) {
        reply = "抱歉，处理请求时超过了最大工具调用轮次。";
      }
    }
  } else {
    const localResult = await handleLocally(userMessage);
    reply = localResult.reply;
    toolCallsLog = localResult.toolCalls;
  }

  // Persist assistant message
  const savedAssistantMsg = await repo.addMessage(conversationId, {
    role: "assistant",
    content: reply!,
    toolCalls: toolCallsLog.length > 0 ? JSON.stringify(toolCallsLog) : undefined,
  });

  const updatedConversation = (await repo.getById(conversationId))!;

  return {
    userMessage: savedUserMsg,
    assistantMessage: savedAssistantMsg,
    conversation: updatedConversation,
  };
}

/**
 * Legacy handler for backward compatibility (no conversation context).
 */
export async function handleMessage(userMessage: string): Promise<{
  reply: string;
  toolCalls: { name: string; args: unknown; result: unknown }[];
}> {
  // If AI is not configured, use local handler
  if (!isAiConfigured()) {
    return handleLocally(userMessage);
  }

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: userMessage },
  ];

  const tools = getAvailableTools();
  const toolCallsLog: { name: string; args: unknown; result: unknown }[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await createChatCompletion(messages, tools);
    const assistantMessage = completion.message;

    messages.push({
      role: "assistant",
      content: assistantMessage.content ?? "",
      tool_calls: assistantMessage.tool_calls,
    });

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return {
        reply: assistantMessage.content ?? "",
        toolCalls: toolCallsLog,
      };
    }

    const results = await executeToolCalls(assistantMessage.tool_calls);

    for (const result of results) {
      const toolCall = assistantMessage.tool_calls.find((tc) => tc.id === result.toolCallId);
      toolCallsLog.push({
        name: toolCall?.function.name ?? "unknown",
        args: toolCall ? JSON.parse(toolCall.function.arguments) : {},
        result: result.error ?? result.result,
      });

      messages.push({
        role: "tool",
        content: result.error ?? JSON.stringify(result.result),
        tool_call_id: result.toolCallId,
      });
    }
  }

  return {
    reply: "抱歉，处理请求时超过了最大工具调用轮次。",
    toolCalls: toolCallsLog,
  };
}
