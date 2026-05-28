# Bug: AI SDK v6 默认使用 Responses API 导致 MiMo 返回 404

**日期:** 2026-05-28
**严重程度:** Critical (AI 对话功能完全不可用)
**影响范围:** 所有 AI 对话（chat、conversation、voice pipeline）
**状态:** 已修复

---

## 现象

- Daemon 启动正常，health 端点返回 `aiProvider: "mimo"`, `aiModel: "mimo-v2.5-pro"`
- 其他 API 端点（tasks、articles、conversations、voice）均正常
- `POST /api/chat` 和 `POST /api/conversations/:id/messages` 返回 `{"error":"Not Found"}`
- MiMo API 直接 curl 调用正常

## 根因

AI SDK v6 (`ai@6.x`) 的 `@ai-sdk/openai@3.x` 做了一个重大变更：

- `provider(modelId)` 默认创建 **Responses API** 模型，调用 `/v1/responses` 端点
- `provider.chat(modelId)` 才创建 **Chat Completions API** 模型，调用 `/v1/chat/completions` 端点

MiMo（以及 Groq、OpenRouter、Ollama 等兼容 API）只支持 Chat Completions API，没有 `/v1/responses` 端点，所以返回 404。

### 错误代码

```typescript
// daemon/src/ai/provider.ts (修复前)
export function getModel(providerName?, modelName?) {
  const provider = getProvider(providerName);
  const model = modelName ?? env.AI_MODEL;
  return provider(model);  // 默认用 Responses API!
}
```

### 错误栈

```
AI_APICallError: Not Found
  at OpenAIResponsesLanguageModel.doGenerate
  at generateText
```

关键线索：`OpenAIResponsesLanguageModel` 而非 `OpenAIChatLanguageModel`。

## 修复

```typescript
// daemon/src/ai/provider.ts (修复后)
export function getModel(providerName?, modelName?) {
  const provider = getProvider(providerName);
  const model = modelName ?? env.AI_MODEL;
  return provider.chat(model);  // 显式使用 Chat Completions API
}
```

## 排查过程

1. curl MiMo API 直接调用 → 正常返回
2. curl `POST /api/chat` → 返回 `{"error":"Not Found"}`，HTTP 500
3. 用户消息被保存到数据库，但 AI 响应失败
4. 直接调用 `handleMessage()` 测试 → 抛出 `AI_APICallError: Not Found`
5. 错误栈指向 `OpenAIResponsesLanguageModel.doGenerate` → 定位到 API 端点问题
6. 查阅 `@ai-sdk/openai` 源码确认 `provider()` vs `provider.chat()` 的区别

## 经验教训

### 1. AI SDK 版本升级需关注 API 端点变更

AI SDK v5 → v6 不仅是 API 名称变更（`CoreMessage` → `ModelMessage`、`maxSteps` → `stopWhen`），还有**底层 API 端点的切换**。这是最容易被忽略的 breaking change。

### 2. 错误信息需要更明确

"Not Found" 作为错误信息没有指明是哪个端点 404。理想情况下应该：
- 捕获 `AI_APICallError` 并记录请求 URL
- 在 daemon 日志中输出完整的 API 调用信息

### 3. 端口冲突掩盖了真正问题

排查过程中多次遇到端口 3001 被占用的问题（旧进程未退出），导致新 daemon 启动失败。应该：
- 启动前检查端口占用
- 或使用端口自动递增（但之前为了前端稳定性改成了 fail-fast）

### 4. 静态分析无法发现运行时 API 不兼容

TypeScript 编译通过不代表运行时正常。`provider()` 和 `provider.chat()` 类型签名相同，但行为不同。需要**实际调用测试**才能发现问题。

### 5. 兼容性 API 需要明确选择 Chat Completions

对于非 OpenAI 官方的兼容 API（MiMo、Groq、OpenRouter、Ollama），必须使用 `provider.chat()` 而非 `provider()`。这是一个通用规则，不仅限于 MiMo。

## 预防措施

- [ ] 在 provider 层添加 API 端点日志（记录实际请求 URL）
- [ ] daemon 启动时自动调用一次 health/AI 端点验证连通性
- [ ] 文档中注明 AI SDK v6 的 Responses API vs Chat Completions API 区别
- [ ] 新增 provider 时必须验证使用 `provider.chat()` 而非 `provider()`

## 相关文件

- `daemon/src/ai/provider.ts` — 修复位置
- `daemon/src/orchestrator/conversation.ts` — 调用 `getModel()` 的地方
- `daemon/src/api/chat.ts` — HTTP 路由层
